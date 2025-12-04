import Link from 'next/link';
import { LayoutDashboard, MessageSquare, UploadCloud, Settings, Sun } from 'lucide-react';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex min-h-screen bg-zinc-950 text-zinc-100 font-sans">
            {/* Sidebar */}
            <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-zinc-800 bg-zinc-950">
                <div className="flex h-16 items-center border-b border-zinc-800 px-6">
                    <Link href="/" className="flex items-center gap-2 font-bold text-white">
                        <Sun className="h-6 w-6 text-yellow-500" />
                        <span>SolarFlash</span>
                    </Link>
                </div>

                <nav className="flex flex-col gap-1 p-4">
                    <Link
                        href="/dashboard"
                        className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-zinc-400 hover:bg-zinc-900 hover:text-white transition-colors"
                    >
                        <LayoutDashboard className="h-5 w-5" />
                        Dashboard
                    </Link>

                    <Link
                        href="/dashboard/import"
                        className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-zinc-400 hover:bg-zinc-900 hover:text-white transition-colors"
                    >
                        <UploadCloud className="h-5 w-5" />
                        Import Leads
                    </Link>

                    <Link
                        href="/dashboard/settings"
                        className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-zinc-400 hover:bg-zinc-900 hover:text-white transition-colors"
                    >
                        <Settings className="h-5 w-5" />
                        Settings
                    </Link>
                </nav>

                <div className="absolute bottom-4 left-0 w-full px-4">
                    <div className="rounded-xl bg-zinc-900 p-4">
                        <p className="text-xs text-zinc-500">Connecté en tant que</p>
                        <p className="text-sm font-medium text-white truncate">Admin</p>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 pl-64">
                {children}
            </main>
        </div>
    );
}
