"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";


type Question = {
    key: string;
    label: string;
    type: "text" | "single_choice" | "multiple_choice" | "file";
    required: boolean;
    options?: string[];
};

type BookingDetail = {
	id: number;
	client_name: string;
	client_email: string;
	client_phone: string | null;
	form_data: Record<string, string | string[]>;
	requested_date: string;
	status: "pending" | "accepted" | "refused" | "cancelled";
	location_type: "onsite" | "home";
	client_address: string | null;
	client_lat: number | null;
	client_lng: number | null;
	travel_distance_km: number | null;
	travel_fees_cents: number;
	travel_time_aller_minutes: number | null;
	travel_time_retour_minutes: number | null;
	rejection_reason: string | null;
	cancelled_by: string | null;
	created_at: string;
	updated_at: string;
	service: {
		id: number;
		name: string;
		price_cents: number;
		deposit_cents: number;
		duration_minutes: number;
		form_schema: Question[];
	};
};

const STATUS_LABELS: Record<string, string> = {
	pending: "En attente",
	accepted: "Acceptée",
	refused: "Refusée",
	cancelled: "Annulée",
};

const STATUS_COLORS: Record<string, string> = {
	pending: "bg-amber-100 text-amber-800",
	accepted: "bg-green-100 text-green-800",
	refused: "bg-red-100 text-red-800",
	cancelled: "bg-stone-100 text-stone-500",
};

export default function BookingDetailPage() {
	const router = useRouter();
	const params = useParams();
	const id = params.id as string;

	const [booking, setBooking] = useState<BookingDetail | null>(null);
	const [loading, setLoading] = useState(true);
	const [actionLoading, setActionLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	// Décision de refus
	const [refusalReason, setRefusalReason] = useState("slot_conflict");
	const [customRefusalReason, setCustomRefusalReason] = useState("");

	// Temps de trajet domicile
	const [travelAller, setTravelAller] = useState(0);
	const [travelRetour, setTravelRetour] = useState(0);

	useEffect(() => {
		loadBooking();
	}, [id]);

	const loadBooking = async () => {
		setLoading(true);
		try {
			const res = await fetch(
				`${process.env.NEXT_PUBLIC_API_URL}/api/admin/bookings/${id}`,
				{ credentials: "include" }
			);
			if (!res.ok) throw new Error("Réservation introuvable");
			setBooking(await res.json());
		} catch (err) {
			setError(err instanceof Error ? err.message : "Une erreur est survenue");
		} finally {
			setLoading(false);
		}
	};

	const handleDecision = async (decision: "accept" | "refuse") => {
		setActionLoading(true);
		setError(null);

		const finalReason =
			refusalReason === "other" ? customRefusalReason : refusalReason;

		if (decision === "refuse" && !finalReason) {
			setError("Merci de préciser la raison du refus");
			setActionLoading(false);
			return;
		}

		try {
			const res = await fetch(
				`${process.env.NEXT_PUBLIC_API_URL}/api/admin/bookings/${id}`,
				{
					method: "PATCH",
					credentials: "include",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						decision,
						rejection_reason:
							decision === "refuse" ? finalReason : undefined,
						travel_time_aller_minutes:
							decision === "accept" && booking?.location_type === "home"
								? travelAller
								: undefined,
						travel_time_retour_minutes:
							decision === "accept" && booking?.location_type === "home"
								? travelRetour
								: undefined,
					}),
				}
			);

			const data = await res.json();
			if (!res.ok)
				throw new Error(data.error || "Erreur lors de la mise à jour");

			await loadBooking();
		} catch (err) {
			setError(
				err instanceof Error ? err.message : "Une erreur est survenue"
			);
		} finally {
			setActionLoading(false);
		}
	};

	if (loading) {
		return (
			<main className="min-h-screen bg-stone-50 px-6 py-12">
				<p className="text-stone-500 max-w-2xl mx-auto">Chargement...</p>
			</main>
		);
	}

	if (!booking) {
		return (
			<main className="min-h-screen bg-stone-50 px-6 py-12">
				<p className="text-red-600 max-w-2xl mx-auto">
					{error ?? "Réservation introuvable"}
				</p>
			</main>
		);
	}

	return (
		<main className="min-h-screen bg-stone-50">
			<div className="max-w-2xl mx-auto px-6 py-12">
				<button
					onClick={() => router.push("/admin/dashboard")}
					className="text-sm text-stone-500 hover:text-stone-800 mb-6"
				>
					← Retour au tableau de bord
				</button>

				<div className="bg-white border border-stone-200 rounded-2xl p-6">
					{/* En-tête */}
					<div className="flex items-center justify-between">
						<h1 className="text-xl font-semibold text-stone-900">
							{booking.client_name}
						</h1>
						<div className="flex flex-col items-end gap-1">
							<span
								className={`text-xs font-medium px-3 py-1 rounded-full ${STATUS_COLORS[booking.status]}`}
							>
								{STATUS_LABELS[booking.status]}
							</span>
							{booking.status === "cancelled" &&
								booking.cancelled_by === "client" && (
									<span className="text-xs text-stone-400">
										par le client
									</span>
								)}
						</div>
					</div>

					{/* Infos client */}
					<div className="mt-4 text-sm text-stone-600 flex flex-col gap-1">
						<p>Email : {booking.client_email}</p>
						{booking.client_phone && (
							<p>Téléphone : {booking.client_phone}</p>
						)}
						<p>
							Demande envoyée le :{" "}
							{new Date(booking.created_at).toLocaleString("fr-FR")}
						</p>
						<p>
							Date souhaitée :{" "}
							{new Date(booking.requested_date).toLocaleString("fr-FR")}
						</p>
					</div>

					{/* Service */}
					<div className="border-t border-stone-100 mt-5 pt-5">
						<h2 className="text-sm font-medium text-stone-900 mb-1">
							Service
						</h2>
						<p className="text-stone-600 text-sm">
							{booking.service.name} —{" "}
							{(booking.service.price_cents / 100).toFixed(2)} € —{" "}
							{booking.service.duration_minutes} min
						</p>
						{booking.service.deposit_cents > 0 && (
							<p className="text-xs text-stone-400 mt-0.5">
								Acompte :{" "}
								{(booking.service.deposit_cents / 100).toFixed(2)} € · Sur
								place :{" "}
								{(
									(booking.service.price_cents -
										booking.service.deposit_cents) /
									100
								).toFixed(2)}{" "}
								€
							</p>
						)}
					</div>

					{/* ✅ Localisation — affichage clair domicile/sur place */}
					<div className="border-t border-stone-100 mt-5 pt-5">
						<h2 className="text-sm font-medium text-stone-900 mb-2">
							Localisation
						</h2>

						{booking.location_type === "home" ? (
							<div className="flex flex-col gap-1">
								<span className="inline-flex items-center gap-1 text-xs font-medium bg-blue-100 text-blue-700 px-2 py-1 rounded-full self-start">
									🏠 À domicile
								</span>
								{booking.client_address && (
									<p className="text-sm text-stone-600 mt-1">
										{booking.client_address}
									</p>
								)}
								{booking.travel_distance_km && (
									<p className="text-xs text-stone-400">
										Distance : {booking.travel_distance_km.toFixed(1)} km —
										Frais :{" "}
										{(booking.travel_fees_cents / 100).toFixed(2)} €
									</p>
								)}
								{booking.travel_time_aller_minutes !== null && (
									<p className="text-xs text-stone-400">
										Trajet : {booking.travel_time_aller_minutes} min aller /
										{booking.travel_time_retour_minutes} min retour
									</p>
								)}
							</div>
						) : (
							<span className="inline-flex items-center gap-1 text-xs font-medium bg-stone-100 text-stone-600 px-2 py-1 rounded-full self-start">
								🏪 Sur place
							</span>
						)}
					</div>

					{/* ✅ Réponses au formulaire — avec lien fichier si URL R2 */}
					<div className="border-t border-stone-100 mt-5 pt-5">
						<h2 className="text-sm font-medium text-stone-900 mb-3">
							Réponses au formulaire
						</h2>
						<div className="flex flex-col gap-3">
							{booking.service.form_schema.map((q) => {
								const answer = booking.form_data[q.key];
								const display = Array.isArray(answer)
									? answer.join(", ")
									: answer ?? "Non renseigné";

								// ✅ Détecte fichier via le type de la question OU l'URL
								const isFileUrl =
									q.type === "file" ||
									(typeof display === "string" && display.startsWith("/api/uploads/"));

								// 👇 Ajoute ça ici
									if (isFileUrl) {
										console.log("URL fichier:", `${process.env.NEXT_PUBLIC_API_URL}${display}`);
									}

								return (
									<div key={q.key}>
										<p className="text-xs text-stone-400">{q.label}</p>
										{isFileUrl ? (
											<a
												href={`${process.env.NEXT_PUBLIC_API_URL}${display}`}
												target="_blank"
												rel="noopener noreferrer"
												className="text-sm text-blue-600 hover:underline flex items-center gap-1 mt-0.5"
											>
												📎 Voir le fichier
											</a>
										) : (
											<p className="text-sm text-stone-800">
												{String(display)}
											</p>
										)}
									</div>
								);
							})}
						</div>
					</div>

					{/* Raison de refus (si refusée) */}
					{booking.status === "refused" && booking.rejection_reason && (
						<div className="border-t border-stone-100 mt-5 pt-5">
							<h2 className="text-sm font-medium text-stone-900 mb-1">
								Raison du refus
							</h2>
							<p className="text-sm text-stone-600">
								{booking.rejection_reason}
							</p>
						</div>
					)}

					{/* ✅ Zone de décision — uniquement si en attente */}
					{booking.status === "pending" && (
						<div className="border-t border-stone-100 mt-5 pt-5 flex flex-col gap-4">

							{/* Temps de trajet si domicile */}
							{booking.location_type === "home" && (
								<div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
									<p className="text-sm font-medium text-blue-800 mb-3">
										Temps de déplacement estimé
									</p>
									<div className="flex gap-4">
										<div className="flex-1">
											<label className="block text-xs text-blue-700 mb-1">
												Aller (min)
											</label>
											<input
												type="number"
												min="0"
												value={travelAller}
												onChange={(e) =>
													setTravelAller(
														parseInt(e.target.value, 10) || 0
													)
												}
												className="w-full border border-blue-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
											/>
										</div>
										<div className="flex-1">
											<label className="block text-xs text-blue-700 mb-1">
												Retour (min)
											</label>
											<input
												type="number"
												min="0"
												value={travelRetour}
												onChange={(e) =>
													setTravelRetour(
														parseInt(e.target.value, 10) || 0
													)
												}
												className="w-full border border-blue-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
											/>
										</div>
									</div>
									<p className="text-xs text-blue-600 mt-2">
										Ces durées sont enregistrées avec la validation pour
										bloquer le planning.
									</p>
								</div>
							)}

							{/* Raison de refus */}
							<div className="bg-stone-50 border border-stone-200 rounded-xl p-4">
								<p className="text-sm font-medium text-stone-700 mb-3">
									Raison du refus (si applicable)
								</p>
								<div className="flex flex-col gap-2">
									{[
										{
											value: "slot_conflict",
											label: "Conflit d'agenda",
										},
										{
											value: "form_invalid",
											label: "Formulaire non conforme",
										},
										{ value: "other", label: "Autre raison" },
									].map((option) => (
										<label
											key={option.value}
											className="flex items-center gap-2 text-sm text-stone-700 cursor-pointer"
										>
											<input
												type="radio"
												name="refusal_reason"
												value={option.value}
												checked={refusalReason === option.value}
												onChange={() =>
													setRefusalReason(option.value)
												}
											/>
											{option.label}
										</label>
									))}
								</div>

								{refusalReason === "other" && (
									<textarea
										className="mt-3 w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-stone-400 resize-none"
										rows={2}
										placeholder="Décrivez la raison..."
										value={customRefusalReason}
										onChange={(e) =>
											setCustomRefusalReason(e.target.value)
										}
									/>
								)}
							</div>

							{error && (
								<p className="text-red-600 text-sm">{error}</p>
							)}

							{/* Boutons décision */}
							<div className="flex gap-3">
								<button
									onClick={() => handleDecision("accept")}
									disabled={actionLoading}
									className="flex-1 bg-stone-900 text-white px-4 py-3 rounded-xl font-medium hover:bg-stone-800 transition disabled:opacity-50"
								>
									{actionLoading ? "..." : "Accepter"}
								</button>
								<button
									onClick={() => handleDecision("refuse")}
									disabled={actionLoading}
									className="flex-1 bg-white border border-stone-300 text-stone-700 px-4 py-3 rounded-xl font-medium hover:bg-stone-50 transition disabled:opacity-50"
								>
									{actionLoading ? "..." : "Refuser"}
								</button>
							</div>
						</div>
					)}
				</div>
			</div>
		</main>
	);
}