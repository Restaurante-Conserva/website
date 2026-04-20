"use client";

import { useState, useEffect, useRef } from 'react';
import {
    X, Check, Calculator, Wallet, QrCode, CreditCard,
    Banknote, Receipt, ShieldCheck, ArrowRight,
    Trash2, Info, Loader2, AlertCircle, Printer, Users, UserPlus, CheckCircle2
} from 'lucide-react';
import { useToast } from '../context/ToastContext';

interface Payment {
    method: 'money' | 'pix' | 'credit' | 'debit' | 'fiado';
    amount: number;
}

interface PaymentModalProps {
    total: number;
    hasCustomer: boolean;
    onCancel: () => void;
    onConfirm: (payments: Payment[], isFiscal: boolean, isCustomerCopy: boolean, paidAmount: number, fiadoTaker?: string, isMerchantCopy?: boolean, discount?: number) => void;
    isPartialAllowed?: boolean;
    customer?: any;
}

const METHODS = [
    { id: 'money', label: 'Dinheiro', icon: <Banknote size={20} />, color: 'hover:border-emerald-500 hover:text-emerald-500 hover:bg-emerald-500/10' },
    { id: 'pix', label: 'Pix', icon: <QrCode size={20} />, color: 'hover:border-teal-500 hover:text-teal-500 hover:bg-teal-500/10' },
    { id: 'credit', label: 'Crédito', icon: <CreditCard size={20} />, color: 'hover:border-blue-500 hover:text-blue-500 hover:bg-blue-500/10' },
    { id: 'debit', label: 'Débito', icon: <CreditCard size={20} />, color: 'hover:border-blue-500 hover:text-blue-500 hover:bg-blue-500/10' },
    { id: 'fiado', label: 'Fiado', icon: <AlertCircle size={20} />, color: 'hover:border-orange-500 hover:text-orange-500 hover:bg-orange-500/10' },
];

export default function PaymentModal({ total, hasCustomer, onCancel, onConfirm, isPartialAllowed = false, customer }: PaymentModalProps) {
    const { showToast } = useToast();
    const [payments, setPayments] = useState<Payment[]>([]);
    const [isFiscal, setIsFiscal] = useState(false);
    const [isCustomerCopy, setIsCustomerCopy] = useState(false);
    const [isMerchantCopy, setIsMerchantCopy] = useState(false);
    const [fiadoTaker, setFiadoTaker] = useState('');
    const [currentMethod, setCurrentMethod] = useState<any>(null);
    const [inputAmount, setInputAmount] = useState('');
    const [receivedAmount, setReceivedAmount] = useState('');
    const [totalChange, setTotalChange] = useState(0);
    const [isProcessing, setIsProcessing] = useState(false);
    const [discount, setDiscount] = useState(0);
    const [discountInput, setDiscountInput] = useState('');
    
    // Guard against multiple submissions
    const isSubmittingRef = useRef(false);

    // Mercado Pago PIX States
    const [isGeneratingPix, setIsGeneratingPix] = useState(false);
    const [pixData, setPixData] = useState<{ qr_code: string, qr_code_base64: string, id: string } | null>(null);
    const [pixStatus, setPixStatus] = useState<'pending' | 'approved' | 'expired'>('pending');
    const [pixTimer, setPixTimer] = useState(600); // 10 minutes

    const finalTotal = Math.max(0, total - discount);
    const paidTotal = payments.reduce((acc, p) => acc + p.amount, 0);
    const remaining = finalTotal - paidTotal;

    const hasFiado = payments.some(p => p.method === 'fiado') || currentMethod === 'fiado';

    useEffect(() => {
        if (remaining > 0) {
            setInputAmount(remaining.toFixed(2));
        } else {
            setInputAmount('0.00');
        }
    }, [remaining, payments]);

    useEffect(() => {
        if (hasFiado) {
            setIsMerchantCopy(true);
            setIsFiscal(false); // No fiado não deve gerar nota NFC
        }
    }, [hasFiado]);

    // PIX Polling and Timer
    useEffect(() => {
        let interval: any;
        if (pixData && pixStatus === 'pending') {
            interval = setInterval(async () => {
                try {
                    const res = await fetch(`/api/pay/pix?id=${pixData.id}`);
                    const data = await res.json();
                    if (data.status === 'approved') {
                        setPixStatus('approved');
                        const amt = parseFloat(inputAmount);
                        const newPayments: Payment[] = [...payments, { method: 'pix', amount: amt }];
                        setPayments(newPayments);
                        setPixData(null);
                        setCurrentMethod(null);

                        if (paidTotal + amt >= finalTotal - 0.01) {
                            setCurrentMethod(null);
                        }
                        showToast('Pagamento Pix recebido com sucesso!', 'success');
                    }
                } catch (e) {
                    console.error("Erro ao verificar Pix:", e);
                }
            }, 5000);
        }
        return () => clearInterval(interval);
    }, [pixData, pixStatus, inputAmount]);

    useEffect(() => {
        let timer: any;
        if (pixData && pixTimer > 0) {
            timer = setInterval(() => setPixTimer(prev => prev - 1), 1000);
        }
        return () => clearInterval(timer);
    }, [pixData, pixTimer]);

    const addPayment = () => {
        const amt = parseFloat(inputAmount);
        if (isNaN(amt) || amt <= 0 || amt > remaining + 0.01) return;

        if (currentMethod === 'money' && change > 0) {
            setTotalChange(prev => prev + change);
        }

        const newPayments = [...payments, { method: currentMethod, amount: amt }];
        setPayments(newPayments);

        setReceivedAmount('');
        if (remaining - amt <= 0.01) {
            setCurrentMethod(null);
            setPixData(null);
        }
    };

    const removePayment = (index: number) => {
        setPayments(payments.filter((_, i) => i !== index));
    };

    const handleConfirm = async () => {
        const discountedTotal = total - discount;
        if (!isPartialAllowed && paidTotal < discountedTotal - 0.01) return;
        if (paidTotal <= 0) return;
        
        if (isSubmittingRef.current || isProcessing) return; // double submit guard
        
        isSubmittingRef.current = true;
        setIsProcessing(true);
        try {
            await onConfirm(payments, isFiscal, isCustomerCopy, paidTotal + totalChange, fiadoTaker, isMerchantCopy, discount);
        } finally {
            // Usually the modal unmounts, but if it fails we reset it
            setIsProcessing(false);
            isSubmittingRef.current = false;
        }
    };

    const change = (parseFloat(receivedAmount) || 0) - (currentMethod === 'money' ? parseFloat(inputAmount) || 0 : 0);

    return (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-gray-900/60 dark:bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200 text-left font-sans text-sm transition-colors">
            <div className="w-full max-w-5xl bg-white dark:bg-[#0c0c0c] border border-gray-200 dark:border-white/[0.06] rounded-[24px] shadow-2xl flex flex-col md:flex-row overflow-hidden animate-in zoom-in-95 duration-200 max-h-[95vh] relative">
                
                {/* Overlay processing locker block */}
                {isProcessing && (
                    <div className="absolute inset-0 z-50 bg-white/50 dark:bg-black/50 backdrop-blur-sm flex flex-col items-center justify-center text-orange-600 dark:text-orange-500 rounded-[24px]">
                       <Loader2 className="animate-spin mb-4" size={48} />
                       <p className="font-black tracking-widest uppercase text-sm">Processando Pagamento...</p>
                    </div>
                )}

                {/* Left Side: Payment Area */}
                <div className="flex-1 flex flex-col h-full bg-gray-50 dark:bg-[#111] z-10 shadow-sm relative border-r border-gray-200 dark:border-white/[0.05] transition-colors">
                    <header className="p-6 md:p-10 flex justify-between items-start border-b border-gray-200 dark:border-white/[0.05] shrink-0 bg-white dark:bg-transparent">
                        <div className="space-y-4">
                            <div>
                                <h3 className="text-xs font-bold text-orange-600 dark:text-orange-500 tracking-widest mb-1.5 uppercase">Finalizar Recebimento</h3>
                                <div className="flex items-baseline gap-4">
                                    <h2 className="text-4xl lg:text-5xl font-black text-gray-900 dark:text-white tracking-tight">R$ {finalTotal.toFixed(2)}</h2>
                                    {discount > 0 && <span className="text-lg font-bold text-red-500 line-through decoration-2">R$ {total.toFixed(2)}</span>}
                                </div>
                            </div>

                            {remaining > 0 && payments.length === 0 && (
                                <div className="flex flex-wrap items-center gap-4 mt-6">
                                    <div className="flex items-center">
                                        <div className="relative group">
                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-bold text-red-500 dark:text-red-400">Desc R$</span>
                                            <input
                                                className="w-36 bg-red-50 dark:bg-[#150a0a] border border-red-200 dark:border-red-500/20 rounded-xl pl-16 pr-4 py-3 text-sm font-bold text-red-600 dark:text-red-400 outline-none focus:border-red-500 dark:focus:border-red-500/50 transition-all disabled:opacity-50"
                                                type="number"
                                                placeholder="0.00"
                                                value={discountInput}
                                                disabled={!!pixData}
                                                onChange={e => {
                                                    const val = parseFloat(e.target.value) || 0;
                                                    setDiscountInput(e.target.value);
                                                    setDiscount(val);
                                                }}
                                            />
                                        </div>
                                    </div>
                                    <div className="flex items-center bg-white dark:bg-[#0a0a0a] border border-gray-200 dark:border-white/[0.06] rounded-xl shadow-sm dark:shadow-none">
                                        <span className="text-xs font-bold text-gray-500 dark:text-[#777] px-4 uppercase tracking-widest flex items-center gap-2"><Users size={16}/> Dividir</span>
                                        <div className="flex border-l border-gray-200 dark:border-white/[0.06]">
                                            {[2, 3, 4, 5].map(n => (
                                                <button
                                                    key={`split-${n}`}
                                                    disabled={!!pixData}
                                                    onClick={() => setInputAmount((finalTotal / n).toFixed(2))}
                                                    className="w-12 h-10 flex items-center justify-center hover:bg-gray-50 dark:hover:bg-white/5 border-l border-gray-100 dark:border-white/[0.02] first:border-l-0 text-xs font-bold text-gray-500 dark:text-[#aaa] transition-all bg-transparent disabled:opacity-30 cursor-pointer"
                                                >
                                                    {n}x
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                        <button onClick={onCancel} className="p-2.5 bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 rounded-xl text-gray-500 dark:text-[#555] hover:text-gray-900 dark:hover:text-white transition-colors border-none cursor-pointer">
                            <X size={24} />
                        </button>
                    </header>

                    <div className="flex-1 overflow-y-auto p-6 md:p-10" style={{ scrollbarWidth: 'thin' }}>
                        {remaining <= 0 && !currentMethod ? (
                            <div className="h-full flex flex-col items-center justify-center space-y-8 animate-in fade-in zoom-in duration-500">
                                <div className="w-24 h-24 bg-emerald-100 dark:bg-emerald-500/10 rounded-full flex items-center justify-center text-emerald-600 dark:text-emerald-500 shadow-sm border border-emerald-200 dark:border-emerald-500/20">
                                    <CheckCircle2 size={48} strokeWidth={2.5} />
                                </div>
                                <div className="text-center space-y-3">
                                    <h3 className="text-2xl font-black text-gray-900 dark:text-white">Pagamento Concluído</h3>
                                    <p className="text-sm font-bold text-gray-500 dark:text-[#777] uppercase tracking-widest">O valor total já foi recebido</p>
                                </div>
                                <div className="w-full max-w-sm p-6 bg-white dark:bg-[#0a0a0a] rounded-2xl border border-gray-200 dark:border-white/[0.05] flex items-center justify-between shadow-sm">
                                    <span className="text-xs font-bold text-gray-500 dark:text-[#555] uppercase tracking-widest">Total Pago</span>
                                    <span className="text-2xl font-black text-emerald-600 dark:text-emerald-500">R$ {payments.reduce((acc, p) => acc + p.amount, 0).toFixed(2)}</span>
                                </div>
                            </div>
                        ) : !currentMethod ? (
                            <div className="space-y-6">
                                <h4 className="text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-[#777]">Selecione a Forma de Pagamento</h4>
                                <div className="grid grid-cols-2 gap-4">
                                    {METHODS.map(m => (
                                        <button
                                            key={m.id}
                                            disabled={(m.id === 'fiado' && !hasCustomer) || isProcessing || (payments.length > 0 && remaining > 0)}
                                            onClick={async () => {
                                                if (m.id === 'pix' && remaining > 0) {
                                                    setIsGeneratingPix(true);
                                                    try {
                                                        const res = await fetch('/api/pay/pix', {
                                                            method: 'POST',
                                                            headers: { 'Content-Type': 'application/json' },
                                                            body: JSON.stringify({ amount: remaining, description: 'Venda PDV' })
                                                        });
                                                        const data = await res.json();
                                                        if (data.success) {
                                                            setPixData({ qr_code: data.qr_code, qr_code_base64: data.qr_code_base64, id: data.id });
                                                            setPixStatus('pending');
                                                            setPixTimer(600);
                                                            setCurrentMethod('pix');
                                                        } else {
                                                            showToast("Erro ao gerar Pix", "error");
                                                        }
                                                    } catch (e) {
                                                        showToast("Falha na conexão com servidor Pix", "error");
                                                    } finally {
                                                        setIsGeneratingPix(false);
                                                    }
                                                } else {
                                                    setCurrentMethod(m.id);
                                                }
                                            }}
                                            className={`p-6 rounded-2xl border border-gray-200 dark:border-white/[0.05] flex flex-col items-center justify-center gap-4 transition-all bg-white dark:bg-[#0a0a0a] shadow-sm dark:shadow-none hover:shadow-md ${m.color} ${(m.id === 'fiado' && !hasCustomer) || isProcessing || (payments.length > 0 && remaining > 0) ? 'opacity-30 cursor-not-allowed grayscale' : 'cursor-pointer'} relative group`}
                                        >
                                            <div className="text-gray-400 dark:text-[#555] group-hover:text-current transition-colors">
                                                {isGeneratingPix && m.id === 'pix' ? <Loader2 className="animate-spin" size={32} /> : m.icon}
                                            </div>
                                            <span className="text-sm font-black text-gray-600 dark:text-[#aaa] group-hover:text-current transition-colors uppercase tracking-wider">
                                                {isGeneratingPix && m.id === 'pix' ? 'Gerando...' : m.label}
                                            </span>
                                            {m.id === 'fiado' && !hasCustomer && <span className="text-[10px] text-red-500 font-bold absolute -bottom-6">Cliente ñ identificado</span>}
                                            {payments.length > 0 && remaining > 0 && <span className="text-[10px] text-gray-500 dark:text-[#555] font-bold absolute -bottom-6">Finalize o atual 1º</span>}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-8 animate-in slide-in-from-right-4 duration-200 max-w-lg mx-auto">
                                <div className="flex items-center justify-between pb-6 border-b border-gray-200 dark:border-white/[0.05]">
                                    <h4 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-[#aaa] flex items-center justify-center border border-gray-200 dark:border-white/[0.05]">
                                            {METHODS.find(m => m.id === currentMethod)?.icon}
                                        </div>
                                        {pixData ? 'Pagamento via Pix' : METHODS.find(m => m.id === currentMethod)?.label}
                                    </h4>
                                    <button onClick={() => { setCurrentMethod(null); setReceivedAmount(''); setPixData(null); }} className="text-xs font-bold text-gray-500 dark:text-[#555] hover:text-gray-900 dark:hover:text-white uppercase tracking-widest border-none bg-transparent cursor-pointer px-3 py-2 transition-colors">
                                        CANCELAR
                                    </button>
                                </div>

                                <div className="space-y-8">
                                    {pixData ? (
                                        <div className="flex flex-col items-center gap-6">
                                            <div className="p-4 bg-white rounded-3xl shadow-md border border-gray-200">
                                                <img src={`data:image/jpeg;base64,${pixData.qr_code_base64}`} alt="Pix QR Code" className="w-64 h-64" />
                                            </div>
                                            <div className="text-center space-y-2">
                                                <p className="text-xs font-bold text-gray-500 dark:text-[#aaa] uppercase tracking-widest">Escaneie o QR Code no app</p>
                                                <div className="flex items-center justify-center gap-4">
                                                    <span className="text-3xl font-black text-gray-900 dark:text-white">R$ {parseFloat(inputAmount).toFixed(2)}</span>
                                                    <span className="px-3 py-1.5 bg-gray-100 dark:bg-[#0a0a0a] border border-gray-200 dark:border-white/[0.05] text-gray-600 dark:text-[#aaa] rounded-lg text-sm font-bold font-mono shadow-inner dark:shadow-none">
                                                        {Math.floor(pixTimer / 60)}:{String(pixTimer % 60).padStart(2, '0')}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="flex w-full gap-4">
                                                <button
                                                    onClick={() => {
                                                        navigator.clipboard.writeText(pixData.qr_code);
                                                        showToast("Código Copia e Cola copiado!", "success");
                                                    }}
                                                    className="flex-1 py-4 bg-gray-100 dark:bg-[#0a0a0a] border border-gray-200 dark:border-white/[0.05] text-gray-700 dark:text-[#aaa] hover:text-gray-900 dark:hover:text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-gray-200 dark:hover:bg-white/5 transition-colors cursor-pointer shadow-sm dark:shadow-none"
                                                >
                                                    Copia / Cola
                                                </button>
                                                <button
                                                    onClick={async () => {
                                                        try {
                                                            const res = await fetch('http://localhost:7777/print-pix', {
                                                                method: 'POST',
                                                                headers: { 'Content-Type': 'application/json' },
                                                                body: JSON.stringify({
                                                                    qrCode: pixData.qr_code,
                                                                    amount: parseFloat(inputAmount)
                                                                })
                                                            });
                                                            if (!res.ok) throw new Error();
                                                        } catch (e) {
                                                            showToast("Impressora offline.", "error");
                                                        }
                                                    }}
                                                    className="flex-1 py-4 bg-gray-900 dark:bg-white text-white dark:text-black rounded-xl text-xs uppercase tracking-widest font-bold hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-md"
                                                >
                                                    <Printer size={16} />
                                                    Imprimir
                                                </button>
                                            </div>
                                            <div className="flex items-center gap-3 text-teal-600 dark:text-teal-500 bg-teal-50 dark:bg-teal-500/10 border border-teal-200 dark:border-teal-500/20 px-5 py-3 rounded-xl shadow-sm dark:shadow-none">
                                                <Loader2 className="animate-spin" size={16} />
                                                <span className="text-xs font-bold uppercase tracking-widest">Aguardando Pagamento...</span>
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            {currentMethod === 'fiado' && (
                                                <div className="space-y-5">
                                                    <div className="p-5 bg-orange-50 dark:bg-orange-500/10 border border-orange-200 dark:border-orange-500/20 rounded-2xl flex items-start gap-4 shadow-sm dark:shadow-none">
                                                        <Info size={20} className="text-orange-600 dark:text-orange-500 mt-0.5 shrink-0" />
                                                        <div className="flex-1 space-y-1.5">
                                                            <p className="text-xs font-bold text-orange-600 dark:text-orange-400 uppercase tracking-widest">Identificação do portador</p>
                                                            <p className="text-xs text-orange-800 dark:text-orange-500/70 font-medium tracking-wide">Informe o nome de quem retira a mercadoria.</p>
                                                        </div>
                                                    </div>
                                                    {customer && (
                                                        <div className="flex justify-between items-center p-4 bg-red-50 dark:bg-red-500/10 rounded-2xl border border-red-200 dark:border-red-500/20 shadow-sm dark:shadow-none">
                                                            <span className="text-xs font-bold text-red-600 dark:text-red-400 uppercase tracking-widest">Dívida anterior</span>
                                                            <span className="text-base font-black text-red-600 dark:text-red-500">R$ {(customer.debtBalance || 0).toFixed(2)}</span>
                                                        </div>
                                                    )}
                                                    <div className="space-y-2">
                                                        <label className="text-xs font-bold text-gray-500 dark:text-[#777] uppercase tracking-widest ml-1">Nome do portador</label>
                                                        <input
                                                            className="w-full bg-white dark:bg-[#0a0a0a] border border-gray-300 dark:border-white/[0.06] rounded-2xl px-5 py-4 text-base text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-[#444] outline-none focus:border-orange-500 transition-all font-bold shadow-inner dark:shadow-none"
                                                            placeholder="Ex: João Silva"
                                                            value={fiadoTaker}
                                                            onChange={e => setFiadoTaker(e.target.value)}
                                                            autoFocus
                                                        />
                                                    </div>
                                                </div>
                                            )}

                                            {(currentMethod === 'credit' || currentMethod === 'debit') && (
                                                <div className="p-10 bg-white dark:bg-[#0a0a0a] rounded-3xl border border-gray-200 dark:border-white/[0.05] flex flex-col items-center justify-center gap-5 text-center shadow-sm dark:shadow-none">
                                                    <div className="w-20 h-20 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-500 border border-blue-200 dark:border-blue-500/20 rounded-full flex items-center justify-center animate-pulse shadow-inner dark:shadow-none">
                                                        <CreditCard size={36} />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-widest mb-2">Aguardando maquininha</p>
                                                        <p className="text-xs text-gray-500 dark:text-[#555] font-bold">Insira ou aproxime o cartão</p>
                                                    </div>
                                                </div>
                                            )}

                                            {currentMethod === 'money' && (
                                                <div className="space-y-6">
                                                    <div>
                                                        <label className="text-xs font-black text-emerald-600 dark:text-emerald-500 mb-2 uppercase tracking-widest block ml-1">Recebido (Cliente)</label>
                                                        <div className="relative shadow-sm dark:shadow-none rounded-2xl">
                                                            <span className="absolute left-5 top-1/2 -translate-y-1/2 text-xl font-black text-emerald-600/80 dark:text-emerald-600">R$</span>
                                                            <input
                                                                className="w-full bg-emerald-50 dark:bg-emerald-500/5 border border-emerald-200 dark:border-emerald-500/20 rounded-2xl pl-14 pr-5 py-5 text-3xl font-black text-emerald-700 dark:text-emerald-400 outline-none focus:border-emerald-500 transition-all shadow-inner dark:shadow-none"
                                                                type="number"
                                                                placeholder="0.00"
                                                                value={receivedAmount}
                                                                onChange={e => setReceivedAmount(e.target.value)}
                                                            />
                                                        </div>
                                                    </div>
                                                    {change > 0 && (
                                                        <div className="p-5 bg-emerald-600 dark:bg-emerald-600 rounded-2xl text-white flex justify-between items-center shadow-lg">
                                                            <span className="text-xs font-bold uppercase tracking-widest">Troco a devolver:</span>
                                                            <span className="text-2xl font-black">R$ {change.toFixed(2)}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            <div className="pt-6 border-t border-gray-200 dark:border-white/[0.05]">
                                                <label className="text-xs font-bold text-gray-500 dark:text-[#777] mb-2 uppercase tracking-widest block ml-1">Valor do Pagamento</label>
                                                <div className="relative shadow-sm dark:shadow-none rounded-2xl">
                                                    <span className="absolute left-5 top-1/2 -translate-y-1/2 text-xl font-bold text-gray-400 dark:text-[#555]">R$</span>
                                                    <input
                                                        className="w-full bg-white dark:bg-[#0a0a0a] border border-gray-300 dark:border-white/[0.06] rounded-2xl pl-14 pr-5 py-4 text-2xl font-black text-gray-900 dark:text-white outline-none focus:border-orange-500 transition-all shadow-inner dark:shadow-none"
                                                        type="number"
                                                        value={inputAmount}
                                                        onChange={e => setInputAmount(e.target.value)}
                                                    />
                                                </div>
                                            </div>

                                            <button
                                                disabled={isProcessing || !inputAmount || parseFloat(inputAmount) <= 0}
                                                onClick={addPayment}
                                                className={`w-full bg-orange-600 text-white py-5 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-orange-500 transition-all hover:scale-[1.01] active:scale-[0.99] shadow-xl shadow-orange-600/20 dark:shadow-orange-900/40 border-none cursor-pointer flex justify-center items-center mt-8 ${isProcessing ? 'opacity-70 pointer-events-none' : ''}`}
                                            >
                                                {isProcessing ? <Loader2 className="animate-spin" size={24} /> : 'Adicionar Pagamento'}
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Side: Resumo */}
                <div className="w-full md:w-[350px] bg-white dark:bg-[#0a0a0a] flex flex-col shrink-0 h-full relative z-0 transition-colors">
                    <div className="p-6 md:p-8 flex-1 flex flex-col border-l border-gray-100 dark:border-transparent">
                        <div className="flex flex-col gap-5 flex-1">
                            <h3 className="text-xs font-bold text-gray-500 dark:text-[#777] uppercase tracking-widest flex items-center gap-2">
                                <Receipt size={16} /> Resumo Financeiro
                            </h3>

                            <div className="space-y-3 mt-2 flex-1 auto-rows-min overflow-y-auto pr-1 pb-6" style={{ scrollbarWidth: 'none' }}>
                                {payments.length === 0 ? (
                                    <div className="h-48 flex flex-col items-center justify-center text-gray-400 dark:text-[#444] border-2 border-dashed border-gray-200 dark:border-white/[0.05] rounded-3xl bg-gray-50 dark:bg-[#111]">
                                        <Wallet size={32} className="mb-3 opacity-40 dark:opacity-30 text-gray-500" />
                                        <p className="text-xs font-bold uppercase tracking-widest text-center">Nenhum recebimento<br/>adicionado</p>
                                    </div>
                                ) : (
                                    payments.map((p, i) => (
                                        <div key={`paid-m-${i}`} className="bg-gray-50 dark:bg-[#111] p-4 rounded-2xl border border-gray-200 dark:border-white/[0.05] flex items-center justify-between shadow-sm animate-in slide-in-from-right-4 duration-200">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-white dark:bg-[#0a0a0a] text-gray-600 dark:text-[#aaa] border border-gray-200 dark:border-white/[0.05] flex items-center justify-center shadow-sm dark:shadow-none">
                                                    {METHODS.find(m => m.id === p.method)?.icon}
                                                </div>
                                                <p className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider">
                                                    {METHODS.find(m => m.id === p.method)?.label}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className="text-base font-black text-gray-900 dark:text-white">R$ {(p.amount || 0).toFixed(2)}</span>
                                                {remaining > 0 && (
                                                    <button onClick={() => removePayment(i)} className="p-2 text-gray-400 dark:text-[#555] hover:text-red-600 dark:hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl border-none bg-transparent cursor-pointer transition-colors"><Trash2 size={16} /></button>
                                                )}
                                            </div>
                                        </div>
                                    ))
                                )}

                                {remaining > 0 && (
                                    <div className="mt-6 pt-5 border-t border-gray-200 dark:border-white/[0.05] flex justify-between items-center">
                                        <span className="text-xs font-bold text-gray-500 dark:text-[#777] uppercase tracking-widest">Falta pagar</span>
                                        <span className="text-2xl font-black text-red-600 dark:text-red-500">R$ {(remaining || 0).toFixed(2)}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="space-y-3 mt-auto pt-6 border-t border-gray-200 dark:border-white/[0.05]">
                            <label className={`flex items-center justify-between p-4 rounded-2xl border cursor-pointer transition-colors ${isFiscal && !hasFiado ? 'bg-orange-50 dark:bg-orange-600/10 border-orange-200 dark:border-orange-500/30 shadow-sm' : 'bg-gray-50 dark:bg-[#111] border-gray-200 dark:border-white/[0.05] hover:border-gray-300 dark:hover:border-white/[0.1]'} ${hasFiado ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                <div className="flex items-center gap-3">
                                    <ShieldCheck size={20} className={isFiscal && !hasFiado ? 'text-orange-600 dark:text-orange-500' : 'text-gray-500 dark:text-[#555]'} />
                                    <div className="flex flex-col">
                                        <span className={`text-xs font-bold tracking-widest uppercase ${isFiscal && !hasFiado ? 'text-orange-700 dark:text-orange-400' : 'text-gray-600 dark:text-[#aaa]'}`}>Nota Fiscal (NFC-e)</span>
                                        {hasFiado && <span className="text-[9px] font-bold uppercase text-red-500 mt-0.5">Bloqueado p/ Fiado</span>}
                                    </div>
                                </div>
                                <div className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 ease-in-out ${isFiscal && !hasFiado ? 'bg-orange-600' : 'bg-gray-300 dark:bg-white/10'}`}>
                                    <input type="checkbox" className="hidden" checked={isFiscal} disabled={hasFiado} onChange={() => setIsFiscal(!isFiscal)} />
                                    <span aria-hidden="true" className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow transition duration-200 ease-in-out ${isFiscal && !hasFiado ? 'translate-x-[22px]' : 'translate-x-[4px]'}`} />
                                </div>
                            </label>

                            <label className={`flex items-center justify-between p-4 rounded-2xl border cursor-pointer transition-colors ${isCustomerCopy ? 'bg-orange-50 dark:bg-orange-600/10 border-orange-200 dark:border-orange-500/30 shadow-sm' : 'bg-gray-50 dark:bg-[#111] border-gray-200 dark:border-white/[0.05] hover:border-gray-300 dark:hover:border-white/[0.1]'}`}>
                                <div className="flex items-center gap-3">
                                    <Receipt size={20} className={isCustomerCopy ? 'text-orange-600 dark:text-orange-500' : 'text-gray-500 dark:text-[#555]'} />
                                    <span className={`text-xs font-bold tracking-widest uppercase ${isCustomerCopy ? 'text-orange-700 dark:text-orange-400' : 'text-gray-600 dark:text-[#aaa]'}`}>Imprimir p/ Cliente</span>
                                </div>
                                <div className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 ease-in-out ${isCustomerCopy ? 'bg-orange-600' : 'bg-gray-300 dark:bg-white/10'}`}>
                                    <input type="checkbox" className="hidden" checked={isCustomerCopy} onChange={() => setIsCustomerCopy(!isCustomerCopy)} />
                                    <span aria-hidden="true" className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow transition duration-200 ease-in-out ${isCustomerCopy ? 'translate-x-[22px]' : 'translate-x-[4px]'}`} />
                                </div>
                            </label>

                            <label className={`flex items-center justify-between p-4 rounded-2xl border cursor-pointer transition-colors ${isMerchantCopy ? 'bg-gray-200 dark:bg-white/[0.05] border-gray-300 dark:border-white/[0.2] shadow-sm' : 'bg-gray-50 dark:bg-[#111] border-gray-200 dark:border-white/[0.05] hover:border-gray-300 dark:hover:border-white/[0.1]'}`}>
                                <div className="flex items-center gap-3">
                                    <Printer size={20} className={isMerchantCopy ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-[#555]'} />
                                    <span className={`text-xs font-bold tracking-widest uppercase ${isMerchantCopy ? 'text-gray-900 dark:text-white' : 'text-gray-600 dark:text-[#aaa]'}`}>Imprimir Via Interna</span>
                                </div>
                                <div className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 ease-in-out ${isMerchantCopy ? 'bg-gray-600 dark:bg-white' : 'bg-gray-300 dark:bg-white/10'}`}>
                                    <input type="checkbox" className="hidden" checked={isMerchantCopy} onChange={() => setIsMerchantCopy(!isMerchantCopy)} />
                                    <span aria-hidden="true" className={`pointer-events-none inline-block h-4 w-4 transform rounded-full ${isMerchantCopy ? 'bg-white dark:bg-black' : 'bg-white'} shadow transition duration-200 ease-in-out ${isMerchantCopy ? 'translate-x-[22px]' : 'translate-x-[4px]'}`} />
                                </div>
                            </label>

                            <button
                                disabled={(paidTotal < finalTotal - 0.01 && !isPartialAllowed) || paidTotal <= 0 || isProcessing}
                                onClick={handleConfirm}
                                className={`w-full py-5 mt-4 rounded-2xl font-black text-sm tracking-widest uppercase shadow-sm transition-all flex items-center justify-center gap-3 border-none ${
                                    (paidTotal >= finalTotal - 0.01 || (isPartialAllowed && paidTotal > 0)) && !isProcessing
                                    ? 'bg-emerald-600 text-white hover:bg-emerald-500 hover:scale-[1.01] cursor-pointer active:scale-[0.98] shadow-xl shadow-emerald-600/30'
                                    : 'bg-gray-200 dark:bg-white/5 text-gray-400 dark:text-[#444] cursor-not-allowed'
                                }`}
                            >
                                {isProcessing ? <Loader2 className="animate-spin" size={24} /> : (
                                    <>
                                        <span>{paidTotal >= finalTotal - 0.01 ? 'FINALIZAR VENDA' : 'CONFIRMAR PARCIAL'}</span>
                                        <Check size={20} strokeWidth={3} />
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
