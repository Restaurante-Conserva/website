"use client";

import { X } from 'lucide-react';

interface HeaderProps {
    title: string;
    onClose: () => void;
}

const TITLES: Record<string, { label: string; sub: string }> = {
    stats: { label: 'Dashboard', sub: 'Visão geral do negócio' },
    catalog: { label: 'Cardápio', sub: 'Produtos e categorias' },
    inventory: { label: 'Estoque', sub: 'Controle de inventário' },
    customers: { label: 'Clientes', sub: 'Base de clientes cadastrados' },
    employees: { label: 'Equipe', sub: 'Gestão de colaboradores' },
    fiscal: { label: 'Fiscal', sub: 'Configurações de NFC-e' },
    sales: { label: 'Vendas', sub: 'Histórico de transações' },
};

export default function Header({ title, onClose }: HeaderProps) {
    const info = TITLES[title] || { label: title, sub: 'Conserva POS' };

    return (
        <header className="px-8 py-6 border-b border-gray-100 dark:border-[#1a1a1a] flex items-center justify-between bg-white dark:bg-[#0a0a0a] shrink-0 transition-colors">
            <div className="flex flex-col">
                <div className="flex items-center gap-3">
                    <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight uppercase">{info.label}</h2>
                    <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 rounded-lg">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-widest">Online</p>
                    </div>
                </div>
                <p className="text-xs font-bold text-gray-500 dark:text-[#444] uppercase tracking-widest mt-1">{info.sub}</p>
            </div>

            <button
                onClick={onClose}
                className="p-3 rounded-xl text-gray-500 dark:text-[#333] hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-[#1a1a1a] transition-all border-none bg-transparent cursor-pointer"
            >
                <X size={22} />
            </button>
        </header>
    );
}
