type Tier = { min_sessions: number; discount_percent: number };

export function computeSessionPrice(
	basePriceCents: number,
	sessionsCount: number,
	tiers: Tier[]
): number {
	let bestDiscount = 0;

	for (const tier of tiers) {
		if (sessionsCount >= tier.min_sessions && tier.discount_percent > bestDiscount) {
			bestDiscount = tier.discount_percent;
		}
	}

	const discounted = basePriceCents * (1 - bestDiscount / 100);
	return Math.round(discounted);
}