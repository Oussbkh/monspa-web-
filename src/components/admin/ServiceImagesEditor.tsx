"use client";

import { useEffect, useRef, useState } from "react";

type ServiceImage = {
	id: number;
	key: string;
	is_cover: boolean;
	url: string;
};

type Props = { serviceId: number };

export default function ServiceImagesEditor({ serviceId }: Props) {
	const [images, setImages] = useState<ServiceImage[]>([]);
	const [loading, setLoading] = useState(true);
	const [uploading, setUploading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const API = process.env.NEXT_PUBLIC_API_URL;

	const loadImages = async () => {
		setLoading(true);
		setError(null);
		try {
			const res = await fetch(
				`${API}/api/admin/services/${serviceId}/images`,
				{ credentials: "include" }
			);
			if (!res.ok) throw new Error("Erreur chargement images");
			const data = await res.json();
			setImages(Array.isArray(data) ? data : []);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Erreur");
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		loadImages();
	}, [serviceId]);

	const handleUpload = async (
		e: React.ChangeEvent<HTMLInputElement>,
		isCover: boolean
	) => {
		const file = e.target.files?.[0];
		if (!file) return;

		setUploading(true);
		setError(null);

		const form = new FormData();
		form.append("file", file);
		form.append("is_cover", String(isCover));

		try {
			const res = await fetch(
				`${API}/api/admin/services/${serviceId}/images`,
				{
					method: "POST",
					credentials: "include",
					// ✅ PAS de Content-Type manuel — le navigateur le met avec le bon boundary
					body: form,
				}
			);

			const data = await res.json();
			if (!res.ok) throw new Error(data.error ?? "Erreur upload");

			await loadImages();
		} catch (err) {
			setError(err instanceof Error ? err.message : "Erreur upload");
		} finally {
			setUploading(false);
			e.target.value = ""; // reset input
		}
	};

	const handleDelete = async (imageId: number) => {
		if (!confirm("Supprimer cette image ?")) return;
		setError(null);

		try {
			const res = await fetch(
				`${API}/api/admin/service-images/${imageId}`,
				{ method: "DELETE", credentials: "include" }
			);
			if (!res.ok) throw new Error("Erreur suppression");
			await loadImages();
		} catch (err) {
			setError(err instanceof Error ? err.message : "Erreur suppression");
		}
	};

	if (loading) return <p className="text-stone-500 text-sm">Chargement...</p>;

	const cover = images.find((img) => img.is_cover);
	const gallery = images.filter((img) => !img.is_cover);

	return (
		<div className="flex flex-col gap-6">
			{error && (
				<div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-600">
					{error}
				</div>
			)}

			{/* Image de couverture */}
			<div>
				<h3 className="text-sm font-medium text-stone-700 mb-2">
					Image principale (couverture)
				</h3>

				{cover ? (
					<div className="relative inline-block">
						{/* ✅ URL directe, pas d'encodeURIComponent */}
						<img
							src={`${API}${cover.url}`}
							alt="Couverture"
							className="w-48 h-32 object-cover rounded-xl border border-stone-200"
						/>
						<button
							type="button"
							onClick={() => handleDelete(cover.id)}
							className="absolute -top-2 -right-2 w-6 h-6 bg-red-600 text-white rounded-full text-xs flex items-center justify-center hover:bg-red-700 transition"
						>
							×
						</button>
					</div>
				) : (
					<label className="cursor-pointer flex flex-col items-center justify-center w-48 h-32 border-2 border-dashed border-stone-300 rounded-xl hover:border-stone-400 transition">
						<span className="text-2xl mb-1">🖼️</span>
						<span className="text-xs text-stone-500">Ajouter une couverture</span>
						<input
							type="file"
							accept=".jpg,.jpeg,.png,.webp"
							className="hidden"
							onChange={(e) => handleUpload(e, true)}
							disabled={uploading}
						/>
					</label>
				)}
			</div>

			{/* Galerie */}
			<div>
				<h3 className="text-sm font-medium text-stone-700 mb-2">
					Galerie ({gallery.length} image{gallery.length !== 1 ? "s" : ""})
				</h3>

				<div className="flex flex-wrap gap-3">
					{gallery.map((img) => (
						<div key={img.id} className="relative">
							<img
								src={`${API}${img.url}`}
								alt="Galerie"
								className="w-28 h-20 object-cover rounded-lg border border-stone-200"
							/>
							<button
								type="button"
								onClick={() => handleDelete(img.id)}
								className="absolute -top-2 -right-2 w-6 h-6 bg-red-600 text-white rounded-full text-xs flex items-center justify-center hover:bg-red-700 transition"
							>
								×
							</button>
						</div>
					))}

					<label className="cursor-pointer flex flex-col items-center justify-center w-28 h-20 border-2 border-dashed border-stone-300 rounded-lg hover:border-stone-400 transition">
						<span className="text-xl">+</span>
						<span className="text-xs text-stone-500 mt-0.5">Ajouter</span>
						<input
							type="file"
							accept=".jpg,.jpeg,.png,.webp"
							className="hidden"
							onChange={(e) => handleUpload(e, false)}
							disabled={uploading}
						/>
					</label>
				</div>
			</div>

			{uploading && (
				<p className="text-sm text-stone-500 flex items-center gap-2">
					<span className="w-3 h-3 border-2 border-stone-300 border-t-stone-700 rounded-full animate-spin inline-block" />
					Upload en cours...
				</p>
			)}
		</div>
	);
}