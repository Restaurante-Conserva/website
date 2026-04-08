"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import {
    X, Check, Calculator, Wallet, QrCode, CreditCard,
    Banknote, Receipt, ShieldCheck, ArrowRight,
    Trash2, Info, Loader2, AlertCircle, Printer, Users, UserPlus, CheckCircle2
} from 'lucide-react';

interface Payment {
    method: 'money' | 'pix' | 'credit' | 'debit' | 'fiado';
    amount: number;
    transactionId?: string;
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
    { id: 'money', label: 'Dinheiro', icon: <Banknote size={20} />, color: 'hover:border-success hover:text-success' },
    { id: 'pix', label: 'Pix', icon: <QrCode size={20} />, color: 'hover:border-secondary hover:text-secondary' },
    { id: 'credit', label: 'Crédito', icon: <CreditCard size={20} />, color: 'hover:border-secondary hover:text-secondary' },
    { id: 'debit', label: 'Débito', icon: <CreditCard size={20} />, color: 'hover:border-secondary hover:text-secondary' },
    { id: 'fiado', label: 'Fiado', icon: <AlertCircle size={20} />, color: 'hover:border-primary hover:text-primary' },
];

// Generate unique transaction ID
const generateTransactionId = () => `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

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

    // Duplicate prevention states
    const [isConfirming, setIsConfirming] = useState(false);
    const [lastConfirmTime, setLastConfirmTime] = useState(0);
    const confirmLockRef = useRef(false);
    const transactionIdRef = useRef<string>(generateTransactionId());

    // Mercado Pago PIX States
    const [isGeneratingPix, setIsGeneratingPix] = useState(false);
    const [pixData, setPixData] = useState<{ qr_code: string, qr_code_base64: string, id: string } | null>(null);
    const [pixStatus, setPixStatus] = useState<'pending' | 'approved' | 'expired'>('pending');
    const [pixTimer, setPixTimer] = useState(600);

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
            setIsFiscal(false);
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
                        const newPayments: Payment[] = [...payments, { 
                            method: 'pix', 
                            amount: amt,
                            transactionId: generateTransactionId()
                        }];
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
    }, [pixData, pixStatus, inputAmount, payments, paidTotal, finalTotal]);

    useEffect(() => {
        let timer: any;
        if (pixData && pixTimer > 0) {
            timer = setInterval(() => setPixTimer(prev => prev - 1), 1000);
        }
        return () => clearInterval(timer);
    }, [pixData, pixTimer]);

    const addPayment = useCallback(() => {
        if (isProcessing) return;
        
        const amt = parseFloat(inputAmount);
        if (isNaN(amt) || amt <= 0 || amt > remaining + 0.01) return;

        setIsProcessing(true);

        try {
            if (currentMethod === 'money' && change > 0) {
                setTotalChange(prev => prev + change);
            }

            const newPayment: Payment = { 
                method: currentMethod, 
                amount: amt,
                transactionId: generateTransactionId()
            };
            
            const newPayments = [...payments, newPayment];
            setPayments(newPayments);

            setReceivedAmount('');
            if (remaining - amt <= 0.01) {
                setCurrentMethod(null);
                setPixData(null);
            }
        } finally {
            setTimeout(() => setIsProcessing(false), 300);
        }
    }, [inputAmount, remaining, currentMethod, payments, isProcessing]);

    const removePayment = (index: number) => {
        setPayments(payments.filter((_, i) => i !== index));
    };

    const handleConfirm = useCallback(async () => {
        // Multiple layers of duplicate prevention
        const now = Date.now();
        
        // 1. Check time-based lock (prevent rapid clicks)
        if (now - lastConfirmTime < 2000) {
            return;
        }
        
        // 2. Check ref-based lock (prevent concurrent calls)
        if (confirmLockRef.current) {
            return;
        }
        
        // 3. Check state-based lock
        if (isConfirming) {
            return;
        }

        const discountedTotal = total - discount;
        if (!isPartialAllowed && paidTotal < discountedTotal - 0.01) return;
        if (paidTotal <= 0) return;

        // Set all locks
        confirmLockRef.current = true;
        setIsConfirming(true);
        setLastConfirmTime(now);
        setIsProcessing(true);

        try {
            // Add transaction ID to prevent server-side duplicates
            const paymentsWithIds = payments.map(p => ({
                ...p,
                transactionId: p.transactionId || generateTransactionId()
            }));

            await onConfirm(
                paymentsWithIds, 
                isFiscal, 
                isCustomerCopy, 
                paidTotal + totalChange, 
                fiadoTaker, 
                isMerchantCopy, 
                discount
            );
        } catch (error) {
            console.error('Payment confirmation error:', error);
            // Reset locks on error to allow retry
            confirmLockRef.current = false;
            setIsConfirming(false);
        } finally {
            setIsProcessing(false);
        }
    }, [
        lastConfirmTime, isConfirming, total, discount, isPartialAllowed, 
        paidTotal, payments, isFiscal, isCustomerCopy, totalChange, 
        fiadoTaker, isMerchantCopy, onConfirm
    ]);

    const change = (parseFloat(receivedAmount) || 0) - (currentMethod === 'money' ? parseFloat(inputAmount) || 0 : 0);

    // Disable confirm button conditions
    const isConfirmDisabled = 
        (paidTotal < finalTotal - 0.01 && !isPartialAllowed) || 
        paidTotal <= 0 || 
        isProcessing || 
        isConfirming;

    return (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-foreground/40 backdrop-blur-sm p-4 animate-in fade-in duration-200 text-left">
            <div className="w-full max-w-4xl bg-card rounded-3xl shadow-2xl flex flex-col md:flex-row overflow-hidden border border-border font-sans text-sm animate-in zoom-in duration-200">

                <div className="flex-1 p-8 md:p-10 space-y-8 h-full overflow-y-auto">
                    <header className="flex justify-between items-start">
                        <div className="flex items-center gap-4">
                            <div className="flex flex-col">
                                <h3 className="text-[10px] font-bold text-secondary tracking-wider mb-1 uppercase">Finalizar Pedido</h3>
                                <h2 className="text-2xl font-extrabold text-card-foreground tracking-tight">R$ {finalTotal.toFixed(2)}</h2>
                                {discount > 0 && <span className="text-[10px] font-bold text-destructive line-through">R$ {total.toFixed(2)}</span>}
                            </div>

                            {remaining > 0 && payments.length === 0 && (
                                <div className="flex flex-col gap-2">
                                    <div className="flex items-center gap-2">
                                        <div className="relative w-32">
                                            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-destructive/60">DESC. R$</span>
                                            <input
                                                className="w-full bg-destructive/5 border border-destructive/20 rounded-lg pl-14 pr-2 py-1.5 text-[10px] font-bold text-destructive outline-none focus:bg-card focus:border-destructive transition-all font-sans disabled:opacity-50 disabled:cursor-not-allowed"
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
                                    <div className="flex items-center gap-1 bg-muted p-1.5 rounded-xl border border-border animate-in fade-in zoom-in duration-300">
                                        <Users size={12} className="text-muted-foreground ml-1" />
                                        <span className="text-[8px] font-bold text-muted-foreground uppercase mr-2">Dividir:</span>
                                        {[2, 3, 4, 5].map(n => (
                                            <button
                                                key={`split-${n}`}
                                                disabled={!!pixData}
                                                onClick={() => setInputAmount((finalTotal / n).toFixed(2))}
                                                className="px-2 py-1 hover:bg-card hover:shadow-sm rounded-lg text-[10px] font-bold text-muted-foreground transition-all border-none bg-transparent cursor-pointer disabled:opacity-20 disabled:cursor-not-allowed"
                                            >
                                                {n}x
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                        <button 
                            onClick={onCancel} 
                            disabled={isConfirming}
                            className="p-2 hover:bg-muted rounded-xl text-muted-foreground transition-all border-none bg-transparent cursor-pointer disabled:opacity-50"
                        >
                            <X size={20} />
                        </button>
                    </header>

                    {/* Métodos de Pagamento ou Tela de Confirmacao */}
                    {remaining <= 0 && !currentMethod ? (
                        <div className="flex-1 flex flex-col items-center justify-center space-y-6 py-10 animate-in fade-in zoom-in duration-500">
                            <div className="w-24 h-24 bg-success/10 rounded-full flex items-center justify-center text-success shadow-sm border border-success/20">
                                <CheckCircle2 size={48} strokeWidth={2.5} />
                            </div>
                            <div className="text-center space-y-2">
                                <h3 className="text-xl font-extrabold text-card-foreground tracking-tight">Pedido Quitado!</h3>
                                <p className="text-xs font-medium text-muted-foreground">Tudo pronto para finalizar a venda.</p>
                            </div>
                            <div className="flex flex-col gap-2 w-full max-w-xs">
                                <div className="p-4 bg-muted rounded-2xl border border-border flex items-center justify-between">
                                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Total Recebido</span>
                                    <span className="text-sm font-black text-card-foreground italic">R$ {payments.reduce((acc, p) => acc + p.amount, 0).toFixed(2)}</span>
                                </div>
                            </div>
                        </div>
                    ) : !currentMethod ? (
                        <div className="space-y-6">
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Escolha a Forma de Pagamento</p>
                            <div className="grid grid-cols-2 gap-3">
                                {METHODS.map(m => (
                                    <button
                                        key={m.id}
                                        disabled={(m.id === 'fiado' && !hasCustomer) || isProcessing || isConfirming || (payments.length > 0 && remaining > 0)}
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
                                        className={`p-6 border border-border rounded-2xl flex flex-col items-center justify-center gap-3 transition-all bg-muted/30 hover:bg-card hover:border-secondary hover:shadow-lg text-card-foreground ${m.color} ${(m.id === 'fiado' && !hasCustomer) || isProcessing || isConfirming || (payments.length > 0 && remaining > 0) ? 'opacity-20 grayscale cursor-not-allowed' : ''} cursor-pointer relative group`}
                                    >
                                        <div className="group-hover:scale-110 transition-transform">
                                            {isGeneratingPix && m.id === 'pix' ? <Loader2 className="animate-spin" size={20} /> : m.icon}
                                        </div>
                                        <span className="text-[10px] font-bold tracking-tight">{isGeneratingPix && m.id === 'pix' ? 'Gerando...' : m.label}</span>
                                        {m.id === 'fiado' && !hasCustomer && <span className="text-[7px] text-destructive font-bold uppercase absolute bottom-2">Identifique o Cliente</span>}
                                        {payments.length > 0 && remaining > 0 && <span className="text-[7px] text-muted-foreground font-bold uppercase absolute bottom-2">Conclua o pagamento atual</span>}
                                    </button>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-8 animate-in slide-in-from-left duration-200">
                            <div className="flex items-center gap-3">
                                <button 
                                    onClick={() => { setCurrentMethod(null); setReceivedAmount(''); setPixData(null); }} 
                                    disabled={isConfirming}
                                    className="p-1.5 hover:bg-muted rounded-lg text-muted-foreground border-none bg-transparent cursor-pointer disabled:opacity-50"
                                >
                                    <X size={16} />
                                </button>
                                <h4 className="text-xs font-bold text-card-foreground tracking-wide text-left flex items-center gap-2">
                                    {pixData ? 'Pagamento via Mercado Pago' : `Pagando com ${METHODS.find(m => m.id === currentMethod)?.label}`}
                                </h4>
                            </div>

                            <div className="space-y-6">
                                {pixData ? (
                                    <div className="flex flex-col items-center gap-6 animate-in zoom-in duration-300">
                                        <img src={`data:image/jpeg;base64,${pixData.qr_code_base64}`} alt="Pix QR Code" className="w-64 h-64 transition-all rounded-xl" />
                                        <div className="text-center space-y-2">
                                            <p className="text-[10px] font-bold text-secondary uppercase tracking-widest font-sans">Escaneie o código acima ou imprima</p>
                                            <div className="flex items-center justify-center gap-3">
                                                <span className="text-3xl font-black text-card-foreground tracking-tighter">R$ {parseFloat(inputAmount).toFixed(2)}</span>
                                                <div className="px-2 py-1 bg-foreground text-background rounded text-[8px] font-bold">
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
                                                className="px-6 py-3 bg-secondary/10 text-secondary rounded-2xl text-[10px] font-bold uppercase tracking-widest hover:bg-secondary/20 transition-all border-none cursor-pointer"
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
                                                className="px-6 py-3 bg-foreground text-background rounded-2xl text-[10px] font-bold uppercase tracking-widest hover:opacity-90 transition-all border-none flex items-center gap-2 cursor-pointer shadow-lg"
                                            >
                                                <Printer size={16} />
                                                Imprimir QR
                                            </button>
                                        </div>
                                        <div className="flex items-center gap-2 text-muted-foreground">
                                            <Loader2 className="animate-spin" size={12} />
                                            <span className="text-[9px] font-bold italic tracking-wide">Aguardando confirmação em tempo real...</span>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        {currentMethod === 'fiado' && (
                                            <div className="space-y-4 animate-in fade-in duration-300">
                                                <div className="p-4 bg-primary/10 rounded-2xl border border-primary/20 flex items-center gap-4">
                                                    <div className="w-10 h-10 bg-primary text-primary-foreground rounded-xl flex items-center justify-center shadow-lg">
                                                        <UserPlus size={20} />
                                                    </div>
                                                    <div className="flex-1">
                                                        <p className="text-xs font-bold text-card-foreground">Quem pegou o pedido?</p>
                                                        <p className="text-[9px] font-bold text-primary uppercase tracking-widest">A pessoa que retirou em nome da empresa</p>
                                                    </div>
                                                </div>
                                                {customer && (
                                                    <div className="flex justify-between items-center px-2 py-1 bg-destructive/10 rounded-lg border border-destructive/20">
                                                        <span className="text-[10px] font-bold text-destructive/60 uppercase tracking-widest">Saldo Devedor Atual</span>
                                                        <span className="text-sm font-black text-destructive">R$ {(customer.debtBalance || 0).toFixed(2)}</span>
                                                    </div>
                                                )}
                                                <input
                                                    className="w-full bg-muted border border-border rounded-2xl px-5 py-4 text-sm font-bold placeholder:text-muted-foreground/50 outline-none focus:bg-card focus:border-primary transition-all text-card-foreground"
                                                    placeholder="Nome de quem está levando..."
                                                    value={fiadoTaker}
                                                    onChange={e => setFiadoTaker(e.target.value)}
                                                    autoFocus
                                                />
                                            </div>
                                        )}

                                        {(currentMethod === 'credit' || currentMethod === 'debit') && (
                                            <div className="p-4 bg-secondary/10 rounded-2xl flex items-center gap-4 animate-in fade-in duration-300 border border-secondary/20">
                                                <div className="w-10 h-10 bg-secondary text-secondary-foreground rounded-xl flex items-center justify-center animate-pulse shadow-lg">
                                                    <CreditCard size={20} />
                                                </div>
                                                <div>
                                                    <p className="text-xs font-bold text-card-foreground">Aguardando maquininha...</p>
                                                    <p className="text-[9px] font-bold text-secondary uppercase tracking-widest">Insira ou aproxime o cartão</p>
                                                </div>
                                            </div>
                                        )}

                                        {currentMethod === 'money' && (
                                            <div className="animate-in fade-in duration-200 space-y-4">
                                                <div>
                                                    <label className="text-[10px] font-bold text-success uppercase mb-2 block ml-1 text-left">Valor recebido (Dinheiro)</label>
                                                    <div className="relative">
                                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-bold text-muted-foreground/50">R$</span>
                                                        <input
                                                            className="w-full bg-success/5 border border-success/20 rounded-2xl pl-11 pr-4 py-4 text-2xl font-bold text-success outline-none focus:bg-card focus:border-success transition-all font-sans"
                                                            type="number"
                                                            placeholder="0,00"
                                                            value={receivedAmount}
                                                            onChange={e => setReceivedAmount(e.target.value)}
                                                        />
                                                    </div>
                                                </div>
                                                {change > 0 && (
                                                    <div className="p-4 bg-success rounded-xl text-success-foreground flex justify-between items-center shadow-lg">
                                                        <span className="text-[9px] font-bold uppercase tracking-widest">Troco a devolver:</span>
                                                        <span className="text-xl font-bold tracking-tight">R$ {change.toFixed(2)}</span>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        <div className="text-left">
                                            <label className="text-[10px] font-bold text-muted-foreground mb-2 block ml-1 uppercase tracking-widest">Valor do Lançamento</label>
                                            <div className="relative">
                                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-bold text-muted-foreground/50">R$</span>
                                                <input
                                                    className="w-full bg-muted border border-border rounded-2xl pl-11 pr-4 py-4 text-2xl font-bold outline-none focus:bg-card focus:border-secondary transition-all font-sans text-card-foreground"
                                                    type="number"
                                                    value={inputAmount}
                                                    onChange={e => setInputAmount(e.target.value)}
                                                />
                                            </div>
                                        </div>

                                        <button
                                            disabled={isProcessing || isConfirming || !inputAmount || parseFloat(inputAmount) <= 0}
                                            onClick={addPayment}
                                            className={`w-full bg-foreground text-background py-4 rounded-xl font-bold text-[10px] uppercase tracking-widest hover:opacity-90 transition-all active:scale-95 shadow-lg border-none cursor-pointer ${isProcessing || isConfirming ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        >
                                            {isProcessing ? <Loader2 className="animate-spin mx-auto" size={20} /> : 'Confirmar Valor'}
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                <div className="w-full md:w-[320px] bg-muted/50 border-l border-border p-8 flex flex-col gap-6 shrink-0 h-full overflow-y-auto">
                    <div className="flex-1 flex flex-col gap-4 overflow-y-auto">
                        <div className="flex items-center gap-2 mb-2 font-bold text-[9px] text-muted-foreground tracking-widest uppercase">
                            <Receipt size={14} /> Resumo dos pagamentos
                        </div>

                        <div className="space-y-2">
                            {payments.map((p, i) => (
                                <div key={`paid-m-${i}`} className="bg-card p-3 rounded-xl border border-border flex items-center justify-between shadow-sm animate-in slide-in-from-right duration-200">
                                    <div className="flex items-center gap-3">
                                        <div className="text-muted-foreground">{METHODS.find(m => m.id === p.method)?.icon}</div>
                                        <p className="text-[9px] font-bold text-card-foreground tracking-tight">
                                            {METHODS.find(m => m.id === p.method)?.label}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="text-xs font-bold text-card-foreground tabular-nums">R$ {(p.amount || 0).toFixed(2)}</span>
                                        {remaining > 0 && !isConfirming && (
                                            <button onClick={() => removePayment(i)} className="p-1 text-muted-foreground/30 hover:text-destructive border-none bg-transparent cursor-pointer transition-colors"><Trash2 size={14} /></button>
                                        )}
                                    </div>
                                </div>
                            ))}
                            {payments.length === 0 && (
                                <div className="py-12 flex flex-col items-center justify-center text-muted-foreground/50 border-2 border-dashed border-border rounded-3xl">
                                    <Wallet size={24} className="mb-2" />
                                    <p className="text-[8px] font-bold tracking-widest uppercase">Aguardando pagamento</p>
                                </div>
                            )}
                        </div>

                        <div className="mt-auto pt-4 border-t border-border">
                            {remaining > 0 ? (
                                <div className="flex justify-between items-center px-1">
                                    <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Falta</span>
                                    <span className="text-lg font-black text-secondary tabular-nums">R$ {(remaining || 0).toFixed(2)}</span>
                                </div>
                            ) : null}
                        </div>
                    </div>

                    <div className="space-y-3 shrink-0">
                        <button
                            disabled={hasFiado || isConfirming}
                            onClick={() => !hasFiado && !isConfirming && setIsFiscal(!isFiscal)}
                            className={`w-full p-3 rounded-xl border flex items-center justify-between transition-all ${isFiscal ? 'bg-secondary border-secondary text-secondary-foreground shadow-md' : 'bg-card border-border text-muted-foreground hover:border-secondary/50 hover:text-secondary'} ${hasFiado || isConfirming ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                        >
                            <div className="flex items-center gap-2">
                                <ShieldCheck size={16} />
                                <div className="flex flex-col text-left">
                                    <span className="text-[9px] font-bold uppercase tracking-wider">Cupom fiscal (NFC-e)</span>
                                    {hasFiado && <span className="text-[7px] font-bold text-primary uppercase">Indisponível para Fiado</span>}
                                </div>
                            </div>
                            <div className={`w-8 h-4 rounded-full relative ${isFiscal ? 'bg-secondary-foreground/20' : 'bg-muted'}`}>
                                <div className={`absolute top-0.5 w-3 h-3 rounded-full transition-all ${isFiscal ? 'right-0.5 bg-secondary-foreground' : 'left-0.5 bg-muted-foreground/50'}`} />
                            </div>
                        </button>

                        <button
                            disabled={isConfirming}
                            onClick={() => !isConfirming && setIsCustomerCopy(!isCustomerCopy)}
                            className={`w-full p-3 rounded-xl border flex items-center justify-between transition-all ${isCustomerCopy ? 'bg-secondary border-secondary text-secondary-foreground shadow-md' : 'bg-card border-border text-muted-foreground hover:border-secondary/50 hover:text-secondary'} ${isConfirming ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                        >
                            <div className="flex items-center gap-2">
                                <Receipt size={16} />
                                <span className="text-[9px] font-bold uppercase tracking-wider">Imprimir via cliente</span>
                            </div>
                            <div className={`w-8 h-4 rounded-full relative ${isCustomerCopy ? 'bg-secondary-foreground/20' : 'bg-muted'}`}>
                                <div className={`absolute top-0.5 w-3 h-3 rounded-full transition-all ${isCustomerCopy ? 'right-0.5 bg-secondary-foreground' : 'left-0.5 bg-muted-foreground/50'}`} />
                            </div>
                        </button>

                        <button
                            disabled={isConfirming}
                            onClick={() => !isConfirming && setIsMerchantCopy(!isMerchantCopy)}
                            className={`w-full p-3 rounded-xl border flex items-center justify-between transition-all ${isMerchantCopy ? 'bg-primary border-primary text-primary-foreground shadow-md' : 'bg-card border-border text-muted-foreground hover:border-primary/50 hover:text-primary'} ${isConfirming ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                        >
                            <div className="flex items-center gap-2">
                                <Printer size={16} />
                                <span className="text-[9px] font-bold uppercase tracking-wider">Via Estabelecimento</span>
                            </div>
                            <div className={`w-8 h-4 rounded-full relative ${isMerchantCopy ? 'bg-primary-foreground/20' : 'bg-muted'}`}>
                                <div className={`absolute top-0.5 w-3 h-3 rounded-full transition-all ${isMerchantCopy ? 'right-0.5 bg-primary-foreground' : 'left-0.5 bg-muted-foreground/50'}`} />
                            </div>
                        </button>

                        <button
                            disabled={isConfirmDisabled}
                            onClick={handleConfirm}
                            className={`w-full py-4 rounded-2xl font-bold text-[10px] tracking-[0.2em] shadow-lg transition-all flex items-center justify-center gap-3 ${(paidTotal >= finalTotal - 0.01 || (isPartialAllowed && paidTotal > 0)) && !isConfirmDisabled ? 'bg-success text-success-foreground hover:opacity-90 active:scale-95' : 'bg-muted text-muted-foreground cursor-not-allowed'} border-none`}
                        >
                            {isProcessing || isConfirming ? (
                                <>
                                    <Loader2 className="animate-spin" size={16} />
                                    <span>PROCESSANDO...</span>
                                </>
                            ) : (
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
