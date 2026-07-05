"use client";

import { useEffect, useState } from "react";

type Rule = {
	weekday: number;
	start_time: string;
	end_time: string;
};

type Exception = {
	id: number;
	date: string;
	closed: number;
};

const WEEKDAYS = [
	{ value: 1, label: "Lundi" },
	{ value: 2, label: "Mardi" },
	{ value: 3, label: "Mercredi" },
	{ value: 4, label: "Jeudi" },
	{ value: 5, label: "Vendredi" },
	{ value: 6, label: "Samedi" },
	{ value: 0, label: "Dimanche" },
];

type Props = {
	serviceId: number;
};

export default function AvailabilityEditor({ serviceId }: Props) {
	const [bufferMinutes, setBufferMinutes] = useState(0);
	const [rules, setRules] = useState<Rule[]>([]);
	const [exceptions, setExceptions] = useState<Exception[]>([]);
	const [newExceptionDate, setNewExceptionDate] = useState("");
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [message, setMessage] = useState<string | null>(null);

	useEffect(() => {
		loadAvailability();
	}, [serviceId]);

	const loadAvailability = async () => {
		setLoading(true);
		try {
			const res = await fetch(
				`${process.env.NEXT_PUBLIC_API_URL}/api/admin/services/${serviceId}/availability`,
				{ credentials: "include" }
			);
			if (!res.ok) throw new Error("Erreur lors du chargement");
			const data = await res.json();
			setBufferMinutes(data.buffer_minutes);
			setRules(data.rules.map((r: any) => ({
				weekday: r.weekday,
				start_time: r.start_time,
				end_time: r.end_time,
			})));
			setExceptions(data.exceptions);
		} catch (err) {
			setMessage("Erreur lors du chargement des disponibilités");
		} finally {
			setLoading(false);
		}
	};

	const addRule = () => {
		setRules([...rules, { weekday: 1, start_time: "09:00", end_time: "18:00" }]);
	};

	const updateRule = (index: number, updates: Partial<Rule>) => {
		const next = [...rules];
		next[index] = { ...next[index], ...updates };
		setRules(next);
	};

	const removeRule = (index: number) => {
		setRules(rules.filter((_, i) => i !== index));
	};

	const saveRules = async () => {
		setSaving(true);
		setMessage(null);
		try {
			const res = await fetch(
				`${process.env.NEXT_PUBLIC_API_URL}/api/admin/services/${serviceId}/availability`,
				{
					method: "POST",
					credentials: "include",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ buffer_minutes: bufferMinutes, rules }),
				}
			);
			if (!res.ok) throw new Error("Erreur lors de l'enregistrement");
			setMessage("Horaires enregistrés");
		} catch (err) {
			setMessage("Erreur lors de l'enregistrement des horaires");
		} finally {
			setSaving(false);
		}
	};

	const addException = async () => {
		if (!newExceptionDate) return;

		try {
			const res = await fetch(
				`${process.env.NEXT_PUBLIC_API_URL}/api/admin/services/${serviceId}/exceptions`,
				{
					method: "POST",
					credentials: "include",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ date: newExceptionDate, global: false }),
				}
			);
			if (!res.ok) throw new Error("Erreur lors de l'ajout");
			setNewExceptionDate("");
			loadAvailability();
		} catch (err) {
			setMessage("Erreur lors de l'ajout de l'exception");
		}
	};

	const removeException = async (exceptionId: number) => {
		try {
			await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/exceptions/${exceptionId}`, {
				method: "DELETE",
				credentials: "include",
			});
			loadAvailability();
		} catch (err) {
			setMessage("Erreur lors de la suppression");
		}
	};

	if (loading) {
		return <p className="text-stone-500 text-sm">Chargement des disponibilités...</p>;
	}

	return (
		<div className="flex flex-col gap-6">
			<div>
				<label className="block text-sm font-medium text-stone-700 mb-1.5">
					Temps de repos après le service (minutes)
				</label>
				<input
					type="number"
					min="0"
					value={bufferMinutes}
					onChange={(e) => setBufferMinutes(parseInt(e.target.value, 10) || 0)}
					className="w-32 border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-stone-400"
				/>
			</div>

			<div>
				<h3 className="text-sm font-medium text-stone-900 mb-3">Horaires récurrents</h3>
				<div className="flex flex-col gap-3">
					{rules.map((rule, index) => (
						<div key={index} className="flex items-center gap-2 bg-stone-50 border border-stone-200 rounded-lg p-3">
							<select
								value={rule.weekday}
								onChange={(e) => updateRule(index, { weekday: parseInt(e.target.value, 10) })}
								className="border border-stone-300 rounded-lg px-2 py-1.5 text-sm"
							>
								{WEEKDAYS.map((w) => (
									<option key={w.value} value={w.value}>
										{w.label}
									</option>
								))}
							</select>

							<input
								type="time"
								value={rule.start_time}
								onChange={(e) => updateRule(index, { start_time: e.target.value })}
								className="border border-stone-300 rounded-lg px-2 py-1.5 text-sm"
							/>
							<span className="text-stone-400 text-sm">à</span>
							<input
								type="time"
								value={rule.end_time}
								onChange={(e) => updateRule(index, { end_time: e.target.value })}
								className="border border-stone-300 rounded-lg px-2 py-1.5 text-sm"
							/>

							<button
								type="button"
								onClick={() => removeRule(index)}
								className="text-sm text-red-600 hover:text-red-700 ml-auto"
							>
								Supprimer
							</button>
						</div>
					))}
				</div>

				<button
					type="button"
					onClick={addRule}
					className="text-sm font-medium text-stone-900 border border-stone-300 rounded-lg px-4 py-2 hover:bg-stone-50 transition mt-3"
				>
					+ Ajouter un horaire
				</button>

				<button
					type="button"
					onClick={saveRules}
					disabled={saving}
					className="block bg-stone-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-stone-800 transition mt-4 disabled:opacity-50"
				>
					{saving ? "Enregistrement..." : "Enregistrer les horaires"}
				</button>

				{message && <p className="text-sm text-stone-600 mt-2">{message}</p>}
			</div>

			<div>
				<h3 className="text-sm font-medium text-stone-900 mb-3">Jours de fermeture exceptionnelle</h3>

				<div className="flex flex-col gap-2 mb-3">
					{exceptions.map((exc) => (
						<div
							key={exc.id}
							className="flex items-center justify-between bg-stone-50 border border-stone-200 rounded-lg p-2.5 text-sm"
						>
							<span>{exc.date.split("-").reverse().join("/")}</span>
							<button
								type="button"
								onClick={() => removeException(exc.id)}
								className="text-red-600 hover:text-red-700"
							>
								Supprimer
							</button>
						</div>
					))}
					{exceptions.length === 0 && (
						<p className="text-stone-400 text-sm">Aucune fermeture exceptionnelle</p>
					)}
				</div>

				<div className="flex items-center gap-2">
					<input
						type="date"
						value={newExceptionDate}
						onChange={(e) => setNewExceptionDate(e.target.value)}
						className="border border-stone-300 rounded-lg px-3 py-2 text-sm"
					/>
					<button
						type="button"
						onClick={addException}
						className="text-sm font-medium text-stone-900 border border-stone-300 rounded-lg px-4 py-2 hover:bg-stone-50 transition"
					>
						+ Ajouter
					</button>
				</div>
			</div>
		</div>
	);
}