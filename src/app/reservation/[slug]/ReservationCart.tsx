// "use client";

// import { useState, useEffect } from "react";
// import { loadStripe } from "@stripe/stripe-js";
// import { Elements } from "@stripe/react-stripe-js";
// import DynamicField from "./DynamicField";
// import PaymentStep from "./PaymentStep";
// import { computeSessionPrice } from "@/lib/pricing";
// import MapboxAutocomplete from "@/components/MapboxAutocomplete";

// const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);
// const DEFAULT_PRICE_PER_KM_CENTS = 150; // 1,50 €/km
// type Question = {
// 	key: string;
// 	label: string;
// 	type: "text" | "single_choice" | "multiple_choice" | "file";
// 	required: boolean;
// 	options?: string[];
// };

// type Tier = { min_sessions: number; discount_percent: number };

// type ServiceInfo = {
// 	id: number;
// 	name: string;
// 	slug: string;
// 	price_cents: number;
// 	deposit_cents: number;
// 	duration_minutes: number;
// 	form_schema: Question[];
// 	tiers: Tier[];
// 	home_available: number;
// };

// type SessionState = {
// 	requestedDate: string;
// 	failedAttempts: number;
// 	suggestedSlots: string[] | null;
// 	slotsLoading: boolean;
// };

// type CartEntry = {
// 	entryId: string;
// 	service: ServiceInfo;
// 	sessionsCount: number;
// 	sessions: SessionState[];
// 	formAnswers: Record<string, string | string[]>;
// };

// type PublicService = {
// 	id: number;
// 	name: string;
// 	slug: string;
// 	price_cents: number;
// 	duration_minutes: number;
// };

// // ✅ Format de date lisible en français (ex: "01 janvier 2026")
// function formatDateFR(isoDate: string): string {
// 	if (!isoDate) return "";
// 	return new Date(isoDate).toLocaleDateString("fr-FR", {
// 		day: "2-digit",
// 		month: "long",
// 		year: "numeric",
// 	});
// }

// function makeEmptySession(): SessionState {
// 	return { requestedDate: "", failedAttempts: 0, suggestedSlots: null, slotsLoading: false };
// }

// function makeEntry(service: ServiceInfo): CartEntry {
// 	return {
// 		entryId: crypto.randomUUID(),
// 		service,
// 		sessionsCount: 1,
// 		sessions: [makeEmptySession()],
// 		formAnswers: {},
// 	};
// }

// export default function ReservationCart({ initialService }: { initialService: ServiceInfo }) {
// 	const [cart, setCart] = useState<CartEntry[]>([makeEntry(initialService)]);

// 	const [clientName, setClientName] = useState("");
// 	const [clientEmail, setClientEmail] = useState("");
// 	const [clientPhone, setClientPhone] = useState("");

// 	const [showServicePicker, setShowServicePicker] = useState(false);
// 	const [availableServices, setAvailableServices] = useState<PublicService[]>([]);
// 	const [loadingServices, setLoadingServices] = useState(false);

// 	const [step, setStep] = useState<"form" | "payment">("form");
// 	const [clientSecret, setClientSecret] = useState<string | null>(null);
// 	// ✅ paymentIntentId supprimé : était défini mais jamais lu

// 	const [error, setError] = useState<string | null>(null);
// 	const [loading, setLoading] = useState(false);

// 	const [locationType, setLocationType] = useState<"onsite" | "home">("onsite");
// 	const [clientAddress, setClientAddress] = useState("");
// 	const [clientLat, setClientLat] = useState<number | null>(null);
// 	const [clientLng, setClientLng] = useState<number | null>(null);
// 	const [travelFeesCents, setTravelFeesCents] = useState(0);
// 	const [travelDistanceKm, setTravelDistanceKm] = useState(0);
// 	const [calculatingFees, setCalculatingFees] = useState(false);

// 	// ✅ Constante centralisée comme valeur par défaut
// 	const [pricePerKmCents, setPricePerKmCents] = useState(DEFAULT_PRICE_PER_KM_CENTS);

// 	// ✅ Période de réservation autorisée
// 	const [bookingPeriodStart, setBookingPeriodStart] = useState("");
// 	const [bookingPeriodEnd, setBookingPeriodEnd] = useState("");

// 	const todayStr = new Date().toISOString().slice(0, 10);

// 	useEffect(() => {
// 		fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/settings/travel`)
// 			.then((res) => res.json())
// 			.then((data) => {
// 				setPricePerKmCents(data.price_per_km_cents ?? DEFAULT_PRICE_PER_KM_CENTS);
// 				setBookingPeriodStart(data.booking_period_start ?? "");
// 				setBookingPeriodEnd(data.booking_period_end ?? "");
// 			})
// 			.catch(() => {});
// 	}, []);

// 	const homePossible = cart.every((entry) => entry.service.home_available === 1);
 
// 	// ✅ Si un service ajouté au panier ne supporte pas le domicile, on repasse automatiquement en "sur place"
// 	useEffect(() => {
// 		if (!homePossible && locationType === "home") {
// 			setLocationType("onsite");
// 			setTravelFeesCents(0);
// 		}
// 	}, [homePossible]);

// 	// ─────────────────────────────────
// 	// Validation de la période de réservation
// 	// ─────────────────────────────────

// 	const isDateInPeriod = (dateStr: string): boolean => {
// 		if (!bookingPeriodStart && !bookingPeriodEnd) return true;
// 		const date = dateStr.split("T")[0]; // "2026-03-15"
// 		if (bookingPeriodStart && date < bookingPeriodStart) return false;
// 		if (bookingPeriodEnd && date > bookingPeriodEnd) return false;
// 		return true;
// 	};

// 	const getPeriodErrorMessage = (): string | null => {
// 		if (!bookingPeriodStart && !bookingPeriodEnd) return null;
// 		const start = bookingPeriodStart ? formatDateFR(bookingPeriodStart) : null;
// 		const end = bookingPeriodEnd ? formatDateFR(bookingPeriodEnd) : null;
// 		if (start && end) return `Merci de choisir un rendez-vous entre le ${start} et le ${end}.`;
// 		if (start) return `Merci de choisir un rendez-vous à partir du ${start}.`;
// 		if (end) return `Merci de choisir un rendez-vous avant le ${end}.`;
// 		return null;
// 	};

// 	// ─────────────────────────────────
// 	// Gestion du panier
// 	// ─────────────────────────────────

// 	const fetchAvailableServices = async () => {
// 		setLoadingServices(true);
// 		try {
// 			const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/services`);
// 			const data = await res.json();
// 			const alreadyInCart = cart.map((e) => e.service.id);
// 			setAvailableServices(data.filter((s: PublicService) => !alreadyInCart.includes(s.id)));
// 		} catch {
// 			setAvailableServices([]);
// 		} finally {
// 			setLoadingServices(false);
// 		}
// 	};

// 	const handleShowPicker = async () => {
// 		setShowServicePicker(true);
// 		await fetchAvailableServices();
// 	};

// 	const handleAddService = async (publicService: PublicService) => {
// 		setShowServicePicker(false);
// 		try {
// 			const [serviceRes, pricingRes] = await Promise.all([
// 				fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/services/${publicService.slug}`),
// 				fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/services/${publicService.slug}/pricing`),
// 			]);
// 			const [serviceData, pricingData] = await Promise.all([serviceRes.json(), pricingRes.json()]);
// 			const newService: ServiceInfo = {
// 				...serviceData,
// 				form_schema: JSON.parse(serviceData.form_schema),
// 				tiers: pricingData.tiers ?? [],
// 			};
// 			setCart((prev) => [...prev, makeEntry(newService)]);
// 		} catch {
// 			setError("Erreur lors du chargement du service");
// 		}
// 	};

// 	const removeEntry = (entryId: string) => {
// 		setCart((prev) => prev.filter((e) => e.entryId !== entryId));
// 	};

// 	const updateEntry = (entryId: string, updates: Partial<CartEntry>) => {
// 		setCart((prev) => prev.map((e) => (e.entryId === entryId ? { ...e, ...updates } : e)));
// 	};

// 	const updateSessionsCount = (entryId: string, count: number) => {
// 		const safeCount = Math.max(1, count);
// 		setCart((prev) =>
// 			prev.map((e) => {
// 				if (e.entryId !== entryId) return e;
// 				const next = [...e.sessions];
// 				while (next.length < safeCount) next.push(makeEmptySession());
// 				while (next.length > safeCount) next.pop();
// 				return { ...e, sessionsCount: safeCount, sessions: next };
// 			})
// 		);
// 	};

// 	const updateSession = (entryId: string, sessionIndex: number, updates: Partial<SessionState>) => {
// 		setCart((prev) =>
// 			prev.map((e) => {
// 				if (e.entryId !== entryId) return e;
// 				const next = [...e.sessions];
// 				next[sessionIndex] = { ...next[sessionIndex], ...updates };
// 				return { ...e, sessions: next };
// 			})
// 		);
// 	};

// 	// ─────────────────────────────────
// 	// Localisation et frais de déplacement
// 	// ─────────────────────────────────

// 	const handleAddressSelect = async (address: string, lat: number, lng: number) => {
// 		setClientAddress(address);
// 		setClientLat(lat);
// 		setClientLng(lng);

// 		if (!address) {
// 			setTravelFeesCents(0);
// 			setTravelDistanceKm(0);
// 			return;
// 		}

// 		setCalculatingFees(true);
// 		try {
// 			// Appel avec une date fictive uniquement pour calculer la distance
// 			const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/cart/payment-intent`, {
// 				method: "POST",
// 				headers: { "Content-Type": "application/json" },
// 				body: JSON.stringify({
// 					items: cart.map((entry) => ({
// 						service_id: entry.service.id,
// 						sessions: ["2099-01-01T09:00:00"],
// 					})),
// 					location_type: "home",
// 					client_lat: lat,
// 					client_lng: lng,
// 					client_address: address,
// 				}),
// 			});
// 			const data = await res.json();
// 			if (data.travel_fees_cents !== undefined) {
// 				setTravelFeesCents(data.travel_fees_cents);
// 				setTravelDistanceKm(data.travel_distance_km ?? 0);
// 			}
// 		} catch {
// 			setTravelFeesCents(0);
// 		} finally {
// 			setCalculatingFees(false);
// 		}
// 	};

// 	// ─────────────────────────────────
// 	// Gestion des séances et créneaux
// 	// ─────────────────────────────────

// 	const handleDateChange = (entryId: string, sessionIndex: number, value: string) => {
// 		// ✅ Vérification de la période de réservation dès la saisie
// 		if (value && !isDateInPeriod(value)) {
// 			setError(getPeriodErrorMessage());
// 			// On met quand même la valeur pour que l'input soit contrôlé
// 			updateSession(entryId, sessionIndex, { requestedDate: value, failedAttempts: 0, suggestedSlots: null });
// 			return;
// 		}
// 		setError(null);
// 		updateSession(entryId, sessionIndex, { requestedDate: value, failedAttempts: 0, suggestedSlots: null });
// 	};

// 	const fetchSuggestedSlots = async (entryId: string, sessionIndex: number, date: string, slug: string) => {
// 		updateSession(entryId, sessionIndex, { slotsLoading: true });
// 		try {
// 			const res = await fetch(
// 				`${process.env.NEXT_PUBLIC_API_URL}/api/services/${slug}/available-slots?date=${date}`
// 			);
// 			const data = await res.json();
// 			updateSession(entryId, sessionIndex, { suggestedSlots: data.slots ?? [], slotsLoading: false });
// 		} catch {
// 			updateSession(entryId, sessionIndex, { suggestedSlots: [], slotsLoading: false });
// 		}
// 	};

// 	const handleSelectSuggestedSlot = (
// 		entryId: string,
// 		sessionIndex: number,
// 		time: string,
// 		currentDate: string
// 	) => {
// 		const dateOnly = currentDate.split("T")[0];
// 		updateSession(entryId, sessionIndex, {
// 			requestedDate: `${dateOnly}T${time}`,
// 			failedAttempts: 0,
// 			suggestedSlots: null,
// 		});
// 	};

// 	// ─────────────────────────────────
// 	// Calculs du récapitulatif
// 	// ─────────────────────────────────

// 	const totalPriceCents = cart.reduce((sum, entry) => {
// 		const price = computeSessionPrice(entry.service.price_cents, entry.sessionsCount, entry.service.tiers);
// 		return sum + price * entry.sessionsCount;
// 	}, 0);

// 	const totalDepositCents = cart.reduce((sum, entry) => {
// 		const deposit =
// 			entry.service.deposit_cents > 0
// 				? entry.service.deposit_cents
// 				: computeSessionPrice(entry.service.price_cents, entry.sessionsCount, entry.service.tiers);
// 		return sum + deposit * entry.sessionsCount;
// 	}, 0);

// 	const totalTodayCents = totalDepositCents + travelFeesCents;

// 	const hasDeposit = cart.some((e) => e.service.deposit_cents > 0);

// 	// ─────────────────────────────────
// 	// Soumission et paiement
// 	// ─────────────────────────────────

// 	const handleSubmit = async (e: React.FormEvent) => {
// 		e.preventDefault();
// 		setError(null);

// 		// Vérification de la période de réservation pour toutes les séances
// 		for (const entry of cart) {
// 			for (const session of entry.sessions) {
// 				if (session.requestedDate && !isDateInPeriod(session.requestedDate)) {
// 					setError(getPeriodErrorMessage());
// 					return;
// 				}
// 			}
// 			if (entry.sessions.some((s) => !s.requestedDate)) {
// 				setError(`Merci de choisir une date et une heure pour toutes les séances de "${entry.service.name}"`);
// 				return;
// 			}
// 		}

// 		if (locationType === "home" && !clientAddress) {
// 			setError("Merci de saisir votre adresse pour une prestation à domicile");
// 			return;
// 		}

// 		setLoading(true);

// 		try {
// 			const items = cart.map((entry) => ({
// 				service_id: entry.service.id,
// 				sessions: entry.sessions.map((s) => `${s.requestedDate}:00`),
// 			}));

// 			const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/cart/payment-intent`, {
// 				method: "POST",
// 				headers: { "Content-Type": "application/json" },
// 				body: JSON.stringify({
// 					items,
// 					location_type: locationType,
// 					client_address: locationType === "home" ? clientAddress : undefined,
// 					client_lat: locationType === "home" ? clientLat : undefined,
// 					client_lng: locationType === "home" ? clientLng : undefined,
// 				}),
// 			});

// 			const data = await res.json();

// 			if (!res.ok) {
// 				const match = data.error?.match(
// 					/Le créneau du (\d{4}-\d{2}-\d{2}) à (\d{2}:\d{2}) n'est pas disponible/
// 				);
// 				if (match) {
// 					const [, failedDate, failedTime] = match;
// 					for (const entry of cart) {
// 						const sessionIndex = entry.sessions.findIndex(
// 							(s) => s.requestedDate === `${failedDate}T${failedTime}`
// 						);
// 						if (sessionIndex !== -1) {
// 							const newAttempts = entry.sessions[sessionIndex].failedAttempts + 1;
// 							updateSession(entry.entryId, sessionIndex, { failedAttempts: newAttempts });
// 							if (newAttempts >= 2) {
// 								await fetchSuggestedSlots(entry.entryId, sessionIndex, failedDate, entry.service.slug);
// 							} else {
// 								setError(
// 									`"${entry.service.name}" — séance ${sessionIndex + 1} : ce créneau n'est pas disponible.`
// 								);
// 							}
// 							break;
// 						}
// 					}
// 				} else {
// 					setError(data.error || "Erreur lors de la création du paiement");
// 				}

// 				setLoading(false);
// 				return;
// 			}

// 			// ✅ paymentIntentId supprimé : on utilise directement dans handlePaymentConfirmed
// 			setClientSecret(data.client_secret);
// 			setStep("payment");
// 		} catch (err) {
// 			setError(err instanceof Error ? err.message : "Une erreur est survenue");
// 		} finally {
// 			setLoading(false);
// 		}
// 	};

// 	const handlePaymentConfirmed = async (confirmedPaymentIntentId: string) => {
// 		// ✅ Upload les fichiers de formulaire vers R2 avant de confirmer
// 		const enrichedItems = await Promise.all(
// 			cart.map(async (entry) => {
// 				const enrichedAnswers = { ...entry.formAnswers };

// 				for (const question of entry.service.form_schema) {
// 					if (question.type !== "file") continue;

// 					const fileInput = document.querySelector<HTMLInputElement>(
// 						`input[type="file"][data-key="${question.key}"]`
// 					);
// 					const file = fileInput?.files?.[0];
// 					if (!file) continue;

// 					const form = new FormData();
// 					form.append("file", file);
// 					form.append("field_key", question.key);

// 					try {
// 						const res = await fetch(
// 							`${process.env.NEXT_PUBLIC_API_URL}/api/form-uploads/${confirmedPaymentIntentId}`,
// 							{ method: "POST", body: form }
// 						);
// 						const data = await res.json();
// 						console.log("Upload R2 response:", data); // 👈
// 						if (res.ok) {
// 							enrichedAnswers[question.key] = data.url; // Stocke l'URL R2
// 						}
// 					} catch {
// 						console.error("Erreur upload fichier", question.key);
// 					}
// 				}

// 				return { ...entry, formAnswers: enrichedAnswers };
// 			})
// 		);

// 		// Même logique qu'avant, mais avec enrichedItems
// 		const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/cart/confirm`, {
// 			method: "POST",
// 			headers: { "Content-Type": "application/json" },
// 			body: JSON.stringify({
// 				payment_intent_id: confirmedPaymentIntentId,
// 				client_name: clientName,
// 				client_email: clientEmail,
// 				client_phone: clientPhone || null,
// 				items: enrichedItems.map((entry) => ({
// 					service_id: entry.service.id,
// 					sessions: entry.sessions.map((s) => `${s.requestedDate}:00`),
// 					form_data: entry.formAnswers,
// 				})),
// 				location_type: locationType,
// 				client_address: clientAddress || null,
// 				client_lat: clientLat,
// 				client_lng: clientLng,
// 			}),
// 		});

// 		const data = await res.json();
// 		if (!res.ok) return { success: false, error: data.error as string };
// 		return { success: true };
// 	};

// 	if (step === "payment" && clientSecret) {
// 		return (
// 			<Elements stripe={stripePromise} options={{ clientSecret }}>
// 				<PaymentStep onConfirmed={handlePaymentConfirmed} />
// 			</Elements>
// 		);
// 	}

// 	return (
// 		<form onSubmit={handleSubmit} className="flex flex-col gap-8">
// 			{/* Informations client */}
// 			<div className="bg-white border border-stone-200 rounded-2xl p-6 flex flex-col gap-4">
// 				<h2 className="text-sm font-semibold text-stone-900 uppercase tracking-wide">Vos informations</h2>
// 				<div>
// 					<label className="block text-sm font-medium text-stone-700 mb-1.5">
// 						Nom complet <span className="text-red-500">*</span>
// 					</label>
// 					<input
// 						type="text"
// 						required
// 						value={clientName}
// 						onChange={(e) => setClientName(e.target.value)}
// 						className="w-full border border-stone-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-stone-400"
// 					/>
// 				</div>
// 				<div>
// 					<label className="block text-sm font-medium text-stone-700 mb-1.5">
// 						Email <span className="text-red-500">*</span>
// 					</label>
// 					<input
// 						type="email"
// 						required
// 						value={clientEmail}
// 						onChange={(e) => setClientEmail(e.target.value)}
// 						className="w-full border border-stone-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-stone-400"
// 					/>
// 				</div>
// 				<div>
// 					<label className="block text-sm font-medium text-stone-700 mb-1.5">Téléphone</label>
// 					<input
// 						type="tel"
// 						value={clientPhone}
// 						onChange={(e) => setClientPhone(e.target.value)}
// 						className="w-full border border-stone-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-stone-400"
// 					/>
// 				</div>
// 			</div>

// 			{/* Lieu de la prestation */}
// 			<div className="bg-white border border-stone-200 rounded-2xl p-6">
// 				<h2 className="text-sm font-semibold text-stone-900 uppercase tracking-wide mb-4">
// 					Lieu de la prestation
// 				</h2>
// 				<div className="flex gap-3">
// 					{/* Bouton Sur place */}
// 					<button
// 						type="button"
// 						onClick={() => {
// 							setLocationType("onsite");
// 							setTravelFeesCents(0);
// 						}}
// 						className={`flex-1 py-3 rounded-xl border text-sm font-medium transition ${
// 							locationType === "onsite"
// 								? "bg-stone-900 text-white border-stone-900"
// 								: "border-stone-300 text-stone-700 hover:border-stone-400"
// 						}`}
// 					>
// 						🏪 Sur place
// 					</button>

// 					{/* Bouton À domicile — conditionnel selon home_available */}
// 					{initialService.home_available === 1 ? (
// 					<button
// 						type="button"
// 						onClick={() => setLocationType("home")}
// 						className={`flex-1 py-3 rounded-xl border text-sm font-medium transition ${
// 							locationType === "home"
// 								? "bg-stone-900 text-white border-stone-900"
// 								: "border-stone-300 text-stone-700 hover:border-stone-400"
// 						}`}
// 					>
// 						🏠 À domicile
// 					</button>
// 					) : (
// 						<div className="flex-1 py-3 rounded-xl border border-stone-200 bg-stone-50 text-center">
// 							<p className="text-xs text-stone-400 font-medium">🏠 À domicile</p>
// 							<p className="text-xs text-stone-400 mt-0.5">
// 								Ce service n&apos;est pas disponible à domicile
// 							</p>
// 						</div>
// 					)}
// 				</div>
				
// 				{/* ✅ Message d'avertissement si un service du panier bloque le domicile */}
// 				{!homePossible && (
// 					<div className="mt-2 bg-amber-50 border border-amber-200 rounded-lg p-2 text-xs text-amber-700">
// 						Un ou plusieurs services sélectionnés ne sont pas disponibles à domicile.
// 					</div>
// 				)}



// 				{locationType === "home" && (
// 					<div className="mt-4">
// 						<label className="block text-sm font-medium text-stone-700 mb-1.5">
// 							Adresse du domicile <span className="text-red-500">*</span>
// 						</label>
// 						<MapboxAutocomplete
// 							onSelect={handleAddressSelect}
// 							placeholder="Entrez votre adresse complète..."
// 						/>
// 						{calculatingFees && (
// 							<p className="text-sm text-stone-500 mt-2 flex items-center gap-2">
// 								<span className="w-3 h-3 border-2 border-stone-300 border-t-stone-700 rounded-full animate-spin inline-block" />
// 								Calcul des frais de déplacement...
// 							</p>
// 						)}
// 						{!calculatingFees && travelFeesCents > 0 && (
// 							<div className="mt-3 bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
// 								Distance estimée : <strong>{travelDistanceKm.toFixed(1)} km</strong>
// 								<br />
// 								Frais de déplacement estimés :{" "}
// 								<strong>{(travelFeesCents / 100).toFixed(2)} €</strong>
// 							</div>
// 						)}
// 					</div>
// 				)}
// 			</div>

// 			{/* Un bloc par service dans le panier */}
// 			{cart.map((entry) => {
// 				const pricePerSession = computeSessionPrice(
// 					entry.service.price_cents,
// 					entry.sessionsCount,
// 					entry.service.tiers
// 				);
// 				const applicableTier = [...entry.service.tiers]
// 					.filter((t) => entry.sessionsCount >= t.min_sessions)
// 					.sort((a, b) => b.discount_percent - a.discount_percent)[0];

// 				return (
// 					<div
// 						key={entry.entryId}
// 						className="bg-white border border-stone-200 rounded-2xl p-6 flex flex-col gap-5"
// 					>
// 						<div className="flex items-center justify-between">
// 							<div>
// 								<h2 className="font-semibold text-stone-900">{entry.service.name}</h2>
// 								<p className="text-sm text-stone-500">
// 									{entry.service.duration_minutes} min —{" "}
// 									{(entry.service.price_cents / 100).toFixed(2)} €
// 								</p>
// 							</div>
// 							{cart.length > 1 && (
// 								<button
// 									type="button"
// 									onClick={() => removeEntry(entry.entryId)}
// 									className="text-sm text-red-600 hover:text-red-700"
// 								>
// 									Retirer
// 								</button>
// 							)}
// 						</div>

// 						{/* Formulaire dynamique */}
// 						{entry.service.form_schema.length > 0 && (
// 							<div className="flex flex-col gap-4">
// 								{entry.service.form_schema.map((question) => (
// 									<DynamicField
// 										key={question.key}
// 										question={question}
// 										value={entry.formAnswers[question.key]}
// 										onChange={(key, value) =>
// 											updateEntry(entry.entryId, {
// 												formAnswers: { ...entry.formAnswers, [key]: value },
// 											})
// 										}
// 									/>
// 								))}
// 							</div>
// 						)}

// 						{/* Nombre de séances */}
// 						<div>
// 							<label className="block text-sm font-medium text-stone-700 mb-1.5">
// 								Nombre de séances
// 							</label>
// 							<input
// 								type="number"
// 								min={1}
// 								value={entry.sessionsCount}
// 								onChange={(e) =>
// 									updateSessionsCount(entry.entryId, parseInt(e.target.value, 10) || 1)
// 								}
// 								className="w-24 border border-stone-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-stone-400"
// 							/>
// 							{(applicableTier || entry.sessionsCount > 1) && (
// 								<div className="mt-2 bg-stone-50 border border-stone-200 rounded-lg p-3 text-sm">
// 									<div className="flex justify-between text-stone-600">
// 										<span>Prix par séance</span>
// 										<span>{(pricePerSession / 100).toFixed(2)} €</span>
// 									</div>
// 									{applicableTier && (
// 										<div className="flex justify-between text-green-700 mt-1">
// 											<span>Réduction</span>
// 											<span>-{applicableTier.discount_percent}%</span>
// 										</div>
// 									)}
// 									<div className="flex justify-between font-medium text-stone-900 mt-1 pt-1 border-t border-stone-200">
// 										<span>
// 											Sous-total ({entry.sessionsCount} séance
// 											{entry.sessionsCount > 1 ? "s" : ""})
// 										</span>
// 										<span>
// 											{((pricePerSession * entry.sessionsCount) / 100).toFixed(2)} €
// 										</span>
// 									</div>
// 								</div>
// 							)}
// 						</div>

// 						{/* Séances */}
// 						<div className="flex flex-col gap-4">
// 							{entry.sessions.map((session, sessionIndex) => (
// 								<div
// 									key={sessionIndex}
// 									className="border border-stone-100 rounded-xl p-4 bg-stone-50"
// 								>
// 									<p className="text-xs font-medium text-stone-500 mb-2">
// 										SÉANCE {sessionIndex + 1}
// 									</p>
// 									<input
// 										type="datetime-local"
// 										required
// 										min={
// 											bookingPeriodStart
// 												? `${bookingPeriodStart}T00:00`
// 												: `${todayStr}T00:00`
// 										}
// 										max={
// 											bookingPeriodEnd ? `${bookingPeriodEnd}T23:59` : undefined
// 										}
// 										value={session.requestedDate}
// 										onChange={(e) =>
// 											handleDateChange(entry.entryId, sessionIndex, e.target.value)
// 										}
// 										className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-stone-400"
// 									/>

// 									{/* ✅ Message période si date hors intervalle */}
// 									{session.requestedDate && !isDateInPeriod(session.requestedDate) && (
// 										<div className="mt-2 bg-amber-50 border border-amber-200 rounded-lg p-2 text-sm text-amber-800">
// 											{getPeriodErrorMessage()}
// 										</div>
// 									)}

// 									{session.slotsLoading && (
// 										<p className="text-sm text-stone-500 mt-2">
// 											Recherche de créneaux...
// 										</p>
// 									)}

// 									{session.suggestedSlots !== null && !session.slotsLoading && (
// 										<div className="mt-3">
// 											{session.suggestedSlots.length === 0 ? (
// 												<p className="text-sm text-stone-600">
// 													Aucun créneau disponible ce jour-là, merci de choisir une
// 													autre journée.
// 												</p>
// 											) : (
// 												<>
// 													<p className="text-sm text-stone-600 mb-2">
// 														Créneaux disponibles :
// 													</p>
// 													<div className="flex flex-wrap gap-2">
// 														{session.suggestedSlots.map((slot) => (
// 															<button
// 																key={slot}
// 																type="button"
// 																onClick={() =>
// 																	handleSelectSuggestedSlot(
// 																		entry.entryId,
// 																		sessionIndex,
// 																		slot,
// 																		session.requestedDate
// 																	)
// 																}
// 																className="text-sm px-3 py-1.5 rounded-lg border border-stone-300 text-stone-700 hover:border-stone-900 hover:bg-stone-900 hover:text-white transition"
// 															>
// 																{slot}
// 															</button>
// 														))}
// 													</div>
// 												</>
// 											)}
// 										</div>
// 									)}
// 								</div>
// 							))}
// 						</div>
// 					</div>
// 				);
// 			})}

// 			{/* Bouton ajouter un service */}
// 			{!showServicePicker && (
// 				<button
// 					type="button"
// 					onClick={handleShowPicker}
// 					className="flex items-center justify-center gap-2 border-2 border-dashed border-stone-300 rounded-2xl py-4 text-sm font-medium text-stone-500 hover:border-stone-400 hover:text-stone-700 transition"
// 				>
// 					<span className="text-lg">+</span>
// 					Ajouter un autre service
// 				</button>
// 			)}

// 			{/* Sélecteur de service */}
// 			{showServicePicker && (
// 				<div className="bg-white border border-stone-200 rounded-2xl p-6">
// 					<div className="flex items-center justify-between mb-4">
// 						<h3 className="text-sm font-semibold text-stone-900">Choisir un service</h3>
// 						<button
// 							type="button"
// 							onClick={() => setShowServicePicker(false)}
// 							className="text-sm text-stone-400 hover:text-stone-700"
// 						>
// 							Annuler
// 						</button>
// 					</div>
// 					{loadingServices && <p className="text-sm text-stone-500">Chargement...</p>}
// 					{!loadingServices && availableServices.length === 0 && (
// 						<p className="text-sm text-stone-500">
// 							Tous les services sont déjà dans votre panier.
// 						</p>
// 					)}
// 					<div className="flex flex-col gap-2">
// 						{availableServices.map((service) => (
// 							<button
// 								key={service.id}
// 								type="button"
// 								onClick={() => handleAddService(service)}
// 								className="flex items-center justify-between border border-stone-200 rounded-xl p-3 hover:border-stone-900 hover:bg-stone-50 transition text-left"
// 							>
// 								<div>
// 									<p className="font-medium text-stone-900 text-sm">{service.name}</p>
// 									<p className="text-xs text-stone-500">{service.duration_minutes} min</p>
// 								</div>
// 								<span className="text-sm text-stone-700">
// 									{(service.price_cents / 100).toFixed(2)} €
// 								</span>
// 							</button>
// 						))}
// 					</div>
// 				</div>
// 			)}

// 			{/* ✅ Récapitulatif complet — tout dans un seul bloc */}
// 			<div className="bg-white border border-stone-200 rounded-2xl p-6">
// 				<h3 className="text-sm font-semibold text-stone-900 uppercase tracking-wide mb-4">
// 					Récapitulatif
// 				</h3>
// 				<div className="flex flex-col gap-3">
// 					{/* Lignes par service */}
// 					{cart.map((entry) => {
// 						const pricePerSession = computeSessionPrice(
// 							entry.service.price_cents,
// 							entry.sessionsCount,
// 							entry.service.tiers
// 						);
// 						const subtotal = pricePerSession * entry.sessionsCount;
// 						const depositTotal = entry.service.deposit_cents * entry.sessionsCount;
// 						const hasDiscount = pricePerSession < entry.service.price_cents;

// 						return (
// 							<div
// 								key={entry.entryId}
// 								className="flex items-start justify-between text-sm pb-3 border-b border-stone-100 last:border-0 last:pb-0"
// 							>
// 								<div>
// 									<p className="font-medium text-stone-900">{entry.service.name}</p>
// 									<p className="text-stone-400 text-xs mt-0.5">
// 										{entry.sessionsCount} séance{entry.sessionsCount > 1 ? "s" : ""} ×{" "}
// 										{(pricePerSession / 100).toFixed(2)} €
// 										{hasDiscount && (
// 											<span className="text-green-600 ml-1">(réduit)</span>
// 										)}
// 									</p>
// 									{entry.service.deposit_cents > 0 && (
// 										<p className="text-xs text-stone-400 mt-0.5">
// 											Acompte : {(depositTotal / 100).toFixed(2)} € · Sur place :{" "}
// 											{((subtotal - depositTotal) / 100).toFixed(2)} €
// 										</p>
// 									)}
// 								</div>
// 								<span className="font-medium text-stone-900">
// 									{(subtotal / 100).toFixed(2)} €
// 								</span>
// 							</div>
// 						);
// 					})}

// 					{/* ✅ Frais de déplacement dans le récapitulatif */}
// 					{locationType === "home" && travelFeesCents > 0 && (
// 						<div className="flex justify-between text-sm pt-1">
// 							<span className="text-stone-600">Frais de déplacement</span>
// 							<span className="font-medium text-stone-900">
// 								{(travelFeesCents / 100).toFixed(2)} €
// 							</span>
// 						</div>
// 					)}

// 					{/* Prix total */}
// 					<div className="flex items-center justify-between pt-2 border-t border-stone-200">
// 						<span className="font-semibold text-stone-900">Prix total prestation</span>
// 						<span className="font-bold text-stone-900">
// 							{(totalPriceCents / 100).toFixed(2)} €
// 						</span>
// 					</div>

// 					{/* Acompte et reste */}
// 					{hasDeposit && (
// 						<>
// 							<div className="border-t border-stone-200 pt-3 flex flex-col gap-2">
// 								<div className="flex justify-between text-sm">
// 									<span className="text-green-700 font-medium">
// 										Total à payer aujourd&apos;hui{" "}
// 										{travelFeesCents > 0 ? "(acompte + déplacement)" : "(acompte)"}
// 									</span>
// 									<span className="text-green-700 font-bold">
// 										{(totalTodayCents / 100).toFixed(2)} €
// 									</span>
// 								</div>
// 								<div className="flex justify-between text-sm">
// 									<span className="text-stone-500">Reste à payer sur place</span>
// 									<span className="text-stone-700 font-medium">
// 										{((totalPriceCents - totalDepositCents) / 100).toFixed(2)} €
// 									</span>
// 								</div>
// 							</div>
// 							<div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
// 								Seul l&apos;acompte est débité aujourd&apos;hui. Le reste sera réglé directement
// 								sur place après la prestation.
// 							</div>
// 						</>
// 					)}

// 					{/* Si pas d'acompte mais des frais de déplacement */}
// 					{!hasDeposit && travelFeesCents > 0 && (
// 						<div className="flex items-center justify-between pt-2 border-t border-stone-200">
// 							<span className="font-semibold text-stone-900">
// 								Total débité aujourd&apos;hui
// 							</span>
// 							<span className="text-xl font-bold text-stone-900">
// 								{(totalTodayCents / 100).toFixed(2)} €
// 							</span>
// 						</div>
// 					)}
// 				</div>
// 			</div>

// 			{/* Avertissement */}
// 			<div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700 font-medium">
// 				⚠ Aucun remboursement ne sera effectué en cas d&apos;annulation moins de 24 heures avant
// 				votre rendez-vous.
// 			</div>

// 			{error && <p className="text-red-600 text-sm">{error}</p>}

// 			<button
// 				type="submit"
// 				disabled={loading}
// 				className="bg-stone-900 text-white px-6 py-4 rounded-xl font-medium hover:bg-stone-800 transition disabled:opacity-50 text-base"
// 			>
// 				{loading
// 					? "Préparation du paiement..."
// 					: `Continuer vers le paiement — ${(totalTodayCents / 100).toFixed(2)} €`}
// 			</button>
// 		</form>
// 	);
// }

"use client";
export const runtime = "edge"
import { useState, useEffect } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import DynamicField from "./DynamicField";
import PaymentStep from "./PaymentStep";
import { computeSessionPrice } from "@/lib/pricing";
import MapboxAutocomplete from "@/components/MapboxAutocomplete";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);
const DEFAULT_PRICE_PER_KM_CENTS = 150; // 1,50 €/km
type Question = {
	key: string;
	label: string;
	type: "text" | "single_choice" | "multiple_choice" | "file";
	required: boolean;
	options?: string[];
};

type Tier = { min_sessions: number; discount_percent: number };

type ServiceInfo = {
	id: number;
	name: string;
	slug: string;
	price_cents: number;
	deposit_cents: number;
	duration_minutes: number;
	form_schema: Question[];
	tiers: Tier[];
	home_available: number;
};

type SessionState = {
	requestedDate: string;
	failedAttempts: number;
	suggestedSlots: string[] | null;
	slotsLoading: boolean;
};

type CartEntry = {
	entryId: string;
	service: ServiceInfo;
	sessionsCount: number;
	sessions: SessionState[];
	formAnswers: Record<string, string | string[]>;
};

type PublicService = {
	id: number;
	name: string;
	slug: string;
	price_cents: number;
	duration_minutes: number;
};

// ✅ Format de date lisible en français (ex: "01 janvier 2026")
function formatDateFR(isoDate: string): string {
	if (!isoDate) return "";
	return new Date(isoDate).toLocaleDateString("fr-FR", {
		day: "2-digit",
		month: "long",
		year: "numeric",
	});
}

function makeEmptySession(): SessionState {
	return { requestedDate: "", failedAttempts: 0, suggestedSlots: null, slotsLoading: false };
}

function makeEntry(service: ServiceInfo): CartEntry {
	return {
		entryId: crypto.randomUUID(),
		service,
		sessionsCount: 1,
		sessions: [makeEmptySession()],
		formAnswers: {},
	};
}

export default function ReservationCart({ initialService }: { initialService: ServiceInfo }) {
	const [cart, setCart] = useState<CartEntry[]>([makeEntry(initialService)]);

	const [clientName, setClientName] = useState("");
	const [clientEmail, setClientEmail] = useState("");
	const [clientPhone, setClientPhone] = useState("");

	const [showServicePicker, setShowServicePicker] = useState(false);
	const [availableServices, setAvailableServices] = useState<PublicService[]>([]);
	const [loadingServices, setLoadingServices] = useState(false);

	const [step, setStep] = useState<"form" | "payment">("form");
	const [clientSecret, setClientSecret] = useState<string | null>(null);
	// ✅ paymentIntentId supprimé : était défini mais jamais lu

	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);

	// ✅ Stocke les objets File réels par clé — le DOM est démonté à l'étape payment
	const [pendingFiles, setPendingFiles] = useState<Record<string, File>>({});

	const [locationType, setLocationType] = useState<"onsite" | "home">("onsite");
	const [clientAddress, setClientAddress] = useState("");
	const [clientLat, setClientLat] = useState<number | null>(null);
	const [clientLng, setClientLng] = useState<number | null>(null);
	const [travelFeesCents, setTravelFeesCents] = useState(0);
	const [travelDistanceKm, setTravelDistanceKm] = useState(0);
	const [calculatingFees, setCalculatingFees] = useState(false);

	// ✅ Constante centralisée comme valeur par défaut
	const [pricePerKmCents, setPricePerKmCents] = useState(DEFAULT_PRICE_PER_KM_CENTS);

	// ✅ Période de réservation autorisée
	const [bookingPeriodStart, setBookingPeriodStart] = useState("");
	const [bookingPeriodEnd, setBookingPeriodEnd] = useState("");

	const todayStr = new Date().toISOString().slice(0, 10);

	useEffect(() => {
		fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/settings/travel`)
			.then((res) => res.json())
			.then((data) => {
				setPricePerKmCents(data.price_per_km_cents ?? DEFAULT_PRICE_PER_KM_CENTS);
				setBookingPeriodStart(data.booking_period_start ?? "");
				setBookingPeriodEnd(data.booking_period_end ?? "");
			})
			.catch(() => {});
	}, []);

	const homePossible = cart.every((entry) => entry.service.home_available === 1);

	// ✅ Si un service ajouté au panier ne supporte pas le domicile, on repasse automatiquement en "sur place"
	useEffect(() => {
		if (!homePossible && locationType === "home") {
			setLocationType("onsite");
			setTravelFeesCents(0);
		}
	}, [homePossible]);

	// ─────────────────────────────────
	// Validation de la période de réservation
	// ─────────────────────────────────

	const isDateInPeriod = (dateStr: string): boolean => {
		if (!bookingPeriodStart && !bookingPeriodEnd) return true;
		const date = dateStr.split("T")[0]; // "2026-03-15"
		if (bookingPeriodStart && date < bookingPeriodStart) return false;
		if (bookingPeriodEnd && date > bookingPeriodEnd) return false;
		return true;
	};

	const getPeriodErrorMessage = (): string | null => {
		if (!bookingPeriodStart && !bookingPeriodEnd) return null;
		const start = bookingPeriodStart ? formatDateFR(bookingPeriodStart) : null;
		const end = bookingPeriodEnd ? formatDateFR(bookingPeriodEnd) : null;
		if (start && end) return `Merci de choisir un rendez-vous entre le ${start} et le ${end}.`;
		if (start) return `Merci de choisir un rendez-vous à partir du ${start}.`;
		if (end) return `Merci de choisir un rendez-vous avant le ${end}.`;
		return null;
	};

	// ─────────────────────────────────
	// Gestion du panier
	// ─────────────────────────────────

	const fetchAvailableServices = async () => {
		setLoadingServices(true);
		try {
			const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/services`);
			const data = await res.json();
			const alreadyInCart = cart.map((e) => e.service.id);
			setAvailableServices(data.filter((s: PublicService) => !alreadyInCart.includes(s.id)));
		} catch {
			setAvailableServices([]);
		} finally {
			setLoadingServices(false);
		}
	};

	const handleShowPicker = async () => {
		setShowServicePicker(true);
		await fetchAvailableServices();
	};

	const handleAddService = async (publicService: PublicService) => {
		setShowServicePicker(false);
		try {
			const [serviceRes, pricingRes] = await Promise.all([
				fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/services/${publicService.slug}`),
				fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/services/${publicService.slug}/pricing`),
			]);
			const [serviceData, pricingData] = await Promise.all([serviceRes.json(), pricingRes.json()]);
			const newService: ServiceInfo = {
				...serviceData,
				form_schema: JSON.parse(serviceData.form_schema),
				tiers: pricingData.tiers ?? [],
			};
			setCart((prev) => [...prev, makeEntry(newService)]);
		} catch {
			setError("Erreur lors du chargement du service");
		}
	};

	const removeEntry = (entryId: string) => {
		setCart((prev) => prev.filter((e) => e.entryId !== entryId));
	};

	const updateEntry = (entryId: string, updates: Partial<CartEntry>) => {
		setCart((prev) => prev.map((e) => (e.entryId === entryId ? { ...e, ...updates } : e)));
	};

	const updateSessionsCount = (entryId: string, count: number) => {
		const safeCount = Math.max(1, count);
		setCart((prev) =>
			prev.map((e) => {
				if (e.entryId !== entryId) return e;
				const next = [...e.sessions];
				while (next.length < safeCount) next.push(makeEmptySession());
				while (next.length > safeCount) next.pop();
				return { ...e, sessionsCount: safeCount, sessions: next };
			})
		);
	};

	const updateSession = (entryId: string, sessionIndex: number, updates: Partial<SessionState>) => {
		setCart((prev) =>
			prev.map((e) => {
				if (e.entryId !== entryId) return e;
				const next = [...e.sessions];
				next[sessionIndex] = { ...next[sessionIndex], ...updates };
				return { ...e, sessions: next };
			})
		);
	};

	// ─────────────────────────────────
	// Localisation et frais de déplacement
	// ─────────────────────────────────

	const handleAddressSelect = async (address: string, lat: number, lng: number) => {
		setClientAddress(address);
		setClientLat(lat);
		setClientLng(lng);

		if (!address) {
			setTravelFeesCents(0);
			setTravelDistanceKm(0);
			return;
		}

		setCalculatingFees(true);
		try {
			// Appel avec une date fictive uniquement pour calculer la distance
			const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/cart/payment-intent`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					items: cart.map((entry) => ({
						service_id: entry.service.id,
						sessions: ["2099-01-01T09:00:00"],
					})),
					location_type: "home",
					client_lat: lat,
					client_lng: lng,
					client_address: address,
				}),
			});
			const data = await res.json();
			if (data.travel_fees_cents !== undefined) {
				setTravelFeesCents(data.travel_fees_cents);
				setTravelDistanceKm(data.travel_distance_km ?? 0);
			}
		} catch {
			setTravelFeesCents(0);
		} finally {
			setCalculatingFees(false);
		}
	};

	// ─────────────────────────────────
	// Gestion des séances et créneaux
	// ─────────────────────────────────

	const handleDateChange = (entryId: string, sessionIndex: number, value: string) => {
		// ✅ Vérification de la période de réservation dès la saisie
		if (value && !isDateInPeriod(value)) {
			setError(getPeriodErrorMessage());
			// On met quand même la valeur pour que l'input soit contrôlé
			updateSession(entryId, sessionIndex, { requestedDate: value, failedAttempts: 0, suggestedSlots: null });
			return;
		}
		setError(null);
		updateSession(entryId, sessionIndex, { requestedDate: value, failedAttempts: 0, suggestedSlots: null });
	};

	const fetchSuggestedSlots = async (entryId: string, sessionIndex: number, date: string, slug: string) => {
		updateSession(entryId, sessionIndex, { slotsLoading: true });
		try {
			const res = await fetch(
				`${process.env.NEXT_PUBLIC_API_URL}/api/services/${slug}/available-slots?date=${date}`
			);
			const data = await res.json();
			updateSession(entryId, sessionIndex, { suggestedSlots: data.slots ?? [], slotsLoading: false });
		} catch {
			updateSession(entryId, sessionIndex, { suggestedSlots: [], slotsLoading: false });
		}
	};

	const handleSelectSuggestedSlot = (
		entryId: string,
		sessionIndex: number,
		time: string,
		currentDate: string
	) => {
		const dateOnly = currentDate.split("T")[0];
		updateSession(entryId, sessionIndex, {
			requestedDate: `${dateOnly}T${time}`,
			failedAttempts: 0,
			suggestedSlots: null,
		});
	};

	// ─────────────────────────────────
	// Calculs du récapitulatif
	// ─────────────────────────────────

	const totalPriceCents = cart.reduce((sum, entry) => {
		const price = computeSessionPrice(entry.service.price_cents, entry.sessionsCount, entry.service.tiers);
		return sum + price * entry.sessionsCount;
	}, 0);

	const totalDepositCents = cart.reduce((sum, entry) => {
		const deposit =
			entry.service.deposit_cents > 0
				? entry.service.deposit_cents
				: computeSessionPrice(entry.service.price_cents, entry.sessionsCount, entry.service.tiers);
		return sum + deposit * entry.sessionsCount;
	}, 0);

	const totalTodayCents = totalDepositCents + travelFeesCents;

	const hasDeposit = cart.some((e) => e.service.deposit_cents > 0);

	// ─────────────────────────────────
	// Soumission et paiement
	// ─────────────────────────────────

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError(null);

		// Vérification de la période de réservation pour toutes les séances
		for (const entry of cart) {
			for (const session of entry.sessions) {
				if (session.requestedDate && !isDateInPeriod(session.requestedDate)) {
					setError(getPeriodErrorMessage());
					return;
				}
			}
			if (entry.sessions.some((s) => !s.requestedDate)) {
				setError(`Merci de choisir une date et une heure pour toutes les séances de "${entry.service.name}"`);
				return;
			}
		}

		if (locationType === "home" && !clientAddress) {
			setError("Merci de saisir votre adresse pour une prestation à domicile");
			return;
		}

		setLoading(true);

		try {
			const items = cart.map((entry) => ({
				service_id: entry.service.id,
				sessions: entry.sessions.map((s) => `${s.requestedDate}:00`),
			}));

			const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/cart/payment-intent`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					items,
					location_type: locationType,
					client_address: locationType === "home" ? clientAddress : undefined,
					client_lat: locationType === "home" ? clientLat : undefined,
					client_lng: locationType === "home" ? clientLng : undefined,
				}),
			});

			const data = await res.json();

			if (!res.ok) {
				const match = data.error?.match(
					/Le créneau du (\d{4}-\d{2}-\d{2}) à (\d{2}:\d{2}) n'est pas disponible/
				);
				if (match) {
					const [, failedDate, failedTime] = match;
					for (const entry of cart) {
						const sessionIndex = entry.sessions.findIndex(
							(s) => s.requestedDate === `${failedDate}T${failedTime}`
						);
						if (sessionIndex !== -1) {
							const newAttempts = entry.sessions[sessionIndex].failedAttempts + 1;
							updateSession(entry.entryId, sessionIndex, { failedAttempts: newAttempts });
							if (newAttempts >= 2) {
								await fetchSuggestedSlots(entry.entryId, sessionIndex, failedDate, entry.service.slug);
							} else {
								setError(
									`"${entry.service.name}" — séance ${sessionIndex + 1} : ce créneau n'est pas disponible.`
								);
							}
							break;
						}
					}
				} else {
					setError(data.error || "Erreur lors de la création du paiement");
				}

				setLoading(false);
				return;
			}

			// ✅ paymentIntentId supprimé : on utilise directement dans handlePaymentConfirmed
			setClientSecret(data.client_secret);
			setStep("payment");
		} catch (err) {
			setError(err instanceof Error ? err.message : "Une erreur est survenue");
		} finally {
			setLoading(false);
		}
	};

	const handlePaymentConfirmed = async (confirmedPaymentIntentId: string) => {
		// ✅ Upload les fichiers vers R2 depuis pendingFiles (querySelector échoue : DOM démonté à l'étape payment)
		const enrichedItems = await Promise.all(
			cart.map(async (entry) => {
				const enrichedAnswers = { ...entry.formAnswers };

				for (const question of entry.service.form_schema) {
					if (question.type !== "file") continue;

					// ✅ Récupère le File depuis pendingFiles — pas depuis le DOM
					const file = pendingFiles[question.key];
					if (!file) continue;

					const form = new FormData();
					form.append("file", file);
					form.append("field_key", question.key);

					try {
						const res = await fetch(
							`${process.env.NEXT_PUBLIC_API_URL}/api/form-uploads/${confirmedPaymentIntentId}`,
							{ method: "POST", body: form }
						);
						const data = await res.json();
						if (res.ok) {
							enrichedAnswers[question.key] = data.url; // ✅ Stocke l'URL R2
						}
					} catch {
						console.error("Erreur upload fichier", question.key);
					}
				}

				return { ...entry, formAnswers: enrichedAnswers };
			})
		);

		// Même logique qu'avant, mais avec enrichedItems
		const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/cart/confirm`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				payment_intent_id: confirmedPaymentIntentId,
				client_name: clientName,
				client_email: clientEmail,
				client_phone: clientPhone || null,
				items: enrichedItems.map((entry) => ({
					service_id: entry.service.id,
					sessions: entry.sessions.map((s) => `${s.requestedDate}:00`),
					form_data: entry.formAnswers,
				})),
				location_type: locationType,
				client_address: clientAddress || null,
				client_lat: clientLat,
				client_lng: clientLng,
			}),
		});

		const data = await res.json();
		if (!res.ok) return { success: false, error: data.error as string };
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
		<form onSubmit={handleSubmit} className="flex flex-col gap-8">
			{/* Informations client */}
			<div className="bg-white border border-stone-200 rounded-2xl p-6 flex flex-col gap-4">
				<h2 className="text-sm font-semibold text-stone-900 uppercase tracking-wide">Vos informations</h2>
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
			</div>

			{/* Lieu de la prestation */}
			<div className="bg-white border border-stone-200 rounded-2xl p-6">
				<h2 className="text-sm font-semibold text-stone-900 uppercase tracking-wide mb-4">
					Lieu de la prestation
				</h2>
				<div className="flex gap-3">
					{/* Bouton Sur place */}
					<button
						type="button"
						onClick={() => {
							setLocationType("onsite");
							setTravelFeesCents(0);
						}}
						className={`flex-1 py-3 rounded-xl border text-sm font-medium transition ${
							locationType === "onsite"
								? "bg-stone-900 text-white border-stone-900"
								: "border-stone-300 text-stone-700 hover:border-stone-400"
						}`}
					>
						🏪 Sur place
					</button>

					{/* Bouton À domicile — conditionnel selon homePossible (tous les services du panier) */}
					{homePossible ? (
					<button
						type="button"
						onClick={() => setLocationType("home")}
						className={`flex-1 py-3 rounded-xl border text-sm font-medium transition ${
							locationType === "home"
								? "bg-stone-900 text-white border-stone-900"
								: "border-stone-300 text-stone-700 hover:border-stone-400"
						}`}
					>
						🏠 À domicile
					</button>
					) : (
						<div className="flex-1 py-3 rounded-xl border border-stone-200 bg-stone-50 text-center">
							<p className="text-xs text-stone-400 font-medium">🏠 À domicile</p>
							<p className="text-xs text-stone-400 mt-0.5">
								Ce service n&apos;est pas disponible à domicile
							</p>
						</div>
					)}
				</div>

				{/* ✅ Message d'avertissement si un service du panier bloque le domicile */}
				{!homePossible && (
					<div className="mt-2 bg-amber-50 border border-amber-200 rounded-lg p-2 text-xs text-amber-700">
						Un ou plusieurs services sélectionnés ne sont pas disponibles à domicile.
					</div>
				)}

				{locationType === "home" && (
					<div className="mt-4">
						<label className="block text-sm font-medium text-stone-700 mb-1.5">
							Adresse du domicile <span className="text-red-500">*</span>
						</label>
						<MapboxAutocomplete
							onSelect={handleAddressSelect}
							placeholder="Entrez votre adresse complète..."
						/>
						{calculatingFees && (
							<p className="text-sm text-stone-500 mt-2 flex items-center gap-2">
								<span className="w-3 h-3 border-2 border-stone-300 border-t-stone-700 rounded-full animate-spin inline-block" />
								Calcul des frais de déplacement...
							</p>
						)}
						{!calculatingFees && travelFeesCents > 0 && (
							<div className="mt-3 bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
								Distance estimée : <strong>{travelDistanceKm.toFixed(1)} km</strong>
								<br />
								Frais de déplacement estimés :{" "}
								<strong>{(travelFeesCents / 100).toFixed(2)} €</strong>
							</div>
						)}
					</div>
				)}
			</div>

			{/* Un bloc par service dans le panier */}
			{cart.map((entry) => {
				const pricePerSession = computeSessionPrice(
					entry.service.price_cents,
					entry.sessionsCount,
					entry.service.tiers
				);
				const applicableTier = [...entry.service.tiers]
					.filter((t) => entry.sessionsCount >= t.min_sessions)
					.sort((a, b) => b.discount_percent - a.discount_percent)[0];

				return (
					<div
						key={entry.entryId}
						className="bg-white border border-stone-200 rounded-2xl p-6 flex flex-col gap-5"
					>
						<div className="flex items-center justify-between">
							<div>
								<h2 className="font-semibold text-stone-900">{entry.service.name}</h2>
								<p className="text-sm text-stone-500">
									{entry.service.duration_minutes} min —{" "}
									{(entry.service.price_cents / 100).toFixed(2)} €
								</p>
							</div>
							{cart.length > 1 && (
								<button
									type="button"
									onClick={() => removeEntry(entry.entryId)}
									className="text-sm text-red-600 hover:text-red-700"
								>
									Retirer
								</button>
							)}
						</div>

						{/* Formulaire dynamique */}
						{entry.service.form_schema.length > 0 && (
							<div className="flex flex-col gap-4">
								{entry.service.form_schema.map((question) => (
									<DynamicField
										key={question.key}
										question={question}
										value={entry.formAnswers[question.key]}
										onChange={(key, value) =>
											updateEntry(entry.entryId, {
												formAnswers: { ...entry.formAnswers, [key]: value },
											})
										}
										// ✅ Stocke le File réel dès la sélection, avant que le DOM soit démonté
										onFileSelect={(key, file) =>
											setPendingFiles((prev) => ({ ...prev, [key]: file }))
										}
									/>
								))}
							</div>
						)}

						{/* Nombre de séances */}
						<div>
							<label className="block text-sm font-medium text-stone-700 mb-1.5">
								Nombre de séances
							</label>
							<input
								type="number"
								min={1}
								value={entry.sessionsCount}
								onChange={(e) =>
									updateSessionsCount(entry.entryId, parseInt(e.target.value, 10) || 1)
								}
								className="w-24 border border-stone-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-stone-400"
							/>
							{(applicableTier || entry.sessionsCount > 1) && (
								<div className="mt-2 bg-stone-50 border border-stone-200 rounded-lg p-3 text-sm">
									<div className="flex justify-between text-stone-600">
										<span>Prix par séance</span>
										<span>{(pricePerSession / 100).toFixed(2)} €</span>
									</div>
									{applicableTier && (
										<div className="flex justify-between text-green-700 mt-1">
											<span>Réduction</span>
											<span>-{applicableTier.discount_percent}%</span>
										</div>
									)}
									<div className="flex justify-between font-medium text-stone-900 mt-1 pt-1 border-t border-stone-200">
										<span>
											Sous-total ({entry.sessionsCount} séance
											{entry.sessionsCount > 1 ? "s" : ""})
										</span>
										<span>
											{((pricePerSession * entry.sessionsCount) / 100).toFixed(2)} €
										</span>
									</div>
								</div>
							)}
						</div>

						{/* Séances */}
						<div className="flex flex-col gap-4">
							{entry.sessions.map((session, sessionIndex) => (
								<div
									key={sessionIndex}
									className="border border-stone-100 rounded-xl p-4 bg-stone-50"
								>
									<p className="text-xs font-medium text-stone-500 mb-2">
										SÉANCE {sessionIndex + 1}
									</p>
									<input
										type="datetime-local"
										required
										min={
											bookingPeriodStart
												? `${bookingPeriodStart}T00:00`
												: `${todayStr}T00:00`
										}
										max={
											bookingPeriodEnd ? `${bookingPeriodEnd}T23:59` : undefined
										}
										value={session.requestedDate}
										onChange={(e) =>
											handleDateChange(entry.entryId, sessionIndex, e.target.value)
										}
										className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-stone-400"
									/>

									{/* ✅ Message période si date hors intervalle */}
									{session.requestedDate && !isDateInPeriod(session.requestedDate) && (
										<div className="mt-2 bg-amber-50 border border-amber-200 rounded-lg p-2 text-sm text-amber-800">
											{getPeriodErrorMessage()}
										</div>
									)}

									{session.slotsLoading && (
										<p className="text-sm text-stone-500 mt-2">
											Recherche de créneaux...
										</p>
									)}

									{session.suggestedSlots !== null && !session.slotsLoading && (
										<div className="mt-3">
											{session.suggestedSlots.length === 0 ? (
												<p className="text-sm text-stone-600">
													Aucun créneau disponible ce jour-là, merci de choisir une
													autre journée.
												</p>
											) : (
												<>
													<p className="text-sm text-stone-600 mb-2">
														Créneaux disponibles :
													</p>
													<div className="flex flex-wrap gap-2">
														{session.suggestedSlots.map((slot) => (
															<button
																key={slot}
																type="button"
																onClick={() =>
																	handleSelectSuggestedSlot(
																		entry.entryId,
																		sessionIndex,
																		slot,
																		session.requestedDate
																	)
																}
																className="text-sm px-3 py-1.5 rounded-lg border border-stone-300 text-stone-700 hover:border-stone-900 hover:bg-stone-900 hover:text-white transition"
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
					</div>
				);
			})}

			{/* Bouton ajouter un service */}
			{!showServicePicker && (
				<button
					type="button"
					onClick={handleShowPicker}
					className="flex items-center justify-center gap-2 border-2 border-dashed border-stone-300 rounded-2xl py-4 text-sm font-medium text-stone-500 hover:border-stone-400 hover:text-stone-700 transition"
				>
					<span className="text-lg">+</span>
					Ajouter un autre service
				</button>
			)}

			{/* Sélecteur de service */}
			{showServicePicker && (
				<div className="bg-white border border-stone-200 rounded-2xl p-6">
					<div className="flex items-center justify-between mb-4">
						<h3 className="text-sm font-semibold text-stone-900">Choisir un service</h3>
						<button
							type="button"
							onClick={() => setShowServicePicker(false)}
							className="text-sm text-stone-400 hover:text-stone-700"
						>
							Annuler
						</button>
					</div>
					{loadingServices && <p className="text-sm text-stone-500">Chargement...</p>}
					{!loadingServices && availableServices.length === 0 && (
						<p className="text-sm text-stone-500">
							Tous les services sont déjà dans votre panier.
						</p>
					)}
					<div className="flex flex-col gap-2">
						{availableServices.map((service) => (
							<button
								key={service.id}
								type="button"
								onClick={() => handleAddService(service)}
								className="flex items-center justify-between border border-stone-200 rounded-xl p-3 hover:border-stone-900 hover:bg-stone-50 transition text-left"
							>
								<div>
									<p className="font-medium text-stone-900 text-sm">{service.name}</p>
									<p className="text-xs text-stone-500">{service.duration_minutes} min</p>
								</div>
								<span className="text-sm text-stone-700">
									{(service.price_cents / 100).toFixed(2)} €
								</span>
							</button>
						))}
					</div>
				</div>
			)}

			{/* ✅ Récapitulatif complet — tout dans un seul bloc */}
			<div className="bg-white border border-stone-200 rounded-2xl p-6">
				<h3 className="text-sm font-semibold text-stone-900 uppercase tracking-wide mb-4">
					Récapitulatif
				</h3>
				<div className="flex flex-col gap-3">
					{/* Lignes par service */}
					{cart.map((entry) => {
						const pricePerSession = computeSessionPrice(
							entry.service.price_cents,
							entry.sessionsCount,
							entry.service.tiers
						);
						const subtotal = pricePerSession * entry.sessionsCount;
						const depositTotal = entry.service.deposit_cents * entry.sessionsCount;
						const hasDiscount = pricePerSession < entry.service.price_cents;

						return (
							<div
								key={entry.entryId}
								className="flex items-start justify-between text-sm pb-3 border-b border-stone-100 last:border-0 last:pb-0"
							>
								<div>
									<p className="font-medium text-stone-900">{entry.service.name}</p>
									<p className="text-stone-400 text-xs mt-0.5">
										{entry.sessionsCount} séance{entry.sessionsCount > 1 ? "s" : ""} ×{" "}
										{(pricePerSession / 100).toFixed(2)} €
										{hasDiscount && (
											<span className="text-green-600 ml-1">(réduit)</span>
										)}
									</p>
									{entry.service.deposit_cents > 0 && (
										<p className="text-xs text-stone-400 mt-0.5">
											Acompte : {(depositTotal / 100).toFixed(2)} € · Sur place :{" "}
											{((subtotal - depositTotal) / 100).toFixed(2)} €
										</p>
									)}
								</div>
								<span className="font-medium text-stone-900">
									{(subtotal / 100).toFixed(2)} €
								</span>
							</div>
						);
					})}

					{/* ✅ Frais de déplacement dans le récapitulatif */}
					{locationType === "home" && travelFeesCents > 0 && (
						<div className="flex justify-between text-sm pt-1">
							<span className="text-stone-600">Frais de déplacement</span>
							<span className="font-medium text-stone-900">
								{(travelFeesCents / 100).toFixed(2)} €
							</span>
						</div>
					)}

					{/* Prix total */}
					<div className="flex items-center justify-between pt-2 border-t border-stone-200">
						<span className="font-semibold text-stone-900">Prix total prestation</span>
						<span className="font-bold text-stone-900">
							{(totalPriceCents / 100).toFixed(2)} €
						</span>
					</div>

					{/* Acompte et reste */}
					{hasDeposit && (
						<>
							<div className="border-t border-stone-200 pt-3 flex flex-col gap-2">
								<div className="flex justify-between text-sm">
									<span className="text-green-700 font-medium">
										Total à payer aujourd&apos;hui{" "}
										{travelFeesCents > 0 ? "(acompte + déplacement)" : "(acompte)"}
									</span>
									<span className="text-green-700 font-bold">
										{(totalTodayCents / 100).toFixed(2)} €
									</span>
								</div>
								<div className="flex justify-between text-sm">
									<span className="text-stone-500">Reste à payer sur place</span>
									<span className="text-stone-700 font-medium">
										{((totalPriceCents - totalDepositCents) / 100).toFixed(2)} €
									</span>
								</div>
							</div>
							<div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
								Seul l&apos;acompte est débité aujourd&apos;hui. Le reste sera réglé directement
								sur place après la prestation.
							</div>
						</>
					)}

					{/* Si pas d'acompte mais des frais de déplacement */}
					{!hasDeposit && travelFeesCents > 0 && (
						<div className="flex items-center justify-between pt-2 border-t border-stone-200">
							<span className="font-semibold text-stone-900">
								Total débité aujourd&apos;hui
							</span>
							<span className="text-xl font-bold text-stone-900">
								{(totalTodayCents / 100).toFixed(2)} €
							</span>
						</div>
					)}
				</div>
			</div>

			{/* Avertissement */}
			<div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700 font-medium">
				⚠ Aucun remboursement ne sera effectué en cas d&apos;annulation moins de 24 heures avant
				votre rendez-vous.
			</div>

			{error && <p className="text-red-600 text-sm">{error}</p>}

			<button
				type="submit"
				disabled={loading}
				className="bg-stone-900 text-white px-6 py-4 rounded-xl font-medium hover:bg-stone-800 transition disabled:opacity-50 text-base"
			>
				{loading
					? "Préparation du paiement..."
					: `Continuer vers le paiement — ${(totalTodayCents / 100).toFixed(2)} €`}
			</button>
		</form>
	);
}