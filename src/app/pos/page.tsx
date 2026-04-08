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
    History,
    Sun,
    Moon
} from 'lucide-react';
import POSView from '../../components/POSView';
import TableView from '../../components/TableView';
import AdminPanel from '../../components/AdminPanel';
import CashierPanel from '../../components/CashierPanel';
import FiadoPanel from '../../components/FiadoPanel';
import SalesView from '../../components/SalesView';
import { useTheme } from '../../context/ThemeContext';

export default function POSPage() {
    const { theme, toggleTheme } = useTheme();
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
        <div className="h-screen bg-background flex items-center justify-center">
            <Loader2 className="animate-spin text-secondary" size={32} />
        </div>
    );

    if (!employee) {
        return (
            <div className="h-screen bg-background flex items-center justify-center p-4">
                <div className="w-full max-w-sm bg-card rounded-3xl shadow-2xl border border-border p-10 flex flex-col items-center">
                    <div className="w-16 h-16 bg-secondary rounded-2xl flex items-center justify-center text-secondary-foreground mb-8 shadow-lg">
                        <Lock size={36} />
                    </div>
                    <h1 className="text-2xl font-bold text-card-foreground mb-2">CONSERVA POS</h1>
                    <p className="text-sm font-medium text-muted-foreground mb-10">Identificação do Operador</p>

                    <form onSubmit={handleLogin} className="w-full space-y-5">
                        <input
                            autoFocus
                            type="password"
                            value={password}
                            onChange={e => { setPassword(e.target.value); setLoginError(false); }}
                            className={`w-full bg-muted border ${loginError ? 'border-destructive bg-destructive/10' : 'border-border'} rounded-2xl px-4 py-4 text-center text-2xl font-bold outline-none focus:border-secondary transition-all text-card-foreground`}
                            placeholder="******"
                        />
                        {loginError && <p className="text-center text-sm text-destructive font-bold">Senha Inválida</p>}
                        <button className="w-full bg-secondary text-secondary-foreground font-bold text-sm uppercase py-4 rounded-2xl hover:opacity-90 transition-all shadow-lg">
                            Acessar Sistema
                        </button>
                    </form>

                    <div className="w-full mt-10 pt-8 border-t border-border">
                        <p className="text-center text-sm text-muted-foreground font-medium mb-4">Novo por aqui?</p>
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
                            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-dashed border-border text-sm font-medium text-muted-foreground hover:bg-muted hover:border-secondary hover:text-secondary transition-all"
                        >
                            <ShieldCheck size={16} />
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
        <div className="flex h-screen bg-background text-foreground font-sans text-sm overflow-hidden">
            {/* Nav Lateral */}
            <aside className="w-18 bg-card border-r border-border flex flex-col items-center py-5 z-30 shrink-0">
                <div className="w-11 h-11 bg-secondary rounded-xl flex items-center justify-center font-bold text-secondary-foreground text-lg mb-8 uppercase shadow-lg">C</div>

                <nav className="flex-1 flex flex-col gap-3">
                    {menu.map(item => (
                        <button
                            key={item.id}
                            disabled={isCashRequired && item.id !== 'cashier'}
                            onClick={() => setView(item.id as any)}
                            className={`p-3 rounded-xl transition-all flex items-center justify-center ${view === item.id ? 'bg-secondary/10 text-secondary' : 'text-muted-foreground hover:text-card-foreground hover:bg-muted'} ${isCashRequired && item.id !== 'cashier' ? 'opacity-20 cursor-not-allowed' : ''}`}
                            title={item.label}
                        >
                            {item.icon}
                        </button>
                    ))}

                    <button
                        onClick={() => setView('fiado')}
                        className={`p-3 rounded-xl transition-all flex items-center justify-center ${view === 'fiado' ? 'bg-secondary/10 text-secondary' : 'text-muted-foreground hover:text-card-foreground hover:bg-muted'}`}
                        title="Gerenciar Fiado"
                    >
                        <ClipboardList size={20} />
                    </button>

                    {employee?.role === 'admin' && (
                        <button
                            onClick={handleAdminAccess}
                            className={`p-3 rounded-xl transition-all flex items-center justify-center ${view === 'admin' ? 'bg-foreground text-background' : 'text-muted-foreground hover:text-card-foreground hover:bg-muted'}`}
                            title="Administração"
                        >
                            <ShieldCheck size={20} />
                        </button>
                    )}
                </nav>

                <div className="flex flex-col items-center gap-3">
                    {/* Theme Toggle */}
                    <button 
                        onClick={toggleTheme} 
                        className="p-3 text-muted-foreground hover:text-card-foreground hover:bg-muted rounded-xl transition-all" 
                        title={theme === 'light' ? 'Modo Escuro' : 'Modo Claro'}
                    >
                        {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
                    </button>
                    <button onClick={handleLogout} className="p-3 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl transition-colors" title="Sair">
                        <LogOut size={20} />
                    </button>
                    <div className="flex flex-col items-center group relative cursor-help">
                        <div className="w-9 h-9 rounded-xl bg-secondary/10 flex items-center justify-center text-secondary border border-secondary/20">
                            <User size={18} />
                        </div>
                        <div className="absolute left-full ml-2 px-3 py-1.5 bg-foreground text-background text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 font-medium">
                            {employee.name}
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col relative overflow-hidden bg-background">
                {/* Status da Impressora - Only on PDV */}
                {view === 'pos' && (
                    <div className="absolute top-3 right-4 flex items-center gap-2 z-50 bg-card/90 backdrop-blur px-3 py-1.5 rounded-full border border-border text-xs">
                        <div className={`w-2 h-2 rounded-full ${bridgeStatus === 'online' ? 'bg-success' : 'bg-destructive animate-pulse'}`} />
                        <span className="font-bold text-muted-foreground">IMP: {bridgeStatus === 'online' ? 'OK' : 'OFF'}</span>
                    </div>
                )}

                {isCashRequired && (
                    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 px-5 py-2.5 bg-destructive text-destructive-foreground rounded-full text-xs font-bold uppercase flex items-center gap-2 shadow-lg animate-bounce">
                        <AlertCircle size={16} />
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
                <div className="fixed inset-0 z-[200] flex items-center justify-center bg-foreground/40 backdrop-blur-sm p-4">
                    <div className="w-full max-w-xs bg-card rounded-2xl shadow-2xl p-8 border border-border animate-in zoom-in duration-200">
                        <div className="flex justify-between items-center mb-6">
                            <div className="flex items-center gap-2 text-card-foreground font-bold text-sm uppercase">
                                <KeyRound size={18} className="text-secondary" /> Acesso Restrito
                            </div>
                            <button onClick={() => setIsAdminModalOpen(false)} className="text-muted-foreground hover:text-card-foreground transition-colors"><X size={20} /></button>
                        </div>
                        <form onSubmit={verifyAdmin} className="space-y-5">
                            <input
                                autoFocus
                                type="password"
                                value={adminPass}
                                onChange={e => { setAdminPass(e.target.value); setAdminError(false); }}
                                className={`w-full bg-muted border ${adminError ? 'border-destructive bg-destructive/10' : 'border-border'} rounded-xl px-4 py-3 text-center text-xl font-bold outline-none focus:border-secondary transition-all text-card-foreground`}
                                placeholder="Senha Admin"
                            />
                            {adminError && <p className="text-center text-sm text-destructive font-bold">Acesso Negado</p>}
                            <button className="w-full bg-foreground text-background font-bold text-sm uppercase py-3 rounded-xl hover:opacity-90 transition-all">Confirmar</button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
