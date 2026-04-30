"use client";

import { useState } from 'react';
import { X, Plus, Minus, ArrowLeft, Check, Calendar, Receipt, Loader2 } from 'lucide-react';
import { useGlobal } from '../context/GlobalContext';
import { useToast } from '../context/ToastContext';

interface DebtModalProps {
    customer: {
        _id: string;
        name: string;
        debtBalance?: number;
        debtHistory?: Array<{
            _id?: string;
            type: 'payment' | 'addition' | 'adjustment';
            amount: number;
            description: string;
            date: string;
        }>;
    };
    onClose: () => void;
}

export default function DebtModal({ customer, onClose }: DebtModalProps) {
    const { refreshCustomers } = useGlobal();
    const { showToast } = useToast();

    const [view, setView] = useState<'list' | 'add'>('list');
    const [amount, setAmount] = useState('');
    const [description, setDescription] = useState('');
    const [type, setType] = useState<'payment' | 'addition' | 'adjustment'>('payment');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        if (!amount || parseFloat(amount) <= 0) return;
        setLoading(true);
        try {
            const res = await fetch(`/api/customers/${customer._id}/debt`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    amount: parseFloat(amount),
                    type,
                    description: description || (type === 'payment' ? 'Pagamento manual' : type === 'addition' ? 'Consumo manual' : 'Ajuste de saldo')
                })
            });

            if (res.ok) {
                showToast('Lançamento realizado com sucesso!', 'success');
                await refreshCustomers();
                onClose();
            } else {
                const data = await res.json();
                showToast(data.error || 'Erro ao processar', 'error');
            }
        } catch {
            showToast('Erro técnico ao salvar', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-full max-w-md bg-white dark:bg-[#0a0a0a] border border-gray-100 dark:border-[#1a1a1a] rounded-xl shadow-xl overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="px-5 py-4 flex items-center justify-between border-b border-gray-100 dark:border-[#1a1a1a] shrink-0">
                    <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">Extrato de Débitos</p>
                        <p className="text-xs text-gray-400 dark:text-[#555] mt-0.5">{customer.name}</p>
                    </div>
                    <button onClick={onClose} className="p-1.5 rounded-md text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-[#1a1a1a] border-none bg-transparent cursor-pointer transition-all">
                        <X size={16} />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4" style={{ scrollbarWidth: 'thin', scrollbarColor: '#333 transparent' }}>
                    {view === 'list' ? (
                        <div className="space-y-4">
                            {/* Balance card */}
                            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-black border border-gray-100 dark:border-[#1a1a1a] rounded-lg">
                                <div>
                                    <p className="text-xs text-gray-400 dark:text-[#555] mb-0.5">Saldo devedor</p>
                                    <p className={`text-xl font-medium tabular-nums ${(customer.debtBalance || 0) > 0 ? 'text-red-600 dark:text-red-500' : 'text-gray-900 dark:text-white'}`}>
                                        R$ {(customer.debtBalance || 0).toFixed(2)}
                                    </p>
                                </div>
                                <button
                                    onClick={() => setView('add')}
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-600 hover:bg-orange-500 text-white text-xs rounded-md border-none cursor-pointer transition-all"
                                >
                                    <Plus size={13} /> Lançamento
                                </button>
                            </div>

                            {/* History */}
                            <div className="space-y-1">
                                <p className="text-xs text-gray-400 dark:text-[#555] mb-2">Movimentações</p>
                                {(!customer.debtHistory || customer.debtHistory.length === 0) ? (
                                    <div className="py-8 flex flex-col items-center justify-center text-gray-300 dark:text-[#333]">
                                        <Receipt size={28} className="mb-2 opacity-50" />
                                        <p className="text-xs text-gray-400 dark:text-[#555]">Nenhum histórico disponível</p>
                                    </div>
                                ) : (
                                    <div className="space-y-1">
                                        {[...customer.debtHistory].reverse().map((entry, i) => (
                                            <div key={entry._id || i} className="px-3 py-2.5 rounded-lg border border-gray-100 dark:border-[#1a1a1a] bg-white dark:bg-[#0a0a0a] flex items-center justify-between hover:bg-gray-50 dark:hover:bg-black transition-colors">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 ${
                                                        entry.type === 'payment'
                                                            ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-500'
                                                            : 'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-500'
                                                    }`}>
                                                        {entry.type === 'payment' ? <Minus size={12} /> : <Plus size={12} />}
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-gray-700 dark:text-gray-300">{entry.description}</p>
                                                        <p className="text-[10px] text-gray-400 dark:text-[#555] flex items-center gap-1 mt-0.5">
                                                            <Calendar size={10} />
                                                            {new Date(entry.date).toLocaleDateString('pt-BR')} · {new Date(entry.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                                        </p>
                                                    </div>
                                                </div>
                                                <p className={`text-sm font-medium tabular-nums ${entry.type === 'payment' ? 'text-emerald-600 dark:text-emerald-500' : 'text-red-600 dark:text-red-500'}`}>
                                                    {entry.type === 'payment' ? '-' : '+'} R$ {entry.amount.toFixed(2)}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4 animate-in slide-in-from-right-4 duration-200">
                            <button onClick={() => setView('list')} className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 border-none bg-transparent cursor-pointer transition-colors">
                                <ArrowLeft size={14} /> Voltar
                            </button>

                            {/* Type selector */}
                            <div>
                                <p className="text-xs text-gray-400 dark:text-[#555] mb-2">Tipo</p>
                                <div className="flex gap-1.5 p-1 bg-gray-50 dark:bg-black border border-gray-100 dark:border-[#1a1a1a] rounded-lg">
                                    {(['payment', 'addition', 'adjustment'] as const).map(t => (
                                        <button
                                            key={t}
                                            onClick={() => setType(t)}
                                            className={`flex-1 py-2 text-xs rounded-md transition-all border-none cursor-pointer ${
                                                type === t
                                                    ? t === 'payment' ? 'bg-emerald-600 text-white' : t === 'addition' ? 'bg-red-600 text-white' : 'bg-blue-600 text-white'
                                                    : 'text-gray-500 dark:text-[#555] hover:text-gray-700 dark:hover:text-gray-300'
                                            }`}
                                        >
                                            {t === 'payment' ? 'Pagamento' : t === 'addition' ? 'Consumo' : 'Ajuste'}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Amount */}
                            <div>
                                <p className="text-xs text-gray-400 dark:text-[#555] mb-2">Valor</p>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400 dark:text-[#555]">R$</span>
                                    <input
                                        className="w-full bg-gray-50 dark:bg-black border border-gray-100 dark:border-[#1a1a1a] rounded-lg pl-9 pr-4 py-3 text-2xl font-medium outline-none focus:border-orange-500/50 transition-all text-gray-900 dark:text-white placeholder:text-gray-200 dark:placeholder:text-[#222]"
                                        type="number"
                                        value={amount}
                                        onChange={e => setAmount(e.target.value)}
                                        placeholder="0.00"
                                        autoFocus
                                    />
                                </div>
                            </div>

                            {/* Note */}
                            <div>
                                <p className="text-xs text-gray-400 dark:text-[#555] mb-2">Observação</p>
                                <input
                                    className="w-full bg-gray-50 dark:bg-black border border-gray-100 dark:border-[#1a1a1a] rounded-lg px-3 py-2.5 text-xs outline-none focus:border-orange-500/50 text-gray-900 dark:text-white transition-all placeholder:text-gray-300 dark:placeholder:text-[#333]"
                                    value={description}
                                    onChange={e => setDescription(e.target.value)}
                                    placeholder="Motivo do lançamento..."
                                />
                            </div>

                            <button
                                onClick={handleSubmit}
                                disabled={loading || !amount}
                                className="w-full bg-gray-900 dark:bg-white text-white dark:text-black text-xs py-3 rounded-lg hover:bg-black dark:hover:bg-gray-100 transition-all disabled:opacity-40 border-none cursor-pointer flex items-center justify-center gap-2"
                            >
                                {loading ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                                Confirmar Lançamento
                            </button>
                        </div>
                    )}
                </div>

                <div className="px-5 py-3 border-t border-gray-100 dark:border-[#1a1a1a] shrink-0">
                    <p className="text-[10px] text-gray-400 dark:text-[#333] text-center">
                        Movimentações refletem no saldo global do cliente
                    </p>
                </div>
            </div>
        </div>
    );
}
