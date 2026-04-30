'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

export type ToastType = 'success' | 'error' | 'info';

export interface Toast {
    id: number;
    message: string;
    type: ToastType;
}

interface ToastContextType {
    showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType>({ showToast: () => {} });

let nextId = 1;

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const showToast = useCallback((message: string, type: ToastType = 'success') => {
        const id = nextId++;
        setToasts(prev => [...prev, { id, message, type }]);
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, 2000);
    }, []);

    const dismiss = (id: number) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    };

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            {/* Toast Container */}
            <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[9999] flex flex-col gap-2 pointer-events-none">
                {toasts.map(toast => (
                    <div
                        key={toast.id}
                        className={`pointer-events-auto flex items-center justify-between gap-4 px-5 py-3.5 rounded-full shadow-xl border bg-white dark:bg-[#111] animate-in slide-in-from-top-4 fade-in duration-200 min-w-[300px] max-w-[420px] ${
                            toast.type === 'success' ? 'border-green-500/50 shadow-green-500/10' :
                            toast.type === 'error' ? 'border-red-500/50 shadow-red-500/10' : 'border-blue-500/50 shadow-blue-500/10'
                        }`}
                    >
                        <div className="flex items-center gap-3 font-semibold text-sm">
                            <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                                toast.type === 'success' ? 'bg-green-500' :
                                toast.type === 'error' ? 'bg-red-500' : 'bg-blue-500'
                            }`} />
                            <span className="text-gray-900 dark:text-white leading-tight">{toast.message}</span>
                        </div>
                        <button
                            onClick={() => dismiss(toast.id)}
                            className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/20 text-gray-500 dark:text-gray-400 transition-colors cursor-pointer border-none"
                        >
                            <svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                                <line x1="1" y1="1" x2="13" y2="13" />
                                <line x1="13" y1="1" x2="1" y2="13" />
                            </svg>
                        </button>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
}

export function useToast() {
    return useContext(ToastContext);
}
