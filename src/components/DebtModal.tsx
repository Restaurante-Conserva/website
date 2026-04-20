"use client";

import { useState } from 'react';
import { X, History, Plus, Minus, Calendar, Receipt, User, ArrowLeft, Trash2, Check } from 'lucide-react';

interface DebtEntry {
    date: string;
    type: 'addition' | 'payment' | 'adjustment';
    description: string;
    amount: number;
    _id?: string;
}

interface Customer {
    id: string;
    _id?: string;
    name: string;
    debtBalance: number;
    debtHistory: DebtEntry[];
}

interface DebtModalProps {
    customer: Customer;
    onClose: () => void;
    onUpdate: () => void;
    dark?: boolean;
}

export default function DebtModal({ customer, onClose, onUpdate, dark = false }: DebtModalProps) {
    const [view, setView] = useState<'list' | 'add'>('list');
    const [loading, setLoading] = useState(false);
    const [amount, setAmount] = useState('');
    const [description, setDescription] = useState('');
    const [type, setType] = useState<'addition' | 'payment' | 'adjustment'>('payment');

    const theme = {
        bg: dark ? 'bg-[#0a0a0a]' : 'bg-white',
        card: dark ? 'bg-[#111] border-[#1a1a1a] shadow-inner' : 'bg-white border-slate-200 shadow-sm',
        header: dark ? 'bg-[#0a0a0a] border-[#1a1a1a]' : 'bg-white border-slate-100',
        text: dark ? 'text-white' : 'text-slate-800',
        subtext: dark ? 'text-[#444]' : 'text-slate-500',
        input: dark ? 'bg-[#0a0a0a] border-[#222] text-white focus:border-orange-500' : 'bg-slate-50 border-slate-200 text-slate-800 focus:bg-white focus:border-blue-500',
        item: dark ? 'bg-[#111] border-[#1a1a1a] hover:border-[#333]' : 'bg-white border-slate-200 hover:border-slate-300',
        btnSecondary: dark ? 'bg-[#1a1a1a] text-[#555] hover:text-white' : 'bg-slate-100 text-slate-400 hover:bg-slate-200',
        btnPrimary: dark ? 'bg-orange-600 hover:bg-orange-500' : 'bg-blue-600 hover:bg-blue-700'
    };

    const handleSubmit = async () => {
        const val = parseFloat(amount);
        if (isNaN(val) || val <= 0) return;

        setLoading(true);
        try {
            const actualNewBalance = type === 'adjustment' ? val : (type === 'addition' ? customer.debtBalance + val : customer.debtBalance - val);

            const res = await fetch('/api/customers', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: customer.id || customer._id,
                    debtBalance: actualNewBalance,
                    debtHistory: [
                        ...(customer.debtHistory || []),
                        {
                            date: new Date().toISOString(),
                            type,
                            description: description || (type === 'payment' ? 'Pagamento manual' : type === 'addition' ? 'Acréscimo manual' : 'Ajuste de saldo'),
                            amount: val
                        }
                    ]
                })
            });

            if (res.ok && type === 'payment') {
                await fetch('/api/cash', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        action: 'transaction',
                        type: 'in',
                        amount: val,
                        description: `Pagamento Fiado: ${customer.name}`
                    })
                });
            }

            onUpdate();
            setView('list');
            setAmount('');
            setDescription('');
        } catch (e) {
            alert("Erro ao atualizar débito");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={`fixed inset-0 z-[200] flex items-center justify-center p-4 animate-in fade-in duration-200 ${dark ? 'bg-black/80' : 'bg-black/40 backdrop-blur-sm'}`}>
            <div className={`w-full max-w-2xl ${theme.bg} rounded-2xl shadow-2xl flex flex-col overflow-hidden border font-sans text-sm max-h-[90vh] ${dark ? 'border-[#1a1a1a]' : 'border-slate-100'}`}>

                <header className={`px-6 py-5 border-b flex items-center justify-between shrink-0 ${theme.header}`}>
                    <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 ${dark ? 'bg-orange-600/10 text-orange-500 border-orange-500/20' : 'bg-rose-50 text-rose-600 border-rose-100'} rounded-xl flex items-center justify-center shadow-sm border`}>
                            <History size={20} />
                        </div>
                        <div>
                            <h3 className={`text-base font-black uppercase italic tracking-tight ${theme.text}`}>Histórico de Fiados</h3>
                            <p className={`text-[10px] uppercase font-bold tracking-widest ${theme.subtext}`}>{customer.name}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-8">
                        <div className="text-right">
                            <span className={`text-[8px] font-black uppercase tracking-widest block mb-0.5 ${theme.subtext}`}>Saldo Devedor</span>
                            <span className={`text-2xl font-black italic tabular-nums ${dark ? 'text-white' : 'text-rose-600'}`}>R$ {(customer.debtBalance || 0).toFixed(2)}</span>
                        </div>
                        <button onClick={onClose} className={`p-2 rounded-lg transition-colors border-none bg-transparent cursor-pointer ${dark ? 'text-[#333] hover:text-white' : 'text-slate-400 hover:bg-slate-100'}`}>
                            <X size={20} />
                        </button>
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto p-6 md:p-8 dark-scroll">
                    {view === 'list' ? (
                        <div className="space-y-6">
                            <div className="flex justify-between items-center">
                                <h4 className={`text-[10px] font-black uppercase tracking-widest italic ${theme.text}`}>Últimas Movimentações</h4>
                                <button
                                    onClick={() => setView('add')}
                                    className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg transition-all flex items-center gap-2 border-none cursor-pointer ${theme.btnPrimary} text-white`}
                                >
                                    <Plus size={16} /> Novo Registro
                                </button>
                            </div>

                            {(customer.debtHistory && customer.debtHistory.length > 0) ? (
                                <div className="space-y-3">
                                    {[...customer.debtHistory].reverse().map((entry, i) => (
                                        <div key={entry._id || i} className={`p-4 rounded-xl flex items-center justify-between transition-all border ${theme.item}`}>
                                            <div className="flex items-center gap-4">
                                                <div className={`w-11 h-11 rounded-lg flex items-center justify-center border ${
                                                    entry.type === 'payment' ? (dark ? 'bg-green-500/10 border-green-500/20 text-green-500' : 'bg-emerald-50 text-emerald-600 border-emerald-100') :
                                                    entry.type === 'addition' ? (dark ? 'bg-red-500/10 border-red-500/20 text-red-500' : 'bg-rose-50 text-rose-600 border-rose-100') : (dark ? 'bg-blue-500/10 border-blue-500/20 text-blue-500' : 'bg-blue-50 text-blue-600 border-blue-100')
                                                }`}>
                                                    {entry.type === 'payment' ? <Minus size={18} /> : entry.type === 'addition' ? <Plus size={18} /> : <Receipt size={18} />}
                                                </div>
                                                <div className="space-y-1">
                                                    <p className={`text-[11px] font-bold uppercase italic ${theme.text} line-clamp-1`}>{entry.description}</p>
                                                    <div className={`flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest ${theme.subtext}`}>
                                                        <Calendar size={12} className="opacity-50" />
                                                        {new Date(entry.date).toLocaleString('pt-BR')}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <span className={`text-sm font-black italic tabular-nums ${
                                                    entry.type === 'payment' ? (dark ? 'text-green-500' : 'text-emerald-600') :
                                                    entry.type === 'addition' ? (dark ? 'text-red-500' : 'text-rose-600') : (dark ? 'text-blue-500' : 'text-blue-600')
                                                }`}>
                                                    {entry.type === 'payment' ? '-' : entry.type === 'addition' ? '+' : ''} R$ {entry.amount.toFixed(2)}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="py-20 flex flex-col items-center justify-center text-[#222]">
                                    <div className={`w-20 h-20 rounded-2xl flex items-center justify-center mb-4 border-2 border-dashed ${dark ? 'bg-[#0a0a0a] border-[#1a1a1a]' : 'bg-slate-50 border-slate-100'}`}>
                                        <Receipt size={32} className="opacity-20" />
                                    </div>
                                    <p className="text-[10px] font-black uppercase tracking-widest">Nenhuma movimentação registrada</p>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="max-w-md mx-auto py-4 animate-in slide-in-from-right-4 duration-200">
                            <button onClick={() => setView('list')} className={`flex items-center gap-2 mb-8 transition-colors border-none bg-transparent cursor-pointer font-black text-[10px] uppercase tracking-widest ${dark ? 'text-[#333] hover:text-white' : 'text-slate-500 hover:text-slate-800'}`}>
                                <ArrowLeft size={16} />
                                Voltar para o histórico
                            </button>

                            <h4 className={`text-xl font-black italic uppercase tracking-tight mb-8 ${theme.text}`}>Novo Lançamento</h4>

                            <div className="space-y-8">
                                <div className="grid grid-cols-3 gap-3">
                                    {(['payment', 'addition', 'adjustment'] as const).map(t => (
                                        <button
                                            key={t}
                                            onClick={() => setType(t)}
                                            className={`p-4 rounded-xl border text-[9px] font-black uppercase tracking-widest transition-all flex items-center justify-center cursor-pointer ${
                                                type === t 
                                                    ? (dark ? 'bg-orange-600 text-white border-orange-500 ring-4 ring-orange-500/10' : 'bg-blue-50 border-blue-500 text-blue-700 ring-2 ring-blue-500/10')
                                                    : (dark ? 'bg-[#0a0a0a] border-[#1a1a1a] text-[#333] hover:border-[#333]' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50')
                                            }`}
                                        >
                                            {t === 'payment' ? 'Pagamento' : t === 'addition' ? 'Consumo' : 'Ajustar Total'}
                                        </button>
                                    ))}
                                </div>

                                <div className="space-y-2">
                                    <label className={`text-[10px] font-black uppercase tracking-widest italic ml-1 ${theme.subtext}`}>Valor do lançamento</label>
                                    <div className="relative">
                                        <span className={`absolute left-5 top-1/2 -translate-y-1/2 text-xl font-black italic ${dark ? 'text-[#222]' : 'text-slate-300'}`}>R$</span>
                                        <input
                                            className={`w-full rounded-2xl pl-14 pr-6 py-5 text-2xl font-black italic tabular-nums outline-none transition-all shadow-inner ${theme.input} placeholder:opacity-20`}
                                            type="number"
                                            placeholder="0.00"
                                            value={amount}
                                            onChange={e => setAmount(e.target.value)}
                                            autoFocus
                                        />
                                    </div>
                                    <p className={`text-[9px] font-bold uppercase tracking-widest mt-2 ${theme.subtext} opacity-50`}>
                                        {type === 'adjustment' ? 'O saldo total do cliente passará a ser este valor.' : `Este valor será ${type === 'payment' ? 'subtraído da' : 'adicionado à'} dívida.`}
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <label className={`text-[10px] font-black uppercase tracking-widest italic ml-1 ${theme.subtext}`}>Descrição / Motivo</label>
                                    <input
                                        className={`w-full rounded-xl px-4 py-4 text-xs font-bold uppercase tracking-tight outline-none transition-all shadow-inner ${theme.input} placeholder:opacity-20`}
                                        type="text"
                                        placeholder="EX: PAGAMENTO PARCIAL..."
                                        value={description}
                                        onChange={e => setDescription(e.target.value)}
                                    />
                                </div>

                                <button
                                    disabled={loading || !amount || parseFloat(amount) <= 0}
                                    onClick={handleSubmit}
                                    className={`w-full text-white py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all shadow-xl active:scale-[0.98] flex items-center justify-center gap-3 border-none cursor-pointer mt-4 shadow-orange-900/10 ${
                                        loading || !amount || parseFloat(amount) <= 0 ? 'opacity-50 cursor-not-allowed' : theme.btnPrimary
                                    }`}
                                >
                                    {loading ? <Loader2 dark={dark} size={20} /> : (
                                        <>
                                            <Check size={20} />
                                            <span>Confirmar Lançamento</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function Loader2({ className, size, dark }: { className?: string, size?: number, dark?: boolean }) {
    return <History className={`animate-spin ${className} ${dark ? 'text-white' : ''}`} size={size} />;
}
