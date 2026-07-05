"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { logout } from "@/lib/auth";

const INACTIVITY_LIMIT_MS = 15 * 60 * 1000; // 15 minutes

export default function InactivityLogout() {
	const router = useRouter();
	const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	useEffect(() => {
		const resetTimer = () => {
			if (timerRef.current) clearTimeout(timerRef.current);
			timerRef.current = setTimeout(async () => {
				await logout();
				router.push("/admin/login");
			}, INACTIVITY_LIMIT_MS);
		};

		const events = ["mousedown", "keydown", "scroll", "touchstart"];
		events.forEach((event) => window.addEventListener(event, resetTimer));

		resetTimer();

		return () => {
			events.forEach((event) => window.removeEventListener(event, resetTimer));
			if (timerRef.current) clearTimeout(timerRef.current);
		};
	}, [router]);

	return null;
}