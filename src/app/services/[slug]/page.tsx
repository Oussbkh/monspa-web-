import { notFound } from "next/navigation";

type ServiceDetail = {
	id: number;
	name: string;
	slug: string;
	description: string | null;
	price_cents: number;
	duration_minutes: number;
	image_key: string | null
};
export const runtime = "edge"
async function getService(slug: string): Promise<ServiceDetail | null> {
	const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/services/${slug}`);

	if (res.status === 404) {
		return null;
	}

	if (!res.ok) {
		throw new Error("Erreur lors du chargement du service");
	}

	return res.json();
}


async function getServiceImages(serviceId: number): Promise<{ id: number; url: string; is_cover: boolean }[]> {
	try {
		// Les images sont récupérées via la route admin → on les expose aussi publiquement
		// via la route GET /api/services/:slug qui retourne image_key
		// Pour la galerie complète, on ajoute une route publique (voir ci-dessous)
		const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/services/${serviceId}/images`);
		if (!res.ok) return [];
		return res.json();
	} catch {
		return [];
	}
}

export default async function ServicePage({ params }: { params: Promise<{ slug: string }> }) {
	const { slug } = await params;
	const service = await getService(slug);
	if (!service) notFound();

	const images = await getServiceImages(service.id);
	const galleryImages = images.filter((img) => !img.is_cover);

	return (
		<main className="min-h-screen bg-stone-50">
			<div className="max-w-2xl mx-auto px-6 py-16">
				<a href="/" className="inline-flex items-center gap-1 text-sm text-stone-500 hover:text-stone-800">
					Retour aux services
				</a>

				{/* ✅ Image principale */}
				{service.image_key && (
					<img
						src={`${process.env.NEXT_PUBLIC_API_URL}/api/uploads/${encodeURIComponent(service.image_key)}`}
						alt={service.name}
						className="w-full h-56 object-cover rounded-2xl mt-6 border border-stone-200"
					/>
				)}

				<div className="bg-white rounded-2xl border border-stone-200 p-8 mt-6">
					<h1 className="text-3xl font-semibold text-stone-900">{service.name}</h1>

					{service.description && (
						<p className="text-stone-500 mt-4 leading-relaxed">{service.description}</p>
					)}

					<div className="flex gap-3 mt-6">
						<span className="inline-flex items-center gap-2 text-sm text-stone-600 bg-stone-100 px-3 py-1.5 rounded-full">
							{service.duration_minutes} minutes
						</span>
						<span className="inline-flex items-center text-sm font-medium text-stone-900 bg-stone-100 px-3 py-1.5 rounded-full">
							{(service.price_cents / 100).toFixed(2)} €
						</span>
					</div>

					{/* ✅ Galerie photos supplémentaires */}
					{galleryImages.length > 0 && (
						<div className="mt-6">
							<h2 className="text-sm font-medium text-stone-700 mb-3">Photos</h2>
							<div className="grid grid-cols-3 gap-2">
								{galleryImages.map((img) => (
									<img
										key={img.id}
										src={`${process.env.NEXT_PUBLIC_API_URL}${img.url}`}
										alt="Photo du service"
										className="w-full h-24 object-cover rounded-lg border border-stone-200"
									/>
								))}
							</div>
						</div>
					)}

					<a
						href={`/reservation/${service.slug}`}
						className="inline-flex items-center justify-center w-full mt-8 bg-stone-900 text-white px-6 py-3.5 rounded-xl font-medium hover:bg-stone-800 transition"
					>
						Réserver ce service
					</a>
				</div>
			</div>
		</main>
	);
}