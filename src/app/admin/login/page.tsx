"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
	const router = useRouter();
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError(null);
		setLoading(true);

		try {
			const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/login`, {
				method: "POST",
				credentials: "include",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ email, password }),
			});

			const data = await res.json();

			if (!res.ok) {
				throw new Error(data.error || "Échec de la connexion");
			}

			router.push("/admin/dashboard");
		} catch (err) {
			setError(err instanceof Error ? err.message : "Une erreur est survenue");
		} finally {
			setLoading(false);
		}
	};

	return (
		<main className="min-h-screen bg-stone-50 flex items-center justify-center px-6">
			<form
				onSubmit={handleSubmit}
				className="bg-white border border-stone-200 rounded-2xl p-8 w-full max-w-sm"
			>
				<h1 className="text-xl font-semibold text-stone-900 mb-6">Connexion admin</h1>

				<div className="flex flex-col gap-4">
					<div>
						<label className="block text-sm font-medium text-stone-700 mb-1.5">Email</label>
						<input
							type="email"
							required
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							className="w-full border border-stone-300 rounded-lg px-3 py-2 text-black focus:outline-none focus:ring-2 focus:ring-stone-400"
						/>
					</div>

					<div>
						<label className="block text-sm font-medium text-stone-700 mb-1.5">Mot de passe</label>
						<input
							type="password"
							required
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							className="w-full border border-stone-300 rounded-lg px-3 py-2 text-black focus:outline-none focus:ring-2 focus:ring-stone-400"
						/>
					</div>

					{error && <p className="text-red-600 text-sm">{error}</p>}

					<button
						type="submit"
						disabled={loading}
						className="bg-stone-900 text-white px-6 py-3 rounded-xl font-medium hover:bg-stone-800 transition disabled:opacity-50 mt-2"
					>
						{loading ? "Connexion..." : "Se connecter"}
					</button>
				</div>
			</form>
		</main>
	);
}