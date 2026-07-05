"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
export const runtime = "edge"
export default function ReviewPage() {
	const { token } = useParams<{ token: string }>();
	const [info, setInfo] = useState<{ client_name: string; service_name: string } | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState(true);
	const [submitted, setSubmitted] = useState(false);
	const [submitting, setSubmitting] = useState(false);

	const [clientName, setClientName] = useState("");
	const [clientFirstname, setClientFirstname] = useState("");
	const [comment, setComment] = useState("");
	const [rating, setRating] = useState(0);
	const [hovered, setHovered] = useState(0);

	useEffect(() => {
		fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/reviews/${token}`)
			.then(async (res) => {
				const data = await res.json();
				if (!res.ok) setError(data.error);
				else if (data.already_submitted) setSubmitted(true);
				else {
					setInfo(data);
					setClientName(data.client_name?.split(" ")[1] ?? "");
					setClientFirstname(data.client_name?.split(" ")[0] ?? "");
				}
			})
			.catch(() => setError("Impossible de contacter le serveur"))
			.finally(() => setLoading(false));
	}, [token]);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (rating === 0) {
			setError("Merci de choisir une note");
			return;
		}

		setSubmitting(true);
		setError(null);

		try {
			const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/reviews/${token}`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ client_name: clientName, client_firstname: clientFirstname, comment, rating }),
			});

			const data = await res.json();
			if (!res.ok) throw new Error(data.error);
			setSubmitted(true);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Erreur lors de la soumission");
		} finally {
			setSubmitting(false);
		}
	};

	if (loading) return (
		<main className="min-h-screen bg-stone-50 flex items-center justify-center">
			<p className="text-stone-500">Chargement...</p>
		</main>
	);

	if (error && !info && !submitted) return (
		<main className="min-h-screen bg-stone-50 flex items-center justify-center px-6">
			<div className="bg-white border border-stone-200 rounded-2xl p-8 max-w-sm w-full text-center">
				<p className="text-red-600 font-medium">{error}</p>
				<a href="/" className="text-sm text-stone-500 hover:text-stone-800 mt-4 inline-block">Retour à l&apos;accueil</a>
			</div>
		</main>
	);

	if (submitted) return (
		<main className="min-h-screen bg-stone-50 flex items-center justify-center px-6">
			<div className="bg-white border border-stone-200 rounded-2xl p-8 max-w-sm w-full text-center">
				<div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
					<svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
					</svg>
				</div>
				<h1 className="text-xl font-semibold text-stone-900">Merci pour votre avis !</h1>
				<p className="text-stone-500 mt-2 text-sm">Votre avis sera publié après validation par notre équipe.</p>
				<a href="/" className="mt-6 inline-block bg-stone-900 text-white px-6 py-2.5 rounded-xl text-sm font-medium hover:bg-stone-800 transition">
					Retour à l&apos;accueil
				</a>
			</div>
		</main>
	);

	return (
		<main className="min-h-screen bg-stone-50 flex items-center justify-center px-6">
			<div className="bg-white border border-stone-200 rounded-2xl p-8 max-w-md w-full">
				<h1 className="text-xl font-semibold text-stone-900 mb-1">Votre avis</h1>
				{info && <p className="text-sm text-stone-500 mb-6">Pour {info.service_name}</p>}

				<form onSubmit={handleSubmit} className="flex flex-col gap-4">
					<div className="flex gap-3">
						<div className="flex-1">
							<label className="block text-sm font-medium text-stone-700 mb-1.5">Prénom <span className="text-red-500">*</span></label>
							<input type="text" required value={clientFirstname}
								onChange={(e) => setClientFirstname(e.target.value)}
								className="w-full border border-stone-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-stone-400" />
						</div>
						<div className="flex-1">
							<label className="block text-sm font-medium text-stone-700 mb-1.5">Nom <span className="text-red-500">*</span></label>
							<input type="text" required value={clientName}
								onChange={(e) => setClientName(e.target.value)}
								className="w-full border border-stone-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-stone-400" />
						</div>
					</div>

					<div>
						<label className="block text-sm font-medium text-stone-700 mb-2">Note <span className="text-red-500">*</span></label>
						<div className="flex gap-1">
							{[1, 2, 3, 4, 5].map((star) => (
								<button key={star} type="button"
									onClick={() => setRating(star)}
									onMouseEnter={() => setHovered(star)}
									onMouseLeave={() => setHovered(0)}
									className="text-3xl transition"
								>
									<span className={(star <= (hovered || rating)) ? "text-amber-400" : "text-stone-200"}>★</span>
								</button>
							))}
						</div>
					</div>

					<div>
						<label className="block text-sm font-medium text-stone-700 mb-1.5">Votre avis <span className="text-red-500">*</span></label>
						<textarea required rows={4} value={comment}
							onChange={(e) => setComment(e.target.value)}
							placeholder="Partagez votre expérience..."
							className="w-full border border-stone-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-stone-400 resize-none" />
					</div>

					{error && <p className="text-red-600 text-sm">{error}</p>}

					<button type="submit" disabled={submitting}
						className="bg-stone-900 text-white px-6 py-3 rounded-xl font-medium hover:bg-stone-800 transition disabled:opacity-50">
						{submitting ? "Envoi en cours..." : "Envoyer mon avis"}
					</button>
				</form>
			</div>
		</main>
	);
}