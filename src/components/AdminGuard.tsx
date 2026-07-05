"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { checkAuth } from "@/lib/auth";

export default function AdminGuard({ children }: { children: React.ReactNode }) {
	const router = useRouter();
	const [checked, setChecked] = useState(false);

	useEffect(() => {
		checkAuth().then((admin) => {
			if (!admin) {
				router.replace("/admin/login");
			} else {
				setChecked(true);
			}
		});
	}, [router]);

	if (!checked) {
		return null;
	}

	return <>{children}</>;
}