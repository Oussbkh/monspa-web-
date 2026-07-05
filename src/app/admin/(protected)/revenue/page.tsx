"use client";

import { useEffect, useState } from "react";

const MONTHS = ["Jan","Fév","Mar","Avr","Mai","Jun","Jul","Aoû","Sep","Oct","Nov","Déc"];

type Stats = {
	pending_count: number;
	accepted_count: number;
	refused_count: number;
	cancelled_by_client_count: number;
	completed_count: number;
};

type Revenue = {
	completed: { total_price_cents: number; total_deposit_cents: number } | null;
	deposits_captured: number;
	remaining_on_site: number;
};

type MonthlyData = {
	month: string;
	bookings_count: number;
	total_price_cents: number;
	total_deposit_cents: number;
};

type DetailRow = {
	id: number;
	client_name: string;
	requested_date: string;
	price_cents: number;
	service_name: string;
	deposit_cents: number;
};

export default function RevenuePage() {
	const currentYear = new Date().getFullYear();
	const [year, setYear] = useState(currentYear.toString());
	const [stats, setStats] = useState<Stats | null>(null);
	const [revenue, setRevenue] = useState<Revenue | null>(null);
	const [monthly, setMonthly] = useState<MonthlyData[]>([]);
	const [details, setDetails] = useState<DetailRow[]>([]);
	const [loading, setLoading] = useState(true);

	const load = async () => {
		setLoading(true);
		try {
			const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/revenue?year=${year}`, {
				credentials: "include",
			});
			const data = await res.json();
			setStats(data.stats);
			setRevenue(data.revenue);
			setMonthly(data.monthly ?? []);
			setDetails(data.details ?? []);
		} catch { /* ignore */ }
		finally { setLoading(false); }
	};

	useEffect(() => { load(); }, [year]);

	const fmt = (cents: number) => `${(cents / 100).toFixed(2)} €`;

	const STAT_CARDS = stats ? [
		{ label: "En attente", value: stats.pending_count, color: "bg-amber-50 text-amber-800 border-amber-200" },
		{ label: "Acceptées", value: stats.accepted_count, color: "bg-green-50 text-green-800 border-green-200" },
		{ label: "Refusées", value: stats.refused_count, color: "bg-red-50 text-red-800 border-red-200" },
		{ label: "Annulées par client", value: stats.cancelled_by_client_count, color: "bg-stone-50 text-stone-600 border-stone-200" },
		{ label: "Terminées", value: stats.completed_count, color: "bg-blue-50 text-blue-800 border-blue-200" },
	] : [];

	return (
		<main className="min-h-screen bg-stone-50">
			<div className="max-w-5xl mx-auto px-6 py-12">
				<div className="flex items-center justify-between mb-8">
					<h1 className="text-2xl font-semibold text-stone-900">Revenus</h1>
					<div className="flex items-center gap-4">
						<select value={year} onChange={(e) => setYear(e.target.value)}
							className="border border-stone-300 rounded-lg px-3 py-2 text-sm">
							{[currentYear, currentYear - 1, currentYear - 2].map((y) => (
								<option key={y} value={y}>{y}</option>
							))}
						</select>
						<a href="/admin/dashboard" className="text-sm text-stone-500 hover:text-stone-800">Tableau de bord</a>
					</div>
				</div>

				{loading && <p className="text-stone-500">Chargement...</p>}

				{!loading && (
					<div className="flex flex-col gap-8">
						{/* Statistiques globales */}
						<div>
							<h2 className="text-sm font-semibold text-stone-500 uppercase tracking-wide mb-3">Statistiques globales</h2>
							<div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
								{STAT_CARDS.map((card) => (
									<div key={card.label} className={`border rounded-xl p-4 ${card.color}`}>
										<p className="text-2xl font-bold">{card.value}</p>
										<p className="text-xs mt-1">{card.label}</p>
									</div>
								))}
							</div>
						</div>

						{/* Revenus */}
						<div>
							<h2 className="text-sm font-semibold text-stone-500 uppercase tracking-wide mb-3">Revenus</h2>
							<div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
								<div className="bg-white border border-stone-200 rounded-xl p-5">
									<p className="text-xs text-stone-500 mb-1">Total prestations réalisées</p>
									<p className="text-2xl font-bold text-stone-900">
										{fmt(revenue?.completed?.total_price_cents ?? 0)}
									</p>
								</div>
								<div className="bg-white border border-stone-200 rounded-xl p-5">
									<p className="text-xs text-stone-500 mb-1">Acomptes encaissés (réservations acceptées)</p>
									<p className="text-2xl font-bold text-green-700">
										{fmt(revenue?.deposits_captured ?? 0)}
									</p>
								</div>
								<div className="bg-white border border-stone-200 rounded-xl p-5">
									<p className="text-xs text-stone-500 mb-1">Reste encaissé sur place</p>
									<p className="text-2xl font-bold text-blue-700">
										{fmt(revenue?.remaining_on_site ?? 0)}
									</p>
								</div>
							</div>
						</div>

						{/* Statistiques mensuelles */}
						<div>
							<h2 className="text-sm font-semibold text-stone-500 uppercase tracking-wide mb-3">
								Statistiques mensuelles — {year}
							</h2>
							<div className="bg-white border border-stone-200 rounded-xl overflow-hidden">
								<table className="w-full text-sm">
									<thead className="bg-stone-50 border-b border-stone-200">
										<tr>
											<th className="text-left px-4 py-3 text-stone-500 font-medium">Mois</th>
											<th className="text-right px-4 py-3 text-stone-500 font-medium">Prestations</th>
											<th className="text-right px-4 py-3 text-stone-500 font-medium">Revenus</th>
											<th className="text-right px-4 py-3 text-stone-500 font-medium">Acomptes</th>
											<th className="text-right px-4 py-3 text-stone-500 font-medium">Sur place</th>
										</tr>
									</thead>
									<tbody>
										{MONTHS.map((name, i) => {
											const monthNum = String(i + 1).padStart(2, "0");
											const row = monthly.find((m) => m.month === monthNum);
											return (
												<tr key={name} className="border-b border-stone-100 last:border-0">
													<td className="px-4 py-3 font-medium text-stone-900">{name}</td>
													<td className="px-4 py-3 text-right text-stone-600">{row?.bookings_count ?? 0}</td>
													<td className="px-4 py-3 text-right text-stone-900">{fmt(row?.total_price_cents ?? 0)}</td>
													<td className="px-4 py-3 text-right text-green-700">{fmt(row?.total_deposit_cents ?? 0)}</td>
													<td className="px-4 py-3 text-right text-blue-700">
														{fmt((row?.total_price_cents ?? 0) - (row?.total_deposit_cents ?? 0))}
													</td>
												</tr>
											);
										})}
									</tbody>
								</table>
							</div>
						</div>

						{/* Tableau détaillé */}
						{details.length > 0 && (
							<div>
								<h2 className="text-sm font-semibold text-stone-500 uppercase tracking-wide mb-3">
									Détail des prestations — {year}
								</h2>
								<div className="bg-white border border-stone-200 rounded-xl overflow-hidden">
									<table className="w-full text-sm">
										<thead className="bg-stone-50 border-b border-stone-200">
											<tr>
												<th className="text-left px-4 py-3 text-stone-500 font-medium">Date</th>
												<th className="text-left px-4 py-3 text-stone-500 font-medium">Client</th>
												<th className="text-left px-4 py-3 text-stone-500 font-medium">Service</th>
												<th className="text-right px-4 py-3 text-stone-500 font-medium">Prix total</th>
												<th className="text-right px-4 py-3 text-stone-500 font-medium">Acompte</th>
												<th className="text-right px-4 py-3 text-stone-500 font-medium">Sur place</th>
											</tr>
										</thead>
										<tbody>
											{details.map((row) => (
												<tr key={row.id} className="border-b border-stone-100 last:border-0">
													<td className="px-4 py-3 text-stone-600">
														{new Date(row.requested_date).toLocaleDateString("fr-FR")}
													</td>
													<td className="px-4 py-3 text-stone-900 font-medium">{row.client_name}</td>
													<td className="px-4 py-3 text-stone-600">{row.service_name}</td>
													<td className="px-4 py-3 text-right text-stone-900">{fmt(row.price_cents)}</td>
													<td className="px-4 py-3 text-right text-green-700">{fmt(row.deposit_cents)}</td>
													<td className="px-4 py-3 text-right text-blue-700">{fmt(row.price_cents - row.deposit_cents)}</td>
												</tr>
											))}
										</tbody>
									</table>
								</div>
							</div>
						)}
					</div>
				)}
			</div>
		</main>
	);
}