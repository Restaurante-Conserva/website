"use client";

import { useState, useEffect, useMemo, useRef } from 'react';
import {
    Search, User, Plus, Minus, Trash2,
    CheckCircle2, Loader2, X, Utensils, Tag, ShoppingBag, Receipt
} from 'lucide-react';
import PaymentModal from './PaymentModal';
import CustomerModal from './CustomerModal';
import DebtModal from './DebtModal';
import { useGlobal, Product } from '../context/GlobalContext';
import { useToast } from '../context/ToastContext';

interface POSViewProps {
    bridgeStatus?: 'online' | 'offline';
}

export default function POSView({ bridgeStatus = 'offline' }: POSViewProps) {
    const { products, categories, isLoading, refreshProducts, refreshCustomers } = useGlobal();
    const { showToast } = useToast();
    const [cart, setCart] = useState<any[]>([]);
    const [search, setSearch] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
    const [isPaymentOpen, setIsPaymentOpen] = useState(false);
    const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
    const [customerModalMode, setCustomerModalMode] = useState<'search' | 'register'>('search');
    const [employee, setEmployee] = useState<any>(null);
    const [showDebtorsOnly, setShowDebtorsOnly] = useState(false);
    const [visibleCount, setVisibleCount] = useState(40);
    const [isDebtModalOpen, setIsDebtModalOpen] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/exhaustive-deps
        setVisibleCount(40);
        if (scrollRef.current) scrollRef.current.scrollTop = 0;
    }, [search, selectedCategory]);

    useEffect(() => {
        const saved = localStorage.getItem('logged_employee');
        // eslint-disable-next-line react-hooks/exhaustive-deps
        if (saved) setEmployee(JSON.parse(saved));
    }, []);

    const addToCart = (p: Product) => {
        const id = p._id;
        if (!id) return;
        if (p.stock != null && p.stock <= 0) { showToast('Produto fora de estoque', 'error'); return; }
        setCart(prev => {
            const existing = prev.find(item => item._id === id);
            if (existing) return prev.map(item => item._id === id ? { ...item, quantity: item.quantity + 1, total: (item.quantity + 1) * item.price } : item);
            return [...prev, { id, name: p.name, price: p.price, quantity: 1, total: p.price }];
        });
    };

    const updateQuantity = (id: string, delta: number) => {
        setCart(prev => prev.map(item => {
            if (item.id === id) {
                const newQty = Math.max(0, item.quantity + delta);
                return { ...item, quantity: newQty, total: newQty * item.price };
            }
            return item;
        }).filter(item => item.quantity > 0));
    };

    const removeFromCart = (id: string) => setCart(prev => prev.filter(item => item.id !== id));

    const total = useMemo(() => cart.reduce((acc, item) => acc + item.total, 0), [cart]);

    const handlePaymentConfirm = async (payments: any[], isFiscal: boolean, isCustomerCopy: boolean, paidAmount: number, fiadoTaker?: string, isMerchantCopy?: boolean, discount: number = 0) => {
        const hasFiado = payments.some(p => p.method === 'fiado');
        const finalIsFiscal = hasFiado ? false : isFiscal;
        const saleData = {
            items: cart, total: total - discount, subtotal: total, discount, payments,
            paidAmount, isFiscal: finalIsFiscal, fiadoTaker,
            customer: selectedCustomer, employee: employee?.name || 'Operador',
            date: new Date().toISOString()
        };
        try {
            const res = await fetch('/api/sales', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(saleData)
            });
            if (res.ok) {
                const savedSale = await res.json();
                let printType = 'receipt';
                if (isFiscal && isCustomerCopy) printType = 'both';
                else if (isFiscal) printType = 'fiscal';
                const printerPayload = {
                    type: printType, isMerchantCopy, fiadoTaker, items: cart,
                    total: savedSale.total, subtotal: savedSale.subtotal || savedSale.total,
                    discount: savedSale.discount || 0, payments: savedSale.payments,
                    customer: savedSale.customer, paidAmount: savedSale.paidAmount,
                    date: savedSale.date, qrcode_url: savedSale.qrcode_url,
                    nfeQRCode: savedSale.nfeQRCode, nfeNumber: savedSale.nfeNumber,
                    nfeSeries: savedSale.nfeSeries, fiscalReference: savedSale.fiscalReference,
                    nfeId: savedSale.nfeId, nfeExternalUrl: savedSale.nfeExternalUrl,
                    nfeMessage: savedSale.nfeMessage, fiscalData: savedSale.fiscalData
                };
                fetch('http://localhost:7777/print', {
                    method: 'POST', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(printerPayload)
                }).catch(err => console.error("[POS] Printer offline:", err));
                setCart([]); setSelectedCustomer(null); setIsPaymentOpen(false);
                refreshProducts();
                showToast('Venda finalizada com sucesso!', 'success');
            } else {
                const errorData = await res.json();
                showToast(`Erro: ${errorData.error || 'Erro desconhecido'}`, 'error');
            }
        } catch (e) {
            showToast('Erro de conexão', 'error');
        }
    };

    const filteredProducts = useMemo(() => products.filter(p =>
        (selectedCategory ? p.category === selectedCategory : true) &&
        p.name.toLowerCase().includes(search.toLowerCase())
    ), [products, selectedCategory, search]);

    const visibleProducts = useMemo(() => filteredProducts.slice(0, visibleCount), [filteredProducts, visibleCount]);

    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const { scrollTop, clientHeight, scrollHeight } = e.currentTarget;
        if (scrollHeight - scrollTop <= clientHeight + 100) {
            setVisibleCount(prev => Math.min(prev + 40, filteredProducts.length));
        }
    };

    return (
        <div className="flex h-full bg-gray-50 dark:bg-[#0c0c0c] text-gray-900 dark:text-white overflow-hidden transition-colors">

            {/* ── Products Panel ── */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Header */}
                <div className="px-5 py-3 border-b border-gray-200 dark:border-white/[0.05] shrink-0 flex flex-wrap lg:flex-nowrap items-center justify-between gap-4">
                    <div className="flex-1 min-w-[200px]">
                        <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Vendas</h2>
                        <p className="text-[9px] text-gray-500 dark:text-[#444] font-medium uppercase tracking-widest mt-0.5">
                            Operador: {employee?.name || '—'}
                        </p>
                    </div>

                    <div className="flex items-center gap-3 w-full lg:w-auto">
                        <div className="relative flex-1 lg:w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-[#444]" size={14} />
                            <input
                                className="w-full bg-white dark:bg-[#111] border border-gray-200 dark:border-white/[0.06] rounded-lg pl-9 pr-3 py-2 text-xs text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-[#333] outline-none focus:border-orange-500/50 transition-all shadow-sm dark:shadow-none"
                                placeholder="Buscar produto..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                            />
                        </div>
                        {/* IMP Badge — strictly scoped to POSView, layout fixed to prevent overlap */}
                        <div className={`flex items-center gap-1.5 px-2.5 py-2 rounded-lg border text-[9px] font-bold uppercase tracking-widest transition-all whitespace-nowrap shadow-sm dark:shadow-none min-w-max ${
                            bridgeStatus === 'online'
                                ? 'bg-green-50 dark:bg-green-500/5 border-green-200 dark:border-green-500/20 text-green-600 dark:text-green-500'
                                : 'bg-gray-100 dark:bg-white/[0.03] border-gray-200 dark:border-white/[0.06] text-gray-500 dark:text-[#444]'
                        }`}>
                            <div className={`w-1.5 h-1.5 rounded-full ${bridgeStatus === 'online' ? 'bg-green-500' : 'bg-red-500'}`} />
                            IMP: {bridgeStatus === 'online' ? 'OK' : 'OFF'}
                        </div>
                    </div>
                </div>

                {/* Category filters */}
                <div className="flex gap-1.5 px-5 py-2.5 border-b border-gray-200 dark:border-white/[0.05] overflow-x-auto shrink-0" style={{ scrollbarWidth: 'none' }}>
                    <button
                        onClick={() => setSelectedCategory(null)}
                        className={`px-3 py-1 rounded-md text-[10px] font-semibold whitespace-nowrap transition-all ${!selectedCategory ? 'bg-orange-600 text-white shadow-sm' : 'bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-[#555] hover:bg-gray-200 dark:hover:bg-white/[0.07]'}`}
                    >
                        Todos
                    </button>
                    {categories.map(cat => (
                        <button
                            key={cat._id}
                            onClick={() => setSelectedCategory(cat._id)}
                            className={`px-3 py-1 rounded-md text-[10px] font-semibold whitespace-nowrap transition-all ${(selectedCategory === cat._id) ? 'bg-orange-600 text-white shadow-sm' : 'bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-[#555] hover:bg-gray-200 dark:hover:bg-white/[0.07]'}`}
                        >
                            {cat.name}
                        </button>
                    ))}
                </div>

                {/* Products Grid */}
                <div
                    ref={scrollRef}
                    onScroll={handleScroll}
                    className="flex-1 overflow-y-auto p-4 grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 auto-rows-min content-start"
                    style={{ scrollbarWidth: 'thin', scrollbarColor: '#1a1a1a transparent' }}
                >
                    {isLoading ? (
                        Array.from({ length: 12 }).map((_, i) => (
                            <div key={`sk-${i}`} className="aspect-square bg-gray-200 dark:bg-white/5 rounded-xl animate-pulse" />
                        ))
                    ) : visibleProducts.length === 0 ? (
                        <div className="col-span-full py-20 flex flex-col items-center gap-2 text-gray-400 dark:text-[#333]">
                            <Tag size={32} />
                            <p className="text-[10px] font-medium">Nenhum produto encontrado</p>
                        </div>
                    ) : (
                        <>
                            {visibleProducts.map(p => (
                                <button
                                    key={p._id}
                                    onClick={() => addToCart(p)}
                                    className="group bg-white dark:bg-[#111] shadow-sm dark:shadow-none border border-gray-100 dark:border-white/[0.05] rounded-xl flex flex-col transition-all hover:border-orange-500/40 hover:shadow-md dark:hover:bg-[#151515] overflow-hidden relative"
                                >
                                    <div className="w-full aspect-[4/3] bg-gray-50 dark:bg-white/[0.03] flex items-center justify-center overflow-hidden relative border-b border-gray-100 dark:border-transparent">
                                        {p.image ? (
                                            <img src={p.image} alt={p.name} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                                        ) : (
                                            <Utensils size={22} className="text-gray-300 dark:text-[#2a2a2a] group-hover:text-orange-500/40 transition-colors" />
                                        )}
                                        {p.stock != null && p.stock <= 0 && (
                                            <div className="absolute inset-0 bg-white/80 dark:bg-black/60 backdrop-blur-[1px] flex items-center justify-center">
                                                <span className="text-[9px] font-bold text-red-600 dark:text-red-400 uppercase border border-red-500/30 bg-red-100 dark:bg-red-500/10 px-2 py-0.5 rounded">Sem Estoque</span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="p-2.5">
                                        <h3 className="text-[10px] font-semibold text-gray-800 dark:text-[#bbb] leading-tight line-clamp-2 text-left h-[2.4em]">{p.name}</h3>
                                        <div className="flex items-center justify-between mt-1 pt-1 border-t border-gray-100 dark:border-transparent">
                                            <p className="text-[11px] font-bold text-orange-600 dark:text-orange-400">R$ {(p.price || 0).toFixed(2)}</p>
                                            {p.stock != null && <span className={`text-[8px] font-bold ${p.stock <= 5 ? 'text-red-500' : 'text-gray-500 dark:text-[#555]'}`}>{p.stock}un</span>}
                                        </div>
                                    </div>
                                </button>
                            ))}
                            {visibleProducts.length < filteredProducts.length && (
                                <div className="col-span-full py-4 flex justify-center">
                                    <Loader2 className="animate-spin text-orange-500" size={20} />
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* ── Cart Panel ── */}
            <aside className="w-[300px] bg-white dark:bg-[#0f0f0f] border-l border-gray-200 dark:border-white/[0.05] flex flex-col shrink-0 z-10 shadow-[-4px_0_15px_-3px_rgba(0,0,0,0.05)] dark:shadow-none">
                {/* Cart Header */}
                <div className="p-4 border-b border-gray-200 dark:border-white/[0.05] space-y-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-gray-900 dark:text-white">Carrinho</span>
                            <span className="bg-orange-100 dark:bg-orange-500/15 text-orange-600 dark:text-orange-400 px-2 py-0.5 rounded-full text-[10px] font-bold">{cart.length}</span>
                        </div>
                        {cart.length > 0 && (
                            <button onClick={() => setCart([])} className="p-1.5 rounded-lg text-gray-400 dark:text-[#444] hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all">
                                <Trash2 size={14} />
                            </button>
                        )}
                    </div>

                    {/* Customer */}
                    {selectedCustomer ? (
                        <div className="bg-gray-50 dark:bg-white/[0.04] border border-gray-200 dark:border-white/[0.06] rounded-xl p-3 space-y-2.5 shadow-sm dark:shadow-none">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-lg bg-orange-100 dark:bg-orange-600/20 text-orange-600 dark:text-orange-400 flex items-center justify-center">
                                        <User size={15} />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-[10px] font-semibold text-gray-900 dark:text-white truncate">{selectedCustomer.name}</p>
                                        <p className="text-[8px] text-gray-500 dark:text-[#555] font-medium">{selectedCustomer.phone || selectedCustomer.cpf || 'Identificado'}</p>
                                    </div>
                                </div>
                                <button onClick={() => setSelectedCustomer(null)} className="text-gray-400 hover:text-gray-800 dark:text-[#444] dark:hover:text-white transition-colors">
                                    <X size={14} />
                                </button>
                            </div>
                            <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-white/[0.04]">
                                <div>
                                    <p className="text-[7px] text-gray-500 dark:text-[#555] font-bold uppercase tracking-widest">Fidelidade</p>
                                    <p className="text-xs font-bold text-gray-900 dark:text-white">{selectedCustomer.loyaltyPoints || 0} <span className="text-[9px] text-gray-400 dark:text-[#555]">PTS</span></p>
                                </div>
                                <button onClick={() => setIsDebtModalOpen(true)} className="text-right group hover:opacity-80 transition-opacity">
                                    <p className="text-[7px] text-gray-500 dark:text-[#555] font-bold uppercase tracking-widest">Fiado</p>
                                    <p className={`text-xs font-bold ${selectedCustomer.debtBalance > 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-[#555]'}`}>
                                        R$ {(selectedCustomer.debtBalance || 0).toFixed(2)}
                                    </p>
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-1.5">
                            <button onClick={() => { setShowDebtorsOnly(true); setIsCustomerModalOpen(true); }}
                                className="w-full py-2 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-500/15 rounded-lg text-[10px] font-semibold flex items-center justify-center gap-1.5 hover:bg-red-100 dark:hover:bg-red-500/20 transition-all shadow-sm dark:shadow-none">
                                <Receipt size={12} /> Receber Fiados
                            </button>
                            <div className="flex gap-1.5">
                                <button onClick={() => { setShowDebtorsOnly(false); setCustomerModalMode('search'); setIsCustomerModalOpen(true); }}
                                    className="flex-1 py-2 bg-white dark:bg-transparent border border-gray-200 dark:border-white/[0.06] rounded-lg text-[10px] text-gray-600 dark:text-[#555] hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-white/[0.04] flex items-center justify-center gap-1.5 transition-all shadow-sm dark:shadow-none">
                                    <Search size={12} /> Identificar
                                </button>
                                <button onClick={() => { setCustomerModalMode('register'); setIsCustomerModalOpen(true); }}
                                    className="flex-1 py-2 bg-gray-50 dark:bg-white/[0.04] border border-gray-200 dark:border-white/[0.06] rounded-lg text-[10px] text-gray-600 dark:text-[#777] hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/[0.07] flex items-center justify-center gap-1.5 transition-all shadow-sm dark:shadow-none">
                                    <Plus size={12} /> Cadastrar
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Cart Items */}
                <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2 bg-gray-50/50 dark:bg-transparent" style={{ scrollbarWidth: 'thin', scrollbarColor: '#1a1a1a transparent' }}>
                    {cart.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-gray-300 dark:text-[#2a2a2a] gap-2">
                            <ShoppingBag size={36} />
                            <p className="text-[10px] font-medium text-gray-400 dark:text-[#444]">Carrinho vazio</p>
                        </div>
                    ) : (
                        cart.map((item, i) => (
                            <div key={`ci-${i}`} className="bg-white dark:bg-white/[0.03] border border-gray-100 dark:border-white/[0.04] p-2.5 rounded-lg flex items-center gap-2 group hover:border-orange-500/20 hover:shadow-sm dark:hover:shadow-none transition-all">
                                <div className="flex-1 min-w-0">
                                    <h4 className="text-[10px] font-semibold text-gray-800 dark:text-[#ccc] truncate">{item.name}</h4>
                                    <p className="text-[9px] text-gray-500 dark:text-[#555] mt-0.5">R$ {(item.price || 0).toFixed(2)} × {item.quantity}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="flex items-center bg-gray-100 dark:bg-white/[0.04] rounded-md border border-gray-200 dark:border-white/[0.06]">
                                        <button onClick={() => updateQuantity(item.id, -1)} className="p-1 px-1.5 text-gray-500 dark:text-[#444] hover:text-red-500 dark:hover:text-red-400 transition-colors">
                                            <Minus size={9} />
                                        </button>
                                        <span className="text-[10px] font-bold text-gray-900 dark:text-white min-w-[20px] text-center">{item.quantity}</span>
                                        <button onClick={() => updateQuantity(item.id, 1)} className="p-1 px-1.5 text-gray-500 dark:text-[#444] hover:text-orange-500 transition-colors">
                                            <Plus size={9} />
                                        </button>
                                    </div>
                                    <div className="flex flex-col items-end min-w-[45px]">
                                        <span className="text-[10px] font-bold text-gray-900 dark:text-white">R$ {(item.total || 0).toFixed(2)}</span>
                                        <button onClick={() => removeFromCart(item.id)} className="text-gray-400 dark:text-[#333] hover:text-red-500 dark:hover:text-red-500 transition-colors opacity-100 lg:opacity-0 group-hover:opacity-100">
                                            <X size={11} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Footer / Checkout */}
                <div className="p-4 border-t border-gray-200 dark:border-white/[0.05] space-y-3 bg-white dark:bg-transparent">
                    <div className="space-y-1 bg-gray-50 dark:bg-white/5 p-3 rounded-xl border border-gray-100 dark:border-transparent">
                        <div className="flex justify-between text-[10px] text-gray-500 dark:text-[#555] font-medium">
                            <span>Subtotal</span>
                            <span>R$ {(total || 0).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-baseline pt-1">
                            <span className="text-xs font-bold text-gray-900 dark:text-white">Total</span>
                            <span className="text-xl font-black text-orange-600 dark:text-orange-400">R$ {(total || 0).toFixed(2)}</span>
                        </div>
                    </div>
                    <button
                        disabled={cart.length === 0}
                        onClick={() => setIsPaymentOpen(true)}
                        className="w-full bg-orange-600 text-white py-3.5 rounded-xl font-bold text-[11px] uppercase tracking-widest shadow-lg shadow-orange-900/20 hover:bg-orange-500 active:scale-[0.98] transition-all disabled:opacity-20 disabled:cursor-not-allowed border border-orange-500/50"
                    >
                        Pagamento (F12)
                    </button>
                </div>
            </aside>

            {/* Modals */}
            {isCustomerModalOpen && (
                <CustomerModal
                    showDebtorsOnly={showDebtorsOnly}
                    onClose={() => setIsCustomerModalOpen(false)}
                    onSelect={(c) => {
                        setSelectedCustomer(c);
                        setIsCustomerModalOpen(false);
                        if (showDebtorsOnly) setTimeout(() => setIsDebtModalOpen(true), 100);
                    }}
                />
            )}
            {isDebtModalOpen && selectedCustomer && (
                <DebtModal
                    customer={selectedCustomer}
                    onClose={() => setIsDebtModalOpen(false)}
                />
            )}
            {isPaymentOpen && (
                <PaymentModal
                    total={total}
                    hasCustomer={!!selectedCustomer}
                    customer={selectedCustomer}
                    onCancel={() => setIsPaymentOpen(false)}
                    onConfirm={handlePaymentConfirm}
                />
            )}
        </div>
    );
}
