'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

export type NotificationType = 'success' | 'error' | 'info';

export type Notification = {
    id: string;
    type: NotificationType;
    message: string;
};

interface NotificationContextType {
    notify: (type: NotificationType, message: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
    const [notifications, setNotifications] = useState<Notification[]>([]);

    const notify = useCallback((type: NotificationType, message: string) => {
        const id = crypto.randomUUID();
        setNotifications(prev => [...prev, { id, type, message }]);

        // Auto remove
        setTimeout(() => {
            setNotifications(prev => prev.filter(n => n.id !== id));
        }, 4000);
    }, []);

    const remove = (id: string) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    };

    return (
        <NotificationContext.Provider value={{ notify }}>
            {children}

            {/* Toast Container */}
            <div className="fixed bottom-6 right-6 z-[60] flex flex-col gap-3 pointer-events-none">
                {notifications.map((n) => (
                    <div
                        key={n.id}
                        className={cn(
                            "pointer-events-auto min-w-[300px] bg-white rounded-xl shadow-2xl p-4 border-l-4 flex items-start gap-3 animate-in slide-in-from-right-full fade-in duration-300",
                            n.type === 'success' && "border-green-500",
                            n.type === 'error' && "border-red-500",
                            n.type === 'info' && "border-blue-500"
                        )}
                    >
                        {n.type === 'success' && <CheckCircle className="w-5 h-5 text-green-500 shrink-0" />}
                        {n.type === 'error' && <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />}
                        {n.type === 'info' && <Info className="w-5 h-5 text-blue-500 shrink-0" />}

                        <div className="flex-1 pt-0.5">
                            <p className="text-sm font-medium text-gray-800">{n.message}</p>
                        </div>

                        <button onClick={() => remove(n.id)} className="text-gray-400 hover:text-gray-600">
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
