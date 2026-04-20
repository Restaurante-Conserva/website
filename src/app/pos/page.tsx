"use client";

import { useState, useEffect } from 'react';
import { Lock, ShieldCheck, Loader2, AlertCircle, KeyRound, X } from 'lucide-react';

import POSView from '../../components/POSView';
import TableView from '../../components/TableView';
import AdminPanel from '../../components/AdminPanel';
import CashierPanel from '../../components/CashierPanel';
import FiadoPanel from '../../components/FiadoPanel';
import SalesView from '../../components/SalesView';
import POSSidebar from '../../components/POSSidebar';
import { ThemeProvider, useTheme } from '../../context/ThemeContext';
import { ToastProvider } from '../../context/ToastContext';

function POSApp() {
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    const [employee, setEmployee] = useState<any>(null);
    const [view, setView] = useState<'pos' | 'tables' | 'admin' | 'cashier' | 'fiado' | 'sales'>('pos');
    const [isAuthenticating, setIsAuthenticating] = useState(true);
    const [password, setPassword] = useState('');
    const [loginError, setLoginError] = useState(false);
    const [bridgeStatus, setBridgeStatus] = useState<'online' | 'offline'>('offline');
    const [cashSession, setCashSession] = useState<any>(null);
    const [isCheckingCash, setIsCheckingCash] = useState(true);

    const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
    const [adminPass, setAdminPass] = useState('');
    const [adminError, setAdminError] = useState(false);

    useEffect(() => {
        const saved = localStorage.getItem('logged_employee');
        if (saved) setEmployee(JSON.parse(saved));
        setIsAuthenticating(false);
        checkCashSession();

        const checkBridge = () => {
            fetch('http://localhost:7777/status')
                .then(res => res.json())
                .then(data => setBridgeStatus(data.status === 'online' ? 'online' : 'offline'))
                .catch(() => setBridgeStatus('offline'));
        };
        checkBridge();
        const interval = setInterval(checkBridge, 10000);
        return () => clearInterval(interval);
    }, []);

    const checkCashSession = async () => {
        setIsCheckingCash(true);
        try {
            const res = await fetch('/api/cash');
            const data = await res.json();
            setCashSession(data);
            if (!data && view !== 'admin') setView('cashier');
        } catch (e) {
            console.error(e);
        } finally {
            setIsCheckingCash(false);
        }
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch('/api/employees', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'verify', password })
            });
            if (res.ok) {
                const data = await res.json();
                setEmployee(data);
                localStorage.setItem('logged_employee', JSON.stringify(data));
                setLoginError(false);
                setPassword('');
                checkCashSession();
            } else {
                setLoginError(true);
            }
        } catch {
            setLoginError(true);
        }
    };

    const handleLogout = () => {
        setEmployee(null);
        localStorage.removeItem('logged_employee');
        setView('pos');
    };

    const handleAdminAccess = () => {
        if (employee?.role === 'admin') {
            setView('admin');
        } else {
            setIsAdminModalOpen(true);
        }
    };

    const verifyAdmin = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch('/api/employees', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'verify', password: adminPass })
            });
            if (res.ok) {
                const data = await res.json();
                if (data.role === 'admin') {
                    setView('admin');
                    setIsAdminModalOpen(false);
                    setAdminPass('');
                    setAdminError(false);
                } else {
                    setAdminError(true);
                }
            } else {
                setAdminError(true);
            }
        } catch {
            setAdminError(true);
        }
    };

    const bg = isDark ? 'bg-[#0c0c0c]' : 'bg-gray-50';
    const cardBg = isDark ? 'bg-[#111] border-white/[0.06]' : 'bg-white border-gray-200';
    const textPrimary = isDark ? 'text-white' : 'text-gray-900';
    const textMuted = isDark ? 'text-[#444]' : 'text-gray-400';
    const inputBg = isDark
        ? 'bg-[#0a0a0a] border-white/[0.07] text-white focus:border-orange-500/70'
        : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-orange-400';

    /* ── Loading ── */
    if (isAuthenticating || isCheckingCash) return (
        <div className={`h-screen ${bg} flex items-center justify-center`}>
            <Loader2 className="animate-spin text-orange-500" size={26} />
        </div>
    );

    /* ── Login ── */
    if (!employee) {
        return (
            <div className={`h-screen ${bg} flex items-center justify-center p-4`}>
                <div className={`w-full max-w-[320px] ${cardBg} rounded-2xl border p-7 flex flex-col items-center gap-5`}>
                    <div className="w-10 h-10 bg-orange-600 rounded-xl flex items-center justify-center shadow-lg shadow-orange-900/30">
                        <Lock size={18} className="text-white" />
                    </div>
                    <div className="text-center">
                        <h1 className={`text-sm font-bold ${textPrimary}`}>CONSERVA POS</h1>
                        <p className={`text-[10px] ${textMuted} mt-0.5 font-medium uppercase tracking-widest`}>Identificação do Operador</p>
                    </div>

                    <form onSubmit={handleLogin} className="w-full flex flex-col gap-2.5">
                        <input
                            autoFocus
                            type="password"
                            value={password}
                            onChange={e => { setPassword(e.target.value); setLoginError(false); }}
                            className={`w-full border ${loginError ? 'border-red-500/50' : ''} ${inputBg}
                                rounded-xl px-4 py-2.5 text-center text-xl font-bold outline-none transition-all`}
                            placeholder="••••"
                        />
                        {loginError && <p className="text-center text-[10px] text-red-500 font-medium">Senha inválida</p>}
                        <button className="w-full bg-orange-600 text-white font-semibold text-[11px] uppercase tracking-wider py-2.5 rounded-xl hover:bg-orange-500 transition-all mt-1">
                            Acessar
                        </button>
                    </form>

                    <div className={`w-full pt-4 border-t ${isDark ? 'border-white/[0.04]' : 'border-gray-100'}`}>
                        <button
                            onClick={async () => {
                                const pass = prompt("Senha de Primeiro Acesso:");
                                if (pass === '2013') {
                                    const adminUser = { name: 'Administrador (Mestre)', role: 'admin' };
                                    setEmployee(adminUser);
                                    localStorage.setItem('logged_employee', JSON.stringify(adminUser));
                                    setView('admin');
                                } else if (pass !== null) {
                                    alert("Senha Incorreta");
                                }
                            }}
                            className={`w-full flex items-center justify-center gap-2 py-2 rounded-lg border border-dashed text-[10px] font-medium uppercase tracking-widest transition-all
                                ${isDark ? 'border-white/[0.07] text-[#444] hover:border-orange-500/40 hover:text-orange-500' : 'border-gray-200 text-gray-400 hover:border-orange-400 hover:text-orange-500'}`}
                        >
                            <ShieldCheck size={13} />
                            Configurar Primeiro Acesso
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const isCashRequired = !cashSession && view !== 'admin';

    /* ── Main App ── */
    return (
        <div className={`flex h-screen ${isDark ? 'text-white' : 'text-gray-900'} font-sans text-sm overflow-hidden ${bg}`}>
            <POSSidebar
                view={view}
                setView={setView}
                employee={employee}
                cashSession={cashSession}
                onAdminAccess={handleAdminAccess}
                onLogout={handleLogout}
            />

            <main className="flex-1 flex flex-col relative overflow-hidden">
                {isCashRequired && (
                    <div className="absolute top-3 left-1/2 -translate-x-1/2 z-50 px-3 py-1.5 bg-red-600 text-white rounded-lg text-[10px] font-medium uppercase flex items-center gap-2 shadow-lg">
                        <AlertCircle size={13} />
                        Abra o caixa para habilitar as funções de venda
                    </div>
                )}

                {view === 'pos'     && <POSView bridgeStatus={bridgeStatus} />}
                {view === 'tables'  && <TableView />}
                {view === 'sales'   && <SalesView />}
                {view === 'admin'   && <AdminPanel onClose={() => { setView('pos'); checkCashSession(); }} />}
                {view === 'cashier' && <CashierPanel onOpen={checkCashSession} employee={employee} />}
                {view === 'fiado'   && <FiadoPanel setView={setView} />}
            </main>

            {/* Admin Modal */}
            {isAdminModalOpen && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-sm">
                    <div className={`w-full max-w-xs ${cardBg} rounded-2xl border p-6`}>
                        <div className="flex justify-between items-center mb-5">
                            <div className={`flex items-center gap-2 ${textPrimary} font-semibold text-xs uppercase tracking-wider`}>
                                <KeyRound size={13} className="text-orange-500" />
                                Acesso Restrito
                            </div>
                            <button onClick={() => setIsAdminModalOpen(false)} className={`${textMuted} hover:text-white transition-colors`}>
                                <X size={16} />
                            </button>
                        </div>
                        <form onSubmit={verifyAdmin} className="space-y-3">
                            <input
                                autoFocus
                                type="password"
                                value={adminPass}
                                onChange={e => { setAdminPass(e.target.value); setAdminError(false); }}
                                className={`w-full border ${adminError ? 'border-red-500/50' : ''} ${inputBg}
                                    rounded-xl px-4 py-2.5 text-center text-lg font-bold outline-none transition-all`}
                                placeholder="Senha Admin"
                            />
                            {adminError && <p className="text-center text-[9px] text-red-500 font-medium">Acesso negado</p>}
                            <button className="w-full bg-orange-600 text-white font-semibold text-[11px] uppercase tracking-wider py-2.5 rounded-xl hover:bg-orange-500 transition-all">
                                Confirmar
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default function POSPage() {
    return (
        <ThemeProvider>
            <POSApp />
        </ThemeProvider>
    );
}
