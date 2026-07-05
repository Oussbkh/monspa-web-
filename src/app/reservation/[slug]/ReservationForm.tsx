"use client";

import { useState, useEffect } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import DynamicField from "./DynamicField";
import PaymentStep from "./PaymentStep";
import { computeSessionPrice } from "@/lib/pricing";

type Question = {
	key: string;
	label: string;
	type: "text" | "single_choice" | "multiple_choice" | "file";
	required: boolean;
	options?: string[];
};

type Tier = { min_sessions: number; discount_percent: number };

type SessionState = {
	requestedDate: string;
	failedAttempts: number;
	suggestedSlots: string[] | null;
	slotsLoading: boolean;
};

type Props = {
	serviceId: number;
	serviceSlug: string;
	formSchema: Question[];
};

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

function makeEmptySession(): SessionState {
	return { requestedDate: "", failedAttempts: 0, suggestedSlots: null, slotsLoading: false };
}

export default function ReservationForm({ serviceId, serviceSlug, formSchema }: Props) {
	const [step, setStep] = useState<"form" | "payment">("form");

	const [clientName, setClientName] = useState("");
	const [clientEmail, setClientEmail] = useState("");
	const [clientPhone, setClientPhone] = useState("");
	const [answers, setAnswers] = useState<Record<string, string | string[]>>({});

	const [basePriceCents, setBasePriceCents] = useState(0);
	const [tiers, setTiers] = useState<Tier[]>([]);
	const [sessionsCount, setSessionsCount] = useState(1);
	const [sessions, setSessions] = useState<SessionState[]>([makeEmptySession()]);

	const [clientSecret, setClientSecret] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);

	useEffect(() => {
		fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/services/${serviceSlug}/pricing`)
			.then((res) => res.json())
			.then((data) => {
				setBasePriceCents(data.price_cents);
				setTiers(data.tiers ?? []);
			});
	}, [serviceSlug]);

	const handleAnswerChange = (key: string, value: string | string[]) => {
		setAnswers((prev) => ({ ...prev, [key]: value }));
	};

	const pricePerSession = computeSessionPrice(basePriceCents, sessionsCount, tiers);
	const totalPrice = pricePerSession * sessionsCount;
	const applicableTier = [...tiers]
		.filter((t) => sessionsCount >= t.min_sessions)
		.sort((a, b) => b.discount_percent - a.discount_percent)[0];

	const updateSessionsCount = (count: number) => {
		const safeCount = Math.max(1, count);
		setSessionsCount(safeCount);

		const next = [...sessions];
		while (next.length < safeCount) next.push(makeEmptySession());
		while (next.length > safeCount) next.pop();
		setSessions(next);
	};

	const updateSessionField = (index: number, updates: Partial<SessionState>) => {
		const next = [...sessions];
		next[index] = { ...next[index], ...updates };
		setSessions(next);
	};

	const handleDateTimeChange = (index: number, value: string) => {
		updateSessionField(index, {
			requestedDate: value,
			failedAttempts: 0,
			suggestedSlots: null,
		});
	};

	const fetchSuggestedSlotsFor = async (index: number, dateStr: string) => {
		updateSessionField(index, { slotsLoading: true });
		try {
			const res = await fetch(
				`${process.env.NEXT_PUBLIC_API_URL}/api/services/${serviceSlug}/available-slots?date=${dateStr}`
			);
			const data = await res.json();
			updateSessionField(index, { suggestedSlots: data.slots ?? [], slotsLoading: false });
		} catch {
			updateSessionField(index, { suggestedSlots: [], slotsLoading: false });
		}
	};

	const handleSelectSuggestedSlot = (index: number, time: string) => {
		const dateOnly = sessions[index].requestedDate.split("T")[0];
		updateSessionField(index, {
			requestedDate: `${dateOnly}T${time}`,
			failedAttempts: 0,
			suggestedSlots: null,
		});
	};

	const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError(null);

		if (sessions.some((s) => !s.requestedDate)) {
			setError("Merci de choisir une date et une heure pour chaque séance");
			return;
		}

		const rawDates = sessions.map((s) => `${s.requestedDate}:00`);
		const uniqueCheck = new Set(rawDates);
		if (uniqueCheck.size !== rawDates.length) {
			setError("Deux séances ne peuvent pas avoir la même date et heure");
			return;
		}

		setLoading(true);

		try {
			const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/bookings/payment-intent`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ service_id: serviceId, sessions: rawDates }),
			});

			const data = await res.json();

			if (!res.ok) {
				const match = data.error?.match(
					/Le créneau du (\d{4}-\d{2}-\d{2}) à (\d{2}:\d{2}) n'est pas disponible/
				);

				if (match) {
					const [, failedDate, failedTime] = match;
					const sessionIndex = sessions.findIndex(
						(s) => s.requestedDate === `${failedDate}T${failedTime}`
					);

					if (sessionIndex !== -1) {
						const newAttempts = sessions[sessionIndex].failedAttempts + 1;
						updateSessionField(sessionIndex, { failedAttempts: newAttempts });

						if (newAttempts >= 2) {
							await fetchSuggestedSlotsFor(sessionIndex, failedDate);
						} else {
							setError(`Séance ${sessionIndex + 1} : ce créneau n'est pas disponible, merci d'en choisir un autre.`);
						}
					} else {
						setError(data.error);
					}
				} else {
					setError(data.error || "Erreur lors de la création du paiement");
				}

				setLoading(false);
				return;
			}

			setPaymentIntentId(data.payment_intent_id);
			setClientSecret(data.client_secret);
			setStep("payment");
		} catch (err) {
			setError(err instanceof Error ? err.message : "Une erreur est survenue");
		} finally {
			setLoading(false);
		}
	};

const handlePaymentConfirmed = async (confirmedPaymentIntentId: string) => {
	const rawDates = sessions.map((s) => `${s.requestedDate}:00`);

	const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/bookings/confirm`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({
			payment_intent_id: confirmedPaymentIntentId,
			service_id: serviceId,
			client_name: clientName,
			client_email: clientEmail,
				client_phone: clientPhone || null,
				form_data: answers,
				sessions: rawDates,
			}),
		});

		const data = await res.json();

		if (!res.ok) {
			return { success: false, error: data.error as string };
		}

		return { success: true };
	};

	if (step === "payment" && clientSecret) {
		return (
			<Elements stripe={stripePromise} options={{ clientSecret }}>
				<PaymentStep onConfirmed={handlePaymentConfirmed} />
			</Elements>
		);
	}

	return (
		<form onSubmit={handleSubmit} className="flex flex-col gap-6">
			<div>
				<label className="block text-sm font-medium text-stone-700 mb-1.5">
					Nom complet <span className="text-red-500">*</span>
				</label>
				<input
					type="text"
					required
					value={clientName}
					onChange={(e) => setClientName(e.target.value)}
					className="w-full border border-stone-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-stone-400"
				/>
			</div>

			<div>
				<label className="block text-sm font-medium text-stone-700 mb-1.5">
					Email <span className="text-red-500">*</span>
				</label>
				<input
					type="email"
					required
					value={clientEmail}
					onChange={(e) => setClientEmail(e.target.value)}
					className="w-full border border-stone-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-stone-400"
				/>
			</div>

			<div>
				<label className="block text-sm font-medium text-stone-700 mb-1.5">Téléphone</label>
				<input
					type="tel"
					value={clientPhone}
					onChange={(e) => setClientPhone(e.target.value)}
					className="w-full border border-stone-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-stone-400"
				/>
			</div>

			{formSchema.map((question) => (
				<DynamicField
					key={question.key}
					question={question}
					value={answers[question.key]}
					onChange={handleAnswerChange}
				/>
			))}

			<div className="border-t border-stone-200 pt-5">
				<label className="block text-sm font-medium text-stone-700 mb-1.5">
					Nombre de séances
				</label>
				<input
					type="number"
					min={1}
					value={sessionsCount}
					onChange={(e) => updateSessionsCount(parseInt(e.target.value, 10) || 1)}
					className="w-24 border border-stone-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-stone-400"
				/>

				<div className="mt-3 bg-stone-50 border border-stone-200 rounded-lg p-4 text-sm">
					<div className="flex justify-between text-stone-600">
						<span>Prix par séance</span>
						<span>{(pricePerSession / 100).toFixed(2)} eur</span>
					</div>
					{applicableTier && (
						<div className="flex justify-between text-green-700 mt-1">
							<span>Réduction appliquée</span>
							<span>-{applicableTier.discount_percent}%</span>
						</div>
					)}
					<div className="flex justify-between font-semibold text-stone-900 mt-2 pt-2 border-t border-stone-200">
						<span>Total ({sessionsCount} séance{sessionsCount > 1 ? "s" : ""})</span>
						<span>{(totalPrice / 100).toFixed(2)} eur</span>
					</div>
				</div>
			</div>

			<div className="flex flex-col gap-5">
				{sessions.map((session, index) => (
					<div key={index} className="border border-stone-200 rounded-xl p-4">
						<p className="text-sm font-medium text-stone-900 mb-3">Séance {index + 1}</p>

						<label className="block text-xs text-stone-500 mb-1.5">Date et heure</label>
						<input
							type="datetime-local"
							required
							value={session.requestedDate}
							onChange={(e) => handleDateTimeChange(index, e.target.value)}
							className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-stone-400"
						/>

						{session.slotsLoading && (
							<p className="text-sm text-stone-500 mt-2">Recherche de créneaux disponibles...</p>
						)}

						{session.suggestedSlots !== null && !session.slotsLoading && (
							<div className="mt-3">
								{session.suggestedSlots.length === 0 ? (
									<p className="text-sm text-stone-600">
										Aucun créneau disponible ce jour-là, merci de choisir une autre journée.
									</p>
								) : (
									<>
										<p className="text-sm text-stone-600 mb-2">
											Voici les créneaux disponibles ce jour-là :
										</p>
										<div className="flex flex-wrap gap-2">
											{session.suggestedSlots.map((slot) => (
												<button
													key={slot}
													type="button"
													onClick={() => handleSelectSuggestedSlot(index, slot)}
													className="text-sm px-3 py-1.5 rounded-lg border border-stone-300 text-stone-700 hover:border-stone-400 transition"
												>
													{slot}
												</button>
											))}
										</div>
									</>
								)}
							</div>
						)}
					</div>
				))}
			</div>

			{error && <p className="text-red-600 text-sm">{error}</p>}

			<button
				type="submit"
				disabled={loading}
				className="bg-stone-900 text-white px-6 py-3.5 rounded-xl font-medium hover:bg-stone-800 transition disabled:opacity-50"
			>
				{loading ? "Création de la réservation..." : "Continuer vers le paiement"}
			</button>
		</form>
	);
}