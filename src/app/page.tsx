type Service = {
	id: number;
	name: string;
	slug: string;
	description: string | null;
	price_cents: number;
	duration_minutes: number;
	image_key: string | null; // ✅ AJOUT
};
export const dynamic = 'force-dynamic';
async function getServices(): Promise<Service[]> {
	const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/services`);

	if (!res.ok) {
		throw new Error("Erreur lors du chargement des services");
	}

	return res.json();
}

import ReviewsCarousel from "@/components/ReviewsCarousel";

// Ajoute cette fonction :
async function getApprovedReviews() {
	try {
		const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/reviews`);
		if (!res.ok) return [];
		return res.json();
	} catch {
		return [];
	}
}


export default async function Home() {
	const [services, reviews] = await Promise.all([
		getServices(),
		getApprovedReviews(),
	]);
	return (
		<main className="min-h-screen bg-stone-50">
			<div className="max-w-5xl mx-auto px-6 py-16">
				<div className="text-center mb-12">
					<h1 className="text-4xl font-semibold text-stone-900">Nos soins</h1>
					<p className="text-stone-500 mt-3">
						Choisissez un soin pour découvrir les détails et réserver votre créneau.
					</p>
				</div>

				<div className="grid gap-6 sm:grid-cols-2">
					{services.map((service) => (
						<a
							key={service.id}
							href={`/services/${service.slug}`}
							className="group block bg-white rounded-2xl p-6 border border-stone-200 hover:border-stone-300 hover:shadow-lg transition-all duration-200"
						>
							{/* ✅ Image de couverture */}
							{service.image_key ? (
								<img
									src={`${process.env.NEXT_PUBLIC_API_URL}/api/uploads/${encodeURIComponent(service.image_key)}`}
									alt={service.name}
									className="w-full h-40 object-cover"
								/>
							) : (
								<div className="w-full h-40 bg-stone-100 flex items-center justify-center">
									<span className="text-stone-300 text-4xl">🌿</span>
								</div>
							)}
							<div className="flex items-start justify-between">
								<h2 className="text-lg font-medium text-stone-900 group-hover:text-stone-700">
									{service.name}
								</h2>
								<span className="text-sm font-medium text-stone-900 bg-stone-100 px-3 py-1 rounded-full whitespace-nowrap ml-3">
									{(service.price_cents / 100).toFixed(2)} €
								</span>
							</div>

							{service.description && (
								<p className="text-stone-500 text-sm mt-3 line-clamp-2">
									{service.description}
								</p>
							)}

							<div className="flex items-center gap-2 mt-5 text-sm text-stone-400">
								<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
								</svg>
								<span>{service.duration_minutes} min</span>
							</div>
						</a>
					))}
				</div>
			</div>
			{reviews.length > 0 ? (
				<ReviewsCarousel reviews={reviews} />
			) : (
				<section className="bg-stone-50 py-16 px-6">
					<div className="max-w-2xl mx-auto text-center">
						<h2 className="text-2xl font-semibold text-stone-900 mb-4">Ce que pensent nos clients</h2>
						<p className="text-stone-400">Aucun avis disponible pour le moment.</p>
					</div>
				</section>
			)}
		</main>
	);
}