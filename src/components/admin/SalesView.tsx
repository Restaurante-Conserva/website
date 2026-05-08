"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { Search, Download, Filter, ChevronDown, ChevronRight, Calendar, X, FileSpreadsheet, Loader2, Eye } from 'lucide-react';

import { Sale, Payment, SaleItem } from '../../context/GlobalContext';

interface SalesViewProps {
    sales: Sale[];
    onSelectSale?: (sale: Sale) => void;
}

const METHOD_LABEL: Record<string, string> = {
    money: 'Dinheiro', cash: 'Dinheiro', card: 'Cartão',
    credit: 'Crédito', debit: 'Débito', pix: 'PIX', fiado: 'Fiado'
};

const formatMethod = (method: string) => METHOD_LABEL[method?.toLowerCase()] || method;

export default function SalesView({ sales, onSelectSale }: SalesViewProps) {
    const [search, setSearch] = useState('');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [productFilter, setProductFilter] = useState('');
    const [methodFilter, setMethodFilter] = useState('');
    const [expandedSale, setExpandedSale] = useState<string | null>(null);
    const [showExportPanel, setShowExportPanel] = useState(false);
    
    const [localSales, setLocalSales] = useState<Sale[]>(sales);
    const [isExporting, setIsExporting] = useState(false);
    const [isFetching, setIsFetching] = useState(false);
    const [exportType, setExportType] = useState<'sales' | 'products'>('sales');

    // Update local sales when prop changes (initial load)
    useEffect(() => {
        if (sales && sales.length > 0) {
            setLocalSales(sales);
        }
    }, [sales]);

    // Initial fetch to get "everything" immediately (limit 10000)
    useEffect(() => {
        const fetchInitial = async () => {
            try {
                const res = await fetch('/api/sales?limit=10000');
                if (res.ok) {
                    const data = await res.json();
                    setLocalSales(data);
                }
            } catch (e) {
                console.error("Erro no fetch inicial de vendas:", e);
            }
        };
        fetchInitial();
    }, []);

    // ── Derive quick-select months ──────────────────────────────────
    const setThisMonth = () => {
        const now = new Date();
        const first = new Date(now.getFullYear(), now.getMonth(), 1);
        const last = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        setDateFrom(first.toISOString().slice(0, 10));
        setDateTo(last.toISOString().slice(0, 10));
    };
    const setLastMonth = () => {
        const now = new Date();
        const first = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const last = new Date(now.getFullYear(), now.getMonth(), 0);
        setDateFrom(first.toISOString().slice(0, 10));
        setDateTo(last.toISOString().slice(0, 10));
    };
    // ── Filtered sales (local view) ──────────────────────────────────
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 50;

    // Reset page when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [search, dateFrom, dateTo, productFilter, methodFilter]);

    const filtered = useMemo(() => {
        return localSales.filter(s => {
            const saleDate = s.date ? new Date(s.date) : null;
            if (dateFrom && saleDate && saleDate < new Date(dateFrom + 'T00:00:00')) return false;
            if (dateTo && saleDate && saleDate > new Date(dateTo + 'T23:59:59')) return false;

            const query = search.toLowerCase();
            if (query) {
                const matchCustomer = (s.customerName || '').toLowerCase().includes(query);
                const matchId = (s._id || '').toLowerCase().includes(query);
                const matchEmployee = (s.employee || '').toLowerCase().includes(query);
                const matchDate = saleDate ? saleDate.toLocaleDateString('pt-BR').includes(query) : false;
                if (!matchCustomer && !matchId && !matchEmployee && !matchDate) return false;
            }

            if (methodFilter) {
                const hasMeth = (s.payments || []).some(p => p.method?.toLowerCase() === methodFilter);
                if (!hasMeth) return false;
            }

            if (productFilter) {
                const hasProduct = (s.items || []).some(i =>
                    (i.name || '').toLowerCase().includes(productFilter.toLowerCase())
                );
                if (!hasProduct) return false;
            }

            return true;
        });
    }, [localSales, search, dateFrom, dateTo, methodFilter, productFilter]);

    const totalRevenue = filtered.reduce((acc, s) => acc + (s.total || 0), 0);
    const totalItems = filtered.reduce((acc, s) => acc + (s.items?.length || 0), 0);

    const paginatedSales = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return filtered.slice(startIndex, startIndex + itemsPerPage);
    }, [filtered, currentPage]);
    
    const totalPages = Math.ceil(filtered.length / itemsPerPage);

    // ── Fetch Filtered Sales from API (for Period View) ──────────────
    const fetchFilteredSales = async () => {
        setIsFetching(true);
        try {
            let url = '/api/sales?limit=5000'; 
            if (dateFrom) url += `&from=${dateFrom}`;
            if (dateTo) url += `&to=${dateTo}`;
            const res = await fetch(url);
            if (res.ok) {
                const data = await res.json();
                setLocalSales(data);
            }
        } catch (e) {
            console.error("Erro ao buscar vendas do período:", e);
        } finally {
            setIsFetching(false);
        }
    };

    // ── Export CSV ──────────────────────────────────────────────────
    const handleExport = async () => {
        setIsExporting(true);
        try {
            // Fetch ALL sales for the period (unlimited for export)
            let url = '/api/sales?limit=10000'; 
            if (dateFrom) url += `&from=${dateFrom}`;
            if (dateTo) url += `&to=${dateTo}`;
            
            const res = await fetch(url);
            if (!res.ok) throw new Error("Falha ao buscar dados para exportação");
            
            const allPeriodSales: Sale[] = await res.json();
            
            // Apply local secondary filters
            const exportSet = allPeriodSales.filter(s => {
                const query = search.toLowerCase();
                if (query) {
                    const saleDate = s.date ? new Date(s.date) : null;
                    const matchCustomer = (s.customerName || '').toLowerCase().includes(query);
                    const matchId = (s._id || '').toLowerCase().includes(query);
                    const matchEmployee = (s.employee || '').toLowerCase().includes(query);
                    const matchDate = saleDate ? saleDate.toLocaleDateString('pt-BR').includes(query) : false;
                    if (!matchCustomer && !matchId && !matchEmployee && !matchDate) return false;
                }
                if (methodFilter) {
                    const hasMeth = (s.payments || []).some(p => p.method?.toLowerCase() === methodFilter);
                    if (!hasMeth) return false;
                }
                if (productFilter) {
                    const hasProduct = (s.items || []).some(i => (i.name || '').toLowerCase().includes(productFilter.toLowerCase()));
                    if (!hasProduct) return false;
                }
                return true;
            });

            if (!exportSet.length) {
                alert("Nenhuma venda encontrada para exportar com estes filtros.");
                return;
            }

            let csv = '';
            let filename = '';

            if (exportType === 'sales') {
                const headers = ['ID Venda', 'Data', 'Hora', 'Operador', 'Cliente', 'Produto', 'Volume', 'Qtd', 'Preço Unit. (R$)', 'Total Item (R$)', 'Total Venda (R$)', 'Pagamentos'];
                csv = "\uFEFF" + headers.join(';') + '\n';
                exportSet.forEach(sale => {
                    const d = sale.date ? new Date(sale.date) : new Date();
                    const data = d.toLocaleDateString('pt-BR');
                    const hora = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
                    const id = sale._id || '';
                    const operador = sale.employee || 'Sistema';
                    const cliente = sale.customerName || 'Venda Avulsa';
                    const totalVenda = (sale.total || 0).toFixed(2).replace('.', ',');
                    const pagamentos = (sale.payments || []).map(p => `${formatMethod(p.method)} (R$ ${(p.amount || 0).toFixed(2).replace('.', ',')})`).join(' | ');
                    
                    const items = sale.items && sale.items.length > 0 ? sale.items : [null];
                    items.forEach((item, index) => {
                        const isFirst = index === 0;
                        const row = [
                            isFirst ? id : '', 
                            isFirst ? data : '', 
                            isFirst ? hora : '', 
                            isFirst ? operador : '', 
                            isFirst ? cliente : '',
                            item ? (item.name || 'Item') : 'N/A',
                            item ? (item.volume || '—') : '—',
                            item ? String(item.quantity || 1) : '—',
                            item ? (item.price || 0).toFixed(2).replace('.', ',') : '—',
                            item ? ((item.price || 0) * (item.quantity || 1)).toFixed(2).replace('.', ',') : '—',
                            isFirst ? totalVenda : '',
                            isFirst ? pagamentos : ''
                        ].map(v => `"${String(v).replace(/"/g, '""')}"`);
                        csv += row.join(';') + '\n';
                    });
                });
                filename = 'relatorio_vendas';
            } else {
                // Product Summary
                csv = "\uFEFFPRODUTO;VOLUME;QNT_TOTAL;VALOR_TOTAL_VENDIDO\n";
                const productMap: Record<string, { name: string, volume: string, qty: number, total: number }> = {};
                
                exportSet.forEach(sale => {
                    (sale.items || []).forEach(item => {
                        const key = `${item.name}-${item.volume}`;
                        if (!productMap[key]) {
                            productMap[key] = { 
                                name: item.name || 'Produto', 
                                volume: item.volume || '—', 
                                qty: 0, 
                                total: 0 
                            };
                        }
                        productMap[key].qty += (item.quantity || 1);
                        productMap[key].total += ((item.price || 0) * (item.quantity || 1));
                    });
                });

                Object.values(productMap).forEach(p => {
                    const row = [
                        p.name, p.volume, String(p.qty), (p.total || 0).toFixed(2).replace('.', ',')
                    ].map(v => `"${String(v).replace(/"/g, '""')}"`);
                    csv += row.join(';') + '\n';
                });
                filename = 'resumo_produtos';
            }

            const dateLabel = dateFrom && dateTo ? `_${dateFrom}_a_${dateTo}` : `_${new Date().toISOString().slice(0, 10)}`;
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            const csvUrl = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = csvUrl;
            a.download = `${filename}${dateLabel}.csv`;
            a.click();
            URL.revokeObjectURL(csvUrl);
        } catch (error) {
            alert("Erro ao exportar: " + (error instanceof Error ? error.message : String(error)));
        } finally {
            setIsExporting(false);
        }
    };

    const hasFilters = dateFrom || dateTo || methodFilter || productFilter || search;

    return (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500">

            {/* ── Header ── */}
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-sm font-normal text-gray-900 dark:text-gray-100">Histórico de Vendas</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        {filtered.length} vendas · R$ {totalRevenue.toFixed(2)} · {totalItems} itens
                    </p>
                </div>
                    <button
                        onClick={() => setShowExportPanel(v => !v)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600/90 hover:bg-emerald-600 text-white rounded-md text-xs font-normal transition-colors border-none cursor-pointer"
                    >
                    <FileSpreadsheet size={13} />
                    Painel de Exportação
                    <ChevronDown size={12} className={`transition-transform ${showExportPanel ? 'rotate-180' : ''}`} />
                </button>
            </div>

            {/* ── Export Panel ── */}
            {showExportPanel && (
                <div className="bg-white dark:bg-[#0a0a0a] border border-gray-200 dark:border-[#222] rounded-lg p-4 space-y-4 shadow-lg animate-in slide-in-from-top-2 duration-300">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs font-normal text-gray-900 dark:text-gray-100 flex items-center gap-1.5">
                                <Filter size={12} /> Filtros de Período & Relatório
                            </p>
                            <p className="text-[10px] text-gray-500 dark:text-[#555] mt-0.5 uppercase tracking-widest">Selecione as datas para buscar dados do banco</p>
                        </div>
                        <button onClick={() => setShowExportPanel(false)} className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 border-none bg-transparent cursor-pointer">
                            <X size={14} />
                        </button>
                    </div>

                    {/* Date range */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
                        <div className="space-y-1">
                                <label className="text-[10px] font-normal text-gray-400 dark:text-[#555] uppercase tracking-widest ml-1">Data Inicial</label>
                            <div className="relative group">
                                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-[#333] group-focus-within:text-emerald-500 transition-colors" size={13} />
                                <input
                                    type="date"
                                    value={dateFrom}
                                    onChange={e => setDateFrom(e.target.value)}
                                    className="w-full bg-gray-50 dark:bg-black border border-gray-200 dark:border-[#222] rounded-md pl-9 pr-3 py-2 text-xs text-gray-900 dark:text-gray-100 outline-none focus:border-emerald-500 transition-all cursor-pointer"
                                />
                            </div>
                        </div>
                        <div className="space-y-1">
                                <label className="text-[10px] font-normal text-gray-400 dark:text-[#555] uppercase tracking-widest ml-1">Data Final</label>
                            <div className="relative group">
                                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-[#333] group-focus-within:text-emerald-500 transition-colors" size={13} />
                                <input
                                    type="date"
                                    value={dateTo}
                                    onChange={e => setDateTo(e.target.value)}
                                    className="w-full bg-gray-50 dark:bg-black border border-gray-200 dark:border-[#222] rounded-md pl-9 pr-3 py-2 text-xs text-gray-900 dark:text-gray-100 outline-none focus:border-emerald-500 transition-all cursor-pointer"
                                />
                            </div>
                        </div>
                        <div className="flex gap-1.5 h-[34px]">
                                <button onClick={setThisMonth} className="flex-1 text-[9px] font-normal uppercase tracking-widest border border-gray-200 dark:border-[#222] bg-gray-50 dark:bg-black text-gray-500 dark:text-[#666] hover:border-emerald-500 hover:text-emerald-600 rounded-md transition-all cursor-pointer">
                                Mês Atual
                            </button>
                                <button onClick={setLastMonth} className="flex-1 text-[9px] font-normal uppercase tracking-widest border border-gray-200 dark:border-[#222] bg-gray-50 dark:bg-black text-gray-500 dark:text-[#666] hover:border-emerald-500 hover:text-emerald-600 rounded-md transition-all cursor-pointer">
                                Mês Anterior
                            </button>
                        </div>
                            <button
                                onClick={fetchFilteredSales}
                                disabled={isFetching || (!dateFrom && !dateTo)}
                                className="h-[34px] bg-orange-600 text-white rounded-md text-[10px] font-normal uppercase tracking-widest hover:bg-orange-500 disabled:opacity-40 transition-all flex items-center justify-center gap-2 border-none cursor-pointer shadow-sm shadow-orange-600/10"
                            >
                            {isFetching ? <Loader2 size={12} className="animate-spin" /> : <Calendar size={12} />}
                            {isFetching ? 'BUSCANDO...' : 'CARREGAR DADOS'}
                        </button>
                    </div>

                    {/* Secondary filters & Export Type */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-4 border-t border-gray-100 dark:border-[#1a1a1a]">
                        <div className="space-y-1">
                                <label className="text-[10px] font-normal text-gray-400 dark:text-[#555] uppercase tracking-widest ml-1">Filtrar Produto no Relatório</label>
                            <div className="relative group">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-[#333] group-focus-within:text-emerald-500 transition-colors" size={13} />
                                <input
                                    type="text"
                                    placeholder="Ex: Coca-Cola, Pizza..."
                                    value={productFilter}
                                    onChange={e => setProductFilter(e.target.value)}
                                    className="w-full bg-gray-50 dark:bg-black border border-gray-200 dark:border-[#222] rounded-md pl-9 pr-3 py-2 text-xs text-gray-900 dark:text-gray-100 outline-none focus:border-emerald-500 placeholder:text-gray-400 dark:placeholder:text-[#333]"
                                />
                            </div>
                        </div>
                        <div className="space-y-1">
                                <label className="text-[10px] font-normal text-gray-400 dark:text-[#555] uppercase tracking-widest ml-1">Método de Pagamento</label>
                            <select
                                value={methodFilter}
                                onChange={e => setMethodFilter(e.target.value)}
                                className="w-full bg-gray-50 dark:bg-black border border-gray-200 dark:border-[#222] rounded-md px-3 py-2 text-xs text-gray-700 dark:text-gray-300 outline-none focus:border-emerald-500 cursor-pointer"
                            >
                                <option value="">Todos os métodos</option>
                                <option value="money">Dinheiro</option>
                                <option value="pix">PIX</option>
                                <option value="card">Cartão (Todos)</option>
                                <option value="fiado">Fiado</option>
                            </select>
                        </div>
                        <div className="space-y-1">
                                <label className="text-[10px] font-normal text-gray-400 dark:text-[#555] uppercase tracking-widest ml-1">Tipo de Exportação</label>
                            <select
                                value={exportType}
                                onChange={e => setExportType(e.target.value as 'sales' | 'products')}
                                className="w-full bg-gray-50 dark:bg-black border border-gray-200 dark:border-[#222] rounded-md px-3 py-2 text-xs text-gray-700 dark:text-gray-300 outline-none focus:border-emerald-500 cursor-pointer"
                            >
                                <option value="sales">Vendas Detalhadas (Completo)</option>
                                <option value="products">Resumo de Produtos (Quantidade)</option>
                            </select>
                        </div>
                    </div>

                    {/* Export Action */}
                    <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-[#1a1a1a]">
                        <div className="flex items-center gap-4 text-[10px] text-gray-500 dark:text-[#444] font-normal uppercase tracking-wider">
                            <span>Vendas: <span className="text-gray-900 dark:text-gray-300">{filtered.length}</span></span>
                            <span>Total: <span className="text-emerald-600 dark:text-emerald-500">R$ {totalRevenue.toFixed(2)}</span></span>
                        </div>
                            <button
                                onClick={handleExport}
                                disabled={isExporting}
                                className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white rounded-md text-[10px] font-normal uppercase tracking-widest transition-all border-none cursor-pointer shadow-sm shadow-emerald-600/10"
                            >
                            {isExporting ? <Loader2 size={12} className="animate-spin" /> : <Download size={12} />}
                            {isExporting ? 'Processando...' : 'Gerar Excel (CSV) Completo'}
                        </button>
                    </div>
                </div>
            )}

            {/* ── Search Bar ── */}
            <div className="flex gap-2">
                <div className="relative group flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-[#333] group-focus-within:text-orange-500 transition-colors" size={13} />
                    <input
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="w-full bg-gray-50 dark:bg-black border border-gray-200 dark:border-[#222] rounded-md pl-8 pr-3 py-1.5 text-xs outline-none focus:border-orange-500/50 text-gray-900 dark:text-gray-100 transition-all placeholder:text-gray-400 dark:placeholder:text-[#333]"
                        placeholder="Buscar por cliente, ID, operador ou data..."
                    />
                </div>
                {hasFilters && (
                        <button
                            onClick={() => { setSearch(''); setDateFrom(''); setDateTo(''); setMethodFilter(''); setProductFilter(''); }}
                            className="flex items-center gap-1 px-3 py-1.5 text-[10px] font-normal uppercase tracking-widest border border-red-200 dark:border-red-900/30 text-red-600 bg-red-50 dark:bg-red-500/5 rounded-md hover:bg-red-100 transition-all cursor-pointer"
                        >
                        <X size={12} /> Limpar
                    </button>
                )}
            </div>

            {/* ── Table ── */}
            <div className="border border-gray-100 dark:border-[#1a1a1a] rounded-lg overflow-hidden bg-white dark:bg-[#0a0a0a] shadow-sm dark:shadow-none">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 dark:bg-black border-b border-gray-100 dark:border-[#1a1a1a] text-gray-500 dark:text-[#444]">
                        <tr>
                            <th className="px-6 py-4 text-[10px] font-normal uppercase tracking-widest w-6"></th>
                            <th className="px-6 py-4 text-[10px] font-normal uppercase tracking-widest min-w-[140px]">Data / Hora</th>
                            <th className="px-6 py-4 text-[10px] font-normal uppercase tracking-widest min-w-[100px]">ID</th>
                            <th className="px-6 py-4 text-[10px] font-normal uppercase tracking-widest min-w-[160px]">Cliente</th>
                            <th className="px-6 py-4 text-[10px] font-normal uppercase tracking-widest min-w-[130px]">Operador</th>
                            <th className="px-6 py-4 text-[10px] font-normal uppercase tracking-widest min-w-[100px] text-center">NFC-e</th>
                            <th className="px-6 py-4 text-[10px] font-normal uppercase tracking-widest min-w-[180px]">Pagamento</th>
                            <th className="px-6 py-4 text-[10px] font-normal uppercase tracking-widest text-right min-w-[100px]">Total</th>
                            <th className="px-6 py-4 text-[10px] font-normal uppercase tracking-widest text-right w-12">Ação</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 dark:divide-[#111]">
                        {filtered.length === 0 ? (
                            <tr>
                                <td colSpan={8} className="px-4 py-12 text-center">
                                    <div className="flex flex-col items-center gap-2 opacity-40">
                                        <FileSpreadsheet size={32} />
                                        <p className="text-xs font-normal uppercase tracking-widest">Nenhuma venda no período</p>
                                    </div>
                                </td>
                            </tr>
                        ) : paginatedSales.map(sale => {
                            const saleId = sale._id || '';
                            const isExpanded = expandedSale === saleId;
                            const saleDate = sale.date ? new Date(sale.date) : null;
                            return (
                                <React.Fragment key={saleId}>
                                    <tr
                                        className={`hover:bg-gray-50 dark:hover:bg-[#111] transition-colors cursor-pointer group ${isExpanded ? 'bg-orange-50/30 dark:bg-orange-500/[0.02]' : ''}`}
                                        onClick={() => setExpandedSale(isExpanded ? null : saleId)}
                                    >
                                        <td className="px-6 py-4 text-gray-400 dark:text-[#333]">
                                            <ChevronRight size={12} className={`transition-transform ${isExpanded ? 'rotate-90 text-orange-500' : ''}`} />
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="text-xs font-normal text-gray-900 dark:text-gray-100 tabular-nums">
                                                    {saleDate ? saleDate.toLocaleDateString('pt-BR') : '—'}
                                                </span>
                                                <span className="text-[10px] font-normal text-gray-500 dark:text-[#444] tabular-nums tracking-tighter">
                                                    {saleDate ? saleDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '—'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-[10px] font-mono font-normal text-gray-500 dark:text-[#333] truncate max-w-[80px] block">
                                                {saleId.slice(-8).toUpperCase()}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-xs font-normal text-gray-700 dark:text-gray-300 truncate max-w-[120px] block">
                                                {sale.customerName || 'Avulso'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-[10px] font-normal text-gray-500 dark:text-[#444] uppercase tracking-tighter">
                                                {sale.employee || 'Sistema'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            {(sale as any).nfeStatus === 'pending' || (sale as any).nfeStatus === 'autorizado' || (sale as any).nfeStatus === 'processando_autorizacao' ? (
                                                <span className="px-2 py-0.5 rounded text-[9px] font-normal uppercase tracking-widest border bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20 text-emerald-600 dark:text-emerald-500">AUTORIZADA</span>
                                            ) : (sale as any).nfeStatus === 'cancelled' ? (
                                                <span className="px-2 py-0.5 rounded text-[9px] font-normal uppercase tracking-widest border bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-500">CANCELADA</span>
                                            ) : (sale as any).nfeStatus === 'error' ? (
                                                <span className="px-2 py-0.5 rounded text-[9px] font-normal uppercase tracking-widest border bg-orange-50 dark:bg-orange-500/10 border-orange-200 dark:border-orange-500/20 text-orange-600 dark:text-orange-500">ERRO</span>
                                            ) : (
                                                <span className="px-2 py-0.5 rounded text-[9px] font-normal uppercase tracking-widest border bg-gray-50 dark:bg-[#1a1a1a] border-gray-200 dark:border-[#222] text-gray-400 dark:text-[#555]">—</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-wrap gap-1">
                                                {(sale.payments || []).map((pm, idx) => (
                                                    <span key={idx} className="text-[9px] font-normal uppercase tracking-widest px-1.5 py-0.5 bg-gray-100 dark:bg-[#1a1a1a] text-gray-500 dark:text-[#555] rounded border border-gray-200 dark:border-[#222]">
                                                        {formatMethod(pm.method)}
                                                    </span>
                                                ))}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <span className="text-xs font-normal text-gray-900 dark:text-gray-100 tabular-nums">
                                                R$ {(sale.total || 0).toFixed(2)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button 
                                                onClick={(e) => {
                                                    e.stopPropagation(); // Prevent row expansion when clicking this button
                                                    if(onSelectSale) onSelectSale(sale);
                                                }}
                                                className="p-1.5 bg-gray-100 dark:bg-[#1a1a1a] text-gray-500 dark:text-[#555] hover:text-gray-900 dark:hover:text-gray-100 rounded border border-gray-200 dark:border-[#222] transition-colors"
                                                title="Ver Detalhes (Modal)"
                                            >
                                                <Eye size={14} />
                                            </button>
                                        </td>
                                    </tr>

                                    {/* ── Expanded items row ── */}
                                    {isExpanded && (
                                        <tr className="bg-gray-50/50 dark:bg-[#050505]">
                                            <td colSpan={8} className="px-4 py-4">
                                                <div className="ml-4 space-y-3">
                                                    <p className="text-[9px] font-normal text-gray-400 dark:text-[#333] uppercase tracking-widest">
                                                        Itens da Venda
                                                    </p>
                                                    <table className="w-full">
                                                        <thead>
                                                            <tr className="text-[9px] font-normal text-gray-400 dark:text-[#444] border-b border-gray-100 dark:border-[#1a1a1a] uppercase tracking-widest">
                                                                <th className="py-2 text-left font-normal">Qtd</th>
                                                                <th className="py-2 text-left font-normal">Item</th>
                                                                <th className="py-2 text-right font-normal">Valor Un.</th>
                                                                <th className="py-2 text-right font-normal">Total</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {(sale.items || []).map((item, iIdx) => (
                                                                <tr key={iIdx} className="text-xs border-b border-gray-50 dark:border-[#111] last:border-0">
                                                                    <td className="py-2 text-gray-800 dark:text-gray-200 font-normal">
                                                                        {item.name || 'Item'}
                                                                    </td>
                                                                    <td className="py-2 text-gray-500 dark:text-[#444] font-normal italic">
                                                                        {item.volume || '—'}
                                                                    </td>
                                                                    <td className="py-2 text-center text-gray-700 dark:text-gray-300 font-normal tabular-nums">
                                                                        {item.quantity || 1}
                                                                    </td>
                                                                    <td className="py-2 text-right text-gray-700 dark:text-gray-300 tabular-nums">
                                                                        R$ {(item.price || 0).toFixed(2)}
                                                                    </td>
                                                                    <td className="py-2 text-right font-normal text-gray-900 dark:text-gray-100 tabular-nums">
                                                                        R$ {((item.price || 0) * (item.quantity || 1)).toFixed(2)}
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                    <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-[#1a1a1a]">
                                                        <div className="flex gap-4 text-[10px] font-normal text-gray-500 dark:text-[#444] uppercase tracking-widest">
                                                            {(sale.payments || []).map((pm, idx) => (
                                                                <span key={idx} className="flex gap-1.5">
                                                                    {formatMethod(pm.method)}: <span className="text-gray-800 dark:text-gray-200">R$ {(pm.amount || 0).toFixed(2)}</span>
                                                                </span>
                                                            ))}
                                                        </div>
                                                        <span className="text-sm font-normal text-orange-600 tabular-nums">
                                                            Total: R$ {(sale.total || 0).toFixed(2)}
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </React.Fragment>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between py-2 px-4 bg-white dark:bg-[#0a0a0a] border border-gray-100 dark:border-[#1a1a1a] rounded-lg shadow-sm">
                    <span className="text-[10px] font-normal text-gray-500 dark:text-[#555] uppercase tracking-widest">
                        Página {currentPage} de {totalPages} ({filtered.length} registros)
                    </span>
                    <div className="flex gap-1.5">
                        <button
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className="px-3 py-1.5 rounded bg-gray-50 dark:bg-[#111] border border-gray-200 dark:border-[#222] text-xs font-normal text-gray-600 dark:text-[#aaa] disabled:opacity-30 hover:bg-gray-100 transition-colors"
                        >
                            Anterior
                        </button>
                        <button
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                            className="px-3 py-1.5 rounded bg-gray-50 dark:bg-[#111] border border-gray-200 dark:border-[#222] text-xs font-normal text-gray-600 dark:text-[#aaa] disabled:opacity-30 hover:bg-gray-100 transition-colors"
                        >
                            Próxima
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
