"use client";

import { useState, useEffect } from 'react';
import {
    Wallet, TrendingUp, TrendingDown, History,
    Plus, Minus, Lock, DollarSign,
    Loader2, ArrowRight,
    Info
} from 'lucide-react';
import { useToast } from '../context/ToastContext';

interface CashierPanelProps {
    onOpen?: () => void;
    employee?: any;
}

export default function CashierPanel({ onOpen, employee }: CashierPanelProps) {
    const { showToast } = useToast();
    const [activeSession, setActiveSession] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [initialAmount, setInitialAmount] = useState('');
    const [finalAmount, setFinalAmount] = useState('');
    const [transaction, setTransaction] = useState({ amount: '', description: '', type: 'out' });

    useEffect(() => {
        fetchSession();
    }, []);

    const fetchSession = async () => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/cash');
            const data = await res.json();
            setActiveSession(data);
        } catch (e) {
            console.error(e);
            showToast('Erro ao carregar caixa', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleOpen = async () => {
        if (!initialAmount) return;
        try {
            const res = await fetch('/api/cash', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'open', initialAmount: parseFloat(initialAmount), openedBy: employee?.name || 'Operador' })
            });
            if (res.ok) {
                if (onOpen) onOpen();
                fetchSession();
                showToast('Caixa aberto com sucesso!', 'success');
            } else {
                showToast('Erro ao abrir caixa', 'error');
            }
        } catch (e) {
            showToast('Erro na conexão ao abrir caixa', 'error');
        }
    };

    const handleTransaction = async () => {
        if (!transaction.amount || !transaction.description) {
            showToast('Preencha valor e justificativa', 'error');
            return;
        }
        try {
            const res = await fetch('/api/cash', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'transaction', type: transaction.type, amount: parseFloat(transaction.amount), description: transaction.description })
            });
            if (res.ok) {
                setTransaction({ amount: '', description: '', type: 'out' });
                fetchSession();
                showToast(transaction.type === 'in' ? 'Suprimento registrado!' : 'Sangria registrada!', 'success');
            } else {
                showToast('Erro ao registrar movimentação', 'error');
            }
        } catch (e) {
            showToast('Erro na conexão', 'error');
        }
    };

    const handleClose = async () => {
        if (!finalAmount) {
            showToast('Informe o valor final em caixa', 'error');
            return;
        }
        if (!confirm('Deseja realmente encerrar o caixa? Essa ação não pode ser desfeita.')) return;
        try {
            const res = await fetch('/api/cash', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'close', finalAmount: parseFloat(finalAmount), closedBy: employee?.name || 'Operador' })
            });
            if (res.ok) {
                showToast('Caixa fechado com sucesso.', 'success');
                setFinalAmount('');
                fetchSession();
            } else {
                showToast('Erro ao fechar caixa', 'error');
            }
        } catch (e) {
            showToast('Erro na conexão', 'error');
        }
    };

    if (isLoading) return (
        <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-[#0c0c0c] text-gray-500 dark:text-[#444] gap-3 text-xs font-bold uppercase tracking-[0.2em]">
            <Loader2 className="animate-spin text-orange-500" size={24} /> Carregando caixa...
        </div>
    );

    if (!activeSession) {
        return (
            <div className="flex-1 flex items-center justify-center p-8 bg-gray-50 dark:bg-[#0c0c0c] text-gray-900 dark:text-white font-sans transition-colors">
                <div className="w-full max-w-xl bg-white dark:bg-[#0a0a0a] p-12 rounded-2xl border border-gray-200 dark:border-[#1a1a1a] text-center shadow-xl dark:shadow-2xl">
                    <div className="w-20 h-20 bg-orange-100 dark:bg-orange-600/10 border border-orange-200 dark:border-orange-500/20 rounded-2xl flex items-center justify-center mx-auto mb-10 shadow-lg shadow-orange-500/10 dark:shadow-orange-900/10">
                        <Wallet size={40} className="text-orange-600 dark:text-orange-500" />
                    </div>
                    <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-2 uppercase tracking-wide">Abertura de Caixa</h2>
                    <p className="text-[10px] text-gray-500 dark:text-[#555] mb-12 font-black uppercase tracking-[0.2em]">Informe o saldo inicial para troco</p>

                    <div className="space-y-10">
                        <div className="text-left">
                            <label className="text-[10px] font-black text-gray-400 dark:text-[#444] uppercase mb-4 block tracking-[0.2em] ml-1">Saldo em Dinheiro (Físico)</label>
                            <div className="relative">
                                <span className="absolute left-6 top-1/2 -translate-y-1/2 font-black text-gray-300 dark:text-[#222] text-3xl">R$</span>
                                <input
                                    className="w-full bg-gray-50 dark:bg-black border border-gray-200 dark:border-[#1a1a1a] rounded-xl pl-16 pr-6 py-8 text-5xl font-black outline-none focus:border-orange-500/60 transition-all text-gray-900 dark:text-white placeholder:text-gray-200 dark:placeholder:text-[#111] shadow-inner dark:shadow-none"
                                    type="number"
                                    value={initialAmount}
                                    onChange={e => setInitialAmount(e.target.value)}
                                    placeholder="0.00"
                                    autoFocus
                                />
                            </div>
                        </div>
                        <button
                            onClick={handleOpen}
                            disabled={!initialAmount}
                            className="w-full bg-orange-600 text-white font-black text-xs uppercase tracking-[0.2em] py-6 rounded-xl hover:bg-orange-500 hover:scale-[1.02] disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:scale-100 transition-all shadow-xl shadow-orange-600/20 dark:shadow-orange-900/20 border-none cursor-pointer"
                        >
                            Iniciar Turno
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const totalCashIn = activeSession.transactions
        .filter((t: any) => t.type === 'in')
        .reduce((acc: number, t: any) => acc + t.amount, 0);

    const totalCashOut = activeSession.transactions
        .filter((t: any) => t.type === 'out')
        .reduce((acc: number, t: any) => acc + t.amount, 0);

    const expectedBalance = activeSession.initialAmount + totalCashIn - totalCashOut;

    return (
        <div className="flex-1 flex flex-col p-6 lg:p-10 gap-10 bg-gray-50 dark:bg-[#0c0c0c] text-gray-900 dark:text-white overflow-y-auto font-sans transition-colors" style={{ scrollbarWidth: 'thin' }}>
            <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8 shrink-0 border-b border-gray-200 dark:border-white/5 pb-10">
                <div className="flex items-center gap-6">
                    <div className="w-16 h-16 bg-orange-100 dark:bg-orange-600/10 border border-orange-200 dark:border-orange-500/20 rounded-2xl flex items-center justify-center text-orange-600 dark:text-orange-500 shadow-sm dark:shadow-none">
                        <Wallet size={32} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-gray-900 dark:text-white uppercase mb-2 tracking-tight">Fluxo de Caixa</h2>
                        <p className="text-[10px] font-black text-gray-500 dark:text-[#444] uppercase tracking-[0.2em] flex items-center gap-3">
                            <span className="bg-white dark:bg-white/5 px-2 py-0.5 rounded border border-gray-100 dark:border-white/5">Operador: {activeSession.openedBy}</span>
                            <span className="w-1.5 h-1.5 rounded-full bg-gray-200 dark:bg-[#222]" />
                            <span className="bg-white dark:bg-white/5 px-2 py-0.5 rounded border border-gray-100 dark:border-white/5">Início: {new Date(activeSession.openedAt).toLocaleTimeString()}</span>
                        </p>
                    </div>
                </div>
                <div className="text-right p-6 bg-white dark:bg-white/[0.02] border border-gray-100 dark:border-white/5 rounded-2xl shadow-sm">
                    <p className="text-[10px] font-black text-gray-400 dark:text-[#444] uppercase tracking-[0.2em] mb-2">Saldo Atual em Espécie</p>
                    <p className="text-5xl font-black text-emerald-600 dark:text-emerald-500 tracking-tight tabular-nums">R$ {expectedBalance.toFixed(2)}</p>
                </div>
            </header>
 
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-10 pb-10">
                <div className="xl:col-span-2 space-y-10">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-white dark:bg-[#0a0a0a] p-8 rounded-2xl border border-gray-100 dark:border-[#1a1a1a] shadow-sm dark:shadow-none">
                            <p className="text-[10px] font-black text-gray-400 dark:text-[#333] uppercase tracking-[0.2em] mb-3 flex items-center gap-2"><DollarSign size={14}/> Abertura</p>
                            <p className="text-2xl font-black text-gray-900 dark:text-white tabular-nums">R$ {activeSession.initialAmount.toFixed(2)}</p>
                        </div>
                        <div className="bg-emerald-50 dark:bg-emerald-500/5 p-8 rounded-2xl border border-emerald-100 dark:border-emerald-500/10 shadow-sm dark:shadow-none">
                            <p className="text-[10px] font-black text-emerald-600 dark:text-emerald-500 uppercase tracking-[0.2em] mb-3 flex items-center gap-2"><TrendingUp size={14}/> Suprimentos</p>
                            <p className="text-2xl font-black text-emerald-600 dark:text-emerald-500 tabular-nums">R$ {totalCashIn.toFixed(2)}</p>
                        </div>
                        <div className="bg-red-50 dark:bg-red-500/5 p-8 rounded-2xl border border-red-100 dark:border-red-500/10 shadow-sm dark:shadow-none">
                            <p className="text-[10px] font-black text-red-600 dark:text-red-500 uppercase tracking-[0.2em] mb-3 flex items-center gap-2"><TrendingDown size={14}/> Sangrias</p>
                            <p className="text-2xl font-black text-red-600 dark:text-red-500 tabular-nums">R$ {totalCashOut.toFixed(2)}</p>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-[#0a0a0a] border border-gray-100 dark:border-[#1a1a1a] rounded-2xl shadow-sm dark:shadow-none flex flex-col min-h-[500px]">
                        <div className="px-8 py-6 border-b border-gray-50 dark:border-[#111] flex items-center justify-between">
                            <h3 className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-[0.2em] flex items-center gap-3">
                                <History size={18} className="text-orange-500" /> Movimentações
                            </h3>
                            <span className="text-[9px] text-gray-400 dark:text-[#444] font-black uppercase tracking-widest px-3 py-1 bg-gray-50 dark:bg-black rounded-lg border border-gray-100 dark:border-[#1a1a1a]">{activeSession.transactions.length} registros</span>
                        </div>
                        <div className="flex-1 overflow-y-auto divide-y divide-gray-50 dark:divide-[#111] p-4" style={{ scrollbarWidth: 'thin' }}>
                            {activeSession.transactions.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center py-20 text-center text-gray-300 dark:text-[#222] gap-6">
                                    <History size={64} className="opacity-10" />
                                    <span className="text-[10px] font-black uppercase tracking-[0.3em]">Aguardando lançamentos...</span>
                                </div>
                            ) : (
                                activeSession.transactions.slice().reverse().map((t: any, i: number) => (
                                    <div key={`cash-log-${i}`} className="px-6 py-6 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-black transition-all rounded-xl border border-transparent hover:border-gray-100 dark:hover:border-[#1a1a1a]">
                                        <div className="flex items-center gap-6">
                                            <div className={`p-3.5 rounded-xl border ${t.type === 'in' ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-500 border-emerald-100 dark:border-emerald-500/20 shadow-sm shadow-emerald-500/5' : 'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-500 border-red-100 dark:border-red-500/20 shadow-sm shadow-red-500/5'}`}>
                                                {t.type === 'in' ? <Plus size={20} /> : <Minus size={20} />}
                                            </div>
                                            <div>
                                                <p className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-tight mb-1">{t.description}</p>
                                                <p className="text-[10px] text-gray-400 dark:text-[#444] font-black uppercase tracking-widest">{t.type === 'in' ? 'Suprimento' : 'Sangria'}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <span className={`text-xl font-black tabular-nums ${t.type === 'in' ? 'text-emerald-600 dark:text-emerald-500' : 'text-red-600 dark:text-red-500'}`}>
                                                {t.type === 'in' ? '+' : '-'} R$ {t.amount.toFixed(2)}
                                            </span>
                                            <p className="text-[10px] text-gray-400 dark:text-[#333] font-black uppercase tracking-widest mt-1.5">{new Date(t.date || Date.now()).toLocaleTimeString()}</p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex flex-col gap-10">
                    <section className="bg-white dark:bg-[#0a0a0a] border border-gray-100 dark:border-[#1a1a1a] rounded-2xl p-8 space-y-8 shadow-sm dark:shadow-none">
                        <div className="flex items-center gap-3 font-black text-[10px] text-gray-400 dark:text-[#444] uppercase tracking-[0.2em]">
                            <Plus size={16} className="text-orange-500" /> Movimentação Avulsa
                        </div>
                        <div className="space-y-6">
                            <div className="flex p-1.5 bg-gray-50 dark:bg-black border border-gray-100 dark:border-[#1a1a1a] rounded-xl">
                                <button onClick={() => setTransaction({ ...transaction, type: 'in' })} className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all border-none cursor-pointer ${transaction.type === 'in' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20' : 'text-gray-400 dark:text-[#333] hover:text-gray-600 dark:hover:text-[#555]'}`}>Suprimento</button>
                                <button onClick={() => setTransaction({ ...transaction, type: 'out' })} className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all border-none cursor-pointer ${transaction.type === 'out' ? 'bg-red-600 text-white shadow-lg shadow-red-600/20' : 'text-gray-400 dark:text-[#333] hover:text-gray-600 dark:hover:text-[#555]'}`}>Sangria</button>
                            </div>
                            <div className="space-y-4">
                                <div className="relative">
                                    <span className="absolute left-5 top-1/2 -translate-y-1/2 text-lg font-black text-gray-300 dark:text-[#222]">R$</span>
                                    <input className="w-full bg-gray-50 dark:bg-black border border-gray-100 dark:border-[#1a1a1a] rounded-xl pl-12 pr-4 py-5 text-2xl font-black outline-none focus:border-orange-500/50 text-gray-900 dark:text-white transition-all placeholder:text-gray-200 dark:placeholder:text-[#111] shadow-inner dark:shadow-none" type="number" value={transaction.amount} onChange={e => setTransaction({ ...transaction, amount: e.target.value })} placeholder="0.00" />
                                </div>
                                <input className="w-full bg-gray-50 dark:bg-black border border-gray-100 dark:border-[#1a1a1a] rounded-xl px-5 py-5 text-[10px] font-black uppercase tracking-widest outline-none focus:border-orange-500/50 text-gray-900 dark:text-white transition-all placeholder:text-gray-300 dark:placeholder:text-[#333] shadow-inner dark:shadow-none" value={transaction.description} onChange={e => setTransaction({ ...transaction, description: e.target.value })} placeholder="Justificativa da transação..." />
                                <button onClick={handleTransaction} className="w-full bg-gray-900 dark:bg-[#151515] text-white font-black text-[10px] uppercase tracking-[0.2em] py-5 hover:bg-black dark:hover:bg-white dark:hover:text-black rounded-xl transition-all border-none cursor-pointer shadow-lg shadow-black/10">Lançar Ajuste</button>
                            </div>
                        </div>
                    </section>

                    <section className="bg-red-500/[0.02] dark:bg-red-500/[0.03] border border-red-500/10 dark:border-red-500/10 rounded-3xl p-8 lg:p-10 space-y-10 shadow-sm dark:shadow-none relative overflow-hidden group">
                        <div className="absolute -top-12 -right-12 p-4 opacity-5 group-hover:opacity-10 transition-all duration-500">
                            <Lock size={200} className="rotate-12" />
                        </div>
                        <div className="flex items-center gap-6 relative z-10">
                            <div className="w-16 h-16 bg-red-600/10 text-red-600 rounded-2xl flex items-center justify-center border border-red-600/20 shadow-lg shadow-red-600/5">
                                <Lock size={32} />
                            </div>
                            <div>
                                <h3 className="text-2xl font-black text-red-600 dark:text-red-500 uppercase tracking-tight">Fechamento</h3>
                                <p className="text-[10px] text-red-500/60 font-black uppercase tracking-[0.2em] mt-1.5 flex items-center gap-2">
                                    <span className="w-1 h-1 rounded-full bg-red-500" />
                                    Encerramento de Turno
                                </p>
                            </div>
                        </div>
                        <div className="space-y-8 relative z-10">
                            <div className="space-y-4">
                                <label className="text-[10px] font-black text-red-500/60 uppercase tracking-[0.2em] ml-1">Conferência Física (Saldo em Caixa)</label>
                                <div className="relative group/input">
                                    <span className="absolute left-6 top-1/2 -translate-y-1/2 text-red-300 dark:text-red-900/40 font-black text-3xl transition-colors group-focus-within/input:text-red-500">R$</span>
                                    <input className="w-full bg-white dark:bg-black border-2 border-red-600/10 dark:border-red-600/5 rounded-2xl pl-16 pr-6 py-8 text-5xl font-black outline-none focus:border-red-600/40 transition-all text-red-600 dark:text-red-500 placeholder:text-red-50/50 dark:placeholder:text-red-900/10 shadow-inner dark:shadow-none" type="number" value={finalAmount} onChange={e => setFinalAmount(e.target.value)} placeholder="0.00" />
                                </div>
                            </div>
                            <div className="p-6 bg-orange-500/10 rounded-2xl flex items-start gap-4 border border-orange-500/10 backdrop-blur-sm">
                                <Info size={24} className="text-orange-500 mt-0.5 shrink-0" />
                                <p className="text-[10px] text-orange-800 dark:text-orange-500/80 leading-relaxed font-black uppercase tracking-[0.15em]">
                                    O sistema comparará o valor com o esperado <span className="text-emerald-600 font-black tracking-normal underline underline-offset-4 decoration-2">(R$ {expectedBalance.toFixed(2)})</span> para consolidar os relatórios.
                                </p>
                            </div>
                            <button onClick={handleClose} disabled={!finalAmount} className="w-full bg-red-600 text-white font-black text-xs uppercase tracking-[0.3em] py-8 rounded-2xl hover:bg-red-500 hover:scale-[1.01] active:scale-95 transition-all disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:scale-100 shadow-2xl shadow-red-600/20 dark:shadow-red-900/40 flex items-center justify-center gap-4 border-none cursor-pointer">
                                Encerrar Expediente <ArrowRight size={24} />
                            </button>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
}
