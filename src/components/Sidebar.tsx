'use client';

import {
    LogOut,
    ShoppingBag,
    List,
    LayoutDashboard,
    Settings,
    Sun,
    Moon
} from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { useTheme } from '@/context/ThemeContext';

export function Sidebar() {
    const pathname = usePathname();
    const router = useRouter();
    const { theme, toggleTheme } = useTheme();

    const handleLogout = async () => {
        await fetch('/api/auth/login', { method: 'DELETE' });
        router.push('/admin');
    };

    const navItems = [
        { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
        { name: 'Configurações', href: '/admin/settings', icon: Settings },
    ];

    return (
        <aside className="w-64 bg-card border-r border-border flex flex-col z-10 h-screen sticky top-0">
            <div className="p-6 border-b border-border">
                <h2 className="text-xl font-bold text-card-foreground flex items-center gap-2">
                    <LayoutDashboard className="w-5 h-5 text-secondary" />
                    Conserva
                </h2>
                <p className="text-xs text-muted-foreground mt-1">Admin v2.0</p>
            </div>

            <nav className="flex-1 p-4 space-y-1">
                {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all",
                                isActive
                                    ? "bg-secondary/10 text-secondary"
                                    : "text-muted-foreground hover:bg-muted hover:text-card-foreground"
                            )}
                        >
                            <item.icon className="w-5 h-5" />
                            {item.name}
                        </Link>
                    );
                })}
            </nav>

            <div className="p-4 border-t border-border space-y-2">
                {/* Theme Toggle */}
                <button
                    onClick={toggleTheme}
                    className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-muted-foreground rounded-xl hover:bg-muted hover:text-card-foreground transition-all"
                >
                    <div className="flex items-center gap-3">
                        {theme === 'light' ? (
                            <Moon className="w-5 h-5" />
                        ) : (
                            <Sun className="w-5 h-5" />
                        )}
                        <span>{theme === 'light' ? 'Modo Escuro' : 'Modo Claro'}</span>
                    </div>
                    <div className={cn(
                        "w-10 h-5 rounded-full relative transition-colors",
                        theme === 'dark' ? "bg-secondary" : "bg-muted"
                    )}>
                        <div className={cn(
                            "absolute top-0.5 w-4 h-4 rounded-full transition-all",
                            theme === 'dark' 
                                ? "right-0.5 bg-secondary-foreground" 
                                : "left-0.5 bg-muted-foreground"
                        )} />
                    </div>
                </button>

                {/* Logout */}
                <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-destructive rounded-xl hover:bg-destructive/10 transition-colors"
                >
                    <LogOut className="w-5 h-5" />
                    Sair
                </button>
            </div>
        </aside>
    );
}
