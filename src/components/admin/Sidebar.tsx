"use client";

import {
    LayoutDashboard, Package, History, Users,
    Shield, FileText, LayoutGrid
} from 'lucide-react';

interface SidebarProps {
    currentView: string;
    setView: (view: any) => void;
}

const menuItems = [
    { id: 'stats',     label: 'Dashboard', icon: LayoutDashboard, sub: 'Visão geral' },
    { id: 'catalog',   label: 'Cardápio',  icon: LayoutGrid,      sub: 'Produtos' },
    { id: 'inventory', label: 'Estoque',   icon: Package,         sub: 'Inventário' },
    { id: 'customers', label: 'Clientes',  icon: Users,           sub: 'Cadastros' },
    { id: 'employees', label: 'Equipe',    icon: Shield,          sub: 'Colaboradores' },
    { id: 'fiscal',    label: 'Fiscal',    icon: FileText,        sub: 'NFC-e' },
    { id: 'sales',     label: 'Vendas',    icon: History,         sub: 'Histórico' },
];

export default function Sidebar({ currentView, setView }: SidebarProps) {
    return (
        <aside className="w-56 border-r border-gray-100 dark:border-[#1a1a1a] flex flex-col bg-white dark:bg-[#0a0a0a] h-full shrink-0 transition-colors">
            {/* Brand */}
            <div className="px-6 py-7 border-b border-gray-100 dark:border-[#1a1a1a]">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-orange-600 rounded-xl flex items-center justify-center font-black text-lg text-white shadow-lg shadow-orange-600/30">
                        C
                    </div>
                    <div>
                        <h2 className="text-sm font-black text-gray-900 dark:text-white tracking-widest uppercase">Conserva</h2>
                        <p className="text-[9px] text-orange-600 dark:text-orange-500/70 font-bold uppercase tracking-[0.2em]">Management</p>
                    </div>
                </div>
            </div>

            {/* Nav */}
            <nav className="flex-1 px-3 py-4 space-y-0.5">
                {menuItems.map((item) => {
                    const Icon = item.icon;
                    const active = currentView === item.id;
                    return (
                        <button
                            key={item.id}
                            onClick={() => setView(item.id)}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all duration-150 border-none cursor-pointer ${
                                active
                                    ? 'bg-orange-50 dark:bg-orange-600/10 text-orange-600 dark:text-orange-500 border border-orange-100 dark:border-orange-500/20 shadow-sm'
                                    : 'text-gray-500 dark:text-[#444] hover:text-gray-900 dark:hover:text-[#aaa] hover:bg-gray-50 dark:hover:bg-[#0d0d0d] bg-transparent border border-transparent'
                            }`}
                        >
                            <Icon size={18} className={active ? 'text-orange-600 dark:text-orange-500' : ''} />
                            <div className="flex flex-col items-start">
                                <span className={`text-xs font-bold tracking-wide uppercase ${active ? 'text-orange-700 dark:text-orange-400' : ''}`}>{item.label}</span>
                                <span className={`text-[9px] font-medium tracking-widest uppercase ${active ? 'text-orange-500/70' : 'text-gray-400 dark:text-[#333]'}`}>{item.sub}</span>
                            </div>
                        </button>
                    );
                })}
            </nav>

            {/* Footer */}
            <div className="p-5 border-t border-gray-100 dark:border-[#1a1a1a]">
                <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-[#111] border border-gray-100 dark:border-[#1a1a1a]">
                    <div className="w-8 h-8 rounded-lg bg-orange-600 flex items-center justify-center text-white font-black text-sm shadow-md shadow-orange-600/20">
                        A
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-gray-900 dark:text-white uppercase tracking-widest">Admin</p>
                        <p className="text-[8px] text-gray-400 dark:text-[#333] font-bold uppercase tracking-widest">v2.5.0</p>
                    </div>
                </div>
            </div>
        </aside>
    );
}
