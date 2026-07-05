"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { logout } from "@/lib/auth";
export const runtime = "edge"
type Booking = {
	id: number;
	client_name: string;
	client_email: string;
	requested_date: string;
	status: "pending" | "accepted" | "refused" | "cancelled";
	created_at: string;
	service_name: string;
	cancelled_by: string | null; // ✅ AJOUT
};

const STATUS_LABELS: Record<string, string> = {
	pending: "En attente",
	accepted: "Acceptées",
	refused: "Refusées",
	cancelled: "Annulées", // ✅ AJOUT
};

const STATUS_COLORS: Record<string, string> = {
	pending: "bg-amber-100 text-amber-800",
	accepted: "bg-green-100 text-green-800",
	refused: "bg-red-100 text-red-800",
	cancelled: "bg-stone-100 text-stone-500", // ✅ AJOUT
};

export default function DashboardPage() {
	const router = useRouter();
	const [bookings, setBookings] = useState<Booking[]>([]);
	const [filter, setFilter] = useState<string>("all");
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		loadBookings();
	}, [filter]);

	const loadBookings = async () => {
		setLoading(true);
		setError(null);

		const query = filter === "all" ? "" : `?status=${filter}`;

		try {
			const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/bookings${query}`, {
				credentials: "include",
			});

			if (!res.ok) {
				throw new Error("Erreur lors du chargement des réservations");
			}

			setBookings(await res.json());
		} catch (err) {
			setError(err instanceof Error ? err.message : "Une erreur est survenue");
		} finally {
			setLoading(false);
		}
	};

	const handleLogout = async () => {
		await logout();
		router.push("/admin/login");
	};

	return (
		<main className="min-h-screen bg-stone-50">
			<div className="max-w-4xl mx-auto px-6 py-12">
				<div className="flex items-center justify-between mb-8">
					<h1 className="text-2xl font-semibold text-stone-900">Tableau de bord</h1>
					<div className="flex items-center gap-4">
						<a href="/admin/services" className="text-sm text-stone-500 hover:text-stone-800">
							Gérer les services
						</a>
						<a href="/admin/calendar" className="text-sm text-stone-500 hover:text-stone-800">
							Voir le calendrier
						</a>
						<a href="/admin/reviews" className="text-sm text-stone-500 hover:text-stone-800">
							Avis clients
						</a>
						<a href="/admin/revenue" className="text-sm text-stone-500 hover:text-stone-800">
							Revenus
						</a>						
						<button onClick={handleLogout} className="text-sm text-stone-500 hover:text-stone-800">
							Se déconnecter
						</button>
						<a href="/admin/settings" className="text-sm text-stone-500 hover:text-stone-800">
							Paramètres
						</a>
					</div>
				</div>

				<div className="flex gap-2 mb-6">
					{["all", "pending", "accepted", "refused", "cancelled"].map((s) => (
						<button
							key={s}
							onClick={() => setFilter(s)}
							className={`text-sm px-4 py-2 rounded-full transition ${
								filter === s
									? "bg-stone-900 text-white"
									: "bg-white border border-stone-200 text-stone-600 hover:border-stone-300"
							}`}
						>
							{s === "all" ? "Toutes" : STATUS_LABELS[s]}
						</button>
					))}
				</div>

				{loading && <p className="text-stone-500">Chargement...</p>}
				{error && <p className="text-red-600">{error}</p>}

				{!loading && bookings.length === 0 && (
					<p className="text-stone-500">Aucune réservation pour ce filtre.</p>
				)}

				<div className="flex flex-col gap-3">
					{bookings.map((booking) => (
						<a
							key={booking.id}
							href={`/admin/dashboard/${booking.id}`}
							className="bg-white border border-stone-200 rounded-xl p-4 flex items-center justify-between hover:border-stone-300 transition"
						>
							<div>
								<p className="font-medium text-stone-900">{booking.client_name}</p>
								<p className="text-sm text-stone-500">{booking.client_email}</p>
								<div className="flex flex-col gap-0.5 mt-1">
									<p className="text-xs text-stone-400">
										Demande envoyée le {new Date(booking.created_at).toLocaleString("fr-FR")}
									</p>
									<p className="text-xs text-stone-400">
										Créneau souhaité : {new Date(booking.requested_date).toLocaleString("fr-FR")}
									</p>
								</div>
							</div>
							<div className="flex flex-col items-end gap-1">
								<span className={`text-xs font-medium px-3 py-1 rounded-full ${STATUS_COLORS[booking.status]}`}>
									{STATUS_LABELS[booking.status]}
								</span>
								{/* ✅ AJOUT : indicateur "Annulé par client" */}
								{booking.status === "cancelled" && booking.cancelled_by === "client" && (
									<span className="text-xs text-stone-400">par le client</span>
								)}
							</div>
						</a>
					))}
				</div>
			</div>
		</main>
	);
}