"use client";

import { useMemo } from 'react';
import { Package, PackageOpen, AlertCircle } from 'lucide-react';

interface InventoryViewProps {
    products: any[];
    categories: any[];
}

export default function InventoryView({ products, categories }: InventoryViewProps) {
    const lowStockItems = useMemo(() => products.filter(p => p.stock !== null && p.stock <= 5), [products]);
    const totalItems = products.reduce((acc, p) => acc + (p.stock || 0), 0);

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-[#111] border border-[#1a1a1a] p-6 rounded-xl flex items-center justify-between shadow-lg">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-500/10 rounded-lg text-blue-500"><Package size={24} /></div>
                        <div>
                            <p className="text-[10px] font-bold text-[#444] uppercase tracking-widest">Total em Estoque</p>
                            <h4 className="text-2xl font-black text-white italic tabular-nums">{totalItems} <span className="text-xs font-bold text-[#333] uppercase not-italic">unidades</span></h4>
                        </div>
                    </div>
                </div>
                <div className="bg-[#111] border border-red-900/20 p-6 rounded-xl flex items-center justify-between shadow-lg">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-red-500/10 rounded-lg text-red-500"><AlertCircle size={24} /></div>
                        <div>
                            <p className="text-[10px] font-bold text-red-400 uppercase tracking-widest">Atenção Crítica</p>
                            <h4 className="text-2xl font-black text-white italic tabular-nums">{lowStockItems.length} <span className="text-xs font-bold text-red-900/50 uppercase not-italic">itens baixos</span></h4>
                        </div>
                    </div>
                </div>
            </div>

            <div className="space-y-4">
                <div>
                    <h3 className="text-sm font-bold text-white uppercase tracking-widest italic">Inventário Geral</h3>
                    <p className="text-[9px] text-[#444] font-medium uppercase mt-0.5">Relatório em tempo real</p>
                </div>

                <div className="border border-[#1a1a1a] rounded-xl overflow-hidden bg-[#111] shadow-2xl">
                    <table className="w-full text-left text-[11px]">
                        <thead className="bg-[#0a0a0a] border-b border-[#1a1a1a] text-[#333] uppercase tracking-widest text-[8px] font-black">
                            <tr>
                                <th className="px-6 py-4">Ítem</th>
                                <th className="px-6 py-4">Categoria</th>
                                <th className="px-6 py-4 text-center">Status</th>
                                <th className="px-6 py-4 text-right">Saldo</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#1a1a1a]">
                            {products.map(p => (
                                <tr key={p.id || p._id} className="hover:bg-[#161616] group transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-[#0a0a0a] border border-[#222] flex items-center justify-center group-hover:border-orange-500/20 transition-all">
                                                <PackageOpen size={16} className="text-[#222] group-hover:text-orange-500/50 transition-colors" />
                                            </div>
                                            <span className="font-bold text-[#888] group-hover:text-white transition-colors">{p.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-[9px] font-bold text-[#444] uppercase tracking-widest">{categories.find(c => (c.id || c._id) === p.categoryId)?.name || 'AVULSO'}</span>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        {p.stock === null ? (
                                            <span className="text-[8px] font-black uppercase text-[#2a2a2a]">Ilimitado</span>
                                        ) : p.stock <= 5 ? (
                                            <span className="text-[8px] font-black uppercase px-2 py-0.5 bg-red-900/10 text-red-500 border border-red-900/20 rounded-full">Crítico</span>
                                        ) : (
                                            <span className="text-[8px] font-black uppercase px-2 py-0.5 bg-green-900/10 text-green-500 border border-green-900/20 rounded-full">Normal</span>
                                        )}
                                    </td>
                                    <td className={`px-6 py-4 text-right font-black italic text-sm tabular-nums ${p.stock <= 5 && p.stock !== null ? 'text-red-500' : 'text-white'}`}>
                                        {p.stock !== null ? p.stock : '∞'}
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
