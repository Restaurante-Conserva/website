'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

export type NotificationType = 'success' | 'error' | 'info';

export type Notification = {
    id: string;
    type: NotificationType;
    message: string;
    isExiting?: boolean;
};

interface NotificationContextType {
    notify: (type: NotificationType, message: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
    const [notifications, setNotifications] = useState<Notification[]>([]);

    const remove = useCallback((id: string) => {
        setNotifications(prev => prev.map(n => 
            n.id === id ? { ...n, isExiting: true } : n
        ));
        setTimeout(() => {
            setNotifications(prev => prev.filter(n => n.id !== id));
        }, 300);
    }, []);

    const notify = useCallback((type: NotificationType, message: string) => {
        const id = crypto.randomUUID();
        setNotifications(prev => [...prev, { id, type, message, isExiting: false }]);

        // Auto remove after 2 seconds
        setTimeout(() => {
            remove(id);
        }, 2000);
    }, [remove]);

    return (
        <NotificationContext.Provider value={{ notify }}>
            {children}

            {/* Toast Container - Centered at top */}
            <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[9999] flex flex-col items-center gap-3 pointer-events-none">
                {notifications.map((n, index) => (
                    <div
                        key={n.id}
                        style={{ 
                            transform: `translateY(${index * 4}px)`,
                            zIndex: 9999 - index 
                        }}
                        className={cn(
                            "pointer-events-auto min-w-[320px] max-w-[90vw] rounded-xl shadow-2xl px-5 py-4 flex items-center gap-3 backdrop-blur-sm",
                            "transition-all duration-300 ease-out",
                            n.isExiting 
                                ? "animate-slide-out-top opacity-0" 
                                : "animate-slide-in-top",
                            n.type === 'success' && "bg-success/95 text-success-foreground",
                            n.type === 'error' && "bg-destructive/95 text-destructive-foreground",
                            n.type === 'info' && "bg-secondary/95 text-secondary-foreground"
                        )}
                    >
                        {n.type === 'success' && <CheckCircle className="w-5 h-5 shrink-0" />}
                        {n.type === 'error' && <AlertCircle className="w-5 h-5 shrink-0" />}
                        {n.type === 'info' && <Info className="w-5 h-5 shrink-0" />}

                        <p className="flex-1 text-sm font-medium">{n.message}</p>

                        <button 
                            onClick={() => remove(n.id)} 
                            className="p-1 rounded-lg hover:bg-foreground/10 transition-colors"
                            aria-label="Fechar notificação"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                ))}
            </div>
        </NotificationContext.Provider>
    );
}

export function useNotification() {
    const context = useContext(NotificationContext);
    if (context === undefined) {
        throw new Error('useNotification must be used within a NotificationProvider');
    }
    return context;
}
