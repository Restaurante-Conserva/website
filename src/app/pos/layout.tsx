"use client";

import { GlobalProvider } from '../../context/GlobalContext';

export default function POSLayout({ children }: { children: React.ReactNode }) {
    return (
        <GlobalProvider>
            {children}
        </GlobalProvider>
    );
}
