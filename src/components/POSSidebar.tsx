'use client';

import { Sun, Moon, ShoppingCart, LayoutGrid, History, Wallet, ClipboardList, ShieldCheck, LogOut } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface MenuItem {
    id: string;
    label: string;
    icon: React.ReactNode;
}

interface POSSidebarProps {
    view: string;
    setView: (v: any) => void;
    employee: any;
    cashSession: any;
    onAdminAccess: () => void;
    onLogout: () => void;
}

export default function POSSidebar({
    view, setView, employee, cashSession, onAdminAccess, onLogout
}: POSSidebarProps) {
    const { theme, toggleTheme } = useTheme();
    const isCashRequired = !cashSession;
    const isDark = theme === 'dark';

    const bg = isDark ? 'bg-[#0c0c0c] border-white/[0.05]' : 'bg-white border-gray-200';
    const logo = isDark ? 'bg-orange-600 shadow-orange-900/30' : 'bg-orange-500 shadow-orange-200';
    const activeBtn = isDark ? 'bg-orange-600 text-white shadow-md shadow-orange-900/30' : 'bg-orange-500 text-white shadow-md shadow-orange-200';
    const inactiveBtn = isDark ? 'text-[#444] hover:text-[#aaa] hover:bg-white/5' : 'text-gray-400 hover:text-gray-700 hover:bg-gray-100';
    const divider = isDark ? 'bg-white/[0.05]' : 'bg-gray-200';
    const logoutBtn = isDark ? 'text-[#333] hover:text-red-500 hover:bg-white/5' : 'text-gray-400 hover:text-red-500 hover:bg-red-50';
    const themeBtn = isDark ? 'text-[#333] hover:text-yellow-400 hover:bg-white/5' : 'text-gray-400 hover:text-gray-700 hover:bg-gray-100';

    const menu: MenuItem[] = [
        { id: 'pos',     label: 'Vendas',    icon: <ShoppingCart size={18} /> },
        { id: 'tables',  label: 'Mesas',     icon: <LayoutGrid size={18} /> },
        { id: 'sales',   label: 'Histórico', icon: <History size={18} /> },
        { id: 'cashier', label: 'Caixa',     icon: <Wallet size={18} /> },
    ];

    return (
        <aside className={`w-16 border-r flex flex-col items-center py-4 z-30 shrink-0 h-screen sticky top-0 ${bg}`}>
            {/* Logo */}
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white font-black text-sm mb-6 shadow-lg ${logo}`}>
                C
            </div>

            {/* Nav Items */}
            <nav className="flex flex-col gap-1.5 w-full px-2 flex-1">
                {menu.map(item => (
                    <button
                        key={item.id}
                        disabled={isCashRequired && item.id !== 'cashier'}
                        onClick={() => setView(item.id)}
                        title={item.label}
                        className={`w-full flex items-center justify-center p-2.5 rounded-lg transition-all duration-150 ${
                            view === item.id ? activeBtn : inactiveBtn
                        } ${isCashRequired && item.id !== 'cashier' ? 'opacity-20 cursor-not-allowed' : ''}`}
                    >
                        {item.icon}
                    </button>
                ))}

                <div className={`h-px my-1.5 mx-1 ${divider}`} />

                <button
                    onClick={() => setView('fiado')}
                    title="Fiado"
                    className={`w-full flex items-center justify-center p-2.5 rounded-lg transition-all duration-150 ${
                        view === 'fiado'
                            ? (isDark ? 'bg-white/10 text-white' : 'bg-gray-100 text-gray-800')
                            : inactiveBtn
                    }`}
                >
                    <ClipboardList size={18} />
                </button>

                {employee?.role === 'admin' && (
                    <button
                        onClick={onAdminAccess}
                        title="Administração"
                        className={`w-full flex items-center justify-center p-2.5 rounded-lg transition-all duration-150 ${
                            view === 'admin' ? activeBtn : inactiveBtn
                        }`}
                    >
                        <ShieldCheck size={18} />
                    </button>
                )}
            </nav>

            {/* Bottom buttons */}
            <div className="flex flex-col items-center gap-1">
                {/* Theme Toggle */}
                <button
                    onClick={toggleTheme}
                    title={isDark ? 'Mudar para Claro' : 'Mudar para Escuro'}
                    className={`p-2.5 rounded-lg transition-all ${themeBtn}`}
                >
                    {isDark ? <Sun size={16} /> : <Moon size={16} />}
                </button>

                {/* Logout */}
                <button
                    onClick={onLogout}
                    title="Sair"
                    className={`p-2.5 rounded-lg transition-all ${logoutBtn}`}
                >
                    <LogOut size={16} />
                </button>
            </div>
        </aside>
    );
}
