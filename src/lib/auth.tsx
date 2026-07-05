export async function checkAuth(): Promise<{ admin_id: number; email: string } | null> {
	try {
		const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/me`, {
			credentials: "include",
		});

		if (!res.ok) return null;

		const data = await res.json();
		return data.connected_as;
	} catch {
		return null;
	}
}

export async function logout(): Promise<void> {
	await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/logout`, {
		method: "POST",
		credentials: "include",
	});
}