"use client";

import { useState, useEffect } from 'react';
import {
    Wallet, TrendingUp, TrendingDown, History,
    Plus, Minus, Lock, Unlock, DollarSign,
    CheckCircle2, AlertCircle, Loader2, ArrowRight,
    Calculator, Receipt, Info, ShieldAlert, X
} from 'lucide-react';

interface CashierPanelProps {
    onOpen?: () => void;
    employee?: any;
}

export default function CashierPanel({ onOpen, employee }: CashierPanelProps) {
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
            }
        } catch (e) {
            alert('Erro ao abrir caixa');
        }
    };

    const handleTransaction = async () => {
        if (!transaction.amount || !transaction.description) return;
        try {
            const res = await fetch('/api/cash', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'transaction', type: transaction.type, amount: parseFloat(transaction.amount), description: transaction.description })
            });
            if (res.ok) {
                setTransaction({ amount: '', description: '', type: 'out' });
                fetchSession();
            }
        } catch (e) {
            alert('Erro ao registrar movimentação');
        }
    };

    const handleClose = async () => {
        if (!finalAmount) return;
        if (!confirm('Deseja realmente encerrar o caixa?')) return;
        try {
            const res = await fetch('/api/cash', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'close', finalAmount: parseFloat(finalAmount), closedBy: employee?.name || 'Operador' })
            });
            if (res.ok) {
                alert('Caixa fechado com sucesso.');
                setFinalAmount('');
                fetchSession();
            }
        } catch (e) {
            alert('Erro ao fechar caixa');
        }
    };

    if (isLoading) return (
        <div className="flex-1 flex items-center justify-center bg-white text-gray-300 gap-2 text-xs font-bold uppercase transition-all">
            <Loader2 className="animate-spin" size={20} /> Carregando caixa...
        </div>
    );

    if (!activeSession) {
        return (
            <div className="flex-1 flex items-center justify-center p-8 bg-white font-sans text-sm">
                <div className="w-full max-w-sm bg-white p-8 rounded-2xl border border-gray-100 shadow-xl text-center">
                    <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-blue-100">
                        <Wallet size={32} className="text-white" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-800 mb-1 uppercase">Abertura de Caixa</h2>
                    <p className="text-[10px] text-gray-400 mb-8 font-bold uppercase tracking-wider">Informe o saldo inicial para troco</p>

                    <div className="space-y-6">
                        <div className="text-left">
                            <label className="text-[10px] font-bold text-gray-400 uppercase ml-1 mb-2 block">Saldo em Dinheiro (Fisico)</label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-gray-300">R$</span>
                                <input
                                    className="w-full bg-gray-50 border border-gray-100 rounded-xl pl-11 pr-4 py-3 text-xl font-bold outline-none focus:border-blue-500 transition-all shadow-inner"
                                    type="number"
                                    value={initialAmount}
                                    onChange={e => setInitialAmount(e.target.value)}
                                    placeholder="0,00"
                                    autoFocus
                                />
                            </div>
                        </div>
                        <button
                            onClick={handleOpen}
                            disabled={!initialAmount}
                            className="w-full bg-blue-600 text-white font-bold text-[10px] uppercase tracking-widest py-4 rounded-xl hover:bg-blue-700 disabled:bg-gray-100 disabled:text-gray-300 transition-all shadow-xl active:scale-95 shadow-blue-100"
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
        <div className="flex-1 flex flex-col p-6 md:p-8 gap-8 bg-white overflow-y-auto font-sans text-sm">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 shrink-0">
                <div>
                    <h2 className="text-xl font-bold text-gray-800 uppercase mb-1">Caixa e Conciliação</h2>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Operador: {activeSession.openedBy} • Início: {new Date(activeSession.openedAt).toLocaleTimeString()}</p>
                </div>

                <div className="flex items-center gap-10">
                    <div className="text-right">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Total Esperado em Espécie</p>
                        <p className="text-3xl font-bold tracking-tight text-blue-600">R$ {expectedBalance.toFixed(2)}</p>
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                <div className="xl:col-span-2 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-gray-50/50 p-5 rounded-xl border border-gray-100">
                            <p className="text-[9px] font-bold text-gray-400 uppercase mb-1">Abertura</p>
                            <p className="text-lg font-bold text-gray-700 tracking-tight">R$ {activeSession.initialAmount.toFixed(2)}</p>
                        </div>
                        <div className="bg-green-50/30 p-5 rounded-xl border border-green-100">
                            <p className="text-[9px] font-bold text-green-600 uppercase mb-1">Total Entradas</p>
                            <p className="text-lg font-bold text-green-700 tracking-tight">R$ {totalCashIn.toFixed(2)}</p>
                        </div>
                        <div className="bg-red-50/30 p-5 rounded-xl border border-red-100">
                            <p className="text-[9px] font-bold text-red-600 uppercase mb-1">Total Saídas</p>
                            <p className="text-lg font-bold text-red-700 tracking-tight">R$ {totalCashOut.toFixed(2)}</p>
                        </div>
                    </div>

                    <div className="bg-white border border-gray-100 rounded-2xl shadow-sm flex flex-col">
                        <div className="px-6 py-4 bg-gray-50/30 border-b border-gray-100 flex items-center justify-between">
                            <h3 className="text-[10px] font-bold text-gray-500 uppercase flex items-center gap-2">
                                <History size={14} /> Histórico de Movimentações
                            </h3>
                            <span className="text-[9px] text-gray-300 font-bold uppercase">{activeSession.transactions.length} registros</span>
                        </div>
                        <div className="max-h-[500px] overflow-y-auto divide-y divide-gray-50">
                            {activeSession.transactions.length === 0 ? (
                                <div className="p-12 text-center text-gray-300 italic text-[10px] font-medium uppercase tracking-widest">Aguardando lançamentos...</div>
                            ) : (
                                activeSession.transactions.slice().reverse().map((t: any, i: number) => (
                                    <div key={`cash-log-${i}`} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50/50 transition-colors">
                                        <div className="flex items-center gap-4">
                                            <div className={`p-2 rounded-lg ${t.type === 'in' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                                                {t.type === 'in' ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                                            </div>
                                            <div>
                                                <p className="text-xs font-bold text-gray-800 uppercase tracking-tight line-clamp-1">{t.description}</p>
                                                <p className="text-[9px] text-gray-400 font-medium uppercase">{t.type === 'in' ? 'Dinheiro / Venda' : 'Ajuste / Retirada'}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <span className={`text-xs font-bold ${t.type === 'in' ? 'text-green-600' : 'text-red-600'}`}>
                                                {t.type === 'in' ? '+' : '-'} R$ {t.amount.toFixed(2)}
                                            </span>
                                            <p className="text-[9px] text-gray-300 font-medium">{new Date(t.date || Date.now()).toLocaleTimeString()}</p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex flex-col gap-6">
                    <section className="bg-gray-50/50 border border-gray-100 rounded-2xl p-6 space-y-6">
                        <div className="flex items-center gap-2 mb-2 font-bold text-[10px] text-gray-500 uppercase tracking-wider">
                            <Plus size={14} /> Sangria ou Suprimento
                        </div>
                        <div className="space-y-4">
                            <div className="flex p-1 bg-white border border-gray-100 rounded-xl">
                                <button onClick={() => setTransaction({ ...transaction, type: 'in' })} className={`flex-1 py-2 text-[9px] font-bold uppercase rounded-lg transition-all ${transaction.type === 'in' ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-400'}`}>Suprimento</button>
                                <button onClick={() => setTransaction({ ...transaction, type: 'out' })} className={`flex-1 py-2 text-[9px] font-bold uppercase rounded-lg transition-all ${transaction.type === 'out' ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-400'}`}>Sangria</button>
                            </div>
                            <div>
                                <input className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2 text-xs font-bold outline-none focus:border-blue-500" type="number" value={transaction.amount} onChange={e => setTransaction({ ...transaction, amount: e.target.value })} placeholder="Valor R$" />
                            </div>
                            <div>
                                <input className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2 text-xs font-bold uppercase tracking-tight outline-none focus:border-blue-500" value={transaction.description} onChange={e => setTransaction({ ...transaction, description: e.target.value })} placeholder="Justificativa..." />
                            </div>
                            <button onClick={handleTransaction} className="w-full bg-gray-900 text-white font-bold text-[10px] uppercase py-3.5 rounded-xl hover:bg-black transition-all shadow-lg shadow-gray-100">Lançar Ajuste</button>
                        </div>
                    </section>

                    <section className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm space-y-6">
                        <div className="mb-2">
                            <h3 className="text-sm font-bold text-gray-800 uppercase tracking-tight">Fechamento do Dia</h3>
                            <p className="text-[9px] text-gray-400 font-bold uppercase">Conferir dinheiro físico no caixa</p>
                        </div>
                        <div className="space-y-4">
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 font-bold">R$</span>
                                <input className="w-full bg-gray-50 border border-gray-100 rounded-xl pl-10 pr-4 py-3 text-lg font-bold outline-none focus:border-red-500 transition-all shadow-inner" type="number" value={finalAmount} onChange={e => setFinalAmount(e.target.value)} placeholder="Valor Final" />
                            </div>
                            <div className="p-3 bg-blue-50 rounded-xl flex items-start gap-2 border border-blue-100">
                                <Info size={14} className="text-blue-600 mt-0.5" />
                                <p className="text-[9px] text-blue-700 leading-normal font-medium">O sistema comparará este valor com o saldo esperado para gerar o relatório de auditória.</p>
                            </div>
                            <button onClick={handleClose} disabled={!finalAmount} className="w-full bg-red-600 text-white font-bold text-[10px] uppercase py-4 rounded-xl hover:bg-red-700 transition-all shadow-xl shadow-red-100 disabled:bg-gray-100 disabled:text-gray-300 active:scale-95">Encerrar Caixa</button>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
}
