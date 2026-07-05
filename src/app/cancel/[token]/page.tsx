"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
export const runtime = "edge"

type CancelInfo = {
	client_name: string;
	service_name: string;
	requested_date: string;
	status: string;
	can_refund: boolean;
	message: string;
};

export default function CancelPage() {
	const { token } = useParams<{ token: string }>();
	const [info, setInfo] = useState<CancelInfo | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState(true);
	const [confirming, setConfirming] = useState(false);
	const [cancelled, setCancelled] = useState(false);
	const [refunded, setRefunded] = useState(false);

	useEffect(() => {
		fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/cancel/${token}`)
			.then(async (res) => {
				const data = await res.json();
				if (!res.ok) {
					setError(data.error ?? "Erreur lors du chargement");
				} else {
					setInfo(data);
				}
			})
			.catch(() => setError("Impossible de contacter le serveur"))
			.finally(() => setLoading(false));
	}, [token]);

	const handleCancel = async () => {
		setConfirming(true);
		setError(null);

		try {
			const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/cancel/${token}`, {
				method: "POST",
			});

			const data = await res.json();

			if (!res.ok) {
				// ✅ CORRECTION : on affiche l'erreur sans crasher la page
				setError(data.error ?? "Erreur lors de l'annulation");
				return;
			}

			// ✅ CORRECTION : on lit refunded depuis la réponse et on affiche le succès
			setRefunded(data.refunded ?? false);
			setCancelled(true);
		} catch {
			setError("Impossible de contacter le serveur");
		} finally {
			setConfirming(false);
		}
	};

	if (loading) {
		return (
			<main className="min-h-screen bg-stone-50 flex items-center justify-center">
				<p className="text-stone-500">Chargement...</p>
			</main>
		);
	}

	if (error && !cancelled) {
		return (
			<main className="min-h-screen bg-stone-50 flex items-center justify-center px-6">
				<div className="bg-white border border-stone-200 rounded-2xl p-8 max-w-sm w-full text-center">
					<div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
						<svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
						</svg>
					</div>
					<p className="text-red-600 font-medium">{error}</p>
					<a href="/" className="text-sm text-stone-500 hover:text-stone-800 mt-4 inline-block">
						Retour à l&apos;accueil
					</a>
				</div>
			</main>
		);
	}

	// ✅ CORRECTION : page de succès propre, sans erreur parasite
	if (cancelled) {
		return (
			<main className="min-h-screen bg-stone-50 flex items-center justify-center px-6">
				<div className="bg-white border border-stone-200 rounded-2xl p-8 max-w-sm w-full text-center">
					<div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
						<svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
						</svg>
					</div>
					<h1 className="text-xl font-semibold text-stone-900">Réservation annulée</h1>
					<p className="text-stone-500 mt-2 text-sm">
						Votre réservation a bien été annulée.
						{refunded && " Votre paiement a été intégralement remboursé."}
						{!refunded && info?.status === "accepted" && " Aucun remboursement n'a été effectué (moins de 24h avant le rendez-vous)."}
					</p>
					<p className="text-stone-400 text-xs mt-2">
						Un email de confirmation vous a été envoyé.
					</p>
					<a href="/" className="mt-6 inline-block bg-stone-900 text-white px-6 py-2.5 rounded-xl text-sm font-medium hover:bg-stone-800 transition">
						Retour à l&apos;accueil
					</a>
				</div>
			</main>
		);
	}

	if (!info) return null;

	const STATUS_FR: Record<string, string> = {
		pending: "En attente de validation",
		accepted: "Confirmée",
	};

	return (
		<main className="min-h-screen bg-stone-50 flex items-center justify-center px-6">
			<div className="bg-white border border-stone-200 rounded-2xl p-8 max-w-sm w-full">
				<h1 className="text-xl font-semibold text-stone-900 mb-1">Annuler votre réservation</h1>
				<p className="text-sm text-stone-500 mb-6">Vérifiez les informations avant de confirmer</p>

				<div className="bg-stone-50 rounded-xl p-4 flex flex-col gap-2 text-sm mb-6">
					<div className="flex justify-between">
						<span className="text-stone-500">Client</span>
						<span className="font-medium text-stone-900">{info.client_name}</span>
					</div>
					<div className="flex justify-between">
						<span className="text-stone-500">Service</span>
						<span className="font-medium text-stone-900">{info.service_name}</span>
					</div>
					<div className="flex justify-between">
						<span className="text-stone-500">Date</span>
						<span className="font-medium text-stone-900">
							{new Date(info.requested_date).toLocaleString("fr-FR")}
						</span>
					</div>
					<div className="flex justify-between">
						<span className="text-stone-500">Statut</span>
						<span className="font-medium text-stone-900">{STATUS_FR[info.status] ?? info.status}</span>
					</div>
				</div>

				<div className={`rounded-lg p-3 text-sm mb-6 ${info.can_refund ? "bg-green-50 text-green-800" : "bg-amber-50 text-amber-800"}`}>
					{info.message}
				</div>

				{error && (
					<p className="text-red-600 text-sm mb-4 text-center">{error}</p>
				)}

				<button
					onClick={handleCancel}
					disabled={confirming}
					className="w-full bg-red-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-red-700 transition disabled:opacity-50"
				>
					{confirming ? "Annulation en cours..." : "Confirmer l'annulation"}
				</button>

				<a href="/" className="block text-center mt-3 text-sm text-stone-400 hover:text-stone-700">
					Garder ma réservation
				</a>
			</div>
		</main>
	);
}