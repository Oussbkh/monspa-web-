import { notFound } from "next/navigation";
import ReservationCart from "./ReservationCart";

type ServiceDetail = {
	id: number;
	name: string;
	slug: string;
	price_cents: number;
	deposit_cents: number; // ✅ AJOUT
	duration_minutes: number;
	form_schema: string;
	home_available: number; // ✅ AJOUT
};

async function getService(slug: string): Promise<ServiceDetail | null> {
	const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/services/${slug}`);
	if (res.status === 404) return null;
	if (!res.ok) throw new Error("Erreur");
	return res.json();
}

async function getPricing(slug: string) {
	const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/services/${slug}/pricing`);
	if (!res.ok) return { tiers: [] };
	return res.json();
}

export default async function ReservationPage({ params }: { params: Promise<{ slug: string }> }) {
	const { slug } = await params;
	const [service, pricing] = await Promise.all([getService(slug), getPricing(slug)]);

	if (!service) notFound();

	const formSchema = JSON.parse(service.form_schema);

	return (
		<main className="min-h-screen bg-stone-50">
			<div className="max-w-2xl mx-auto px-6 py-16">
				<a href={`/services/${service.slug}`} className="inline-flex items-center gap-1 text-sm text-stone-500 hover:text-stone-800 mb-8">
					Retour
				</a>
				<h1 className="text-2xl font-semibold text-stone-900 mb-8">Votre réservation</h1>
				<ReservationCart
				initialService={{
					...service,
					form_schema: formSchema,
					tiers: pricing.tiers ?? [],
					deposit_cents: service.deposit_cents, // ✅ AJOUT
					home_available: service.home_available, // ✅ AJOUT
				}}
			/>
			</div>
		</main>
	);
}