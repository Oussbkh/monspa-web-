import AdminGuard from "@/components/AdminGuard";
import InactivityLogout from "@/components/InactivityLogout";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
	return (
		<AdminGuard>
			<InactivityLogout />
			{children}
		</AdminGuard>
	);
}