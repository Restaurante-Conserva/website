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
        <div className="flex-1 flex items-center justify-center bg-white text-gray-300 text-xs font-bold uppercase transition-all">
            <Loader2 className="animate-spin" size={20} /> Carregando...
        </div>
    );

    return (
        <div className="flex flex-1 overflow-hidden font-sans text-sm bg-white">
            <div className="flex-1 flex flex-col p-6 overflow-y-auto">
                <header className="mb-8 flex justify-between items-center bg-white">
                    <div>
                        <h2 className="text-xl font-bold text-gray-800">Mapa de Mesas</h2>
                        <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">{tables.filter(t => t.status === 'free').length} mesas disponíveis</p>
                    </div>
                </header>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                    {tables.map((table, idx) => (
                        <button
                            key={table.id || table._id || idx}
                            onClick={() => setSelectedTable(table)}
                            className={`aspect-square rounded-2xl p-4 flex flex-col justify-between transition-all border text-left relative shadow-sm hover:shadow-md ${selectedTable?._id === table._id ? 'border-blue-500 ring-4 ring-blue-50 bg-blue-50/20' : 'border-gray-100 bg-white'} ${table.status === 'occupied' ? 'border-blue-100 text-blue-700' : table.status === 'billing' ? 'bg-orange-50 border-orange-200 text-orange-700' : 'text-gray-400 hover:border-gray-200'}`}
                        >
                            <span className="text-xl font-bold">#{table.number}</span>
                            <div className="overflow-hidden">
                                {table.customerName ? (
                                    <>
                                        <p className="text-[10px] font-bold truncate uppercase">{table.customerName}</p>
                                        <p className="text-[10px] font-medium mt-0.5 opacity-70">R$ {table.total?.toFixed(2)}</p>
                                    </>
                                ) : (
                                    <span className="text-[10px] font-medium uppercase tracking-wider italic opacity-40">Livre</span>
                                )}
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            {/* Painel de Controle */}
            {selectedTable && (
                <div className="w-80 bg-white border-l border-gray-100 flex flex-col animate-in slide-in-from-right duration-200">
                    <header className="p-6 border-b border-gray-100">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-sm font-bold text-gray-800">Mesa {selectedTable.number}</h3>
                            <button onClick={() => setSelectedTable(null)} className="p-1 hover:bg-gray-100 rounded-lg text-gray-300 transition-colors"><X size={18} /></button>
                        </div>

                        {selectedTable.status === 'free' ? (
                            <div className="space-y-4">
                                <div>
                                    <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">Nome do Cliente</label>
                                    <input
                                        className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-xs font-medium outline-none focus:border-blue-500"
                                        placeholder="Ex: Pedro Silva"
                                        value={newCustomer}
                                        onChange={e => setNewCustomer(e.target.value)}
                                        autoFocus
                                    />
                                </div>
                                <button
                                    onClick={handleOpenTable}
                                    className="w-full bg-blue-600 text-white py-2 rounded-lg text-xs font-bold uppercase transition-colors"
                                >
                                    Abrir Mesa
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-1">
                                <p className="text-xs font-bold text-gray-800 uppercase tracking-tight line-clamp-1">{selectedTable.customerName}</p>
                                <p className="text-[10px] font-medium text-gray-400 uppercase">{selectedTable.items?.length || 0} itens no comando</p>
                            </div>
                        )}
                    </header>

                    <div className="flex-1 overflow-y-auto p-4 space-y-2">
                        {selectedTable.items?.map((item: any, i: number) => (
                            <div key={`table-item-${selectedTable.id || selectedTable._id || 'none'}-${i}`} className="flex justify-between items-center bg-gray-50/50 p-2 rounded-lg border border-gray-50">
                                <div className="min-w-0 pr-2">
                                    <p className="text-[11px] font-bold text-gray-700 truncate line-clamp-1 uppercase tracking-tight">{item.name}</p>
                                    <p className="text-[9px] text-gray-400 font-medium">{item.quantity}x • R$ {item.price.toFixed(2)}</p>
                                </div>
                                <span className="text-[11px] font-bold text-gray-800 whitespace-nowrap">R$ {item.total.toFixed(2)}</span>
                            </div>
                        ))}
                    </div>

                    {selectedTable.status !== 'free' && (
                        <footer className="p-6 border-t border-gray-100 bg-white space-y-4">
                            <div className="flex justify-between items-end">
                                <span className="text-[10px] font-bold text-gray-400 uppercase">Subtotal</span>
                                <span className="text-2xl font-bold tracking-tight text-gray-800">R$ {selectedTable.total?.toFixed(2)}</span>
                            </div>
                            <button
                                onClick={() => setIsPaymentOpen(true)}
                                className="w-full bg-blue-600 text-white py-3.5 rounded-xl text-xs font-bold uppercase transition-all shadow-xl shadow-blue-100 hover:bg-blue-700 active:scale-95"
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
