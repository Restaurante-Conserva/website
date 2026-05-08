"use client";

import React, { useState } from 'react';
import { X, Receipt, Printer, Ban, User, History, Shield, Loader2 } from 'lucide-react';
import { useToast } from '@/context/ToastContext';

interface SaleDetailsProps {
    sale: any;
    onClose: () => void;
}

export default function SaleDetails({ sale, onClose }: SaleDetailsProps) {
    const { showToast } = useToast();
    const [isCanceling, setIsCanceling] = useState(false);
    const [localNfeStatus, setLocalNfeStatus] = useState(sale.nfeStatus);

    if (!sale) return null;

    const handleCancelNfe = async () => {
        if (!confirm('Deseja realmente solicitar o cancelamento desta NFC-e na SEFAZ? Isso não pode ser desfeito.')) return;
        
        setIsCanceling(true);
        try {
            const res = await fetch(`/api/fiscal/nfe?ref=${sale.nfeId || sale._id}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ justificativa: 'Cancelamento solicitado pelo estabelecimento.' })
            });
            const data = await res.json();
            
            if (res.ok && data.success) {
                showToast('NFC-e cancelada com sucesso!', 'success');
                setLocalNfeStatus('cancelled');
            } else {
                showToast(data.error || 'Erro ao cancelar NFC-e', 'error');
            }
        } catch (e) {
            showToast('Erro de conexão ao cancelar NFC-e', 'error');
        } finally {
            setIsCanceling(false);
        }
    };

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
        <div className="fixed inset-0 z-[200] flex justify-end bg-black/40 backdrop-blur-[2px] animate-in fade-in duration-300">
            <div 
                className="w-full max-w-md bg-[#0a0a0a] h-full shadow-2xl border-l border-[#1a1a1a] flex flex-col animate-in slide-in-from-right duration-500 ease-out"
            >
                <header className="px-6 py-6 border-b border-[#111] flex items-center justify-between bg-[#0a0a0a]">
                    <div className="flex flex-col">
                        <div className="flex items-center gap-2 mb-1">
                            <Receipt size={16} className="text-orange-600" />
                            <h3 className="text-xs font-black text-white uppercase tracking-widest italic">Detalhes da Venda</h3>
                        </div>
                        <p className="text-[10px] text-[#333] font-bold uppercase tracking-tighter">ID: {sale.id || sale._id}</p>
                    </div>
                    <button onClick={onClose} className="p-2 text-[#222] hover:text-white rounded-lg transition-colors"><X size={20} /></button>
                </header>

                <div className="flex-1 overflow-y-auto px-6 py-8 space-y-8 scrollbar-hide">
                    {/* Status e Info Geral */}
                    <div className="flex items-center justify-between p-4 bg-[#111] border border-[#1a1a1a] rounded-xl shadow-inner">
                        <div className="flex flex-col">
                            <span className="text-[8px] font-black text-[#333] uppercase tracking-widest mb-1">Data e Hora</span>
                            <span className="text-[11px] font-bold text-[#888] tabular-nums">{new Date(sale.date).toLocaleString('pt-BR')}</span>
                        </div>
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-[#0a0a0a] rounded-lg border border-[#1a1a1a]">
                            <div className="h-1.5 w-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.3)] animate-pulse" />
                            <span className="text-[9px] font-black text-green-500 uppercase tracking-widest">FATURADA</span>
                        </div>
                    </div>

                    {/* Cliente e Operador */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 border-b border-[#111] pb-2">
                            <User size={14} className="text-orange-600" />
                            <h4 className="text-[10px] font-black text-white uppercase tracking-widest">Envolvidos</h4>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-3 bg-[#111]/50 border border-[#1a1a1a] rounded-lg">
                                <span className="text-[7px] font-black text-[#222] uppercase tracking-[0.2em] block mb-1">Cliente</span>
                                <span className="text-[11px] font-bold text-[#888] truncate italic block uppercase">{sale.customer?.name || 'Venda Avulsa'}</span>
                            </div>
                            <div className="p-3 bg-[#111]/50 border border-[#1a1a1a] rounded-lg">
                                <span className="text-[7px] font-black text-[#222] uppercase tracking-[0.2em] block mb-1">Operador</span>
                                <span className="text-[11px] font-bold text-[#888] truncate italic block uppercase">{sale.employee || 'Sistema'}</span>
                            </div>
                        </div>
                    </div>

                    {/* Lista de Produtos */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between border-b border-[#111] pb-2">
                            <div className="flex items-center gap-2">
                                <History size={14} className="text-orange-600" />
                                <h4 className="text-[10px] font-black text-white uppercase tracking-widest italic">Itens da Cesta</h4>
                            </div>
                            <span className="text-[9px] font-black text-[#333] uppercase tabular-nums">{sale.items?.length || 0} ITEMS</span>
                        </div>
                        <div className="space-y-2">
                            {sale.items?.map((item: any, idx: number) => (
                                <div key={`detail-item-${idx}`} className="flex items-center justify-between p-3 bg-[#111] border border-[#1a1a1a] rounded-lg group hover:border-orange-500/20 transition-all">
                                    <div className="flex-1 min-w-0 pr-4">
                                        <h5 className="text-[11px] font-bold text-[#888] group-hover:text-white transition-colors truncate uppercase italic">{item.name}</h5>
                                        <p className="text-[9px] text-[#333] font-bold tabular-nums">R$ {(item.price || 0).toFixed(2)} x {item.quantity || 1}</p>
                                    </div>
                                    <span className="text-xs font-black text-white tabular-nums italic">R$ {((item.total) || ((item.price || 0) * (item.quantity || 1))).toFixed(2)}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Financeiro */}
                    <div className="space-y-4 pb-10">
                        <div className="flex items-center gap-2 border-b border-[#111] pb-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-orange-600" />
                            <h4 className="text-[10px] font-black text-white uppercase tracking-widest italic">Financeiro</h4>
                        </div>
                        <div className="bg-[#111] border border-[#1a1a1a] p-5 rounded-2xl space-y-4 shadow-xl">
                            <div className="space-y-2">
                                {sale.payments?.map((pm: any, idx: number) => (
                                    <div key={`detail-pm-${idx}`} className="flex justify-between items-center text-[11px] font-bold border-b border-[#1a1a1a]/50 pb-2 last:border-0">
                                        <span className="text-[#444] uppercase tracking-widest italic">{formatMethod(pm.method)}</span>
                                        <span className="text-white tabular-nums">R$ {(pm.amount || 0).toFixed(2)}</span>
                                    </div>
                                ))}
                            </div>
                            
                            <div className="pt-4 border-t border-[#1a1a1a] flex flex-col gap-1">
                                <div className="flex justify-between items-center opacity-50">
                                    <span className="text-[9px] font-black text-[#555] uppercase tracking-[0.2em]">Subtotal</span>
                                    <span className="text-xs font-black text-[#555] tabular-nums">R$ {(sale.subtotal || sale.total || 0).toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm font-black text-white uppercase tracking-[0.2em]">Total</span>
                                    <span className="text-2xl font-black text-white italic tabular-nums shadow-orange-500/10">R$ {(sale.total || 0).toFixed(2)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <footer className="p-6 border-t border-[#111] bg-[#0a0a0a] flex gap-3">
                    <button className="flex-1 bg-orange-600 text-white py-3.5 rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-orange-500 transition-all flex items-center justify-center gap-2 shadow-lg shadow-orange-900/10 disabled:opacity-50">
                        <Printer size={14} /> Re-imprimir Cupom
                    </button>
                    <button 
                        onClick={async () => {
                            if (!confirm('CANCELAR esta venda permanentemente?')) return;
                            await fetch(`/api/sales?id=${sale.id || sale._id}`, { method: 'DELETE' });
                            onClose();
                        }}
                        className="p-3.5 bg-[#111] text-[#222] hover:text-red-500 hover:bg-red-900/10 rounded-xl border border-[#1a1a1a] transition-all"
                    >
                        <Ban size={18} />
                    </button>
                </footer>
            </div>
        </div>
    );
}
