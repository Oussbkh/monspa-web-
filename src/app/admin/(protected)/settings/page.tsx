"use client";
export const runtime = "edge"
import { useEffect, useState } from "react";
import MapboxAutocomplete from "@/components/MapboxAutocomplete";

const DEFAULT_PRICE_PER_KM_EUROS = "1.50";
export default function SettingsPage() {
	const [salonAddress, setSalonAddress] = useState("");
	const [salonLat, setSalonLat] = useState("0");
	const [salonLng, setSalonLng] = useState("0");
	const [pricePerKm, setPricePerKm] = useState(DEFAULT_PRICE_PER_KM_EUROS); 
	const [bookingPeriodStart, setBookingPeriodStart] = useState("");
	const [bookingPeriodEnd, setBookingPeriodEnd] = useState("");
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [message, setMessage] = useState<string | null>(null);
	// ✅ Suppression de addressSelected : état inutilisé

	useEffect(() => {
		fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/settings`, { credentials: "include" })
			.then((res) => res.json())
			.then((data) => {
				setSalonAddress(data.salon_address ?? "");
				setSalonLat(data.salon_lat ?? "0");
				setSalonLng(data.salon_lng ?? "0");
				const centsValue = parseInt(data.price_per_km_cents ?? "150", 10);
				setPricePerKm((centsValue / 100).toFixed(2));
				setBookingPeriodStart(data.booking_period_start ?? "");
				setBookingPeriodEnd(data.booking_period_end ?? "");
			})
			.finally(() => setLoading(false));
	}, []);

	const handleAddressSelect = (address: string, lat: number, lng: number) => {
		setSalonAddress(address);
		setSalonLat(lat.toString());
		setSalonLng(lng.toString());
		// ✅ Suppression de setAddressSelected : inutile
	};

	const save = async () => {
		setSaving(true);
		setMessage(null);

		try {
			const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/settings`, {
				method: "POST",
				credentials: "include",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					salon_address: salonAddress,
					salon_lat: salonLat,
					salon_lng: salonLng,
					price_per_km_cents: Math.round(parseFloat(pricePerKm) * 100).toString(),
					booking_period_start: bookingPeriodStart,
					booking_period_end: bookingPeriodEnd,
				}),
			});

			if (!res.ok) throw new Error("Erreur lors de la sauvegarde");
			setMessage("Paramètres enregistrés");
		} catch {
			setMessage("Erreur lors de l'enregistrement");
		} finally {
			setSaving(false);
		}
	};

	if (loading) {
		return (
			<main className="min-h-screen bg-stone-50 px-6 py-12">
				<p className="text-stone-500">Chargement...</p>
			</main>
		);
	}

	return (
		<main className="min-h-screen bg-stone-50">
			<div className="max-w-xl mx-auto px-6 py-12">
				<div className="flex items-center justify-between mb-8">
					<h1 className="text-2xl font-semibold text-stone-900">Paramètres</h1>
					<a href="/admin/dashboard" className="text-sm text-stone-500 hover:text-stone-800">
						Tableau de bord
					</a>
				</div>

				<div className="bg-white border border-stone-200 rounded-2xl p-6 flex flex-col gap-8">
					{/* Adresse du salon */}
					<div>
						<h2 className="text-sm font-semibold text-stone-900 mb-1">Adresse du salon</h2>
						<p className="text-xs text-stone-500 mb-3">
							Utilisée pour calculer les frais de déplacement et affichée dans les emails de confirmation.
						</p>
						<label className="block text-sm font-medium text-stone-700 mb-1.5">
							Adresse <span className="text-red-500">*</span>
						</label>
						<MapboxAutocomplete
							onSelect={handleAddressSelect}
							placeholder={salonAddress || "Entrez l'adresse du salon..."}
						/>
						{salonLat !== "0" && (
							<p className="text-xs text-stone-400 mt-1">
								Coordonnées : {parseFloat(salonLat).toFixed(4)}, {parseFloat(salonLng).toFixed(4)}
							</p>
						)}
					</div>

					{/* Tarif de déplacement */}
					<div>
						<h2 className="text-sm font-semibold text-stone-900 mb-3">Tarif de déplacement</h2>
						<label className="block text-sm font-medium text-stone-700 mb-1.5">
							Prix par km (€)
						</label>
						<input
							type="number"
							step="0.01"
							min="0"
							value={pricePerKm}
							onChange={(e) => setPricePerKm(e.target.value)}
							className="w-32 border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-stone-400"
						/>
						<p className="text-xs text-stone-400 mt-1">
							Exemple : 1,50 €/km pour 10 km = 15 € de frais.
						</p>
					</div>

					{/* Période de réservation */}
					<div>
						<h2 className="text-sm font-semibold text-stone-900 mb-1">Période de réservation autorisée</h2>
						<p className="text-xs text-stone-500 mb-3">
							Les clients ne pourront réserver que dans cet intervalle. Laisser vide pour ne pas restreindre.
						</p>
						<div className="flex gap-4">
							<div className="flex-1">
								<label className="block text-sm font-medium text-stone-700 mb-1.5">
									Date de début
								</label>
								<input
									type="date"
									value={bookingPeriodStart}
									onChange={(e) => setBookingPeriodStart(e.target.value)}
									className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-stone-400"
								/>
							</div>
							<div className="flex-1">
								<label className="block text-sm font-medium text-stone-700 mb-1.5">
									Date de fin
								</label>
								<input
									type="date"
									value={bookingPeriodEnd}
									onChange={(e) => setBookingPeriodEnd(e.target.value)}
									className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-stone-400"
								/>
							</div>
						</div>

						{bookingPeriodStart && bookingPeriodEnd && (
							<p className="text-xs text-stone-400 mt-2">
								Les clients pourront réserver du{" "}
								<strong>{new Date(bookingPeriodStart).toLocaleDateString("fr-FR")}</strong>{" "}
								au{" "}
								<strong>{new Date(bookingPeriodEnd).toLocaleDateString("fr-FR")}</strong>.
							</p>
						)}
					</div>

					{message && (
						<p className={`text-sm ${message.includes("Erreur") ? "text-red-600" : "text-green-700"}`}>
							{message}
						</p>
					)}

					<button
						type="button"
						onClick={save}
						disabled={saving}
						className="bg-stone-900 text-white px-6 py-3 rounded-xl font-medium hover:bg-stone-800 transition disabled:opacity-50 self-start"
					>
						{saving ? "Enregistrement..." : "Enregistrer"}
					</button>
				</div>
			</div>
		</main>
	);
}