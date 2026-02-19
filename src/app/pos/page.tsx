"use client";

import { useState, useEffect } from 'react';
import {
    LayoutGrid,
    ShoppingCart,
    Settings,
    ShieldCheck,
    User,
    LogOut,
    Plus,
    X,
    ClipboardList,
    Wallet,
    Loader2,
    Lock,
    KeyRound,
    AlertCircle,
    History
} from 'lucide-react';
import POSView from '../../components/POSView';
import TableView from '../../components/TableView';
import AdminPanel from '../../components/AdminPanel';
import CashierPanel from '../../components/CashierPanel';
import FiadoPanel from '../../components/FiadoPanel';
import SalesView from '../../components/SalesView';

export default function POSPage() {
    const [employee, setEmployee] = useState<any>(null);
    const [view, setView] = useState<'pos' | 'tables' | 'admin' | 'cashier' | 'fiado' | 'sales'>('pos');
    const [isAuthenticating, setIsAuthenticating] = useState(true);
    const [password, setPassword] = useState('');
    const [loginError, setLoginError] = useState(false);
    const [bridgeStatus, setBridgeStatus] = useState<'online' | 'offline'>('offline');
    const [cashSession, setCashSession] = useState<any>(null);
    const [isCheckingCash, setIsCheckingCash] = useState(true);

    // Admin Protection
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
                .then(data => {
                    if (data.status === 'online') setBridgeStatus('online');
                    else setBridgeStatus('offline');
                })
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
            if (!data && view !== 'admin') {
                setView('cashier');
            }
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
                // After login, check cash again
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

    if (isAuthenticating || isCheckingCash) return (
        <div className="h-screen bg-white flex items-center justify-center">
            <Loader2 className="animate-spin text-blue-600" size={32} />
        </div>
    );

    if (!employee) {
        return (
            <div className="h-screen bg-gray-50 flex items-center justify-center p-4">
                <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl border border-gray-100 p-8 flex flex-col items-center">
                    <div className="w-14 h-14 bg-blue-600 rounded-xl flex items-center justify-center text-white mb-6 shadow-lg shadow-blue-200">
                        <Lock size={32} />
                    </div>
                    <h1 className="text-xl font-bold text-gray-800 mb-1">CONSERVA POS</h1>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-8">Identificação do Operador</p>

                    <form onSubmit={handleLogin} className="w-full space-y-4">
                        <input
                            autoFocus
                            type="password"
                            value={password}
                            onChange={e => { setPassword(e.target.value); setLoginError(false); }}
                            className={`w-full bg-gray-50 border ${loginError ? 'border-red-500 bg-red-50' : 'border-gray-200'} rounded-xl px-4 py-3 text-center text-2xl font-bold outline-none focus:border-blue-500 transition-all`}
                            placeholder="••••"
                        />
                        {loginError && <p className="text-center text-[10px] text-red-500 font-bold uppercase">Senha Inválida</p>}
                        <button className="w-full bg-blue-600 text-white font-bold text-xs uppercase py-4 rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-100">
                            Acessar Sistema
                        </button>
                    </form>

                    <div className="w-full mt-8 pt-6 border-t border-gray-100">
                        <p className="text-center text-[9px] text-gray-400 font-bold uppercase tracking-widest mb-4">Novo por aqui?</p>
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
                            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-dashed border-gray-200 text-[10px] font-bold text-gray-400 uppercase tracking-widest hover:bg-gray-50 hover:border-blue-300 hover:text-blue-600 transition-all"
                        >
                            <ShieldCheck size={14} />
                            Configurar Primeiro Acesso
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const menu = [
        { id: 'pos', label: 'Vendas', icon: <ShoppingCart size={20} /> },
        { id: 'tables', label: 'Mesas', icon: <LayoutGrid size={20} /> },
        { id: 'sales', label: 'Histórico', icon: <History size={20} /> },
        { id: 'cashier', label: 'Caixa', icon: <Wallet size={20} /> },
    ];

    const isCashRequired = !cashSession && view !== 'admin';

    return (
        <div className="flex h-screen bg-white text-gray-800 font-sans text-sm overflow-hidden">
            {/* Nav Lateral */}
            <aside className="w-16 bg-white border-r border-gray-200 flex flex-col items-center py-4 z-30 shrink-0">
                <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-white text-lg mb-8 uppercase">C</div>

                <nav className="flex-1 flex flex-col gap-4">
                    {menu.map(item => (
                        <button
                            key={item.id}
                            disabled={isCashRequired && item.id !== 'cashier'}
                            onClick={() => setView(item.id as any)}
                            className={`p-3 rounded-lg transition-all flex items-center justify-center ${view === item.id ? 'bg-blue-50 text-blue-600' : 'text-gray-400 hover:text-gray-600'} ${isCashRequired && item.id !== 'cashier' ? 'opacity-20 cursor-not-allowed' : ''}`}
                            title={item.label}
                        >
                            {item.icon}
                        </button>
                    ))}

                    <button
                        onClick={() => setView('fiado')}
                        className={`p-3 rounded-lg transition-all flex items-center justify-center ${view === 'fiado' ? 'bg-blue-50 text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
                        title="Gerenciar Fiado"
                    >
                        <ClipboardList size={20} />
                    </button>

                    {employee?.role === 'admin' && (
                        <button
                            onClick={handleAdminAccess}
                            className={`p-3 rounded-lg transition-all flex items-center justify-center ${view === 'admin' ? 'bg-gray-900 text-white' : 'text-gray-400 hover:text-gray-600'}`}
                            title="Administração"
                        >
                            <ShieldCheck size={20} />
                        </button>
                    )}
                </nav>

                <div className="flex flex-col items-center gap-4">
                    <button onClick={handleLogout} className="p-3 text-gray-300 hover:text-red-500 transition-colors" title="Sair">
                        <LogOut size={20} />
                    </button>
                    <div className="flex flex-col items-center group relative cursor-help">
                        <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 border border-blue-100">
                            <User size={16} />
                        </div>
                        <div className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-[9px] rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                            {employee.name}
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col relative overflow-hidden bg-white">
                {/* Status da Impressora */}
                <div className="absolute top-3 right-4 flex items-center gap-1.5 z-50 bg-white/80 backdrop-blur px-2 py-1 rounded-full border border-gray-100 text-[9px] text-gray-400">
                    <div className={`w-1.5 h-1.5 rounded-full ${bridgeStatus === 'online' ? 'bg-green-500' : 'bg-red-500 animate-pulse'}`} />
                    <span className="font-bold opacity-60">IMP: {bridgeStatus === 'online' ? 'OK' : 'OFF'}</span>
                </div>

                {isCashRequired && (
                    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 bg-red-600 text-white rounded-full text-[10px] font-bold uppercase flex items-center gap-2 shadow-lg animate-bounce">
                        <AlertCircle size={14} />
                        Abra o caixa para habilitar as funções de venda
                    </div>
                )}

                {view === 'pos' && <POSView />}
                {view === 'tables' && <TableView />}
                {view === 'sales' && <SalesView />}
                {view === 'admin' && <AdminPanel onClose={() => { setView('pos'); checkCashSession(); }} />}
                {view === 'cashier' && <CashierPanel onOpen={checkCashSession} employee={employee} />}
                {view === 'fiado' && <FiadoPanel setView={setView} />}
            </main>

            {/* Admin Password Modal */}
            {isAdminModalOpen && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center bg-gray-900/40 backdrop-blur-sm p-4">
                    <div className="w-full max-w-xs bg-white rounded-2xl shadow-2xl p-6 border border-gray-100 animate-in zoom-in duration-200">
                        <div className="flex justify-between items-center mb-6">
                            <div className="flex items-center gap-2 text-gray-800 font-bold text-xs uppercase">
                                <KeyRound size={16} className="text-blue-600" /> Acesso Restrito
                            </div>
                            <button onClick={() => setIsAdminModalOpen(false)} className="text-gray-300 hover:text-gray-500"><X size={20} /></button>
                        </div>
                        <form onSubmit={verifyAdmin} className="space-y-4">
                            <input
                                autoFocus
                                type="password"
                                value={adminPass}
                                onChange={e => { setAdminPass(e.target.value); setAdminError(false); }}
                                className={`w-full bg-gray-50 border ${adminError ? 'border-red-500 bg-red-50' : 'border-gray-200'} rounded-xl px-4 py-3 text-center text-xl font-bold outline-none focus:border-blue-500`}
                                placeholder="Senha Admin"
                            />
                            {adminError && <p className="text-center text-[9px] text-red-500 font-bold uppercase italic">Acesso Negado</p>}
                            <button className="w-full bg-gray-900 text-white font-bold text-[10px] uppercase py-3 rounded-xl hover:bg-black transition-all">Confirmar</button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
