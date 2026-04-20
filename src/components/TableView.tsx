"use client";

import { useState, useEffect } from 'react';
import {
    LayoutGrid, User, Plus, X, Search, Filter,
    ChevronRight, Loader2, Minus, Trash2, Printer, CheckCircle, ClipboardList,
    Users, Coffee, Utensils
} from 'lucide-react';
import PaymentModal from './PaymentModal';

interface Table {
    id?: string;
    _id: string;
    number: number;
    status: 'free' | 'occupied' | 'billing';
    customerName?: string;
    items?: any[];
    total?: number;
}

export default function TableView() {
    const [tables, setTables] = useState<Table[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedTable, setSelectedTable] = useState<Table | null>(null);
    const [newCustomer, setNewCustomer] = useState('');
    const [isPaymentOpen, setIsPaymentOpen] = useState(false);

    useEffect(() => {
        fetchTables();
    }, []);

    const fetchTables = async () => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/tables');
            const data = await res.json();
            setTables(data);
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    const handleOpenTable = async () => {
        if (!selectedTable || !newCustomer) return;
        try {
            const res = await fetch('/api/tables', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'open', tableId: selectedTable._id, customerName: newCustomer })
            });
            if (res.ok) {
                setNewCustomer('');
                fetchTables();
            }
        } catch (e) {
            alert('Erro ao abrir mesa');
        }
    };

    const handleCloseTableConfirm = async (payments: any[], isFiscal: boolean, isCustomerCopy: boolean, paidAmount: number) => {
        if (!selectedTable) return;

        const payload = {
            tableId: selectedTable._id,
            payments,
            isFiscal,
            isCustomerCopy,
            paidAmount,
            items: selectedTable.items,
            total: selectedTable.total,
            customer: { name: selectedTable.customerName }
        };

        try {
            const res = await fetch('/api/tables', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'close', ...payload })
            });

            if (res.ok) {
                const savedSale = await res.json();

                console.log('[TABLE DEBUG] Received sale:', savedSale);
                console.log('[TABLE DEBUG] Fiscal data:', {
                    qrcode_url: savedSale.qrcode_url,
                    nfeQRCode: savedSale.nfeQRCode,
                    nfeNumber: savedSale.nfeNumber,
                    nfeSeries: savedSale.nfeSeries,
                    fiscalReference: savedSale.fiscalReference,
                    hasFiscalData: !!savedSale.fiscalData
                });

                // Determinar tipo de impressão
                let printType = 'receipt';
                if (isFiscal && isCustomerCopy) printType = 'both';
                else if (isFiscal) printType = 'fiscal';

                // Criar payload explícito para a impressora
                const printerPayload = {
                    type: printType,
                    items: selectedTable.items,
                    total: savedSale.total,
                    subtotal: savedSale.subtotal || savedSale.total,
                    discount: savedSale.discount || 0,
                    payments: savedSale.payments,
                    customer: savedSale.customer,
                    paidAmount: savedSale.paidAmount,
                    date: savedSale.date,
                    // Dados fiscais explícitos
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

                console.log('[TABLE DEBUG] Sending to printer:', JSON.stringify(printerPayload, null, 2));

                // Notificar bridge de impressão
                await fetch('http://localhost:7777/print', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(printerPayload)
                }).catch(err => console.error("Printer error:", err));

                setIsPaymentOpen(false);
                setSelectedTable(null);
                fetchTables();
            }
        } catch (e) {
            alert('Erro ao fechar mesa');
        }
    };

    if (isLoading) return (
        <div className="flex-1 flex items-center justify-center bg-[#0c0c0c] text-[#444] gap-2 text-xs font-medium">
            <Loader2 className="animate-spin text-orange-500" size={20} /> Carregando...
        </div>
    );

    return (
        <div className="flex flex-1 overflow-hidden font-sans text-sm bg-[#0c0c0c] text-white">
            <div className="flex-1 flex flex-col p-5 overflow-y-auto">
                <header className="mb-5 flex justify-between items-center">
                    <div>
                        <h2 className="text-sm font-semibold text-white">Mesas</h2>
                        <p className="text-[9px] text-[#444] font-medium uppercase tracking-widest mt-0.5">{tables.filter(t => t.status === 'free').length} disponíveis</p>
                    </div>
                </header>

                <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2.5">
                    {tables.map((table, idx) => (
                        <button
                            key={table.id || table._id || idx}
                            onClick={() => setSelectedTable(table)}
                            className={`aspect-square rounded-xl p-3 flex flex-col justify-between transition-all border text-left ${
                                selectedTable?._id === table._id
                                    ? 'border-orange-500/60 bg-orange-500/5'
                                    : table.status === 'occupied'
                                        ? 'border-white/10 bg-white/[0.04] text-white'
                                        : table.status === 'billing'
                                            ? 'border-orange-500/30 bg-orange-500/5 text-orange-400'
                                            : 'border-white/[0.05] bg-white/[0.02] text-[#444] hover:border-white/10 hover:text-[#888]'
                            }`}
                        >
                            <span className="text-lg font-bold">#{table.number}</span>
                            <div className="overflow-hidden">
                                {table.customerName ? (
                                    <>
                                        <p className="text-[9px] font-semibold truncate uppercase text-[#aaa]">{table.customerName}</p>
                                        <p className="text-[9px] font-medium mt-0.5 text-orange-400">R$ {table.total?.toFixed(2)}</p>
                                    </>
                                ) : (
                                    <span className="text-[9px] font-medium uppercase tracking-wider italic text-[#333]">Livre</span>
                                )}
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            {/* Painel de Controle */}
            {selectedTable && (
                <div className="w-72 bg-[#0f0f0f] border-l border-white/[0.05] flex flex-col">
                    <header className="p-4 border-b border-white/[0.05]">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-sm font-semibold text-white">Mesa {selectedTable.number}</h3>
                            <button onClick={() => setSelectedTable(null)} className="p-1.5 rounded-lg text-[#444] hover:text-white hover:bg-white/5 transition-all"><X size={16} /></button>
                        </div>

                        {selectedTable.status === 'free' ? (
                            <div className="space-y-3">
                                <div>
                                    <label className="text-[9px] font-bold text-[#444] uppercase mb-1.5 block tracking-widest">Nome do Cliente</label>
                                    <input
                                        className="w-full bg-[#111] border border-white/[0.07] rounded-lg px-3 py-2 text-xs text-white font-medium outline-none focus:border-orange-500/50 transition-all"
                                        placeholder="Ex: Pedro Silva"
                                        value={newCustomer}
                                        onChange={e => setNewCustomer(e.target.value)}
                                        autoFocus
                                    />
                                </div>
                                <button
                                    onClick={handleOpenTable}
                                    className="w-full bg-orange-600 text-white py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider hover:bg-orange-500 transition-colors"
                                >
                                    Abrir Mesa
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-0.5">
                                <p className="text-xs font-semibold text-white uppercase tracking-tight">{selectedTable.customerName}</p>
                                <p className="text-[9px] font-medium text-[#444] uppercase">{selectedTable.items?.length || 0} itens no pedido</p>
                            </div>
                        )}
                    </header>

                    <div className="flex-1 overflow-y-auto p-3 space-y-1.5" style={{ scrollbarWidth: 'thin', scrollbarColor: '#1a1a1a transparent' }}>
                        {selectedTable.items?.map((item: any, i: number) => (
                            <div key={`table-item-${selectedTable.id || selectedTable._id || 'none'}-${i}`} className="flex justify-between items-center bg-white/[0.03] border border-white/[0.04] p-2.5 rounded-lg">
                                <div className="min-w-0 pr-2">
                                    <p className="text-[10px] font-semibold text-[#ccc] truncate">{item.name}</p>
                                    <p className="text-[9px] text-[#444] font-medium">{item.quantity}x · R$ {item.price.toFixed(2)}</p>
                                </div>
                                <span className="text-[10px] font-bold text-white whitespace-nowrap">R$ {item.total.toFixed(2)}</span>
                            </div>
                        ))}
                    </div>

                    {selectedTable.status !== 'free' && (
                        <footer className="p-4 border-t border-white/[0.05] space-y-3">
                            <div className="flex justify-between items-baseline">
                                <span className="text-[9px] font-bold text-[#444] uppercase">Total</span>
                                <span className="text-xl font-black text-orange-400">R$ {selectedTable.total?.toFixed(2)}</span>
                            </div>
                            <button
                                onClick={() => setIsPaymentOpen(true)}
                                className="w-full bg-orange-600 text-white py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-orange-500 transition-all shadow-lg shadow-orange-900/20"
                            >
                                Fechar e Pagar
                            </button>
                        </footer>
                    )}
                </div>
            )}

            {isPaymentOpen && selectedTable && (
                <PaymentModal
                    total={selectedTable.total || 0}
                    hasCustomer={!!selectedTable.customerName}
                    onCancel={() => setIsPaymentOpen(false)}
                    onConfirm={handleCloseTableConfirm}
                />
            )}
        </div>
    );
}
