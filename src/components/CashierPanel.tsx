"use client";

import { useState, useEffect } from 'react';
import {
    Wallet, TrendingUp, TrendingDown, History,
    Plus, Minus, Lock, Unlock, DollarSign,
    CheckCircle2, AlertCircle, Loader2, ArrowRight,
    Calculator, Receipt, Info, ShieldAlert, X
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
        <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-[#0c0c0c] text-gray-500 dark:text-[#444] gap-3 text-sm">
            <Loader2 className="animate-spin text-orange-500" size={24} /> Carregando caixa...
        </div>
    );

    if (!activeSession) {
        return (
            <div className="flex-1 flex items-center justify-center p-8 bg-gray-50 dark:bg-[#0c0c0c] text-gray-900 dark:text-white font-sans transition-colors">
                <div className="w-full max-w-xl bg-white dark:bg-[#111] p-10 rounded-[28px] border border-gray-200 dark:border-white/[0.06] text-center shadow-xl dark:shadow-2xl">
                    <div className="w-20 h-20 bg-orange-100 dark:bg-orange-600/10 border border-orange-200 dark:border-orange-500/20 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-lg shadow-orange-500/10 dark:shadow-orange-900/10">
                        <Wallet size={40} className="text-orange-600 dark:text-orange-500" />
                    </div>
                    <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-2 uppercase tracking-wide">Abertura de Caixa</h2>
                    <p className="text-xs text-gray-500 dark:text-[#555] mb-10 font-bold uppercase tracking-widest">Informe o saldo inicial para troco</p>

                    <div className="space-y-8">
                        <div className="text-left">
                            <label className="text-xs font-bold text-gray-500 dark:text-[#aaaaaa] uppercase mb-3 block tracking-widest ml-1">Saldo em Dinheiro (Físico)</label>
                            <div className="relative">
                                <span className="absolute left-6 top-1/2 -translate-y-1/2 font-black text-gray-400 dark:text-[#555] text-2xl">R$</span>
                                <input
                                    className="w-full bg-gray-50 dark:bg-[#0a0a0a] border border-gray-200 dark:border-white/[0.07] rounded-2xl pl-16 pr-6 py-6 text-4xl font-black outline-none focus:border-orange-500/60 transition-all text-gray-900 dark:text-white placeholder:text-gray-300 dark:placeholder:text-[#333] shadow-inner dark:shadow-none"
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
                            className="w-full bg-orange-600 text-white font-black text-sm uppercase tracking-widest py-5 rounded-2xl hover:bg-orange-500 hover:scale-[1.02] disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:scale-100 transition-all shadow-xl shadow-orange-600/20 dark:shadow-orange-900/20"
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
        <div className="flex-1 flex flex-col p-6 lg:p-8 gap-8 bg-gray-50 dark:bg-[#0c0c0c] text-gray-900 dark:text-white overflow-y-auto font-sans transition-colors" style={{ scrollbarWidth: 'thin' }}>
            <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 shrink-0 border-b border-gray-200 dark:border-white/[0.05] pb-6">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-orange-100 dark:bg-orange-600/10 border border-orange-200 dark:border-orange-500/20 rounded-2xl flex items-center justify-center text-orange-600 dark:text-orange-500 shadow-sm dark:shadow-none">
                        <Wallet size={28} />
                    </div>
                    <div>
                        <h2 className="text-xl font-black text-gray-900 dark:text-white uppercase mb-1.5 tracking-tight">Caixa e Conciliação</h2>
                        <p className="text-xs font-bold text-gray-500 dark:text-[#555] uppercase tracking-widest flex items-center gap-2">
                            <span>Operador: {activeSession.openedBy}</span>
                            <span className="w-1.5 h-1.5 rounded-full bg-gray-300 dark:bg-[#333]" />
                            <span>Início: {new Date(activeSession.openedAt).toLocaleTimeString()}</span>
                        </p>
                    </div>
                </div>
                <div className="text-right bg-white dark:bg-transparent p-4 dark:p-0 rounded-2xl shadow-sm dark:shadow-none border border-gray-100 dark:border-none">
                    <p className="text-xs font-bold text-gray-500 dark:text-[#555] uppercase tracking-widest mb-1.5">Esperado em Espécie</p>
                    <p className="text-4xl font-black text-emerald-600 dark:text-emerald-400">R$ {expectedBalance.toFixed(2)}</p>
                </div>
            </header>
 
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 pb-8">
                <div className="xl:col-span-2 space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-white dark:bg-[#111] p-6 rounded-[24px] border border-gray-200 dark:border-white/[0.05] shadow-sm dark:shadow-none flex flex-col justify-center">
                            <p className="text-xs font-bold text-gray-500 dark:text-[#555] uppercase tracking-widest mb-2 flex items-center gap-2"><DollarSign size={16}/> Abertura</p>
                            <p className="text-2xl font-black text-gray-900 dark:text-white">R$ {activeSession.initialAmount.toFixed(2)}</p>
                        </div>
                        <div className="bg-emerald-50 dark:bg-emerald-500/5 p-6 rounded-[24px] border border-emerald-100 dark:border-emerald-500/10 shadow-sm dark:shadow-none flex flex-col justify-center">
                            <p className="text-xs font-bold text-emerald-600 dark:text-emerald-500 uppercase tracking-widest mb-2 flex items-center gap-2"><TrendingUp size={16}/> Entradas</p>
                            <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">R$ {totalCashIn.toFixed(2)}</p>
                        </div>
                        <div className="bg-red-50 dark:bg-red-500/5 p-6 rounded-[24px] border border-red-100 dark:border-red-500/10 shadow-sm dark:shadow-none flex flex-col justify-center">
                            <p className="text-xs font-bold text-red-600 dark:text-red-500 uppercase tracking-widest mb-2 flex items-center gap-2"><TrendingDown size={16}/> Saídas</p>
                            <p className="text-2xl font-black text-red-600 dark:text-red-400">R$ {totalCashOut.toFixed(2)}</p>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-[#111] border border-gray-200 dark:border-white/[0.05] rounded-[24px] shadow-sm dark:shadow-none flex flex-col h-full min-h-[400px]">
                        <div className="px-6 py-5 border-b border-gray-100 dark:border-white/[0.05] flex items-center justify-between">
                            <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-2.5">
                                <History size={18} className="text-orange-500" /> Movimentações
                            </h3>
                            <span className="text-xs text-gray-500 dark:text-[#555] font-bold uppercase tracking-widest px-3 py-1 bg-gray-50 dark:bg-white/5 rounded-lg border border-gray-100 dark:border-white/[0.05]">{activeSession.transactions.length} registros</span>
                        </div>
                        <div className="flex-1 overflow-y-auto divide-y divide-gray-100 dark:divide-white/[0.03] p-2" style={{ scrollbarWidth: 'thin' }}>
                            {activeSession.transactions.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center p-10 text-center text-gray-400 dark:text-[#555] gap-4">
                                    <History size={48} className="opacity-20" />
                                    <span className="text-xs font-bold uppercase tracking-widest">Aguardando lançamentos...</span>
                                </div>
                            ) : (
                                activeSession.transactions.slice().reverse().map((t: any, i: number) => (
                                    <div key={`cash-log-${i}`} className="px-6 py-5 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors rounded-xl">
                                        <div className="flex items-center gap-5">
                                            <div className={`p-3 rounded-2xl border ${t.type === 'in' ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-500 border-emerald-200 dark:border-emerald-500/20' : 'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-500 border-red-200 dark:border-red-500/20'}`}>
                                                {t.type === 'in' ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-tight">{t.description}</p>
                                                <p className="text-xs text-gray-500 dark:text-[#555] font-bold uppercase tracking-widest mt-1">{t.type === 'in' ? 'Suprimento' : 'Sangria'}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <span className={`text-lg font-black ${t.type === 'in' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                                                {t.type === 'in' ? '+' : '-'} R$ {t.amount.toFixed(2)}
                                            </span>
                                            <p className="text-xs text-gray-500 dark:text-[#555] font-bold mt-1">{new Date(t.date || Date.now()).toLocaleTimeString()}</p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex flex-col gap-8">
                    <section className="bg-white dark:bg-[#111] border border-gray-200 dark:border-white/[0.05] rounded-[24px] p-8 space-y-6 shadow-sm dark:shadow-none">
                        <div className="flex items-center gap-2.5 font-black text-sm text-gray-900 dark:text-white uppercase tracking-widest">
                            <Plus size={18} className="text-orange-500" /> Sangria / Suprimento
                        </div>
                        <div className="space-y-4">
                            <div className="flex p-1.5 bg-gray-50 dark:bg-[#0a0a0a] border border-gray-200 dark:border-white/[0.05] rounded-2xl">
                                <button onClick={() => setTransaction({ ...transaction, type: 'in' })} className={`flex-1 py-3 text-xs font-black uppercase tracking-widest rounded-xl transition-all ${transaction.type === 'in' ? 'bg-emerald-600 text-white shadow-md' : 'text-gray-500 dark:text-[#555] hover:text-gray-900 dark:hover:text-white'}`}>Suprimento</button>
                                <button onClick={() => setTransaction({ ...transaction, type: 'out' })} className={`flex-1 py-3 text-xs font-black uppercase tracking-widest rounded-xl transition-all ${transaction.type === 'out' ? 'bg-red-600 text-white shadow-md' : 'text-gray-500 dark:text-[#555] hover:text-gray-900 dark:hover:text-white'}`}>Sangria</button>
                            </div>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-bold text-gray-400 dark:text-[#555]">R$</span>
                                <input className="w-full bg-gray-50 dark:bg-[#0a0a0a] border border-gray-200 dark:border-white/[0.06] rounded-2xl pl-12 pr-4 py-4 text-xl font-black outline-none focus:border-orange-500/50 text-gray-900 dark:text-white transition-all placeholder:text-gray-400 dark:placeholder:text-[#333] shadow-inner dark:shadow-none" type="number" value={transaction.amount} onChange={e => setTransaction({ ...transaction, amount: e.target.value })} placeholder="0.00" />
                            </div>
                            <input className="w-full bg-gray-50 dark:bg-[#0a0a0a] border border-gray-200 dark:border-white/[0.06] rounded-2xl px-5 py-4 text-sm font-bold uppercase tracking-tight outline-none focus:border-orange-500/50 text-gray-900 dark:text-white transition-all placeholder:text-gray-400 dark:placeholder:text-[#444] shadow-inner dark:shadow-none" value={transaction.description} onChange={e => setTransaction({ ...transaction, description: e.target.value })} placeholder="Justificativa da transação..." />
                            <button onClick={handleTransaction} className="w-full bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/[0.05] text-gray-700 dark:text-[#aaa] font-black text-xs uppercase tracking-widest py-4 hover:bg-gray-200 hover:text-gray-900 dark:hover:text-white dark:hover:bg-white/10 rounded-2xl transition-all">Lançar Ajuste</button>
                        </div>
                    </section>

                    <section className="bg-red-50 dark:bg-red-500/5 border border-red-200 dark:border-red-500/20 rounded-[24px] p-8 space-y-8 shadow-sm dark:shadow-none">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 bg-red-100 dark:bg-red-500/10 text-red-600 dark:text-red-500 rounded-2xl flex items-center justify-center border border-red-200 dark:border-red-500/20">
                                <Lock size={24} />
                            </div>
                            <div>
                                <h3 className="text-lg font-black text-red-600 dark:text-red-400 uppercase tracking-tight">Fechamento do Dia</h3>
                                <p className="text-xs text-red-500/80 dark:text-red-500/60 font-bold uppercase tracking-widest mt-1">Conferência Física</p>
                            </div>
                        </div>
                        <div className="space-y-6">
                            <div className="relative">
                                <span className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-[#555] font-black text-2xl">R$</span>
                                <input className="w-full bg-white dark:bg-[#0a0a0a] border border-red-300 dark:border-red-500/20 rounded-2xl pl-16 pr-5 py-5 text-3xl font-black outline-none focus:bg-white dark:focus:bg-[#111] focus:border-red-500/50 transition-all text-gray-900 dark:text-white placeholder:text-gray-300 dark:placeholder:text-[#333] shadow-inner dark:shadow-none bg-red-50/50" type="number" value={finalAmount} onChange={e => setFinalAmount(e.target.value)} placeholder="0.00" />
                            </div>
                            <div className="p-5 bg-orange-50 dark:bg-orange-500/10 rounded-2xl flex items-start gap-3 border border-orange-200 dark:border-orange-500/20">
                                <Info size={20} className="text-orange-600 dark:text-orange-500 mt-0.5 shrink-0" />
                                <p className="text-xs text-orange-800 dark:text-orange-200/80 leading-relaxed font-bold uppercase tracking-widest">
                                    O sistema comparará o valor informado com o esperado <span className="text-emerald-600 dark:text-emerald-400 font-black">(R$ {expectedBalance.toFixed(2)})</span> para gerar relatórios na nuvem.
                                </p>
                            </div>
                            <button onClick={handleClose} disabled={!finalAmount} className="w-full bg-red-600 text-white font-black text-sm uppercase tracking-widest py-5 rounded-2xl hover:bg-red-500 hover:scale-[1.02] transition-all disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:scale-100 shadow-xl shadow-red-600/20 dark:shadow-red-900/30 flex items-center justify-center gap-3">
                                Encerrar Expediente <ArrowRight size={18} />
                            </button>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
}
