"use client";

import { useMemo } from 'react';
import { Package, PackageOpen, AlertCircle } from 'lucide-react';

import { Product, Category } from '../../context/GlobalContext';

interface InventoryViewProps {
    products: Product[];
    categories: Category[];
}

export default function InventoryView({ products, categories }: InventoryViewProps) {
    const lowStockItems = useMemo(() => products.filter(p => (p.stock ?? 0) <= 5), [products]);
    const totalItems = products.reduce((acc, p) => acc + (p.stock || 0), 0);

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-[#111] border border-[#1a1a1a] p-6 rounded-xl flex items-center justify-between shadow-lg">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-50 dark:bg-blue-500/10 rounded-lg text-blue-600 dark:text-blue-500"><Package size={20} /></div>
                        <div>
                            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Total em Estoque</p>
                            <h4 className="text-xl font-semibold text-gray-900 dark:text-gray-100 tabular-nums">{totalItems} <span className="text-xs font-medium text-gray-400 dark:text-gray-500">unidades</span></h4>
                        </div>
                    </div>
                </div>
                <div className="bg-[#111] border border-red-900/20 p-6 rounded-xl flex items-center justify-between shadow-lg">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-red-50 dark:bg-red-500/10 rounded-lg text-red-600 dark:text-red-500"><AlertCircle size={20} /></div>
                        <div>
                            <p className="text-xs font-medium text-red-600 dark:text-red-500">Atenção Crítica</p>
                            <h4 className="text-xl font-semibold text-gray-900 dark:text-gray-100 tabular-nums">{lowStockItems.length} <span className="text-xs font-medium text-red-400 dark:text-red-900/50">itens baixos</span></h4>
                        </div>
                    </div>
                </div>
            </div>

            <div className="space-y-3">
                <div>
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Inventário Geral</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Relatório em tempo real</p>
                </div>

                <div className="border border-gray-100 dark:border-[#1a1a1a] rounded-lg overflow-hidden bg-white dark:bg-[#0a0a0a] shadow-sm dark:shadow-none">
                    <table className="w-full text-left text-xs">
                        <thead className="bg-gray-50 dark:bg-[#111] border-b border-gray-100 dark:border-[#1a1a1a] text-gray-500 dark:text-gray-400 font-medium">
                            <tr>
                                <th className="px-4 py-2.5 font-medium">Item</th>
                                <th className="px-4 py-2.5 font-medium">Categoria</th>
                                <th className="px-4 py-2.5 font-medium text-center">Status</th>
                                <th className="px-4 py-2.5 font-medium text-right">Saldo</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 dark:divide-[#1a1a1a]">
                            {products.map(p => (
                                <tr key={p._id} className="border-b border-[#1a1a1a] hover:bg-white/[0.02] transition-colors group">
                                    <td className="py-4 px-4">
                                        <div className="flex items-center gap-3">
                                            {p.image ? <img src={p.image} alt="" className="w-8 h-8 rounded-lg object-cover border border-[#333]" /> : <div className="w-8 h-8 rounded-lg bg-[#1a1a1a] flex items-center justify-center text-[#333]"><Package size={14} /></div>}
                                            <span className="text-sm font-medium text-gray-200">{p.name}</span>
                                        </div>
                                    </td>
                                    <td className="py-4 px-4 text-sm text-gray-400 font-medium">
                                        {categories.find(c => c._id === p.category)?.name || 'Sem Categoria'}
                                    </td>
                                    <td className="py-4 px-4">
                                        <div className={`text-sm font-bold tabular-nums ${(p.stock ?? 0) <= 5 ? 'text-orange-500' : 'text-emerald-500'}`}>
                                            {p.stock ?? 0}
                                        </div>
                                    </td>
                                    <td className="py-4 px-4 text-right">
                                        <div className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-white/[0.03] border border-white/5 text-gray-500">
                                            {(p.stock ?? 0) <= 5 ? 'Crítico' : 'Normal'}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
