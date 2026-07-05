"use client";

import { useEffect, useState } from "react";
export const runtime = "edge"
type Review = {
	id: number;
	client_name: string;
	client_firstname: string;
	comment: string;
	rating: number;
	status: "pending" | "approved" | "rejected";
	service_name: string;
	created_at: string;
};

export default function ReviewsPage() {
	const [reviews, setReviews] = useState<Review[]>([]);
	const [filter, setFilter] = useState("all");
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const loadReviews = async () => {
		setLoading(true);
		try {
			const url = filter === "all"
				? `${process.env.NEXT_PUBLIC_API_URL}/api/admin/reviews`
				: `${process.env.NEXT_PUBLIC_API_URL}/api/admin/reviews?status=${filter}`;
			const res = await fetch(url, { credentials: "include" });
			if (!res.ok) throw new Error("Erreur");
			setReviews(await res.json());
		} catch {
			setError("Erreur lors du chargement");
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => { loadReviews(); }, [filter]);

	const handleAction = async (id: number, action: "approve" | "reject" | "delete") => {
		if (action === "delete") {
			await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/reviews/${id}`, {
				method: "DELETE",
				credentials: "include",
			});
		} else {
			await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/reviews/${id}`, {
				method: "PATCH",
				credentials: "include",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ action }),
			});
		}
		loadReviews();
	};

	const STATUS_LABELS: Record<string, string> = {
		pending: "En attente",
		approved: "Approuvé",
		rejected: "Rejeté",
	};

	const STATUS_COLORS: Record<string, string> = {
		pending: "bg-amber-100 text-amber-800",
		approved: "bg-green-100 text-green-800",
		rejected: "bg-red-100 text-red-800",
	};

	return (
		<main className="min-h-screen bg-stone-50">
			<div className="max-w-4xl mx-auto px-6 py-12">
				<div className="flex items-center justify-between mb-8">
					<h1 className="text-2xl font-semibold text-stone-900">Avis clients</h1>
					<div className="flex items-center gap-4">
						<a href="/admin/dashboard" className="text-sm text-stone-500 hover:text-stone-800">Tableau de bord</a>
					</div>
				</div>

				<div className="flex gap-2 mb-6">
					{["all", "pending", "approved", "rejected"].map((s) => (
						<button key={s} onClick={() => setFilter(s)}
							className={`text-sm px-4 py-2 rounded-full transition ${filter === s
								? "bg-stone-900 text-white"
								: "bg-white border border-stone-200 text-stone-600 hover:border-stone-300"}`}>
							{s === "all" ? "Tous" : STATUS_LABELS[s]}
						</button>
					))}
				</div>

				{loading && <p className="text-stone-500">Chargement...</p>}
				{error && <p className="text-red-600">{error}</p>}
				{!loading && reviews.length === 0 && <p className="text-stone-500">Aucun avis pour ce filtre.</p>}

				<div className="flex flex-col gap-4">
					{reviews.map((review) => (
						<div key={review.id} className="bg-white border border-stone-200 rounded-xl p-5">
							<div className="flex items-start justify-between">
								<div>
									<p className="font-medium text-stone-900">{review.client_firstname} {review.client_name}</p>
									<p className="text-xs text-stone-500 mt-0.5">{review.service_name} · {new Date(review.created_at).toLocaleDateString("fr-FR")}</p>
									<div className="flex gap-0.5 mt-1">
										{[1,2,3,4,5].map((s) => (
											<span key={s} className={s <= review.rating ? "text-amber-400" : "text-stone-200"}>★</span>
										))}
									</div>
								</div>
								<span className={`text-xs font-medium px-3 py-1 rounded-full ${STATUS_COLORS[review.status]}`}>
									{STATUS_LABELS[review.status]}
								</span>
							</div>

							<p className="text-stone-700 text-sm mt-3 leading-relaxed">{review.comment}</p>

							<div className="flex gap-2 mt-4">
								{review.status === "pending" && (
									<>
										<button onClick={() => handleAction(review.id, "approve")}
											className="text-sm px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition">
											Approuver
										</button>
										<button onClick={() => handleAction(review.id, "reject")}
											className="text-sm px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition">
											Rejeter
										</button>
									</>
								)}
								{review.status === "approved" && (
									<button onClick={() => handleAction(review.id, "reject")}
										className="text-sm px-3 py-1.5 border border-stone-300 text-stone-700 rounded-lg hover:bg-stone-50 transition">
										Retirer
									</button>
								)}
								{review.status === "rejected" && (
									<button onClick={() => handleAction(review.id, "approve")}
										className="text-sm px-3 py-1.5 border border-stone-300 text-stone-700 rounded-lg hover:bg-stone-50 transition">
										Approuver quand même
									</button>
								)}
								<button onClick={() => handleAction(review.id, "delete")}
									className="text-sm px-3 py-1.5 text-red-600 hover:text-red-700 ml-auto">
									Supprimer
								</button>
							</div>
						</div>
					))}
				</div>
			</div>
		</main>
	);
}