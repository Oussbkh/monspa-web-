"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import FormSchemaBuilder from "@/components/admin/FormSchemaBuilder";
import { SERVICE_COLORS } from "@/lib/serviceColors";

type Question = {
	key: string;
	label: string;
	type: "text" | "single_choice" | "multiple_choice" | "file";
	required: boolean;
	options?: string[];
};


export default function NewServicePage() {
	const router = useRouter();
	const [name, setName] = useState("");
	const [slug, setSlug] = useState("");
	const [description, setDescription] = useState("");
	const [priceEuros, setPriceEuros] = useState("");
	const [duration, setDuration] = useState("");
	const [questions, setQuestions] = useState<Question[]>([]);
	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);
	const [color, setColor] = useState(SERVICE_COLORS[0].value);
	const [depositEuros, setDepositEuros] = useState("0");
	const [homeAvailable, setHomeAvailable] = useState(true);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError(null);
		setLoading(true);

		try {
			const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/services`, {
				method: "POST",
				credentials: "include",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					name,
					slug,
					description: description || null,
					price_cents: Math.round(parseFloat(priceEuros) * 100),
					duration_minutes: parseInt(duration, 10),
					form_schema: questions,
					color,
					deposit_cents: Math.round(parseFloat(depositEuros) * 100) || 0,
					home_available: homeAvailable ? 1 : 0,
				}),
			});

			const data = await res.json();

			if (!res.ok) {
				throw new Error(data.error || "Erreur lors de la création du service");
			}

			router.push("/admin/services");
		} catch (err) {
			setError(err instanceof Error ? err.message : "Une erreur est survenue");
		} finally {
			setLoading(false);
		}
	};

	return (
		<main className="min-h-screen bg-stone-50">
			<div className="max-w-2xl mx-auto px-6 py-12">
				<button
					onClick={() => router.push("/admin/services")}
					className="text-sm text-stone-500 hover:text-stone-800 mb-6"
				>
					Retour aux services
				</button>

				<h1 className="text-2xl font-semibold text-stone-900 mb-6">Nouveau service</h1>

				<form onSubmit={handleSubmit} className="flex flex-col gap-5">
					<div>
						<label className="block text-sm font-medium text-stone-700 mb-1.5">Nom</label>
						<input
							type="text"
							required
							value={name}
							onChange={(e) => setName(e.target.value)}
							className="w-full border border-stone-300 rounded-lg px-3 py-2 text-black focus:outline-none focus:ring-2 focus:ring-stone-400"
						/>
					</div>

					<div>
						<label className="block text-sm font-medium text-stone-700 mb-1.5">
							Slug (utilisé dans l&apos;URL)
						</label>
						<input
							type="text"
							required
							value={slug}
							onChange={(e) => setSlug(e.target.value)}
							placeholder="ex: massage-relaxant"
							className="w-full border border-stone-300 rounded-lg px-3 py-2 text-black focus:outline-none focus:ring-2 focus:ring-stone-400"
						/>
					</div>

					<div>
						<label className="block text-sm font-medium text-stone-700 mb-1.5">Description</label>
						<textarea
							value={description}
							onChange={(e) => setDescription(e.target.value)}
							rows={3}
							className="w-full border border-stone-300 rounded-lg px-3 py-2 text-black focus:outline-none focus:ring-2 focus:ring-stone-400"
						/>
					</div>

					<div className="flex gap-4">
						<div className="flex-1">
							<label className="block text-sm font-medium text-stone-700 mb-1.5">Prix (€)</label>
							<input
								type="number"
								step="0.01"
								min="0"
								required
								value={priceEuros}
								onChange={(e) => setPriceEuros(e.target.value)}
								className="w-full border border-stone-300 rounded-lg px-3 py-2 text-black focus:outline-none focus:ring-2 focus:ring-stone-400"
							/>
						</div>

						<div className="flex-1">
							<label className="block text-sm font-medium text-stone-700 mb-1.5">
								Durée (minutes)
							</label>
							<input
								type="number"
								min="1"
								required
								value={duration}
								onChange={(e) => setDuration(e.target.value)}
								className="w-full border border-stone-300 rounded-lg px-3 py-2 text-black focus:outline-none focus:ring-2 focus:ring-stone-400"
							/>
						</div>
					</div>

					<div>
						<label className="block text-sm font-medium text-stone-700 mb-1.5">
							Acompte (€) — 0 pour encaisser la totalité
						</label>
						<input
							type="number"
							step="0.01"
							min="0"
							value={depositEuros}
							onChange={(e) => setDepositEuros(e.target.value)}
							className="w-full border border-stone-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-stone-400"
						/>
					</div>
					<label className="flex items-center gap-2 text-sm text-stone-700 cursor-pointer">
						<input
							type="checkbox"
							checked={homeAvailable}
							onChange={(e) => setHomeAvailable(e.target.checked)}
						/>
						Service disponible à domicile
					</label>

					<div>
						<label className="block text-sm font-medium text-stone-700 mb-2">
							Couleur dans le calendrier
						</label>
						<div className="flex gap-2">
							{SERVICE_COLORS.map((c) => (
								<button
									key={c.value}
									type="button"
									onClick={() => setColor(c.value)}
									title={c.name}
									style={{ backgroundColor: c.value }}
									className={`w-8 h-8 rounded-full transition ${
										color === c.value ? "ring-2 ring-offset-2 ring-stone-900" : ""
									}`}
								/>
							))}
						</div>
					</div>

					<div className="border-t border-stone-200 pt-5">
						<h2 className="text-sm font-medium text-stone-900 mb-3">Formulaire pour ce service</h2>
						<FormSchemaBuilder questions={questions} onChange={setQuestions} />
					</div>

					{error && <p className="text-red-600 text-sm">{error}</p>}

					<button
						type="submit"
						disabled={loading}
						className="bg-stone-900 text-white px-6 py-3.5 rounded-xl font-medium hover:bg-stone-800 transition disabled:opacity-50"
					>
						{loading ? "Création..." : "Créer le service"}
					</button>
				</form>
			</div>
		</main>
	);
}