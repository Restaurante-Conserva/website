"use client";

import { useMemo, useState } from 'react';
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
    PieChart, Pie, Cell, AreaChart, Area, Legend
} from 'recharts';
import { TrendingUp, ShoppingBag, CreditCard, PieChart as PieIcon, BarChart3, Calendar, X } from 'lucide-react';

import { Sale } from '../../context/GlobalContext';

interface ReportsViewProps {
    sales: Sale[];
}

const COLORS = ['#f97316', '#0ea5e9', '#10b981', '#6366f1', '#ec4899', '#8b5cf6', '#eab308'];

export default function ReportsView({ sales }: ReportsViewProps) {
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');

    const filteredSales = useMemo(() => {
        return sales.filter(s => {
            const saleDate = s.date ? new Date(s.date) : null;
            if (dateFrom && saleDate && saleDate < new Date(dateFrom + 'T00:00:00')) return false;
            if (dateTo && saleDate && saleDate > new Date(dateTo + 'T23:59:59')) return false;
            return true;
        });
    }, [sales, dateFrom, dateTo]);

    // 1. Vendas por Categoria (Pie)
    const categoryData = useMemo(() => {
        const map: Record<string, number> = {};
        filteredSales.forEach(s => {
            s.items.forEach(item => {
                const cat = item.category || 'Outros';
                map[cat] = (map[cat] || 0) + (item.quantity * item.price);
            });
        });
        return Object.entries(map).map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value);
    }, [filteredSales]);

    // 2. Evolução de Receita (Area)
    const revenueEvolution = useMemo(() => {
        const map: Record<string, number> = {};
        filteredSales.forEach(s => {
            const date = new Date(s.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
            map[date] = (map[date] || 0) + s.total;
        });
        return Object.entries(map).map(([date, total]) => ({ date, total }))
            .sort((a, b) => {
                const [d1, m1] = a.date.split('/').map(Number);
                const [d2, m2] = b.date.split('/').map(Number);
                return (m1 * 100 + d1) - (m2 * 100 + d2);
            });
    }, [filteredSales]);

    // 3. Fluxo por Horário (Bar)
    const hourlyData = useMemo(() => {
        const hours = Array.from({ length: 24 }, (_, i) => ({
            hour: `${i}h`,
            vendas: 0,
            receita: 0
        }));

        filteredSales.forEach(s => {
            const h = new Date(s.date).getHours();
            hours[h].vendas++;
            hours[h].receita += s.total;
        });

        return hours.filter(h => h.vendas > 0 || (Number(h.hour.replace('h','')) > 8 && Number(h.hour.replace('h','')) < 22));
    }, [filteredSales]);

    // 4. Métodos de Pagamento (Bar horizontal)
    const paymentData = useMemo(() => {
        const map: Record<string, number> = {};
        filteredSales.forEach(s => {
            s.payments.forEach(p => {
                const m = p.method === 'money' ? 'Dinheiro' : p.method.toUpperCase();
                map[m] = (map[m] || 0) + p.amount;
            });
        });
        return Object.entries(map).map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value);
    }, [filteredSales]);

    const stats = useMemo(() => {
        const total = filteredSales.reduce((acc, s) => acc + s.total, 0);
        const count = filteredSales.length;
        const items = filteredSales.reduce((acc, s) => acc + s.items.reduce((sum, i) => sum + i.quantity, 0), 0);
        return { total, count, items };
    }, [filteredSales]);

    return (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Relatórios & Análises</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Visão geral do desempenho</p>
                </div>
                <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5 bg-white dark:bg-[#0a0a0a] border border-gray-100 dark:border-[#1a1a1a] rounded-md px-2 py-1">
                        <Calendar size={12} className="text-gray-400" />
                        <input 
                            type="date" 
                            className="bg-transparent border-none outline-none text-[10px] font-medium text-gray-600 dark:text-gray-400 w-24"
                            value={dateFrom}
                            onChange={e => setDateFrom(e.target.value)}
                        />
                        <span className="text-gray-300 dark:text-[#222]">/</span>
                        <input 
                            type="date" 
                            className="bg-transparent border-none outline-none text-[10px] font-medium text-gray-600 dark:text-gray-400 w-24"
                            value={dateTo}
                            onChange={e => setDateTo(e.target.value)}
                        />
                        {(dateFrom || dateTo) && (
                            <button onClick={() => { setDateFrom(''); setDateTo(''); }} className="ml-1 p-0.5 hover:bg-gray-100 dark:hover:bg-[#1a1a1a] rounded text-gray-400 border-none bg-transparent cursor-pointer">
                                <X size={10} />
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="bg-white dark:bg-[#0a0a0a] border border-gray-100 dark:border-[#1a1a1a] p-4 rounded-lg shadow-sm">
                    <div className="flex items-center gap-2 mb-1">
                        <TrendingUp size={14} className="text-orange-500" />
                        <span className="text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Receita Total</span>
                    </div>
                    <div className="text-lg font-semibold text-gray-900 dark:text-gray-100 tabular-nums">R$ {stats.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                </div>
                <div className="bg-white dark:bg-[#0a0a0a] border border-gray-100 dark:border-[#1a1a1a] p-4 rounded-lg shadow-sm">
                    <div className="flex items-center gap-2 mb-1">
                        <ShoppingBag size={14} className="text-blue-500" />
                        <span className="text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total de Vendas</span>
                    </div>
                    <div className="text-lg font-semibold text-gray-900 dark:text-gray-100 tabular-nums">{stats.count}</div>
                </div>
                <div className="bg-white dark:bg-[#0a0a0a] border border-gray-100 dark:border-[#1a1a1a] p-4 rounded-lg shadow-sm">
                    <div className="flex items-center gap-2 mb-1">
                        <BarChart3 size={14} className="text-emerald-500" />
                        <span className="text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Itens Vendidos</span>
                    </div>
                    <div className="text-lg font-semibold text-gray-900 dark:text-gray-100 tabular-nums">{stats.items}</div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Evolução de Receita */}
                <div className="bg-white dark:bg-[#0a0a0a] border border-gray-100 dark:border-[#1a1a1a] p-5 rounded-lg shadow-sm">
                    <div className="flex items-center gap-2 mb-6">
                        <div className="p-1.5 bg-orange-50 dark:bg-orange-500/10 rounded text-orange-600"><TrendingUp size={14} /></div>
                        <h4 className="text-xs font-semibold text-gray-900 dark:text-gray-100">Faturamento</h4>
                    </div>
                    <div className="h-[200px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={revenueEvolution}>
                                <defs>
                                    <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#f97316" stopOpacity={0.1}/>
                                        <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#88888822" />
                                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#666'}} />
                                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#666'}} />
                                <Tooltip 
                                    contentStyle={{ backgroundColor: '#000', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '11px' }}
                                    itemStyle={{ color: '#fff' }}
                                />
                                <Area type="monotone" dataKey="total" stroke="#f97316" fillOpacity={1} fill="url(#colorTotal)" strokeWidth={2} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Categorias */}
                <div className="bg-white dark:bg-[#0a0a0a] border border-gray-100 dark:border-[#1a1a1a] p-5 rounded-lg shadow-sm">
                    <div className="flex items-center gap-2 mb-6">
                        <div className="p-1.5 bg-blue-50 dark:bg-blue-500/10 rounded text-blue-600"><PieIcon size={14} /></div>
                        <h4 className="text-xs font-semibold text-gray-900 dark:text-gray-100">Mix de Produtos</h4>
                    </div>
                    <div className="h-[200px] flex items-center">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={categoryData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {categoryData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip 
                                    contentStyle={{ backgroundColor: '#000', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '11px' }}
                                />
                                <Legend iconType="circle" wrapperStyle={{ fontSize: '10px' }} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Horários */}
                <div className="bg-white dark:bg-[#0a0a0a] border border-gray-100 dark:border-[#1a1a1a] p-5 rounded-lg shadow-sm">
                    <div className="flex items-center gap-2 mb-6">
                        <div className="p-1.5 bg-emerald-50 dark:bg-emerald-500/10 rounded text-emerald-600"><BarChart3 size={14} /></div>
                        <h4 className="text-xs font-semibold text-gray-900 dark:text-gray-100">Fluxo por Horário</h4>
                    </div>
                    <div className="h-[200px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={hourlyData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#88888822" />
                                <XAxis dataKey="hour" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#666'}} />
                                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#666'}} />
                                <Tooltip 
                                    contentStyle={{ backgroundColor: '#000', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '11px' }}
                                />
                                <Bar dataKey="vendas" fill="#10b981" radius={[2, 2, 0, 0]} barSize={20} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Pagamento */}
                <div className="bg-white dark:bg-[#0a0a0a] border border-gray-100 dark:border-[#1a1a1a] p-5 rounded-lg shadow-sm">
                    <div className="flex items-center gap-2 mb-6">
                        <div className="p-1.5 bg-purple-50 dark:bg-purple-500/10 rounded text-purple-600"><CreditCard size={14} /></div>
                        <h4 className="text-xs font-semibold text-gray-900 dark:text-gray-100">Meios de Pagamento</h4>
                    </div>
                    <div className="h-[200px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={paymentData} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#88888822" />
                                <XAxis type="number" hide />
                                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#666'}} width={70} />
                                <Tooltip 
                                    contentStyle={{ backgroundColor: '#000', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '11px' }}
                                />
                                <Bar dataKey="value" fill="#8b5cf6" radius={[0, 2, 2, 0]} barSize={12} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
}
