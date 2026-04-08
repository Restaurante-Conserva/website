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
        <div className="flex-1 flex items-center justify-center bg-background text-muted-foreground gap-3 text-sm font-bold uppercase transition-all">
            <Loader2 className="animate-spin" size={24} /> Carregando caixa...
        </div>
    );

    if (!activeSession) {
        return (
            <div className="flex-1 flex items-center justify-center p-8 bg-background font-sans">
                <div className="w-full max-w-md bg-card p-10 rounded-3xl border border-border shadow-2xl text-center">
                    <div className="w-20 h-20 bg-secondary rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-lg">
                        <Wallet size={40} className="text-secondary-foreground" />
                    </div>
                    <h2 className="text-2xl font-bold text-card-foreground mb-2 uppercase">Abertura de Caixa</h2>
                    <p className="text-sm text-muted-foreground mb-10 font-medium">Informe o saldo inicial para troco</p>

                    <div className="space-y-8">
                        <div className="text-left">
                            <label className="text-sm font-bold text-muted-foreground uppercase ml-1 mb-3 block">Saldo em Dinheiro (Físico)</label>
                            <div className="relative">
                                <span className="absolute left-5 top-1/2 -translate-y-1/2 text-xl font-bold text-muted-foreground/50">R$</span>
                                <input
                                    className="w-full bg-muted border border-border rounded-2xl pl-14 pr-5 py-5 text-3xl font-bold outline-none focus:border-secondary focus:bg-card transition-all text-card-foreground"
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
                            className="w-full bg-secondary text-secondary-foreground font-bold text-sm uppercase tracking-widest py-5 rounded-2xl hover:opacity-90 disabled:bg-muted disabled:text-muted-foreground transition-all shadow-xl active:scale-95"
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
        <div className="flex-1 flex flex-col p-8 md:p-10 gap-10 bg-background overflow-y-auto font-sans">
            {/* Header */}
            <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 shrink-0">
                <div>
                    <h2 className="text-2xl font-bold text-foreground uppercase mb-2">Caixa e Conciliação</h2>
                    <p className="text-sm font-medium text-muted-foreground">
                        Operador: <span className="text-card-foreground font-bold">{activeSession.openedBy}</span> 
                        <span className="mx-2">|</span> 
                        Início: <span className="text-card-foreground font-bold">{new Date(activeSession.openedAt).toLocaleTimeString()}</span>
                    </p>
                </div>

                <div className="bg-card border border-border rounded-2xl p-6 shadow-lg">
                    <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-2">Total Esperado em Espécie</p>
                    <p className="text-4xl font-black tracking-tight text-secondary tabular-nums">R$ {expectedBalance.toFixed(2)}</p>
                </div>
            </header>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                <div className="xl:col-span-2 space-y-8">
                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                        <div className="bg-card p-6 rounded-2xl border border-border shadow-sm">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2.5 bg-muted rounded-xl text-muted-foreground">
                                    <Wallet size={20} />
                                </div>
                                <p className="text-sm font-bold text-muted-foreground uppercase">Abertura</p>
                            </div>
                            <p className="text-2xl font-black text-card-foreground tracking-tight tabular-nums">R$ {activeSession.initialAmount.toFixed(2)}</p>
                        </div>
                        <div className="bg-card p-6 rounded-2xl border border-success/20 shadow-sm">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2.5 bg-success/10 rounded-xl text-success">
                                    <TrendingUp size={20} />
                                </div>
                                <p className="text-sm font-bold text-success uppercase">Total Entradas</p>
                            </div>
                            <p className="text-2xl font-black text-success tracking-tight tabular-nums">R$ {totalCashIn.toFixed(2)}</p>
                        </div>
                        <div className="bg-card p-6 rounded-2xl border border-destructive/20 shadow-sm">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2.5 bg-destructive/10 rounded-xl text-destructive">
                                    <TrendingDown size={20} />
                                </div>
                                <p className="text-sm font-bold text-destructive uppercase">Total Saídas</p>
                            </div>
                            <p className="text-2xl font-black text-destructive tracking-tight tabular-nums">R$ {totalCashOut.toFixed(2)}</p>
                        </div>
                    </div>

                    {/* Transaction History */}
                    <div className="bg-card border border-border rounded-3xl shadow-sm flex flex-col overflow-hidden">
                        <div className="px-8 py-5 bg-muted/50 border-b border-border flex items-center justify-between">
                            <h3 className="text-sm font-bold text-card-foreground uppercase flex items-center gap-3">
                                <History size={18} className="text-muted-foreground" /> Histórico de Movimentações
                            </h3>
                            <span className="text-sm text-muted-foreground font-bold">{activeSession.transactions.length} registros</span>
                        </div>
                        <div className="max-h-[450px] overflow-y-auto divide-y divide-border">
                            {activeSession.transactions.length === 0 ? (
                                <div className="p-16 text-center text-muted-foreground italic text-sm font-medium">Aguardando lançamentos...</div>
                            ) : (
                                activeSession.transactions.slice().reverse().map((t: any, i: number) => (
                                    <div key={`cash-log-${i}`} className="px-8 py-5 flex items-center justify-between hover:bg-muted/30 transition-colors">
                                        <div className="flex items-center gap-5">
                                            <div className={`p-3 rounded-xl ${t.type === 'in' ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'}`}>
                                                {t.type === 'in' ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-card-foreground uppercase tracking-tight line-clamp-1">{t.description}</p>
                                                <p className="text-sm text-muted-foreground font-medium">{t.type === 'in' ? 'Dinheiro / Venda' : 'Ajuste / Retirada'}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <span className={`text-lg font-black tabular-nums ${t.type === 'in' ? 'text-success' : 'text-destructive'}`}>
                                                {t.type === 'in' ? '+' : '-'} R$ {t.amount.toFixed(2)}
                                            </span>
                                            <p className="text-sm text-muted-foreground font-medium">{new Date(t.date || Date.now()).toLocaleTimeString()}</p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Panel */}
                <div className="flex flex-col gap-8">
                    {/* Transaction Form */}
                    <section className="bg-card border border-border rounded-3xl p-8 shadow-sm space-y-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2.5 bg-primary/10 rounded-xl text-primary">
                                <Plus size={20} />
                            </div>
                            <h3 className="text-base font-bold text-card-foreground uppercase">Sangria ou Suprimento</h3>
                        </div>
                        <div className="space-y-5">
                            <div className="flex p-1.5 bg-muted border border-border rounded-2xl">
                                <button 
                                    onClick={() => setTransaction({ ...transaction, type: 'in' })} 
                                    className={`flex-1 py-3 text-sm font-bold uppercase rounded-xl transition-all ${transaction.type === 'in' ? 'bg-secondary text-secondary-foreground shadow-sm' : 'text-muted-foreground hover:text-card-foreground'}`}
                                >
                                    Suprimento
                                </button>
                                <button 
                                    onClick={() => setTransaction({ ...transaction, type: 'out' })} 
                                    className={`flex-1 py-3 text-sm font-bold uppercase rounded-xl transition-all ${transaction.type === 'out' ? 'bg-secondary text-secondary-foreground shadow-sm' : 'text-muted-foreground hover:text-card-foreground'}`}
                                >
                                    Sangria
                                </button>
                            </div>
                            <div>
                                <label className="text-sm font-bold text-muted-foreground uppercase mb-2 block">Valor</label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-bold text-muted-foreground/50">R$</span>
                                    <input 
                                        className="w-full bg-muted border border-border rounded-2xl pl-12 pr-5 py-4 text-xl font-bold outline-none focus:border-secondary focus:bg-card transition-all text-card-foreground" 
                                        type="number" 
                                        value={transaction.amount} 
                                        onChange={e => setTransaction({ ...transaction, amount: e.target.value })} 
                                        placeholder="0,00" 
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="text-sm font-bold text-muted-foreground uppercase mb-2 block">Justificativa</label>
                                <input 
                                    className="w-full bg-muted border border-border rounded-2xl px-5 py-4 text-sm font-bold uppercase tracking-tight outline-none focus:border-secondary focus:bg-card transition-all text-card-foreground placeholder:normal-case placeholder:text-muted-foreground/50" 
                                    value={transaction.description} 
                                    onChange={e => setTransaction({ ...transaction, description: e.target.value })} 
                                    placeholder="Motivo da movimentação..." 
                                />
                            </div>
                            <button 
                                onClick={handleTransaction} 
                                className="w-full bg-foreground text-background font-bold text-sm uppercase py-4 rounded-2xl hover:opacity-90 transition-all shadow-lg active:scale-95"
                            >
                                Lançar Ajuste
                            </button>
                        </div>
                    </section>

                    {/* Close Cashier */}
                    <section className="bg-card border border-destructive/20 rounded-3xl p-8 shadow-sm space-y-6">
                        <div className="mb-4">
                            <h3 className="text-lg font-bold text-card-foreground uppercase tracking-tight flex items-center gap-3">
                                <Lock size={20} className="text-destructive" />
                                Fechamento do Dia
                            </h3>
                            <p className="text-sm text-muted-foreground font-medium mt-1">Conferir dinheiro físico no caixa</p>
                        </div>
                        <div className="space-y-5">
                            <div>
                                <label className="text-sm font-bold text-muted-foreground uppercase mb-2 block">Valor Final Conferido</label>
                                <div className="relative">
                                    <span className="absolute left-5 top-1/2 -translate-y-1/2 text-xl font-bold text-muted-foreground/50">R$</span>
                                    <input 
                                        className="w-full bg-muted border border-border rounded-2xl pl-14 pr-5 py-5 text-2xl font-bold outline-none focus:border-destructive focus:bg-card transition-all text-card-foreground" 
                                        type="number" 
                                        value={finalAmount} 
                                        onChange={e => setFinalAmount(e.target.value)} 
                                        placeholder="0,00" 
                                    />
                                </div>
                            </div>
                            <div className="p-4 bg-secondary/10 rounded-2xl flex items-start gap-3 border border-secondary/20">
                                <Info size={18} className="text-secondary mt-0.5 shrink-0" />
                                <p className="text-sm text-card-foreground leading-relaxed font-medium">O sistema comparará este valor com o saldo esperado para gerar o relatório de auditoria.</p>
                            </div>
                            <button 
                                onClick={handleClose} 
                                disabled={!finalAmount} 
                                className="w-full bg-destructive text-destructive-foreground font-bold text-sm uppercase py-5 rounded-2xl hover:opacity-90 transition-all shadow-xl disabled:bg-muted disabled:text-muted-foreground active:scale-95"
                            >
                                Encerrar Caixa
                            </button>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
}
