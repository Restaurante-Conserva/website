"use client";

import { History, Search, Receipt, ChevronRight, Ban, Eye } from 'lucide-react';

interface SalesViewProps {
    sales: any[];
    onSelectSale: (s: any) => void;
}

export default function SalesView({ sales, onSelectSale }: SalesViewProps) {
    const formatMethod = (method: string) => {
        const methodMap: Record<string, string> = {
            'money': 'Dinheiro',
            'cash': 'Dinheiro',
            'card': 'Cartão',
            'credit': 'Crédito',
            'debit': 'Débito',
            'pix': 'PIX',
            'fiado': 'Fiado'
        };
        return methodMap[method.toLowerCase()] || method;
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-sm font-bold text-white uppercase tracking-widest italic">Histórico de Vendas</h3>
                    <p className="text-[9px] text-[#444] font-medium uppercase mt-0.5">Relação completa de transações</p>
                </div>
            </div>

            <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#333] group-focus-within:text-orange-500 transition-colors" size={16} />
                <input 
                    className="w-full bg-[#111] border border-[#1a1a1a] rounded-xl pl-12 pr-4 py-3 text-xs outline-none focus:border-orange-500/50 text-white transition-all placeholder:text-[#222]" 
                    placeholder="BUSCAR POR DATA, CLIENTE OU ID..." 
                />
            </div>

            <div className="border border-[#1a1a1a] rounded-xl overflow-hidden bg-[#111] shadow-2xl">
                <table className="w-full text-left text-[11px]">
                    <thead className="bg-[#0a0a0a] border-b border-[#1a1a1a] text-[#333] uppercase tracking-widest text-[8px] font-black">
                        <tr>
                            <th className="px-6 py-4">Data/Hora</th>
                            <th className="px-6 py-4">Cliente / Operador</th>
                            <th className="px-6 py-4">Pagamento</th>
                            <th className="px-6 py-4">Total</th>
                            <th className="px-6 py-4 text-right">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1a1a1a]">
                        {sales.map(sale => (
                            <tr key={sale.id || sale._id} className="hover:bg-[#161616] group transition-colors">
                                <td className="px-6 py-4">
                                    <div className="flex flex-col">
                                        <span className="font-bold text-white tabular-nums italic">{new Date(sale.date).toLocaleDateString('pt-BR')}</span>
                                        <span className="text-[9px] text-[#333] font-bold tabular-nums group-hover:text-[#555] transition-colors">{new Date(sale.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex flex-col">
                                        <span className="font-bold text-[#888] group-hover:text-white transition-colors truncate uppercase max-w-[150px]">{sale.customer?.name || 'Cliente Avulso'}</span>
                                        <span className="text-[8px] text-[#333] font-black uppercase tracking-widest">{sale.employee || 'Operador'}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex flex-wrap gap-1">
                                        {sale.payments?.map((pm: any, idx: number) => (
                                            <span key={`${sale.id}-pm-${idx}`} className="text-[8px] font-black uppercase px-2 py-0.5 bg-[#0a0a0a] text-[#555] border border-[#1a1a1a] rounded group-hover:border-orange-500/20 group-hover:text-orange-500 transition-all">
                                                {formatMethod(pm.method)}
                                            </span>
                                        ))}
                                    </div>
                                </td>
                                <td className="px-6 py-4 font-black text-white italic text-sm tabular-nums">R$ {sale.total.toFixed(2)}</td>
                                <td className="px-6 py-4 text-right">
                                    <button 
                                        onClick={() => onSelectSale(sale)}
                                        className="p-2.5 bg-[#1a1a1a] text-[#333] hover:text-white rounded-lg border border-[#222] hover:border-[#333] transition-all opacity-0 group-hover:opacity-100 translate-x-3 group-hover:translate-x-0"
                                    >
                                        <Eye size={16} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
