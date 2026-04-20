"use client";

import { useMemo } from 'react';
import { History, DollarSign, Users, TrendingUp, ShoppingBag, ArrowUpRight } from 'lucide-react';
import StatCard from './StatCard';

interface StatsViewProps {
    sales: any[];
    customers: any[];
}

export default function StatsView({ sales, customers }: StatsViewProps) {
    const today = new Date().toDateString();

    const todaySales = useMemo(() =>
        sales.filter((s: any) => s.date && new Date(s.date).toDateString() === today),
        [sales, today]);

    const todayRevenue = useMemo(() => todaySales.reduce((acc: number, sale: any) => acc + (sale.total || 0), 0), [todaySales]);
    const totalRevenue = useMemo(() => sales.reduce((acc: number, sale: any) => acc + (sale.total || 0), 0), [sales]);

    const avgTicket = useMemo(() =>
        sales.length > 0 ? totalRevenue / sales.length : 0,
        [totalRevenue, sales]);

    const weeklyData = useMemo(() => {
        const last7Days = Array.from({ length: 7 }).map((_, i) => {
            const date = new Date();
            date.setDate(date.getDate() - (6 - i));
            return date.toDateString();
        });

        return last7Days.map(dateStr => {
            const dayRevenue = sales
                .filter((s: any) => s.date && new Date(s.date).toDateString() === dateStr)
                .reduce((sum: number, s: any) => sum + (s.total || 0), 0);
            return { date: dateStr, amount: dayRevenue };
        });
    }, [sales]);

    const maxAmount = Math.max(...weeklyData.map(d => d.amount), 1);

    const recentSales = useMemo(() =>
        [...sales].sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5),
        [sales]);

    const paymentMethodTotals = useMemo(() => {
        const map: Record<string, number> = { money: 0, pix: 0, credit: 0, debit: 0, fiado: 0 };
        sales.forEach((s: any) => {
            (s.payments || []).forEach((p: any) => {
                if (map[p.method] !== undefined) map[p.method] += p.amount || 0;
            });
        });
        return Object.entries(map).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]);
    }, [sales]);

    const methodLabel: Record<string, string> = {
        money: 'Dinheiro', pix: 'Pix', credit: 'Crédito', debit: 'Débito', fiado: 'Fiado'
    };
    const methodColor: Record<string, string> = {
        money: 'bg-emerald-500', pix: 'bg-teal-500', credit: 'bg-blue-500', debit: 'bg-indigo-500', fiado: 'bg-orange-500'
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">

            {/* KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    title="Vendas Hoje"
                    value={todaySales.length.toString()}
                    icon={<History size={20} />}
                    trend="+12%"
                    color="text-green-500"
                    accentColor="orange"
                />
                <StatCard
                    title="Receita Hoje"
                    value={`R$ ${todayRevenue.toFixed(2)}`}
                    icon={<DollarSign size={20} />}
                    trend="+8%"
                    color="text-green-500"
                    accentColor="emerald"
                />
                <StatCard
                    title="Clientes"
                    value={customers.length.toString()}
                    icon={<Users size={20} />}
                    trend="+5%"
                    color="text-green-500"
                    accentColor="blue"
                />
                <StatCard
                    title="Ticket Médio"
                    value={`R$ ${avgTicket.toFixed(2)}`}
                    icon={<TrendingUp size={20} />}
                    trend="+3%"
                    color="text-green-500"
                    accentColor="violet"
                />
            </div>

            {/* Chart + Methods */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Weekly Revenue Chart */}
                <div className="lg:col-span-2 bg-white dark:bg-[#111] rounded-2xl border border-gray-100 dark:border-[#1a1a1a] p-7 shadow-sm dark:shadow-none">
                    <div className="flex items-start justify-between mb-8">
                        <div>
                            <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-widest">Desempenho Semanal</h3>
                            <p className="text-xs text-gray-500 dark:text-[#444] font-bold uppercase tracking-widest mt-1">Volume de vendas — últimos 7 dias</p>
                        </div>
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 dark:bg-[#0a0a0a] rounded-xl border border-gray-100 dark:border-[#1a1a1a]">
                            <div className="h-2 w-2 rounded-full bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.6)]" />
                            <span className="text-[10px] font-bold text-gray-500 dark:text-[#555] uppercase tracking-widest">Receita Bruta</span>
                        </div>
                    </div>
                    <div className="h-40 flex items-end gap-3 px-2">
                        {weeklyData.map((d, i) => (
                            <div key={`chart-bar-${i}`} className="flex-1 flex flex-col items-center gap-2 group">
                                <div className="w-full bg-gray-50 dark:bg-[#161616] rounded-t-lg group-hover:bg-gray-100 dark:group-hover:bg-[#1e1e1e] cursor-help relative h-full flex items-end border border-gray-100 dark:border-[#1a1a1a] shadow-inner dark:shadow-none overflow-hidden">
                                    <div
                                        className="w-full bg-gradient-to-t from-orange-600 to-orange-400 rounded-t-md transition-all duration-700 ease-out"
                                        style={{ height: `${d.amount > 0 ? Math.max((d.amount / maxAmount) * 100, 4) : 0}%` }}
                                    />
                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-gray-900 dark:bg-[#1a1a1a] text-white text-[10px] rounded-xl opacity-0 group-hover:opacity-100 whitespace-nowrap z-10 font-bold border border-gray-800 dark:border-[#222] shadow-2xl pointer-events-none transition-opacity">
                                        R$ {d.amount.toFixed(2)}
                                    </div>
                                </div>
                                <span className="text-[9px] font-bold text-gray-400 dark:text-[#333] uppercase tracking-widest">{new Date(d.date).toLocaleDateString('pt-BR', { weekday: 'short' })}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Payment Methods */}
                <div className="bg-white dark:bg-[#111] rounded-2xl border border-gray-100 dark:border-[#1a1a1a] p-7 shadow-sm dark:shadow-none">
                    <div className="mb-6">
                        <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-widest">Formas de Pagamento</h3>
                        <p className="text-xs text-gray-500 dark:text-[#444] font-bold uppercase tracking-widest mt-1">Distribuição do total</p>
                    </div>
                    {paymentMethodTotals.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-32 text-gray-400 dark:text-[#333]">
                            <ShoppingBag size={32} className="mb-3 opacity-30" />
                            <p className="text-xs font-bold uppercase tracking-widest text-center">Sem dados</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {paymentMethodTotals.map(([method, amount]) => {
                                const total = paymentMethodTotals.reduce((s, [,v]) => s + v, 0);
                                const pct = total > 0 ? (amount / total) * 100 : 0;
                                return (
                                    <div key={method} className="space-y-2">
                                        <div className="flex justify-between items-center">
                                            <div className="flex items-center gap-2">
                                                <div className={`w-2.5 h-2.5 rounded-full ${methodColor[method] || 'bg-gray-400'}`} />
                                                <span className="text-xs font-bold text-gray-700 dark:text-[#aaa] uppercase tracking-wider">{methodLabel[method] || method}</span>
                                            </div>
                                            <span className="text-xs font-black text-gray-900 dark:text-white">R$ {amount.toFixed(0)}</span>
                                        </div>
                                        <div className="h-1.5 bg-gray-100 dark:bg-[#1a1a1a] rounded-full overflow-hidden">
                                            <div
                                                className={`h-full ${methodColor[method] || 'bg-gray-400'} rounded-full transition-all duration-700`}
                                                style={{ width: `${pct}%` }}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* Recent Sales */}
            <div className="bg-white dark:bg-[#111] rounded-2xl border border-gray-100 dark:border-[#1a1a1a] overflow-hidden shadow-sm dark:shadow-none">
                <div className="px-7 py-5 border-b border-gray-100 dark:border-[#1a1a1a] flex items-center justify-between">
                    <div>
                        <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-widest">Últimas Vendas</h3>
                        <p className="text-xs text-gray-500 dark:text-[#444] font-bold uppercase tracking-widest mt-1">5 transações mais recentes</p>
                    </div>
                    <div className="text-xs font-bold text-gray-500 dark:text-[#444] flex items-center gap-1.5 uppercase tracking-widest">
                        <span>Total geral</span>
                        <span className="text-gray-900 dark:text-white font-black">R$ {totalRevenue.toFixed(2)}</span>
                    </div>
                </div>
                {recentSales.length === 0 ? (
                    <div className="py-16 flex flex-col items-center text-gray-400 dark:text-[#333]">
                        <History size={40} className="mb-4 opacity-30" />
                        <p className="text-xs font-black uppercase tracking-widest">Nenhuma venda registrada</p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-50 dark:divide-[#1a1a1a]">
                        {recentSales.map((s: any, i: number) => (
                            <div key={s._id || i} className="px-7 py-4 flex items-center justify-between group hover:bg-gray-50 dark:hover:bg-[#0d0d0d] transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-orange-50 dark:bg-orange-500/10 border border-orange-100 dark:border-orange-500/20 flex items-center justify-center text-orange-600 dark:text-orange-500 font-black text-sm">
                                        #{(sales.length - sales.indexOf(s)).toString().padStart(2, '0')}
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-gray-900 dark:text-white">{s.customerName || 'Cliente não identificado'}</p>
                                        <p className="text-xs font-bold text-gray-500 dark:text-[#444] uppercase tracking-widest mt-0.5">
                                            {s.date ? new Date(s.date).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : '—'}
                                            {' · '}{(s.items || []).length} {(s.items || []).length === 1 ? 'item' : 'itens'}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className="text-lg font-black text-gray-900 dark:text-white tabular-nums">R$ {(s.total || 0).toFixed(2)}</span>
                                    <ArrowUpRight size={16} className="text-gray-300 dark:text-[#333] group-hover:text-orange-500 transition-colors" />
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
