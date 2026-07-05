"use client";

import { useEffect, useState, useCallback } from "react";

type Review = {
	id: number;
	client_name: string;
	client_firstname: string;
	comment: string;
	rating: number;
	service_name: string;
	created_at: string;
};

export default function ReviewsCarousel({ reviews }: { reviews: Review[] }) {
	const [current, setCurrent] = useState(0);

	const next = useCallback(() => {
		setCurrent((c) => (c + 1) % reviews.length);
	}, [reviews.length]);

	const prev = () => {
		setCurrent((c) => (c - 1 + reviews.length) % reviews.length);
	};

	// ✅ Auto-défilement toutes les 5 secondes
	useEffect(() => {
		if (reviews.length <= 1) return;
		const interval = setInterval(next, 5000);
		return () => clearInterval(interval);
	}, [next, reviews.length]);

	if (reviews.length === 0) return null;

	const review = reviews[current];

	return (
		<section className="bg-stone-50 py-16 px-6">
			<div className="max-w-2xl mx-auto">
				<h2 className="text-2xl font-semibold text-stone-900 text-center mb-10">
					Ce que pensent nos clients
				</h2>

				<div className="relative">
					{/* Carte d'avis */}
					<div className="bg-white border border-stone-200 rounded-2xl p-8 text-center min-h-[200px] flex flex-col items-center justify-center transition-all">
						<div className="flex gap-0.5 mb-4 justify-center">
							{[1,2,3,4,5].map((s) => (
								<span key={s} className={`text-xl ${s <= review.rating ? "text-amber-400" : "text-stone-200"}`}>★</span>
							))}
						</div>
						<p className="text-stone-700 leading-relaxed mb-4 max-w-md">
							&ldquo;{review.comment}&rdquo;
						</p>
						<p className="font-semibold text-stone-900">
							{review.client_firstname} {review.client_name}
						</p>
						<p className="text-xs text-stone-400 mt-1">
							{review.service_name} · {new Date(review.created_at).toLocaleDateString("fr-FR")}
						</p>
					</div>

					{/* Flèches */}
					{reviews.length > 1 && (
						<>
							<button onClick={prev}
								className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-5 w-10 h-10 bg-white border border-stone-200 rounded-full flex items-center justify-center hover:bg-stone-50 transition shadow-sm">
								‹
							</button>
							<button onClick={next}
								className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-5 w-10 h-10 bg-white border border-stone-200 rounded-full flex items-center justify-center hover:bg-stone-50 transition shadow-sm">
								›
							</button>
						</>
					)}
				</div>

				{/* Indicateurs */}
				{reviews.length > 1 && (
					<div className="flex justify-center gap-2 mt-6">
						{reviews.map((_, i) => (
							<button key={i} onClick={() => setCurrent(i)}
								className={`w-2 h-2 rounded-full transition ${i === current ? "bg-stone-900" : "bg-stone-300"}`} />
						))}
					</div>
				)}
			</div>
		</section>
	);
}