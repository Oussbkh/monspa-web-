"use client";

import { useEffect, useRef, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import multiMonthPlugin from "@fullcalendar/multimonth";
import interactionPlugin from "@fullcalendar/interaction";
import frLocale from "@fullcalendar/core/locales/fr";
import type { EventClickArg, EventDropArg } from "@fullcalendar/core";
import "./calendar.css";
export const runtime = "edge"
type Booking = {
	id: number;
	client_name: string;
	client_email: string;
	client_phone: string | null;
	requested_date: string;
	status: string;
	service_name: string;
	service_color: string;
	location_type: string | null;
	client_address: string | null;
};

type Question = {
	key: string;
	label: string;
	type: string;
};

type BookingDetail = {
	id: number;
	client_name: string;
	client_email: string;
	client_phone: string | null;
	form_data: Record<string, string | string[]>;
	requested_date: string;
	status: string;
	service: {
		name: string;
		price_cents: number;
		duration_minutes: number;
		form_schema: Question[];
	};
	location_type: string | null;
	client_address: string | null;
};

const VIEWS = [
	{ key: "multiMonthFourMonth", label: "4 mois" },
	{ key: "dayGridMonth", label: "Mois" },
	{ key: "timeGridWeek", label: "Semaine" },
	{ key: "timeGridDay", label: "Jour" },	
];

function toLocalISO(date: Date): string {
	const pad = (n: number) => String(n).padStart(2, "0");
	return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:00`;
}

export default function CalendarPage() {
	const calendarRef = useRef<FullCalendar | null>(null);
	const [title, setTitle] = useState("");
	const [activeView, setActiveView] = useState("dayGridMonth");

	const [bookings, setBookings] = useState<Booking[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const [selectedId, setSelectedId] = useState<number | null>(null);
	const [selectedDetail, setSelectedDetail] = useState<BookingDetail | null>(null);
	const [detailLoading, setDetailLoading] = useState(false);

	const [rescheduleDate, setRescheduleDate] = useState("");
	const [rescheduling, setRescheduling] = useState(false);
	const [rescheduleError, setRescheduleError] = useState<string | null>(null);

	useEffect(() => {
		loadBookings();
	}, []);

	const loadBookings = async () => {
		setLoading(true);
		try {
			const res = await fetch(
				`${process.env.NEXT_PUBLIC_API_URL}/api/admin/bookings?status=accepted`,
				{ credentials: "include" }
			);
			if (!res.ok) throw new Error("Erreur lors du chargement des réservations");
			setBookings(await res.json());
		} catch (err) {
			setError(err instanceof Error ? err.message : "Une erreur est survenue");
		} finally {
			setLoading(false);
		}
	};

	const loadDetail = async (id: number) => {
		setDetailLoading(true);
		setSelectedId(id);
		setSelectedDetail(null);
		setRescheduleError(null);
		try {
			const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/bookings/${id}`, {
				credentials: "include",
			});
			if (!res.ok) throw new Error("Réservation introuvable");
			const data: BookingDetail = await res.json();
			setSelectedDetail(data);
			setRescheduleDate(data.requested_date.slice(0, 16));
		} catch (err) {
			setError(err instanceof Error ? err.message : "Une erreur est survenue");
		} finally {
			setDetailLoading(false);
		}
	};

	const events = bookings.map((b) => ({
		id: String(b.id),
		title: b.service_name,
		start: b.requested_date,
		color: b.service_color,
		extendedProps: {
			location_type: b.location_type ?? "onsite",
			client_address: b.client_address ?? null,
		},
	}));

	const handleEventClick = (arg: EventClickArg) => {
		loadDetail(Number(arg.event.id));
	};

	const handleEventDrop = async (info: EventDropArg) => {
		if (!info.event.start) return;
		const newDate = toLocalISO(info.event.start);

		try {
			const res = await fetch(
				`${process.env.NEXT_PUBLIC_API_URL}/api/admin/bookings/${info.event.id}/reschedule`,
				{
					method: "PATCH",
					credentials: "include",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ requested_date: newDate }),
				}
			);

			if (!res.ok) {
				const data = await res.json();
				alert(data.error || "Ce créneau n'est pas disponible");
				info.revert();
				return;
			}

			await loadBookings();
		} catch {
			alert("Erreur lors de la reprogrammation");
			info.revert();
		}
	};

	const handleReschedule = async () => {
		if (!selectedDetail || !rescheduleDate) return;

		setRescheduling(true);
		setRescheduleError(null);

		try {
			const res = await fetch(
				`${process.env.NEXT_PUBLIC_API_URL}/api/admin/bookings/${selectedDetail.id}/reschedule`,
				{
					method: "PATCH",
					credentials: "include",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ requested_date: `${rescheduleDate}:00` }),
				}
			);

			const data = await res.json();

			if (!res.ok) {
				throw new Error(data.error || "Erreur lors de la reprogrammation");
			}

			await loadBookings();
			await loadDetail(selectedDetail.id);
		} catch (err) {
			setRescheduleError(err instanceof Error ? err.message : "Une erreur est survenue");
		} finally {
			setRescheduling(false);
		}
	};

	const goPrev = () => calendarRef.current?.getApi().prev();
	const goNext = () => calendarRef.current?.getApi().next();
	const goToday = () => calendarRef.current?.getApi().today();
	const changeView = (view: string) => {
		calendarRef.current?.getApi().changeView(view);
		setActiveView(view);
	};

	return (
		<main className="min-h-screen bg-stone-50">
			<div className="max-w-6xl mx-auto px-6 py-12">
				<div className="flex items-center justify-between mb-6">
					<h1 className="text-2xl font-semibold text-stone-900">Calendrier</h1>
					<div className="flex items-center gap-4">
						<a href="/admin/services" className="text-sm text-stone-500 hover:text-stone-800">
							Gérer les services
						</a>
						<a href="/admin/dashboard" className="text-sm text-stone-500 hover:text-stone-800">
							Voir la liste
						</a>
					</div>
				</div>

				<p className="text-sm text-stone-500 mb-4">
					Glissez-déposez une réservation sur un autre jour pour la reprogrammer.
				</p>

				{loading && <p className="text-stone-500">Chargement...</p>}
				{error && <p className="text-red-600">{error}</p>}

				{!loading && (
					<div className="bg-white border border-stone-200 rounded-2xl p-6">
						<div className="flex items-start justify-between mb-5 flex-wrap gap-4">
							<div className="flex flex-col gap-2">
								<div className="flex items-center gap-1">
									<button
										onClick={goPrev}
										className="w-8 h-8 flex items-center justify-center rounded-lg border border-stone-200 text-stone-600 hover:bg-stone-100 transition"
									>
										‹
									</button>
									<button
										onClick={goNext}
										className="w-8 h-8 flex items-center justify-center rounded-lg border border-stone-200 text-stone-600 hover:bg-stone-100 transition"
									>
										›
									</button>
								</div>
								<button
									onClick={goToday}
									className="text-sm font-medium text-stone-700 border border-stone-200 rounded-lg px-3 py-1.5 hover:bg-stone-100 transition self-start"
								>
									Aujourd&apos;hui
								</button>
							</div>

							<h2 className="text-lg font-semibold text-stone-900 mt-1">{title}</h2>

							<div className="flex items-center gap-1 bg-stone-100 rounded-lg p-1">
								{VIEWS.map((v) => (
									<button
										key={v.key}
										onClick={() => changeView(v.key)}
										className={`text-sm px-3 py-1.5 rounded-md transition ${
											activeView === v.key
												? "bg-white text-stone-900 shadow-sm"
												: "text-stone-500 hover:text-stone-800"
										}`}
									>
										{v.label}
									</button>
								))}
							</div>
						</div>

						<FullCalendar
							ref={calendarRef}
							plugins={[dayGridPlugin, timeGridPlugin, multiMonthPlugin, interactionPlugin]}
							initialView="dayGridMonth"
							locale="fr"
							locales={[frLocale]}
							firstDay={1}
							height="auto"
							headerToolbar={false}
							eventDisplay="block"
							editable={true}
							eventDrop={handleEventDrop}
							datesSet={(arg) => setTitle(arg.view.title)}
							views={{
								multiMonthFourMonth: {
									type: "multiMonth",
									duration: { months: 4 },
								},
							}}
							events={events}
							eventClick={handleEventClick}
							
							eventContent={(arg) => {
								const isHome = arg.event.extendedProps.location_type === "home";
								return (
									<div className="flex items-center gap-1 px-1 overflow-hidden w-full">
										<span className="flex-shrink-0 text-xs">{isHome ? "🏠" : "🏪"}</span>
										<span className="truncate text-xs font-medium">{arg.event.title}</span>
										<span className="text-xs opacity-75 flex-shrink-0">
											{arg.timeText}
										</span>
									</div>
								);
							}}

							eventTimeFormat={{ hour: "2-digit", minute: "2-digit" }}
							dayMaxEvents={3}
							moreLinkText={(n) => `+${n} autres`}
						/>
					</div>
				)}

				{selectedId && (
					<div className="mt-6 bg-white border border-stone-200 rounded-2xl p-6">
						{detailLoading && <p className="text-stone-500 text-sm">Chargement...</p>}

						{!detailLoading && selectedDetail && (
							<>
								<div className="flex items-center justify-between">
									<h3 className="text-lg font-semibold text-stone-900">
										{selectedDetail.client_name}
									</h3>
									<a
										href={`/admin/dashboard/${selectedDetail.id}`}
										className="text-sm text-stone-500 hover:text-stone-800"
									>
										Voir la fiche complète
									</a>
								</div>

								<div className="mt-3 text-sm text-stone-600 flex flex-col gap-1">
									<p>Email : {selectedDetail.client_email}</p>
									{selectedDetail.client_phone && (
										<p>Téléphone : {selectedDetail.client_phone}</p>
									)}

									<div className="flex items-center gap-2 mt-1">
										{selectedDetail.location_type === "home" ? (
											<>
												<span className="text-xs font-medium bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
													🏠 À domicile
												</span>
												{selectedDetail.client_address && (
													<span className="text-xs text-stone-500">{selectedDetail.client_address}</span>
												)}
											</>
										) : (
											<span className="text-xs font-medium bg-stone-100 text-stone-600 px-2 py-0.5 rounded-full">
												🏪 Sur place
											</span>
										)}
									</div>


									<p>Date actuelle : {new Date(selectedDetail.requested_date).toLocaleString("fr-FR")}</p>
									<p>
										Service : {selectedDetail.service.name} —{" "}
										{(selectedDetail.service.price_cents / 100).toFixed(2)} eur —{" "}
										{selectedDetail.service.duration_minutes} min
									</p>
								</div>

								<div className="border-t border-stone-100 mt-4 pt-4">
									<h4 className="text-sm font-medium text-stone-900 mb-2">Reprogrammer</h4>
									<div className="flex items-center gap-2">
										<input
											type="datetime-local"
											value={rescheduleDate}
											onChange={(e) => setRescheduleDate(e.target.value)}
											className="border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-stone-400"
										/>
										<button
											type="button"
											onClick={handleReschedule}
											disabled={rescheduling}
											className="text-sm font-medium bg-stone-900 text-white px-4 py-2 rounded-lg hover:bg-stone-800 transition disabled:opacity-50"
										>
											{rescheduling ? "..." : "Confirmer"}
										</button>
									</div>
									{rescheduleError && (
										<p className="text-red-600 text-sm mt-2">{rescheduleError}</p>
									)}
								</div>

								<div className="border-t border-stone-100 mt-4 pt-4">
									<h4 className="text-sm font-medium text-stone-900 mb-2">
										Réponses au formulaire
									</h4>
									<div className="flex flex-col gap-2">
										{selectedDetail.service.form_schema.map((q) => {
											const answer = selectedDetail.form_data[q.key];
											const display = Array.isArray(answer)
												? answer.join(", ")
												: answer ?? "";

											// ✅ On ne crée un lien que si on a vraiment une URL R2 valide
											const isUploadedFile =
												typeof display === "string" &&
												display.startsWith("/api/uploads/");

											// Cas : champ de type file mais pas encore uploadé
											const isFileFieldNotUploaded =
												q.type === "file" && !isUploadedFile;

											return (
												<div key={q.key}>
													<p className="text-xs text-stone-400">{q.label}</p>

													{isUploadedFile ? (
														// ✅ URL R2 valide → lien cliquable
														<a
															href={`${process.env.NEXT_PUBLIC_API_URL}${display}`}
															target="_blank"
															rel="noopener noreferrer"
															className="text-sm text-blue-600 hover:underline flex items-center gap-1 mt-0.5"
														>
															📎 Voir le fichier
														</a>
													) : isFileFieldNotUploaded ? (
														// Champ fichier mais valeur = nom de fichier local ou vide
														<p className="text-sm text-stone-400 italic">
															{display || "Aucun fichier fourni"}
														</p>
													) : (
														// Réponse texte classique
														<p className="text-sm text-stone-800">
															{display || "Non renseigné"}
														</p>
													)}
												</div>
											);
										})}
									</div>
								</div>
							</>
						)}
					</div>
				)}
			</div>
		</main>
	);
}