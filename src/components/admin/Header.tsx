"use client";

import { X } from 'lucide-react';

interface HeaderProps {
    title: string;
    onClose: () => void;
}

const TITLES: Record<string, { label: string; sub: string }> = {
    stats:     { label: 'Dashboard',   sub: 'Visão geral do negócio' },
    catalog:   { label: 'Cardápio',    sub: 'Produtos e categorias' },
    inventory: { label: 'Estoque',     sub: 'Controle de inventário' },
    customers: { label: 'Clientes',    sub: 'Base de clientes cadastrados' },
    employees: { label: 'Equipe',      sub: 'Gestão de colaboradores' },
    fiscal:    { label: 'Fiscal',      sub: 'Configurações de NFC-e' },
    sales:     { label: 'Vendas',      sub: 'Histórico de transações' },
    reports:   { label: 'Relatórios',  sub: 'Análises e exportações' },
};

export default function Header({ title, onClose }: HeaderProps) {
    const info = TITLES[title] || { label: title, sub: 'Conserva POS' };

    return (
        <header className="px-6 py-3 border-b border-gray-100 dark:border-[#1a1a1a] flex items-center justify-between bg-white dark:bg-[#0a0a0a] shrink-0 transition-colors">
            <div className="flex items-center gap-3">
                <div>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">{info.label}</span>
                    <span className="text-xs text-gray-400 dark:text-[#555] ml-2">{info.sub}</span>
                </div>
                <div className="flex items-center gap-1 px-2 py-0.5 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 rounded">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400">Online</span>
                </div>
            </div>

            <button
                onClick={onClose}
                className="p-1.5 rounded-md text-gray-400 dark:text-[#555] hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-[#1a1a1a] transition-all border-none bg-transparent cursor-pointer"
            >
                <X size={16} />
            </button>
        </header>
    );
}
