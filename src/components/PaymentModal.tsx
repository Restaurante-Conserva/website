"use client";

import { useState, useEffect } from 'react';
import {
    X, Check, Calculator, Wallet, QrCode, CreditCard,
    Banknote, Receipt, ShieldCheck, ArrowRight,
    Trash2, Info, Loader2, AlertCircle, Printer, Users, UserPlus, CheckCircle2
} from 'lucide-react';

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
    { id: 'money', label: 'Dinheiro', icon: <Banknote size={20} />, color: 'hover:border-green-500 hover:text-green-600' },
    { id: 'pix', label: 'Pix', icon: <QrCode size={20} />, color: 'hover:border-teal-500 hover:text-teal-600' },
    { id: 'credit', label: 'Crédito', icon: <CreditCard size={20} />, color: 'hover:border-blue-500 hover:text-blue-600' },
    { id: 'debit', label: 'Débito', icon: <CreditCard size={20} />, color: 'hover:border-blue-500 hover:text-blue-600' },
    { id: 'fiado', label: 'Fiado', icon: <AlertCircle size={20} />, color: 'hover:border-orange-500 hover:text-orange-600' },
];

export default function PaymentModal({ total, hasCustomer, onCancel, onConfirm, isPartialAllowed = false, customer }: PaymentModalProps) {
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
        setIsProcessing(true);
        try {
            await onConfirm(payments, isFiscal, isCustomerCopy, paidTotal + totalChange, fiadoTaker, isMerchantCopy, discount);
        } finally {
            setIsProcessing(false);
        }
    };

    const change = (parseFloat(receivedAmount) || 0) - (currentMethod === 'money' ? parseFloat(inputAmount) || 0 : 0);

    return (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-gray-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-200 text-left">
            <div className="w-full max-w-4xl bg-white rounded-3xl shadow-2xl flex flex-col md:flex-row overflow-hidden border border-gray-100 font-sans text-sm animate-in zoom-in duration-200">

                <div className="flex-1 p-8 md:p-10 space-y-8 h-full overflow-y-auto">
                    <header className="flex justify-between items-start">
                        <div className="flex items-center gap-4">
                            <div className="flex flex-col">
                                <h3 className="text-[10px] font-bold text-blue-600 tracking-wider mb-1 uppercase">Finalizar Pedido</h3>
                                <h2 className="text-2xl font-extrabold text-gray-800 tracking-tight">R$ {finalTotal.toFixed(2)}</h2>
                                {discount > 0 && <span className="text-[10px] font-bold text-red-500 line-through">R$ {total.toFixed(2)}</span>}
                            </div>

                            {remaining > 0 && payments.length === 0 && (
                                <div className="flex flex-col gap-2">
                                    <div className="flex items-center gap-2">
                                        <div className="relative w-32">
                                            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-red-400">DESC. R$</span>
                                            <input
                                                className="w-full bg-red-50/50 border border-red-100 rounded-lg pl-14 pr-2 py-1.5 text-[10px] font-bold text-red-600 outline-none focus:bg-white focus:border-red-500 transition-all font-sans disabled:opacity-50 disabled:cursor-not-allowed"
                                                type="number"
                                                placeholder="0,00"
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
                                    <div className="flex items-center gap-1 bg-gray-50 p-1.5 rounded-xl border border-gray-100 animate-in fade-in zoom-in duration-300">
                                        <Users size={12} className="text-gray-400 ml-1" />
                                        <span className="text-[8px] font-bold text-gray-400 uppercase mr-2">Dividir:</span>
                                        {[2, 3, 4, 5].map(n => (
                                            <button
                                                key={`split-${n}`}
                                                disabled={!!pixData}
                                                onClick={() => setInputAmount((finalTotal / n).toFixed(2))}
                                                className="px-2 py-1 hover:bg-white hover:shadow-sm rounded-lg text-[10px] font-bold text-gray-600 transition-all border-none bg-transparent cursor-pointer disabled:opacity-20 disabled:cursor-not-allowed"
                                            >
                                                {n}x
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                        <button onClick={onCancel} className="p-2 hover:bg-gray-100 rounded-xl text-gray-300 transition-all border-none bg-transparent cursor-pointer">
                            <X size={20} />
                        </button>
                    </header>

                    {/* Métodos de Pagamento ou Tela de Confirmacao */}
                    {remaining <= 0 && !currentMethod ? (
                        <div className="flex-1 flex flex-col items-center justify-center space-y-6 py-10 animate-in fade-in zoom-in duration-500">
                            <div className="w-24 h-24 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-500 shadow-sm border border-emerald-100">
                                <CheckCircle2 size={48} strokeWidth={2.5} />
                            </div>
                            <div className="text-center space-y-2">
                                <h3 className="text-xl font-extrabold text-gray-800 tracking-tight">Pedido Quitado!</h3>
                                <p className="text-xs font-medium text-slate-400">Tudo pronto para finalizar a venda.</p>
                            </div>
                            <div className="flex flex-col gap-2 w-full max-w-xs">
                                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Recebido</span>
                                    <span className="text-sm font-black text-slate-900 italic">R$ {payments.reduce((acc, p) => acc + p.amount, 0).toFixed(2)}</span>
                                </div>
                            </div>
                        </div>
                    ) : !currentMethod ? (
                        <div className="space-y-6">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Escolha a Forma de Pagamento</p>
                            <div className="grid grid-cols-2 gap-3">
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
                                                        alert("Erro ao gerar Pix");
                                                    }
                                                } catch (e) {
                                                    alert("Falha na conexão com Mercado Pago");
                                                } finally {
                                                    setIsGeneratingPix(false);
                                                }
                                            } else {
                                                setCurrentMethod(m.id);
                                            }
                                        }}
                                        className={`p-6 border border-gray-100 rounded-2xl flex flex-col items-center justify-center gap-3 transition-all bg-gray-50/30 hover:bg-white hover:border-blue-500 hover:shadow-lg hover:shadow-blue-500/5 ${m.color} ${(m.id === 'fiado' && !hasCustomer) || isProcessing || (payments.length > 0 && remaining > 0) ? 'opacity-20 grayscale cursor-not-allowed' : ''} cursor-pointer relative group`}
                                    >
                                        <div className="group-hover:scale-110 transition-transform">
                                            {isGeneratingPix && m.id === 'pix' ? <Loader2 className="animate-spin" size={20} /> : m.icon}
                                        </div>
                                        <span className="text-[10px] font-bold tracking-tight">{isGeneratingPix && m.id === 'pix' ? 'Gerando...' : m.label}</span>
                                        {m.id === 'fiado' && !hasCustomer && <span className="text-[7px] text-red-500 font-bold uppercase absolute bottom-2">Identifique o Cliente</span>}
                                        {payments.length > 0 && remaining > 0 && <span className="text-[7px] text-gray-400 font-bold uppercase absolute bottom-2">Conclua o pagamento atual</span>}
                                    </button>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-8 animate-in slide-in-from-left duration-200">
                            <div className="flex items-center gap-3">
                                <button onClick={() => { setCurrentMethod(null); setReceivedAmount(''); setPixData(null); }} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 border-none bg-transparent cursor-pointer">
                                    <X size={16} />
                                </button>
                                <h4 className="text-xs font-bold text-gray-700 tracking-wide text-left flex items-center gap-2">
                                    {pixData ? 'Pagamento via Mercado Pago' : `Pagando com ${METHODS.find(m => m.id === currentMethod)?.label}`}
                                </h4>
                            </div>

                            <div className="space-y-6">
                                {pixData ? (
                                    <div className="flex flex-col items-center gap-6 animate-in zoom-in duration-300">
                                        <img src={`data:image/jpeg;base64,${pixData.qr_code_base64}`} alt="Pix QR Code" className="w-64 h-64 transition-all" />
                                        <div className="text-center space-y-2">
                                            <p className="text-[10px] font-bold text-teal-600 uppercase tracking-widest font-sans">Escaneie o código acima ou imprima</p>
                                            <div className="flex items-center justify-center gap-3">
                                                <span className="text-3xl font-black text-gray-800 tracking-tighter">R$ {parseFloat(inputAmount).toFixed(2)}</span>
                                                <div className="px-2 py-1 bg-gray-900 text-white rounded text-[8px] font-bold">
                                                    {Math.floor(pixTimer / 60)}:{String(pixTimer % 60).padStart(2, '0')}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => {
                                                    navigator.clipboard.writeText(pixData.qr_code);
                                                    alert("Código Copia e Cola copiado!");
                                                }}
                                                className="px-6 py-3 bg-teal-100/50 text-teal-700 rounded-2xl text-[10px] font-bold uppercase tracking-widest hover:bg-teal-100 transition-all border-none cursor-pointer"
                                            >
                                                Copiar código
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
                                                        alert("Impressora offline ou não conectada");
                                                    }
                                                }}
                                                className="px-6 py-3 bg-gray-900 text-white rounded-2xl text-[10px] font-bold uppercase tracking-widest hover:bg-black transition-all border-none flex items-center gap-2 cursor-pointer shadow-lg shadow-gray-200"
                                            >
                                                <Printer size={16} />
                                                Imprimir QR
                                            </button>
                                        </div>
                                        <div className="flex items-center gap-2 text-gray-400">
                                            <Loader2 className="animate-spin" size={12} />
                                            <span className="text-[9px] font-bold italic tracking-wide">Aguardando confirmação em tempo real...</span>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        {currentMethod === 'fiado' && (
                                            <div className="space-y-4 animate-in fade-in duration-300">
                                                <div className="p-4 bg-orange-50 rounded-2xl border border-orange-100 flex items-center gap-4">
                                                    <div className="w-10 h-10 bg-orange-500 text-white rounded-xl flex items-center justify-center shadow-lg shadow-orange-100">
                                                        <UserPlus size={20} />
                                                    </div>
                                                    <div className="flex-1">
                                                        <p className="text-xs font-bold text-orange-900">Quem pegou o pedido?</p>
                                                        <p className="text-[9px] font-bold text-orange-400 uppercase tracking-widest">A pessoa que retirou em nome da empresa</p>
                                                    </div>
                                                </div>
                                                {customer && (
                                                    <div className="flex justify-between items-center px-2 py-1 bg-red-50 rounded-lg border border-red-100">
                                                        <span className="text-[10px] font-bold text-red-400 uppercase tracking-widest">Saldo Devedor Atual</span>
                                                        <span className="text-sm font-black text-red-600">R$ {(customer.debtBalance || 0).toFixed(2)}</span>
                                                    </div>
                                                )}
                                                <input
                                                    className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 text-sm font-bold placeholder:text-gray-300 outline-none focus:bg-white focus:border-orange-500 transition-all"
                                                    placeholder="Nome de quem está levando..."
                                                    value={fiadoTaker}
                                                    onChange={e => setFiadoTaker(e.target.value)}
                                                    autoFocus
                                                />
                                            </div>
                                        )}

                                        {(currentMethod === 'credit' || currentMethod === 'debit') && (
                                            <div className="p-4 bg-blue-50 rounded-2xl flex items-center gap-4 animate-in fade-in duration-300 border border-blue-100">
                                                <div className="w-10 h-10 bg-blue-600 text-white rounded-xl flex items-center justify-center animate-pulse shadow-lg shadow-blue-100">
                                                    <CreditCard size={20} />
                                                </div>
                                                <div>
                                                    <p className="text-xs font-bold text-blue-900">Aguardando maquininha...</p>
                                                    <p className="text-[9px] font-bold text-blue-400 uppercase tracking-widest">Insira ou aproxime o cartão</p>
                                                </div>
                                            </div>
                                        )}

                                        {currentMethod === 'money' && (
                                            <div className="animate-in fade-in duration-200 space-y-4">
                                                <div>
                                                    <label className="text-[10px] font-bold text-green-600 uppercase mb-2 block ml-1 text-left">Valor recebido (Dinheiro)</label>
                                                    <div className="relative">
                                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-bold text-gray-300">R$</span>
                                                        <input
                                                            className="w-full bg-green-50/30 border border-green-100 rounded-2xl pl-11 pr-4 py-4 text-2xl font-bold text-green-700 outline-none focus:bg-white focus:border-green-500 transition-all font-sans"
                                                            type="number"
                                                            placeholder="0,00"
                                                            value={receivedAmount}
                                                            onChange={e => setReceivedAmount(e.target.value)}
                                                        />
                                                    </div>
                                                </div>
                                                {change > 0 && (
                                                    <div className="p-4 bg-green-600 rounded-xl text-white flex justify-between items-center shadow-lg shadow-green-100">
                                                        <span className="text-[9px] font-bold uppercase tracking-widest">Troco a devolver:</span>
                                                        <span className="text-xl font-bold tracking-tight">R$ {change.toFixed(2)}</span>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        <div className="text-left">
                                            <label className="text-[10px] font-bold text-gray-400 mb-2 block ml-1 uppercase tracking-widest">Valor do Lançamento</label>
                                            <div className="relative">
                                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-bold text-gray-300">R$</span>
                                                <input
                                                    className="w-full bg-gray-50 border border-gray-100 rounded-2xl pl-11 pr-4 py-4 text-2xl font-bold outline-none focus:bg-white focus:border-blue-500 transition-all font-sans"
                                                    type="number"
                                                    value={inputAmount}
                                                    onChange={e => setInputAmount(e.target.value)}
                                                />
                                            </div>
                                        </div>

                                        <button
                                            disabled={isProcessing || !inputAmount || parseFloat(inputAmount) <= 0}
                                            onClick={addPayment}
                                            className={`w-full bg-gray-800 text-white py-4 rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-black transition-all active:scale-95 shadow-lg border-none cursor-pointer ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        >
                                            {isProcessing ? <Loader2 className="animate-spin mx-auto" size={20} /> : 'Confirmar Valor'}
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                <div className="w-full md:w-[320px] bg-gray-50/50 border-l border-gray-100 p-8 flex flex-col gap-6 shrink-0 h-full overflow-y-auto">
                    <div className="flex-1 flex flex-col gap-4 overflow-y-auto">
                        <div className="flex items-center gap-2 mb-2 font-bold text-[9px] text-gray-400 tracking-widest uppercase">
                            <Receipt size={14} /> Resumo dos pagamentos
                        </div>

                        <div className="space-y-2">
                            {payments.map((p, i) => (
                                <div key={`paid-m-${i}`} className="bg-white p-3 rounded-xl border border-gray-100 flex items-center justify-between shadow-sm animate-in slide-in-from-right duration-200">
                                    <div className="flex items-center gap-3">
                                        <div className="text-gray-400">{METHODS.find(m => m.id === p.method)?.icon}</div>
                                        <p className="text-[9px] font-bold text-gray-700 tracking-tight">
                                            {METHODS.find(m => m.id === p.method)?.label}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="text-xs font-bold text-gray-800 tabular-nums">R$ {(p.amount || 0).toFixed(2)}</span>
                                        {remaining > 0 && (
                                            <button onClick={() => removePayment(i)} className="p-1 text-gray-200 hover:text-red-500 border-none bg-transparent cursor-pointer transition-colors"><Trash2 size={14} /></button>
                                        )}
                                    </div>
                                </div>
                            ))}
                            {payments.length === 0 && (
                                <div className="py-12 flex flex-col items-center justify-center text-gray-300 opacity-60 border-2 border-dashed border-gray-100 rounded-3xl">
                                    <Wallet size={24} className="mb-2" />
                                    <p className="text-[8px] font-bold tracking-widest uppercase">Aguardando pagamento</p>
                                </div>
                            )}
                        </div>

                        <div className="mt-auto pt-4 border-t border-gray-100">
                            {remaining > 0 ? (
                                <div className="flex justify-between items-center px-1">
                                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Falta</span>
                                    <span className="text-lg font-black text-blue-600 tabular-nums">R$ {(remaining || 0).toFixed(2)}</span>
                                </div>
                            ) : null}
                        </div>
                    </div>

                    <div className="space-y-3 shrink-0">
                        <button
                            disabled={hasFiado}
                            onClick={() => !hasFiado && setIsFiscal(!isFiscal)}
                            className={`w-full p-3 rounded-xl border flex items-center justify-between transition-all ${isFiscal ? 'bg-blue-600 border-blue-600 text-white shadow-md' : 'bg-white border-gray-100 text-gray-400 hover:border-blue-100 hover:text-blue-500'} ${hasFiado ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                        >
                            <div className="flex items-center gap-2">
                                <ShieldCheck size={16} />
                                <div className="flex flex-col text-left">
                                    <span className="text-[9px] font-bold uppercase tracking-wider">Cupom fiscal (NFC-e)</span>
                                    {hasFiado && <span className="text-[7px] font-bold text-orange-500 uppercase">Indisponível para Fiado</span>}
                                </div>
                            </div>
                            <div className={`w-8 h-4 rounded-full relative ${isFiscal ? 'bg-white/20' : 'bg-gray-100'}`}>
                                <div className={`absolute top-0.5 w-3 h-3 rounded-full transition-all ${isFiscal ? 'right-0.5 bg-white' : 'left-0.5 bg-gray-300'}`} />
                            </div>
                        </button>

                        <button
                            onClick={() => setIsCustomerCopy(!isCustomerCopy)}
                            className={`w-full p-3 rounded-xl border flex items-center justify-between transition-all ${isCustomerCopy ? 'bg-blue-600 border-blue-600 text-white shadow-md' : 'bg-white border-gray-100 text-gray-400 hover:border-blue-100 hover:text-blue-500'} cursor-pointer`}
                        >
                            <div className="flex items-center gap-2">
                                <Receipt size={16} />
                                <span className="text-[9px] font-bold uppercase tracking-wider">Imprimir via cliente</span>
                            </div>
                            <div className={`w-8 h-4 rounded-full relative ${isCustomerCopy ? 'bg-white/20' : 'bg-gray-100'}`}>
                                <div className={`absolute top-0.5 w-3 h-3 rounded-full transition-all ${isCustomerCopy ? 'right-0.5 bg-white' : 'left-0.5 bg-gray-300'}`} />
                            </div>
                        </button>

                        <button
                            onClick={() => setIsMerchantCopy(!isMerchantCopy)}
                            className={`w-full p-3 rounded-xl border flex items-center justify-between transition-all ${isMerchantCopy ? 'bg-orange-600 border-orange-600 text-white shadow-md' : 'bg-white border-gray-100 text-gray-400 hover:border-orange-100 hover:text-orange-500'} cursor-pointer`}
                        >
                            <div className="flex items-center gap-2">
                                <Printer size={16} />
                                <span className="text-[9px] font-bold uppercase tracking-wider">Via Estabelecimento</span>
                            </div>
                            <div className={`w-8 h-4 rounded-full relative ${isMerchantCopy ? 'bg-white/20' : 'bg-gray-100'}`}>
                                <div className={`absolute top-0.5 w-3 h-3 rounded-full transition-all ${isMerchantCopy ? 'right-0.5 bg-white' : 'left-0.5 bg-gray-300'}`} />
                            </div>
                        </button>

                        <button
                            disabled={(paidTotal < finalTotal - 0.01 && !isPartialAllowed) || paidTotal <= 0 || isProcessing}
                            onClick={handleConfirm}
                            className={`w-full py-4 rounded-2xl font-bold text-[10px] tracking-[0.2em] shadow-lg transition-all flex items-center justify-center gap-3 ${(paidTotal >= finalTotal - 0.01 || (isPartialAllowed && paidTotal > 0)) ? 'bg-green-600 text-white hover:bg-green-700 active:scale-95' : 'bg-gray-100 text-gray-300 cursor-not-allowed'} border-none cursor-pointer`}
                        >
                            {isProcessing ? <Loader2 className="animate-spin" size={16} /> : (
                                <>
                                    <span>{paidTotal >= finalTotal - 0.01 ? 'FECHAR PEDIDO' : 'CONFIRMAR PARCIAL'}</span>
                                    <ArrowRight size={16} />
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
