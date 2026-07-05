"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import FormSchemaBuilder from "@/components/admin/FormSchemaBuilder";
import { SERVICE_COLORS } from "@/lib/serviceColors";
import AvailabilityEditor from "@/components/admin/AvailabilityEditor";
import DiscountTiersEditor from "@/components/admin/DiscountTiersEditor";
import EmailConfigEditor from "@/components/admin/EmailConfigEditor";
import ServiceImagesEditor from "@/components/admin/ServiceImagesEditor";

type Question = {
	key: string;
	label: string;
	type: "text" | "single_choice" | "multiple_choice"| "file";
	required: boolean;
	options?: string[];
};

type Service = {
	id: number;
	name: string;
	description: string | null;
	price_cents: number;
	deposit_cents: number;    // ✅ présent
	duration_minutes: number;
	is_active: number;
	form_schema: string;
	color: string;            // ✅ CORRECTION : color ajouté au type
	home_available: number;
};

export default function EditServicePage() {
	const router = useRouter();
	const params = useParams();
	const id = params.id as string;

	const [name, setName] = useState("");
	const [description, setDescription] = useState("");
	const [priceEuros, setPriceEuros] = useState("");
	const [depositEuros, setDepositEuros] = useState("0"); // ✅ state présent
	const [duration, setDuration] = useState("");
	const [isActive, setIsActive] = useState(true);
	const [color, setColor] = useState(SERVICE_COLORS[0].value);
	const [questions, setQuestions] = useState<Question[]>([]);
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [homeAvailable, setHomeAvailable] = useState(true);

	useEffect(() => {
		loadService();
	}, [id]);

	const loadService = async () => {
		setLoading(true);
		try {
			const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/services/${id}`, {
				credentials: "include",
			});

			if (!res.ok) throw new Error("Service introuvable");

			const service: Service = await res.json();
			setName(service.name);
			setDescription(service.description ?? "");
			setPriceEuros((service.price_cents / 100).toString());
			setDepositEuros(((service.deposit_cents ?? 0) / 100).toString()); // ✅ CORRECTION : ?? 0 pour éviter NaN si null
			setDuration(service.duration_minutes.toString());
			setIsActive(service.is_active === 1);
			setQuestions(JSON.parse(service.form_schema));
			setHomeAvailable(service.home_available === 1 || service.home_available === undefined);
			setColor(service.color ?? SERVICE_COLORS[0].value); // ✅ CORRECTION : ?? pour fallback si nul			
		} catch (err) {
			setError(err instanceof Error ? err.message : "Une erreur est survenue");
		} finally {
			setLoading(false);
		}
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError(null);
		setSaving(true);

		try {
			const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/services/${id}`, {
				method: "PATCH",
				credentials: "include",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					name,
					description: description || null,
					price_cents: Math.round(parseFloat(priceEuros) * 100),
					duration_minutes: parseInt(duration, 10),
					is_active: isActive ? 1 : 0,
					form_schema: questions,
					color,
					deposit_cents: Math.round(parseFloat(depositEuros) * 100) || 0, // ✅ bien envoyé
					home_available: homeAvailable ? 1 : 0,
				}),
			});

			const data = await res.json();

			if (!res.ok) {
				throw new Error(data.error || "Erreur lors de la mise à jour");
			}

			router.push("/admin/services");
		} catch (err) {
			setError(err instanceof Error ? err.message : "Une erreur est survenue");
		} finally {
			setSaving(false);
		}
	};

	if (loading) {
		return (
			<main className="min-h-screen bg-stone-50 px-6 py-12">
				<p className="text-stone-500 max-w-2xl mx-auto">Chargement...</p>
			</main>
		);
	}

	return (
		<main className="min-h-screen bg-stone-50">
			<div className="max-w-2xl mx-auto px-6 py-12">
				<button
					onClick={() => router.push("/admin/services")}
					className="text-sm text-stone-500 hover:text-stone-800 mb-6"
				>
					Retour aux services
				</button>

				<h1 className="text-2xl font-semibold text-stone-900 mb-6">Modifier le service</h1>

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

					{/* ✅ CORRECTION : champ acompte ajouté dans le JSX (était manquant) */}
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
							className="w-full border border-stone-300 rounded-lg px-3 py-2 text-black focus:outline-none focus:ring-2 focus:ring-stone-400"
						/>
					</div>

					<label className="flex items-center gap-2 text-sm text-stone-700">
						<input
							type="checkbox"
							checked={isActive}
							onChange={(e) => setIsActive(e.target.checked)}
						/>
						Service actif (visible sur le site)
					</label>
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
						disabled={saving}
						className="bg-stone-900 text-white px-6 py-3.5 rounded-xl font-medium hover:bg-stone-800 transition disabled:opacity-50"
					>
						{saving ? "Enregistrement..." : "Enregistrer les modifications"}
					</button>
				</form>

				<div className="border-t border-stone-200 mt-8 pt-8">
					<h2 className="text-sm font-medium text-stone-900 mb-4">Disponibilités</h2>
					<AvailabilityEditor serviceId={Number(id)} />
				</div>
				<div className="border-t border-stone-200 mt-8 pt-8">
					<h2 className="text-sm font-medium text-stone-900 mb-4">Réductions par nombre de séances</h2>
					<DiscountTiersEditor serviceId={Number(id)} />
				</div>
				<div className="border-t border-stone-200 mt-8 pt-8">
					<h2 className="text-sm font-medium text-stone-900 mb-1">Emails automatiques</h2>
					<p className="text-xs text-stone-500 mb-4">Personnalisez les emails envoyés aux clients pour ce service</p>
					<EmailConfigEditor serviceId={Number(id)} />
					<div className="border-t border-stone-200 mt-8 pt-8">
						<h2 className="text-sm font-medium text-stone-900 mb-1">Images du service</h2>
						<p className="text-xs text-stone-500 mb-4">
							L&apos;image principale s&apos;affiche sur la page d&apos;accueil et la page du service.
						</p>
						<ServiceImagesEditor serviceId={Number(id)} />
					</div>
				</div>
			</div>
		</main>
	);
}