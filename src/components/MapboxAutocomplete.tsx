"use client";

import { useState, useRef, useEffect } from "react";

type Feature = {
	id: string;
	place_name: string;
	geometry: { coordinates: [number, number] };
};

type Props = {
	onSelect: (address: string, lat: number, lng: number) => void;
	placeholder?: string;
};

export default function MapboxAutocomplete({ onSelect, placeholder = "Entrez votre adresse..." }: Props) {
	const [query, setQuery] = useState("");
	const [suggestions, setSuggestions] = useState<Feature[]>([]);
	const [loading, setLoading] = useState(false);
	const [selected, setSelected] = useState(false);
	const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	const search = async (q: string) => {
		if (q.length < 3) {
			setSuggestions([]);
			return;
		}

		setLoading(true);

		try {
			const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
			const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(q)}.json?access_token=${token}&country=fr&language=fr&types=address&limit=5`;
			const res = await fetch(url);
			const data = await res.json();
			setSuggestions(data.features ?? []);
		} catch {
			setSuggestions([]);
		} finally {
			setLoading(false);
		}
	};

	const handleChange = (value: string) => {
		setQuery(value);
		setSelected(false);

		if (debounceRef.current) clearTimeout(debounceRef.current);
		debounceRef.current = setTimeout(() => search(value), 400);
	};

	const handleSelect = (feature: Feature) => {
		const [lng, lat] = feature.geometry.coordinates;
		setQuery(feature.place_name);
		setSuggestions([]);
		setSelected(true);
		onSelect(feature.place_name, lat, lng);
	};

	return (
		<div className="relative">
			<input
				type="text"
				value={query}
				onChange={(e) => handleChange(e.target.value)}
				placeholder={placeholder}
				className="w-full border border-stone-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-stone-400"
			/>

			{loading && (
				<div className="absolute right-3 top-1/2 -translate-y-1/2">
					<div className="w-4 h-4 border-2 border-stone-300 border-t-stone-700 rounded-full animate-spin" />
				</div>
			)}

			{suggestions.length > 0 && !selected && (
				<ul className="absolute z-50 w-full bg-white border border-stone-200 rounded-lg shadow-lg mt-1 overflow-hidden">
					{suggestions.map((feature) => (
						<li key={feature.id}>
							<button
								type="button"
								onClick={() => handleSelect(feature)}
								className="w-full text-left px-4 py-3 text-sm text-stone-700 hover:bg-stone-50 border-b border-stone-100 last:border-0"
							>
								{feature.place_name}
							</button>
						</li>
					))}
				</ul>
			)}

			{!selected && query.length >= 3 && suggestions.length === 0 && !loading && (
				<p className="text-xs text-red-500 mt-1">Aucune adresse trouvée. Merci de sélectionner une suggestion.</p>
			)}
		</div>
	);
}