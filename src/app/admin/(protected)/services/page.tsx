"use client";

import { useEffect, useState } from "react";

type Service = {
	id: number;
	name: string;
	price_cents: number;
	duration_minutes: number;
	is_active: number;
};

export default function ServicesListPage() {
	const [services, setServices] = useState<Service[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		loadServices();
	}, []);

	const loadServices = async () => {
		setLoading(true);
		try {
			const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/services`, {
				credentials: "include",
			});
			if (!res.ok) throw new Error("Erreur lors du chargement des services");
			setServices(await res.json());
		} catch (err) {
			setError(err instanceof Error ? err.message : "Une erreur est survenue");
		} finally {
			setLoading(false);
		}
	};

	const handleDelete = async (id: number, e: React.MouseEvent) => {
		e.preventDefault();
		e.stopPropagation();

		if (!confirm("Supprimer ce service ? Il ne sera plus visible sur le site.")) {
			return;
		}

		try {
			const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/services/${id}`, {
				method: "DELETE",
				credentials: "include",
			});

			if (!res.ok) throw new Error("Erreur lors de la suppression");

			await loadServices();
		} catch (err) {
			setError(err instanceof Error ? err.message : "Une erreur est survenue");
		}
	};

	return (
		<main className="min-h-screen bg-stone-50">
			<div className="max-w-3xl mx-auto px-6 py-12">
				<div className="flex items-center justify-between mb-8">
					<h1 className="text-2xl font-semibold text-stone-900">Services</h1>
					<div className="flex items-center gap-4">
						<a href="/admin/calendar" className="text-sm text-stone-500 hover:text-stone-800">
							Voir le calendrier
						</a>
						<a href="/admin/dashboard" className="text-sm text-stone-500 hover:text-stone-800">
							Tableau de bord
						</a>						
						<a
							href="/admin/services/new"
							className="bg-stone-900 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-stone-800 transition"
						>
							+ Nouveau service
						</a>
					</div>
				</div>

				{loading && <p className="text-stone-500">Chargement...</p>}
				{error && <p className="text-red-600">{error}</p>}

				<div className="flex flex-col gap-3">
					{services.map((service) => (
						<a
							key={service.id}
							href={`/admin/services/${service.id}/edit`}
							className="bg-white border border-stone-200 rounded-xl p-4 flex items-center justify-between hover:border-stone-300 transition"
						>
							<div>
								<p className="font-medium text-stone-900">{service.name}</p>
								<p className="text-sm text-stone-500">
									{(service.price_cents / 100).toFixed(2)} € — {service.duration_minutes} min
								</p>
							</div>
							<span
								className={`text-xs font-medium px-3 py-1 rounded-full ${
									service.is_active ? "bg-green-100 text-green-800" : "bg-stone-100 text-stone-500"
								}`}
							>
								{service.is_active ? "Actif" : "Inactif"}
							</span>
						</a>
					))}
				</div>
			</div>
		</main>
	);
}