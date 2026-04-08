"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
    Search, ShoppingCart, User, Plus, Minus, Trash2,
    CheckCircle2, AlertCircle, Loader2,
    X, Utensils, Tag, ClipboardList, ShoppingBag, Receipt
} from 'lucide-react';
import PaymentModal from './PaymentModal';
import CustomerModal from './CustomerModal';
import DebtModal from './DebtModal';
import { useGlobal } from '../context/GlobalContext';

interface Product {
    id: string;
    _id?: string;
    name: string;
    price: number;
    categoryId: string;
    stock: number | null;
    image?: string;
}

interface Category {
    id: string;
    _id?: string;
    name: string;
    image?: string;
}

export default function POSView() {
    const { products, categories, isLoading, refreshProducts, refreshCustomers, customers } = useGlobal();
    const [cart, setCart] = useState<any[]>([]);
    const [search, setSearch] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    // const [isLoading, setIsLoading] = useState(true); // Now from context
    const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
    const [isPaymentOpen, setIsPaymentOpen] = useState(false);
    const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
    const [customerModalMode, setCustomerModalMode] = useState<'search' | 'register'>('search');
    const [employee, setEmployee] = useState<any>(null);
    const [showDebtorsOnly, setShowDebtorsOnly] = useState(false);
    const [visibleCount, setVisibleCount] = useState(40); // Pagination limit
    const [isDebtModalOpen, setIsDebtModalOpen] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Reset visible count when search or category changes
    useEffect(() => {
        setVisibleCount(40);
        if (scrollRef.current) scrollRef.current.scrollTop = 0;
    }, [search, selectedCategory]);

    useEffect(() => {
        const saved = localStorage.getItem('logged_employee');
        if (saved) setEmployee(JSON.parse(saved));
    }, []);



    const addToCart = (p: Product) => {
        const id = p.id || p._id;
        if (!id) return;

        if (p.stock !== null && p.stock <= 0) {
            alert('PRODUTO FORA DE ESTOQUE');
            return;
        }
        setCart(prev => {
            const existing = prev.find(item => item.id === id);
            if (existing) return prev.map(item => item.id === id ? { ...item, quantity: item.quantity + 1, total: (item.quantity + 1) * item.price } : item);
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

    const removeFromCart = (id: string) => {
        setCart(prev => prev.filter(item => item.id !== id));
    };

    const total = useMemo(() => cart.reduce((acc, item) => acc + item.total, 0), [cart]);

    const handlePaymentConfirm = async (payments: any[], isFiscal: boolean, isCustomerCopy: boolean, paidAmount: number, fiadoTaker?: string, isMerchantCopy?: boolean, discount: number = 0) => {
        const hasFiado = payments.some(p => p.method === 'fiado');
        const finalIsFiscal = hasFiado ? false : isFiscal;

        const saleData = {
            items: cart,
            total: total - discount,
            subtotal: total,
            discount: discount,
            payments,
            paidAmount,
            isFiscal: finalIsFiscal,
            fiadoTaker,
            customer: selectedCustomer,
            employee: employee?.name || 'Operador',
            date: new Date().toISOString()
        };

        try {
            console.log(`[POS DEBUG] Sending sale to server. isFiscal: ${isFiscal}`);
            const res = await fetch('/api/sales', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(saleData)
            });

            if (res.ok) {
                const savedSale = await res.json();
                console.log(`[POS DEBUG] Sale saved successfully:`, savedSale);

                let printType = 'receipt';
                if (isFiscal && isCustomerCopy) printType = 'both';
                else if (isFiscal) printType = 'fiscal';

                const printerPayload = {
                    type: printType,
                    isMerchantCopy,
                    fiadoTaker,
                    items: cart,
                    total: savedSale.total,
                    subtotal: savedSale.subtotal || savedSale.total,
                    discount: savedSale.discount || 0,
                    payments: savedSale.payments,
                    customer: savedSale.customer,
                    paidAmount: savedSale.paidAmount,
                    date: savedSale.date,
                    qrcode_url: savedSale.qrcode_url,
                    nfeQRCode: savedSale.nfeQRCode,
                    nfeNumber: savedSale.nfeNumber,
                    nfeSeries: savedSale.nfeSeries,
                    fiscalReference: savedSale.fiscalReference,
                    nfeId: savedSale.nfeId,
                    nfeExternalUrl: savedSale.nfeExternalUrl,
                    nfeMessage: savedSale.nfeMessage,
                    fiscalData: savedSale.fiscalData
                };

                fetch('http://localhost:7777/print', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(printerPayload)
                }).catch((err) => console.error("[POS DEBUG] Printer bridge offline:", err));

                setCart([]);
                setSelectedCustomer(null);
                setIsPaymentOpen(false);
                refreshProducts(); // Refresh context data
                alert('Venda finalizada com sucesso!');
            } else {
                const errorData = await res.json();
                alert(`Erro ao processar venda no banco: ${errorData.error || 'Erro desconhecido'}`);
            }
        } catch (e) {
            alert('Erro de conexão com o servidor');
        }
    };

    const filteredProducts = useMemo(() => products.filter(p =>
        (selectedCategory ? (p.categoryId === selectedCategory) : true) &&
        (p.name.toLowerCase().includes(search.toLowerCase()))
    ), [products, selectedCategory, search]);

    const visibleProducts = useMemo(() => filteredProducts.slice(0, visibleCount), [filteredProducts, visibleCount]);

    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const { scrollTop, clientHeight, scrollHeight } = e.currentTarget;
        if (scrollHeight - scrollTop <= clientHeight + 100) {
            setVisibleCount(prev => Math.min(prev + 40, filteredProducts.length));
        }
    };

    return (
        <div className="flex h-full bg-background font-sans text-sm selection:bg-secondary/20 overflow-hidden">
            <div className="flex-1 flex flex-col min-w-0">
                <header className="px-8 py-4 bg-card border-b border-border shrink-0">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <h2 className="text-xl font-bold text-card-foreground tracking-tight mb-0.5">Vendas PDV</h2>
                            <p className="text-xs font-medium text-muted-foreground flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-success" />
                                Operador: {employee?.name || 'Operador'}
                            </p>
                        </div>
                        <div className="relative group w-full md:w-80">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                            <input
                                className="w-full bg-muted border border-border rounded-xl pl-10 pr-4 py-2.5 text-sm font-medium placeholder:text-muted-foreground/50 outline-none focus:bg-card focus:border-secondary transition-all text-card-foreground"
                                placeholder="Buscar produto..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="flex gap-2 mt-4 overflow-x-auto pb-2" style={{ scrollbarWidth: 'thin' }}>
                        <button
                            onClick={() => setSelectedCategory(null)}
                            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${!selectedCategory ? 'bg-foreground text-background shadow-sm' : 'bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground'}`}
                        >
                            Todos
                        </button>
                        {categories.map(cat => (
                            <button
                                key={cat.id || cat._id}
                                onClick={() => setSelectedCategory(cat.id || (cat._id as string))}
                                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${(selectedCategory === cat.id || selectedCategory === cat._id) ? 'bg-secondary text-secondary-foreground shadow-sm' : 'bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground'}`}
                            >
                                {cat.name}
                            </button>
                        ))}
                    </div>
                </header>

                <main
                    ref={scrollRef}
                    onScroll={handleScroll}
                    className="flex-1 overflow-y-auto p-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 auto-rows-min content-start bg-background"
                >
                    {isLoading ? (
                        Array.from({ length: 10 }).map((_, i) => (
                            <div key={`skeleton-p-${i}`} className="aspect-square bg-muted rounded-2xl animate-pulse" />
                        ))
                    ) : visibleProducts.length === 0 ? (
                        <div className="col-span-full py-20 text-center text-muted-foreground flex flex-col items-center gap-2">
                            <Tag size={40} />
                            <p className="text-sm font-bold">Nenhum produto encontrado</p>
                        </div>
                    ) : (
                        <>
                            {visibleProducts.map(p => (
                                <button
                                    key={p.id || p._id}
                                    onClick={() => addToCart(p)}
                                    className="group bg-card border border-border rounded-2xl flex flex-col transition-all shadow-sm hover:border-secondary hover:shadow-md overflow-hidden relative"
                                >
                                    <div className="w-full aspect-[4/3] bg-muted flex items-center justify-center overflow-hidden relative">
                                        {p.image ? (
                                            <img src={p.image} alt={p.name} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                                        ) : (
                                            <Utensils size={28} className="text-muted-foreground/30 group-hover:text-secondary transition-colors" />
                                        )}
                                        {p.stock !== null && p.stock <= 0 && (
                                            <div className="absolute inset-0 bg-card/80 backdrop-blur-[1px] flex items-center justify-center">
                                                <span className="text-xs font-black text-destructive uppercase border border-destructive/20 bg-destructive/10 px-2 py-1 rounded">Sem Estoque</span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="p-3 flex flex-col gap-1 w-full relative z-10">
                                        <h3 className="text-xs font-bold text-card-foreground leading-tight line-clamp-2 text-left h-[2.5em]" title={p.name}>{p.name}</h3>
                                        <div className="flex items-center justify-between">
                                            <p className="text-sm font-bold text-secondary">R$ {(p.price || 0).toFixed(2)}</p>
                                            {p.stock !== null && <span className={`text-xs font-bold uppercase ${p.stock <= 5 ? 'text-destructive' : 'text-muted-foreground'}`}>{p.stock}un</span>}
                                        </div>
                                    </div>
                                </button>
                            ))}
                            {visibleProducts.length < filteredProducts.length && (
                                <div className="col-span-full py-4 text-center">
                                    <Loader2 className="animate-spin text-secondary mx-auto" size={24} />
                                </div>
                            )}
                        </>
                    )}
                </main>
            </div>

            <aside className="w-[340px] bg-card border-l border-border flex flex-col shrink-0 shadow-lg">
                <header className="p-6 border-b border-border space-y-4">
                    <div className="flex items-center gap-3">
                        <h3 className="text-sm font-bold text-card-foreground">Carrinho</h3>
                        <span className="bg-secondary/10 text-secondary px-2.5 py-0.5 rounded-full text-xs font-bold">{cart.length}</span>
                    </div>
                    {cart.length > 0 && (
                        <button
                            onClick={() => setCart([])}
                            className="text-muted-foreground hover:text-destructive transition-colors border-none bg-transparent cursor-pointer p-2 rounded-lg hover:bg-destructive/10"
                            title="Esvaziar Carrinho"
                        >
                            <Trash2 size={16} />
                        </button>
                    )}

                    {selectedCustomer ? (
                        <div className="bg-secondary/5 border border-secondary/20 rounded-2xl p-4 space-y-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-secondary text-secondary-foreground flex items-center justify-center shadow-md"><User size={20} /></div>
                                    <div className="min-w-0">
                                        <p className="text-xs font-bold text-card-foreground uppercase tracking-tight truncate">{selectedCustomer.name}</p>
                                        <p className="text-xs font-medium text-muted-foreground">{selectedCustomer.phone || selectedCustomer.cpf || 'IDENTIFICADO'}</p>
                                    </div>
                                </div>
                                <button onClick={() => setSelectedCustomer(null)} className="text-muted-foreground hover:text-destructive transition-colors bg-transparent border-none p-0"><X size={16} /></button>
                            </div>


                            <div className="flex items-center justify-between pt-3 border-t border-secondary/10">
                                <div className="flex flex-col">
                                    <span className="text-xs font-medium text-muted-foreground">Fidelidade</span>
                                    <span className="text-sm font-black text-secondary">{selectedCustomer.loyaltyPoints || 0} <span className="text-xs">PTS</span></span>
                                </div>
                                {selectedCustomer.address?.street && (
                                    <div className="flex flex-col items-end max-w-[150px]">
                                        <span className="text-xs font-medium text-muted-foreground text-right">Entrega</span>
                                        <span className="text-xs font-bold text-card-foreground truncate w-full text-right uppercase">{selectedCustomer.address.street}, {selectedCustomer.address.number}</span>
                                    </div>
                                )}
                            </div>

                            <button onClick={() => setIsDebtModalOpen(true)} className="w-full bg-card border border-destructive/20 rounded-xl p-3 flex items-center justify-between hover:border-destructive/50 hover:shadow-sm transition-all group cursor-pointer">
                                <div className="flex flex-col text-left">
                                    <span className="text-xs font-bold text-destructive/60 uppercase group-hover:text-destructive transition-colors">Gerenciar Fiado</span>
                                    <span className="text-sm font-black text-destructive group-hover:scale-105 transition-transform origin-left">Saldo: R$ {(selectedCustomer.debtBalance || 0).toFixed(2)}</span>
                                </div>
                                <div className="w-8 h-8 rounded-lg bg-destructive/10 flex items-center justify-center text-destructive group-hover:bg-destructive group-hover:text-destructive-foreground transition-all">
                                    <Utensils size={16} className={selectedCustomer.debtBalance > 0 ? "animate-pulse" : ""} />
                                </div>
                            </button>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-2">
                            <button onClick={() => { setShowDebtorsOnly(true); setIsCustomerModalOpen(true); }} className="w-full py-3 bg-destructive/10 text-destructive border border-destructive/20 rounded-xl text-xs font-bold tracking-wide hover:bg-destructive/20 transition-all flex items-center justify-center gap-2 mb-1">
                                <Receipt size={14} /> Gerenciar Fiados
                            </button>
                            <button onClick={() => { setShowDebtorsOnly(false); setCustomerModalMode('search'); setIsCustomerModalOpen(true); }} className="w-full py-3 border border-border rounded-xl text-xs font-medium text-muted-foreground hover:bg-muted flex items-center justify-center gap-2 transition-all">
                                <Search size={14} /> Identificar Cliente
                            </button>
                            <button onClick={() => { setCustomerModalMode('register'); setIsCustomerModalOpen(true); }} className="w-full py-3 bg-foreground text-background rounded-xl text-xs font-semibold tracking-wide hover:opacity-90 transition-all flex items-center justify-center gap-2">
                                <Plus size={14} /> Cadastrar Novo Cliente
                            </button>
                        </div>
                    )
                    }
                </header >

                <div className="flex-1 overflow-y-auto px-4 py-2">
                    {cart.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-gray-300 opacity-60">
                            <ShoppingBag size={48} className="mb-4" />
                            <p className="text-xs font-medium">Carrinho vazio</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {cart.map((item, i) => (
                                <div key={`cart-item-${i}`} className="bg-white border border-gray-50 p-3 rounded-2xl flex items-center justify-between group hover:border-blue-100 transition-all">
                                    <div className="flex-1 min-w-0">
                                        <h4 className="text-xs font-bold text-gray-800 truncate mb-1">{item.name}</h4>
                                        <p className="text-[10px] text-gray-400 font-medium">R$ {(item.price || 0).toFixed(2)} x {item.quantity}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="flex items-center bg-gray-50 rounded-lg border border-gray-100 p-0.5">
                                            <button
                                                onClick={() => updateQuantity(item.id, -1)}
                                                className="p-1 text-gray-400 hover:text-red-500 hover:bg-white rounded transition-all border-none bg-transparent cursor-pointer"
                                            >
                                                <Minus size={10} />
                                            </button>
                                            <span className="text-[10px] font-bold text-gray-600 min-w-[20px] text-center">{item.quantity}</span>
                                            <button
                                                onClick={() => updateQuantity(item.id, 1)}
                                                className="p-1 text-gray-400 hover:text-blue-600 hover:bg-white rounded transition-all border-none bg-transparent cursor-pointer"
                                            >
                                                <Plus size={10} />
                                            </button>
                                        </div>
                                        <div className="flex flex-col items-end min-w-[60px]">
                                            <span className="text-xs font-black text-gray-900">R$ {(item.total || 0).toFixed(2)}</span>
                                            <button onClick={() => removeFromCart(item.id)} className="p-1 text-gray-300 hover:text-red-500 transition-all border-none bg-transparent cursor-pointer opacity-0 group-hover:opacity-100"><X size={12} /></button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <footer className="p-6 bg-gray-50/30 border-t border-gray-100 space-y-4">
                    <div className="space-y-2">
                        <div className="flex justify-between text-xs font-medium text-gray-400">
                            <span>Subtotal</span>
                            <span>R$ {(total || 0).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-end">
                            <span className="text-xs font-bold text-gray-800">Total</span>
                            <span className="text-2xl font-black text-blue-600 tracking-tighter">R$ {(total || 0).toFixed(2)}</span>
                        </div>
                    </div>
                    <button
                        disabled={cart.length === 0}
                        onClick={() => setIsPaymentOpen(true)}
                        className="w-full bg-blue-600 text-white py-3.5 rounded-xl font-bold text-[10px] uppercase tracking-widest shadow-md hover:bg-blue-700 transition-all disabled:bg-gray-50 disabled:text-gray-300"
                    >
                        Pagar Agora (F12)
                    </button>
                </footer>
            </aside >

            {isCustomerModalOpen && (
                <CustomerModal
                    initialRegister={customerModalMode === 'register'}
                    showDebtorsOnly={showDebtorsOnly}
                    onClose={() => setIsCustomerModalOpen(false)}
                    onSelect={(c) => {
                        setSelectedCustomer(c);
                        setIsCustomerModalOpen(false);
                        // If we were in "Debtors" mode, selecting one should probably open their Debt Modal?
                        // Or just select them. The user can then click "Gerenciar Fiado" in the sidebar.
                        // Let's just select them like normal.
                        if (showDebtorsOnly) {
                            setTimeout(() => setIsDebtModalOpen(true), 100);
                        }
                    }}
                />
            )}

            {
                isDebtModalOpen && selectedCustomer && (
                    <DebtModal
                        customer={selectedCustomer}
                        onClose={() => setIsDebtModalOpen(false)}
                        onUpdate={async () => {
                            await refreshCustomers();
                            // Re-fetch only this customer to update local state
                            if (selectedCustomer.cpf) {
                                const res = await fetch(`/api/customers?cpf=${selectedCustomer.cpf}`);
                                if (res.ok) {
                                    const updated = await res.json();
                                    setSelectedCustomer(updated);
                                }
                            } else {
                                const res = await fetch('/api/customers');
                                if (res.ok) {
                                    const all = await res.json();
                                    const updated = all.find((c: any) => c._id === selectedCustomer._id || c.id === selectedCustomer.id);
                                    if (updated) setSelectedCustomer(updated);
                                }
                            }
                        }}
                    />
                )
            }

            {
                isPaymentOpen && (
                    <PaymentModal
                        total={total}
                        hasCustomer={!!selectedCustomer}
                        customer={selectedCustomer}
                        onCancel={() => setIsPaymentOpen(false)}
                        onConfirm={handlePaymentConfirm}
                    />
                )
            }
        </div>
    );
}
