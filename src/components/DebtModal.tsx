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
}

export default function DebtModal({ customer, onClose, onUpdate }: DebtModalProps) {
    const [view, setView] = useState<'list' | 'add'>('list');
    const [loading, setLoading] = useState(false);
    const [amount, setAmount] = useState('');
    const [description, setDescription] = useState('');
    const [type, setType] = useState<'addition' | 'payment' | 'adjustment'>('payment');

    const handleSubmit = async () => {
        const val = parseFloat(amount);
        if (isNaN(val) || val <= 0) return;

        setLoading(true);
        try {
            // Update debt balance
            let newBalance = customer.debtBalance;
            if (type === 'addition') newBalance += val;
            if (type === 'payment') newBalance = Math.max(0, newBalance - val);
            if (type === 'adjustment') newBalance = val; // Assuming adjustment sets the value? Or delta? Let's say delta.

            // Actually let's make adjustment a delta or setter. Setter is easier for "modificar".
            const actualNewBalance = type === 'adjustment' ? val : (type === 'addition' ? customer.debtBalance + val : customer.debtBalance - val);

            const res = await fetch('/api/customers', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: customer.id || customer._id,
                    debtBalance: actualNewBalance,
                    debtHistory: [
                        ...customer.debtHistory,
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
                // Log in cash if payment
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
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-gray-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-gray-100 font-sans text-sm">

                <header className="p-6 border-b border-gray-50 flex items-center justify-between bg-white sticky top-0 z-10">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center shadow-inner">
                            <History size={24} />
                        </div>
                        <div>
                            <h3 className="text-lg font-extrabold text-gray-800 tracking-tight">Histórico de Fiados</h3>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{customer.name}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="text-right">
                            <span className="text-[9px] font-bold text-gray-400 uppercase block tracking-widest leading-none mb-1">Saldo Devedor</span>
                            <span className="text-xl font-black text-red-600 tracking-tighter">R$ {(customer.debtBalance || 0).toFixed(2)}</span>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl text-gray-300 transition-all border-none bg-transparent cursor-pointer">
                            <X size={20} />
                        </button>
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto p-6 min-h-[400px]">
                    {view === 'list' ? (
                        <div className="space-y-4">
                            <div className="flex justify-between items-center mb-6">
                                <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Últimas Movimentações</h4>
                                <button
                                    onClick={() => setView('add')}
                                    className="bg-gray-900 text-white px-4 py-2 rounded-xl text-[9px] font-bold uppercase tracking-widest hover:bg-black transition-all flex items-center gap-2 border-none cursor-pointer"
                                >
                                    <Plus size={14} /> Registrar Novo
                                </button>
                            </div>

                            {customer.debtHistory && customer.debtHistory.length > 0 ? (
                                <div className="space-y-2">
                                    {[...customer.debtHistory].reverse().map((entry, i) => (
                                        <div key={entry._id || i} className="bg-gray-50/50 border border-gray-100 p-4 rounded-2xl flex items-center justify-between group hover:bg-white hover:border-blue-100 transition-all">
                                            <div className="flex items-center gap-4">
                                                <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${entry.type === 'payment' ? 'bg-green-100 text-green-600' :
                                                    entry.type === 'addition' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'
                                                    }`}>
                                                    {entry.type === 'payment' ? <Minus size={14} /> : entry.type === 'addition' ? <Plus size={14} /> : <Receipt size={14} />}
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-bold text-gray-800 uppercase tracking-tight line-clamp-1">{entry.description}</p>
                                                    <div className="flex items-center gap-2 mt-0.5 text-[8px] text-gray-400 font-bold uppercase">
                                                        <Calendar size={10} />
                                                        {new Date(entry.date).toLocaleString('pt-BR')}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <span className={`text-xs font-black tracking-tight ${entry.type === 'payment' ? 'text-green-600' :
                                                    entry.type === 'addition' ? 'text-red-600' : 'text-blue-600'
                                                    }`}>
                                                    {entry.type === 'payment' ? '-' : entry.type === 'addition' ? '+' : ''} R$ {entry.amount.toFixed(2)}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="py-20 flex flex-col items-center justify-center text-gray-300 opacity-60">
                                    <Receipt size={48} className="mb-4" />
                                    <p className="text-[10px] font-bold uppercase tracking-widest">Nenhuma movimentação encontrada</p>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="max-w-md mx-auto py-8 animate-in slide-in-from-bottom duration-300">
                            <button onClick={() => setView('list')} className="flex items-center gap-2 text-gray-400 hover:text-gray-600 mb-8 transition-all border-none bg-transparent cursor-pointer">
                                <ArrowLeft size={16} />
                                <span className="text-[10px] font-bold uppercase tracking-widest">Voltar para o histórico</span>
                            </button>

                            <h4 className="text-lg font-black text-gray-800 tracking-tight mb-8">Novo registro de dívida</h4>

                            <div className="space-y-6">
                                <div className="grid grid-cols-3 gap-2">
                                    {(['payment', 'addition', 'adjustment'] as const).map(t => (
                                        <button
                                            key={t}
                                            onClick={() => setType(t)}
                                            className={`p-3 rounded-2xl border text-[9px] font-bold uppercase tracking-widest transition-all ${type === t ? 'bg-blue-600 border-blue-600 text-white shadow-lg' : 'bg-gray-50 border-gray-100 text-gray-400 hover:border-gray-200'
                                                } cursor-pointer`}
                                        >
                                            {t === 'payment' ? 'Pagamento' : t === 'addition' ? 'Consumo' : 'Ajustar Total'}
                                        </button>
                                    ))}
                                </div>

                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Valor do lançamento</label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-bold text-gray-300">R$</span>
                                        <input
                                            className="w-full bg-gray-50 border border-gray-100 rounded-2xl pl-11 pr-4 py-4 text-2xl font-bold outline-none focus:bg-white focus:border-blue-500 transition-all font-sans"
                                            type="number"
                                            placeholder="0,00"
                                            value={amount}
                                            onChange={e => setAmount(e.target.value)}
                                            autoFocus
                                        />
                                    </div>
                                    <p className="text-[8px] text-gray-400 ml-1 font-medium mt-1 uppercase">
                                        {type === 'adjustment' ? 'O saldo total do cliente passará a ser este valor.' : `Este valor será ${type === 'payment' ? 'subtraído da' : 'adicionado à'} dívida.`}
                                    </p>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Descrição / Motivo</label>
                                    <input
                                        className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-4 py-4 text-xs font-bold outline-none focus:bg-white focus:border-blue-500 transition-all placeholder:text-gray-300 uppercase"
                                        type="text"
                                        placeholder="Ex: Compra do dia 05/01, Pagamento em Dinheiro..."
                                        value={description}
                                        onChange={e => setDescription(e.target.value)}
                                    />
                                </div>

                                <button
                                    disabled={loading || !amount}
                                    onClick={handleSubmit}
                                    className="w-full bg-blue-600 text-white py-5 rounded-2xl font-bold text-[10px] tracking-widest hover:bg-blue-700 transition-all shadow-xl shadow-blue-500/10 active:scale-95 flex items-center justify-center gap-3 border-none cursor-pointer disabled:opacity-50"
                                >
                                    {loading ? <Loader2 className="animate-spin" size={20} /> : (
                                        <>
                                            <Check size={18} />
                                            <span>CONFIRMAR LANÇAMENTO</span>
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

function Loader2({ className, size }: { className?: string, size?: number }) {
    return <History className={`animate-spin ${className}`} size={size} />;
}
