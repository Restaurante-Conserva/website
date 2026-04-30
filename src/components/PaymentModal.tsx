"use client";

import { useState, useEffect, useRef } from 'react';
import {
    X, Check, Wallet, QrCode, CreditCard,
    Banknote, Receipt, ShieldCheck,
    Trash2, Info, Loader2, AlertCircle, Printer, CheckCircle2, ChevronRight
} from 'lucide-react';
import { useToast } from '../context/ToastContext';

interface Payment {
    method: 'money' | 'pix' | 'credit' | 'debit' | 'fiado';
    amount: number;
}

interface Customer {
    id: string;
    name: string;
    debt?: number;
}

interface PaymentModalProps {
    total: number;
    hasCustomer: boolean;
    onCancel: () => void;
    onConfirm: (payments: Payment[], isFiscal: boolean, isCustomerCopy: boolean, paidAmount: number, fiadoTaker?: string, isMerchantCopy?: boolean, discount?: number) => void;
    isPartialAllowed?: boolean;
    customer?: Customer;
}

const METHODS = [
    { id: 'money',  label: 'Dinheiro', icon: <Banknote size={15} />,    color: 'hover:border-emerald-500/40' },
    { id: 'pix',    label: 'Pix',      icon: <QrCode size={15} />,       color: 'hover:border-teal-500/40' },
    { id: 'credit', label: 'Crédito',  icon: <CreditCard size={15} />,   color: 'hover:border-blue-500/40' },
    { id: 'debit',  label: 'Débito',   icon: <CreditCard size={15} />,   color: 'hover:border-blue-500/40' },
    { id: 'fiado',  label: 'Fiado',    icon: <AlertCircle size={15} />,  color: 'hover:border-orange-500/40' },
];

export default function PaymentModal({ total, hasCustomer, onCancel, onConfirm, isPartialAllowed = false }: PaymentModalProps) {
    const { showToast } = useToast();
    const [payments, setPayments] = useState<Payment[]>([]);
    const [isFiscal, setIsFiscal] = useState(false);
    const [isCustomerCopy, setIsCustomerCopy] = useState(false);
    const [isMerchantCopy, setIsMerchantCopy] = useState(false);
    const [fiadoTaker, setFiadoTaker] = useState('');
    const [currentMethod, setCurrentMethod] = useState<Payment['method'] | null>(null);
    const [inputAmount, setInputAmount] = useState('');
    const [receivedAmount, setReceivedAmount] = useState('');
    const [totalChange, setTotalChange] = useState(0);
    const [isProcessing, setIsProcessing] = useState(false);
    const [discount, setDiscount] = useState(0);
    const [discountInput, setDiscountInput] = useState('');
    const [isGeneratingPix, setIsGeneratingPix] = useState(false);
    const [pixData, setPixData] = useState<{ qr_code: string; qr_code_base64: string; id: string } | null>(null);
    const [pixStatus, setPixStatus] = useState<'pending' | 'approved' | 'expired'>('pending');
    const [pixTimer, setPixTimer] = useState(600);
    const isSubmittingRef = useRef(false);

    const finalTotal = Math.max(0, total - discount);
    const paidTotal = payments.reduce((acc, p) => acc + p.amount, 0);
    const remaining = finalTotal - paidTotal;
    const hasFiado = payments.some(p => p.method === 'fiado') || currentMethod === 'fiado';
    const change = (parseFloat(receivedAmount) || 0) - (currentMethod === 'money' ? parseFloat(inputAmount) || 0 : 0);

    useEffect(() => {
        setInputAmount(remaining > 0 ? remaining.toFixed(2) : '0.00');
    }, [remaining, payments]);

    useEffect(() => {
        if (hasFiado) { setIsMerchantCopy(true); setIsFiscal(false); }
    }, [hasFiado]);

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (pixData && pixStatus === 'pending') {
            interval = setInterval(async () => {
                try {
                    const res = await fetch(`/api/pay/pix?id=${pixData.id}`);
                    const data = await res.json();
                    if (data.status === 'approved') {
                        setPixStatus('approved');
                        const amt = parseFloat(inputAmount);
                        setPayments(prev => [...prev, { method: 'pix', amount: amt }]);
                        setPixData(null); setCurrentMethod(null);
                        showToast('Pagamento Pix recebido!', 'success');
                    }
                } catch (e) { console.error(e); }
            }, 5000);
        }
        return () => clearInterval(interval);
    }, [pixData, pixStatus, inputAmount, payments, showToast]);

    useEffect(() => {
        let timer: NodeJS.Timeout;
        if (pixData && pixTimer > 0) timer = setInterval(() => setPixTimer(p => p - 1), 1000);
        return () => clearInterval(timer);
    }, [pixData, pixTimer]);

    const addPayment = () => {
        const amt = parseFloat(inputAmount);
        if (isNaN(amt) || amt <= 0 || amt > remaining + 0.01) return;
        if (currentMethod === 'money' && change > 0) setTotalChange(prev => prev + change);
        setPayments(prev => [...prev, { method: currentMethod!, amount: amt }]);
        setReceivedAmount('');
        setCurrentMethod(null);
        setPixData(null);
    };

    const removePayment = (index: number) => setPayments(payments.filter((_, i) => i !== index));

    const handleConfirm = async () => {
        if (!isPartialAllowed && paidTotal < finalTotal - 0.01) return;
        if (paidTotal <= 0 || isSubmittingRef.current || isProcessing) return;
        isSubmittingRef.current = true;
        setIsProcessing(true);
        try {
            await onConfirm(payments, isFiscal, isCustomerCopy, paidTotal + totalChange, fiadoTaker, isMerchantCopy, discount);
        } finally {
            setIsProcessing(false);
            isSubmittingRef.current = false;
        }
    };

    return (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-full max-w-4xl bg-white dark:bg-[#0a0a0a] border border-gray-100 dark:border-[#1a1a1a] rounded-xl shadow-xl flex flex-col md:flex-row overflow-hidden animate-in zoom-in-95 duration-200 h-[620px] max-h-[90vh] relative">

                {isProcessing && (
                    <div className="absolute inset-0 z-[100] bg-black/60 backdrop-blur-md flex flex-col items-center justify-center text-orange-500">
                        <Loader2 className="animate-spin mb-3" size={28} />
                        <p className="text-xs text-gray-300">Processando transação...</p>
                    </div>
                )}

                {/* Left: Interaction */}
                <div className="flex-1 flex flex-col border-r border-gray-100 dark:border-[#1a1a1a] overflow-hidden">
                    {/* Header */}
                    <div className="px-5 py-4 border-b border-gray-100 dark:border-[#1a1a1a] flex items-start justify-between shrink-0">
                        <div>
                            <p className="text-xs text-gray-400 dark:text-[#555]">Total da venda</p>
                            <div className="flex items-baseline gap-2 mt-0.5">
                                <span className="text-3xl font-medium text-gray-900 dark:text-white tabular-nums">R$ {finalTotal.toFixed(2)}</span>
                                {discount > 0 && <span className="text-base text-red-400 line-through tabular-nums">R$ {total.toFixed(2)}</span>}
                            </div>
                        </div>
                        <button onClick={onCancel} className="p-1.5 rounded-md text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-[#1a1a1a] border-none bg-transparent cursor-pointer transition-all">
                            <X size={16} />
                        </button>
                    </div>

                    {/* Discount + installments bar */}
                    {remaining > 0 && payments.length === 0 && (
                        <div className="px-5 py-2.5 border-b border-gray-100 dark:border-[#1a1a1a] flex items-center gap-3 shrink-0">
                            <div className="relative">
                                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-red-500">DESC R$</span>
                                <input
                                    className="w-28 bg-red-50 dark:bg-red-500/5 border border-red-100 dark:border-red-500/20 rounded-md pl-14 pr-2 py-1.5 text-xs text-red-600 dark:text-red-400 outline-none focus:border-red-400 transition-all"
                                    type="number" placeholder="0.00" value={discountInput} disabled={!!pixData}
                                    onChange={e => { setDiscountInput(e.target.value); setDiscount(parseFloat(e.target.value) || 0); }}
                                />
                            </div>
                            <div className="flex items-center gap-1 bg-gray-50 dark:bg-black border border-gray-100 dark:border-[#1a1a1a] rounded-md px-2 py-1">
                                <span className="text-[10px] text-gray-400 mr-1">Parcelar</span>
                                {[2, 3, 4].map(n => (
                                    <button key={n} disabled={!!pixData} onClick={() => setInputAmount((finalTotal / n).toFixed(2))}
                                        className="px-2 py-0.5 text-xs text-gray-500 hover:text-orange-600 hover:bg-white dark:hover:bg-white/10 rounded transition-all bg-transparent border-none cursor-pointer disabled:opacity-30">
                                        {n}X
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Body */}
                    <div className="flex-1 overflow-y-auto px-5 py-4" style={{ scrollbarWidth: 'thin', scrollbarColor: '#333 transparent' }}>
                        {remaining <= 0 && !currentMethod ? (
                            <div className="h-full flex flex-col items-center justify-center animate-in fade-in duration-300">
                                <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-500 flex items-center justify-center mb-3">
                                    <CheckCircle2 size={24} />
                                </div>
                                <p className="text-sm font-medium text-gray-900 dark:text-white">Pagamento recebido</p>
                                <p className="text-xs text-gray-400 dark:text-[#555] mt-1">Pronto para finalizar</p>
                            </div>
                        ) : !currentMethod ? (
                            <div className="space-y-3">
                                <p className="text-xs text-gray-400 dark:text-[#555] mb-2">Selecione o método</p>
                                <div className="grid grid-cols-2 gap-2.5">
                                    {METHODS.map(m => (
                                        <button
                                            key={m.id}
                                            disabled={(m.id === 'fiado' && !hasCustomer) || isProcessing || (payments.length > 0 && remaining > 0)}
                                            onClick={async () => {
                                                if (m.id === 'pix' && remaining > 0) {
                                                    setIsGeneratingPix(true);
                                                    try {
                                                        const res = await fetch('/api/pay/pix', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ amount: remaining, description: 'Venda PDV' }) });
                                                        const data = await res.json();
                                                        if (data.success) { setPixData({ qr_code: data.qr_code, qr_code_base64: data.qr_code_base64, id: data.id }); setPixStatus('pending'); setPixTimer(600); setCurrentMethod('pix'); }
                                                        else showToast("Erro ao gerar Pix", "error");
                                                    } catch { showToast("Falha Pix", "error"); }
                                                    finally { setIsGeneratingPix(false); }
                                                } else setCurrentMethod(m.id as Payment['method']);
                                            }}
                                            className={`px-5 py-4 rounded-lg border border-gray-100 dark:border-[#1a1a1a] flex items-center gap-3 transition-all bg-white dark:bg-black/30 text-sm text-gray-700 dark:text-gray-300 ${m.color} ${(m.id === 'fiado' && !hasCustomer) || isProcessing || (payments.length > 0 && remaining > 0) ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer hover:shadow-sm'}`}
                                        >
                                            <span className="text-gray-400 dark:text-[#555]">{isGeneratingPix && m.id === 'pix' ? <Loader2 className="animate-spin" size={16} /> : m.icon}</span>
                                            {isGeneratingPix && m.id === 'pix' ? 'Gerando...' : m.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-4 animate-in slide-in-from-right-4 duration-200">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="w-7 h-7 rounded-md bg-orange-500/10 text-orange-500 flex items-center justify-center">
                                            {METHODS.find(m => m.id === currentMethod)?.icon}
                                        </div>
                                        <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                                            {pixData ? 'Pagamento via Pix' : METHODS.find(m => m.id === currentMethod)?.label}
                                        </span>
                                    </div>
                                    <button onClick={() => { setCurrentMethod(null); setReceivedAmount(''); setPixData(null); }} className="text-xs text-gray-400 hover:text-red-500 border-none bg-transparent cursor-pointer transition-colors">
                                        Cancelar
                                    </button>
                                </div>

                                {pixData ? (
                                    <div className="flex flex-col items-center gap-4 py-2">
                                        <div className="p-3 bg-white rounded-lg border border-gray-200 dark:border-[#222] shadow-sm">
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img src={`data:image/jpeg;base64,${pixData.qr_code_base64}`} alt="Pix QR" className="w-52 h-52" />
                                        </div>
                                        <div className="text-center">
                                            <p className="text-xs text-gray-400 dark:text-[#555]">Valor do Pix</p>
                                            <p className="text-2xl font-medium text-orange-600 dark:text-orange-500 tabular-nums mt-0.5">R$ {parseFloat(inputAmount).toFixed(2)}</p>
                                            <div className="flex items-center justify-center gap-1.5 mt-2">
                                                <Loader2 size={11} className="animate-spin text-orange-500" />
                                                <span className="text-xs font-mono text-gray-500 tabular-nums">{Math.floor(pixTimer / 60)}:{String(pixTimer % 60).padStart(2, '0')}</span>
                                            </div>
                                        </div>
                                        <div className="flex gap-2 w-full">
                                            <button onClick={() => { navigator.clipboard.writeText(pixData.qr_code); showToast("Código copiado!", "success"); }} className="flex-1 py-3 text-xs border border-gray-200 dark:border-[#1a1a1a] rounded-md text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-[#111] transition-all cursor-pointer bg-transparent">Copiar Código</button>
                                            <button onClick={async () => { try { await fetch('http://localhost:7777/print-pix', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ qrCode: pixData.qr_code, amount: parseFloat(inputAmount) }) }); } catch { showToast("Impressora offline", "error"); } }} className="flex-1 py-3 bg-gray-900 dark:bg-white text-white dark:text-black text-xs rounded-md flex items-center justify-center gap-1.5 cursor-pointer border-none">
                                                <Printer size={13} /> Imprimir
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {currentMethod === 'fiado' && (
                                            <div className="p-4 bg-orange-500/5 border border-orange-500/15 rounded-lg flex gap-3">
                                                <Info size={18} className="text-orange-500 shrink-0 mt-0.5" />
                                                <p className="text-xs text-orange-700 dark:text-orange-400 leading-relaxed">Identifique o portador que está efetuando a retirada no fiado.</p>
                                            </div>
                                        )}
                                        {currentMethod === 'fiado' && (
                                            <div>
                                                <p className="text-xs text-gray-400 dark:text-[#555] mb-2">Identificação do portador</p>
                                                <input className="w-full bg-gray-50 dark:bg-black border border-gray-100 dark:border-[#1a1a1a] rounded-md px-4 py-3 text-sm text-gray-900 dark:text-white outline-none focus:border-orange-500/50 transition-all" placeholder="Ex: João (Filho)..." value={fiadoTaker} onChange={e => setFiadoTaker(e.target.value)} autoFocus />
                                            </div>
                                        )}
                                        {currentMethod === 'money' && (
                                            <div>
                                                <p className="text-xs text-gray-400 dark:text-[#555] mb-2">Valor entregue pelo cliente</p>
                                                <div className="relative">
                                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-emerald-600">R$</span>
                                                    <input className="w-full bg-emerald-50/40 dark:bg-emerald-500/5 border border-emerald-100 dark:border-emerald-500/20 rounded-md pl-9 pr-3 py-3 text-2xl font-medium text-emerald-700 dark:text-emerald-400 outline-none focus:border-emerald-400 transition-all tabular-nums" type="number" value={receivedAmount} onChange={e => setReceivedAmount(e.target.value)} autoFocus />
                                                </div>
                                                {change > 0 && (
                                                    <div className="mt-3 p-4 bg-emerald-600 rounded-md text-white flex justify-between items-center animate-in slide-in-from-top-2">
                                                        <span className="text-sm font-medium">Troco p/ cliente:</span>
                                                        <span className="text-xl font-bold tabular-nums">R$ {change.toFixed(2)}</span>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                        <div className="pt-2 border-t border-gray-100 dark:border-[#1a1a1a]">
                                            <p className="text-xs text-gray-400 dark:text-[#555] mb-2">Lançar no caixa</p>
                                            <div className="relative">
                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-lg text-gray-400">R$</span>
                                                <input className="w-full bg-white dark:bg-black border border-gray-200 dark:border-[#1a1a1a] rounded-md pl-9 pr-3 py-4 text-3xl font-medium text-gray-900 dark:text-white outline-none focus:border-orange-500/50 transition-all tabular-nums" type="number" value={inputAmount} onChange={e => setInputAmount(e.target.value)} />
                                            </div>
                                        </div>
                                        <button disabled={isProcessing || !inputAmount || parseFloat(inputAmount) <= 0} onClick={addPayment}
                                            className="w-full bg-orange-600 hover:bg-orange-500 disabled:opacity-40 text-white py-4 rounded-md text-sm transition-all flex items-center justify-center gap-2 border-none cursor-pointer">
                                            Confirmar entrada <ChevronRight size={16} />
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Right: Receipt */}
                <div className="w-full md:w-[300px] bg-white dark:bg-[#0a0a0a] flex flex-col shrink-0">
                    <div className="p-5 flex-1 flex flex-col">
                        <div className="flex items-center gap-1.5 mb-3">
                            <Receipt size={13} className="text-gray-400 dark:text-[#555]" />
                            <span className="text-xs text-gray-400 dark:text-[#555]">Checkout</span>
                        </div>

                        <div className="space-y-1.5 flex-1 overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
                            {payments.length === 0 ? (
                                <div className="h-32 flex flex-col items-center justify-center border border-dashed border-gray-100 dark:border-[#1a1a1a] rounded-lg">
                                    <Wallet size={20} className="text-gray-200 dark:text-[#222] mb-1.5" />
                                    <p className="text-xs text-gray-300 dark:text-[#333]">Nenhum lançamento</p>
                                </div>
                            ) : (
                                payments.map((p, i) => (
                                    <div key={i} className="px-3 py-2.5 rounded-lg border border-gray-100 dark:border-[#1a1a1a] flex items-center justify-between group hover:bg-gray-50 dark:hover:bg-black transition-colors">
                                        <div className="flex items-center gap-2">
                                            <div className="w-6 h-6 rounded-md bg-gray-50 dark:bg-[#111] text-gray-400 border border-gray-100 dark:border-[#1a1a1a] flex items-center justify-center">
                                                {METHODS.find(m => m.id === p.method)?.icon}
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-700 dark:text-gray-300">{METHODS.find(m => m.id === p.method)?.label}</p>
                                                <p className="text-[10px] text-gray-400 dark:text-[#555]">Confirmado</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-medium text-gray-900 dark:text-white tabular-nums">R$ {p.amount.toFixed(2)}</span>
                                            {remaining > 0 && <button onClick={() => removePayment(i)} className="p-1 rounded text-gray-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all bg-transparent border-none cursor-pointer"><Trash2 size={13} /></button>}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {remaining > 0 && (
                            <div className="mt-3 pt-3 border-t border-gray-100 dark:border-[#1a1a1a] flex justify-between items-center">
                                <span className="text-xs text-gray-400 dark:text-[#555]">Saldo em aberto</span>
                                <span className="text-xl font-medium text-red-600 dark:text-red-500 tabular-nums">R$ {remaining.toFixed(2)}</span>
                            </div>
                        )}

                        <div className="space-y-2 mt-4">
                            <button onClick={() => !hasFiado && setIsFiscal(!isFiscal)} disabled={hasFiado} className={`w-full flex items-center justify-between px-3 py-3 rounded-lg border transition-all cursor-pointer bg-transparent ${isFiscal && !hasFiado ? 'border-orange-500/30 bg-orange-500/5' : 'border-gray-100 dark:border-[#1a1a1a] hover:bg-gray-50 dark:hover:bg-black'} ${hasFiado ? 'opacity-30 cursor-not-allowed' : ''}`}>
                                <div className="flex items-center gap-2.5">
                                    <ShieldCheck size={15} className={isFiscal && !hasFiado ? 'text-orange-600' : 'text-gray-400'} />
                                    <span className="text-xs text-gray-700 dark:text-gray-300">Emitir NFC-e</span>
                                </div>
                                <div className={`w-9 h-5 rounded-full transition-all relative ${isFiscal && !hasFiado ? 'bg-orange-600' : 'bg-gray-200 dark:bg-[#333]'}`}>
                                    <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${isFiscal && !hasFiado ? 'left-4' : 'left-0.5'}`} />
                                </div>
                            </button>

                            <button onClick={() => setIsCustomerCopy(!isCustomerCopy)} className={`w-full flex items-center justify-between px-3 py-3 rounded-lg border transition-all cursor-pointer bg-transparent ${isCustomerCopy ? 'border-orange-500/30 bg-orange-500/5' : 'border-gray-100 dark:border-[#1a1a1a] hover:bg-gray-50 dark:hover:bg-black'}`}>
                                <div className="flex items-center gap-2.5">
                                    <Receipt size={15} className={isCustomerCopy ? 'text-orange-600' : 'text-gray-400'} />
                                    <span className="text-xs text-gray-700 dark:text-gray-300">Recibo cliente</span>
                                </div>
                                <div className={`w-9 h-5 rounded-full transition-all relative ${isCustomerCopy ? 'bg-orange-600' : 'bg-gray-200 dark:bg-[#333]'}`}>
                                    <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${isCustomerCopy ? 'left-4' : 'left-0.5'}`} />
                                </div>
                            </button>

                            <button
                                disabled={(paidTotal < finalTotal - 0.01 && !isPartialAllowed) || paidTotal <= 0 || isProcessing}
                                onClick={handleConfirm}
                                className={`w-full py-3 mt-1 rounded-lg text-sm transition-all flex items-center justify-center gap-2 border-none ${
                                    (paidTotal >= finalTotal - 0.01 || (isPartialAllowed && paidTotal > 0)) && !isProcessing
                                        ? 'bg-emerald-600 text-white hover:bg-emerald-500 cursor-pointer'
                                        : 'bg-gray-100 dark:bg-white/5 text-gray-400 dark:text-[#333] cursor-not-allowed'
                                }`}
                            >
                                {paidTotal >= finalTotal - 0.01 ? 'Concluir venda' : 'Parcial'}
                                <Check size={14} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
