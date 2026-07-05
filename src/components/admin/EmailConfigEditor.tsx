"use client";

import { useEffect, useState } from "react";

type Config = {
	email_reminder_template: string | null;
	reminder_delay_days: number;
	post_session_delay_hours: number;
	post_session_advice: string | null;
};

type Props = { serviceId: number };

export default function EmailConfigEditor({ serviceId }: Props) {
	const [config, setConfig] = useState<Config>({
		email_reminder_template: "",
		reminder_delay_days: 2,
		post_session_delay_hours: 2,
		post_session_advice: "",
	});
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [message, setMessage] = useState<string | null>(null);
	const [activeTab, setActiveTab] = useState<"reminder" | "post_session">("reminder");

	useEffect(() => {
		fetch(
			`${process.env.NEXT_PUBLIC_API_URL}/api/admin/services/${serviceId}/email-config`,
			{ credentials: "include" }
		)
			.then((res) => res.json())
			.then((data) =>
				setConfig({
					email_reminder_template: data.email_reminder_template ?? "",
					reminder_delay_days: data.reminder_delay_days ?? 2,
					post_session_delay_hours: data.post_session_delay_hours ?? 2,
					post_session_advice: data.post_session_advice ?? "",
				})
			)
			.catch(() => setMessage("Erreur lors du chargement"))
			.finally(() => setLoading(false));
	}, [serviceId]);

	const save = async () => {
		setSaving(true);
		setMessage(null);

		try {
			const res = await fetch(
				`${process.env.NEXT_PUBLIC_API_URL}/api/admin/services/${serviceId}/email-config`,
				{
					method: "POST",
					credentials: "include",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						// ✅ On n'envoie que les champs modifiables
						email_reminder_template: config.email_reminder_template || null,
						reminder_delay_days: config.reminder_delay_days,
						post_session_delay_hours: config.post_session_delay_hours,
						post_session_advice: config.post_session_advice || null,
						// Champs supprimés de l'UI → on envoie null pour effacer les anciens
						email_accept_template: null,
						email_cancel_template: null,
						email_post_session_template: null,
					}),
				}
			);

			if (!res.ok) throw new Error("Erreur");
			setMessage("Configuration enregistrée");
		} catch {
			setMessage("Erreur lors de l'enregistrement");
		} finally {
			setSaving(false);
		}
	};

	if (loading) return <p className="text-stone-500 text-sm">Chargement...</p>;

	const TABS = [
		{ key: "reminder" as const, label: "Rappel" },
		{ key: "post_session" as const, label: "Post-séance" },
	];

	return (
		<div className="flex flex-col gap-6">
			{/* Onglets */}
			<div className="flex gap-1 bg-stone-100 rounded-lg p-1">
				{TABS.map((tab) => (
					<button
						key={tab.key}
						type="button"
						onClick={() => setActiveTab(tab.key)}
						className={`flex-1 text-sm px-3 py-1.5 rounded-md transition ${
							activeTab === tab.key
								? "bg-white text-stone-900 shadow-sm"
								: "text-stone-500 hover:text-stone-800"
						}`}
					>
						{tab.label}
					</button>
				))}
			</div>

			{/* ────── Rappel ────── */}
			{activeTab === "reminder" && (
				<div className="flex flex-col gap-4">
					<p className="text-xs text-stone-500">
						Email envoyé automatiquement avant le rendez-vous. Laisser vide pour utiliser le
						template par défaut.
					</p>

					<div>
						<label className="block text-sm font-medium text-stone-700 mb-1.5">
							Envoyer le rappel combien de jours avant ?
						</label>
						<div className="flex gap-2">
							{[1, 2, 3].map((days) => (
								<button
									key={days}
									type="button"
									onClick={() =>
										setConfig({ ...config, reminder_delay_days: days })
									}
									className={`px-4 py-2 rounded-lg border text-sm transition ${
										config.reminder_delay_days === days
											? "bg-stone-900 text-white border-stone-900"
											: "border-stone-300 text-stone-700 hover:border-stone-400"
									}`}
								>
									{days} jour{days > 1 ? "s" : ""}
								</button>
							))}
						</div>
					</div>

					<div>
						<label className="block text-xs text-stone-500 mb-1.5">
							Template personnalisé (variables : {"{{client_name}}"},{" "}
							{"{{service_name}}"}, {"{{requested_date}}"}, {"{{cancel_link}}"},{" "}
							{"{{location_info}}"})
						</label>
						<textarea
							rows={7}
							value={config.email_reminder_template ?? ""}
							onChange={(e) =>
								setConfig({ ...config, email_reminder_template: e.target.value })
							}
							placeholder="Laisser vide pour le template par défaut..."
							className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-stone-400 font-mono resize-y"
						/>
					</div>
				</div>
			)}

			{/* ────── Post-séance ────── */}
			{activeTab === "post_session" && (
				<div className="flex flex-col gap-4">
					<p className="text-xs text-stone-500">
						Email envoyé automatiquement après la séance. Seuls le délai et les conseils
						sont personnalisables — le reste utilise le template par défaut.
					</p>

					<div>
						<label className="block text-sm font-medium text-stone-700 mb-1.5">
							Envoyer combien d&apos;heures après la séance ?
						</label>
						<div className="flex gap-2">
							{[1, 2, 3].map((hours) => (
								<button
									key={hours}
									type="button"
									onClick={() =>
										setConfig({ ...config, post_session_delay_hours: hours })
									}
									className={`px-4 py-2 rounded-lg border text-sm transition ${
										config.post_session_delay_hours === hours
											? "bg-stone-900 text-white border-stone-900"
											: "border-stone-300 text-stone-700 hover:border-stone-400"
									}`}
								>
									{hours}h après
								</button>
							))}
						</div>
					</div>

					<div>
						<label className="block text-sm font-medium text-stone-700 mb-1.5">
							Conseils post-séance
						</label>
						<p className="text-xs text-stone-400 mb-1.5">
							Ces conseils seront ajoutés dans le template via{" "}
							{"{{admin_advice}}"}.
						</p>
						<textarea
							rows={5}
							value={config.post_session_advice ?? ""}
							onChange={(e) =>
								setConfig({ ...config, post_session_advice: e.target.value })
							}
							placeholder="Ex: Buvez beaucoup d'eau dans les prochaines heures, évitez le soleil direct..."
							className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-stone-400 resize-y"
						/>
					</div>
				</div>
			)}

			<button
				type="button"
				onClick={save}
				disabled={saving}
				className="bg-stone-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-stone-800 transition disabled:opacity-50 self-start"
			>
				{saving ? "Enregistrement..." : "Enregistrer"}
			</button>

			{message && (
				<p
					className={`text-sm ${
						message.includes("Erreur") ? "text-red-600" : "text-green-700"
					}`}
				>
					{message}
				</p>
			)}
		</div>
	);
}