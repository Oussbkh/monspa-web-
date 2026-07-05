"use client";

import { useEffect, useState } from "react";

type Tier = {
	min_sessions: number;
	discount_percent: number;
};

type Props = {
	serviceId: number;
};

export default function DiscountTiersEditor({ serviceId }: Props) {
	const [tiers, setTiers] = useState<Tier[]>([]);
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [message, setMessage] = useState<string | null>(null);

	useEffect(() => {
		loadTiers();
	}, [serviceId]);

	const loadTiers = async () => {
		setLoading(true);
		try {
			const res = await fetch(
				`${process.env.NEXT_PUBLIC_API_URL}/api/admin/services/${serviceId}/discount-tiers`,
				{ credentials: "include" }
			);
			if (!res.ok) throw new Error("Erreur lors du chargement");
			const data = await res.json();
			setTiers(data.map((t: any) => ({ min_sessions: t.min_sessions, discount_percent: t.discount_percent })));
		} catch {
			setMessage("Erreur lors du chargement des paliers");
		} finally {
			setLoading(false);
		}
	};

	const addTier = () => {
		setTiers([...tiers, { min_sessions: 2, discount_percent: 5 }]);
	};

	const updateTier = (index: number, updates: Partial<Tier>) => {
		const next = [...tiers];
		next[index] = { ...next[index], ...updates };
		setTiers(next);
	};

	const removeTier = (index: number) => {
		setTiers(tiers.filter((_, i) => i !== index));
	};

	const saveTiers = async () => {
		setSaving(true);
		setMessage(null);

		for (const tier of tiers) {
			if (tier.min_sessions < 2) {
				setMessage("Le nombre minimum de séances doit être au moins 2");
				setSaving(false);
				return;
			}
			if (tier.discount_percent < 0 || tier.discount_percent > 100) {
				setMessage("La réduction doit être entre 0 et 100%");
				setSaving(false);
				return;
			}
		}

		try {
			const res = await fetch(
				`${process.env.NEXT_PUBLIC_API_URL}/api/admin/services/${serviceId}/discount-tiers`,
				{
					method: "POST",
					credentials: "include",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ tiers }),
				}
			);

			if (!res.ok) throw new Error("Erreur lors de l'enregistrement");
			setMessage("Paliers enregistrés");
		} catch {
			setMessage("Erreur lors de l'enregistrement des paliers");
		} finally {
			setSaving(false);
		}
	};

	if (loading) {
		return <p className="text-stone-500 text-sm">Chargement des paliers...</p>;
	}

	return (
		<div className="flex flex-col gap-4">
			<p className="text-sm text-stone-500">
				Définissez des réductions selon le nombre de séances réservées en une fois. La meilleure réduction applicable est automatiquement utilisée.
			</p>

			<div className="flex flex-col gap-3">
				{tiers.map((tier, index) => (
					<div key={index} className="flex items-center gap-3 bg-stone-50 border border-stone-200 rounded-lg p-3">
						<span className="text-sm text-stone-600">À partir de</span>
						<input
							type="number"
							min="2"
							value={tier.min_sessions}
							onChange={(e) => updateTier(index, { min_sessions: parseInt(e.target.value, 10) || 2 })}
							className="w-20 border border-stone-300 rounded-lg px-2 py-1.5 text-sm"
						/>
						<span className="text-sm text-stone-600">séances : -</span>
						<input
							type="number"
							min="0"
							max="100"
							value={tier.discount_percent}
							onChange={(e) => updateTier(index, { discount_percent: parseFloat(e.target.value) || 0 })}
							className="w-20 border border-stone-300 rounded-lg px-2 py-1.5 text-sm"
						/>
						<span className="text-sm text-stone-600">%</span>

						<button
							type="button"
							onClick={() => removeTier(index)}
							className="text-sm text-red-600 hover:text-red-700 ml-auto"
						>
							Supprimer
						</button>
					</div>
				))}

				{tiers.length === 0 && (
					<p className="text-stone-400 text-sm">Aucun palier défini — seul le prix unitaire s&apos;applique.</p>
				)}
			</div>

			<div className="flex items-center gap-3">
				<button
					type="button"
					onClick={addTier}
					className="text-sm font-medium text-stone-900 border border-stone-300 rounded-lg px-4 py-2 hover:bg-stone-50 transition"
				>
					+ Ajouter un palier
				</button>

				<button
					type="button"
					onClick={saveTiers}
					disabled={saving}
					className="bg-stone-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-stone-800 transition disabled:opacity-50"
				>
					{saving ? "Enregistrement..." : "Enregistrer les paliers"}
				</button>
			</div>

			{message && <p className="text-sm text-stone-600">{message}</p>}
		</div>
	);
}