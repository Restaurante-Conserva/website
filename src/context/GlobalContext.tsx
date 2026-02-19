"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface GlobalContextType {
    categories: any[];
    products: any[];
    sales: any[];
    employees: any[];
    customers: any[];
    config: any;
    isLoading: boolean;
    refreshCategories: () => Promise<void>;
    refreshProducts: () => Promise<void>;
    refreshSales: () => Promise<void>;
    refreshEmployees: () => Promise<void>;
    refreshCustomers: () => Promise<void>;
    refreshConfig: () => Promise<void>;
}

const GlobalContext = createContext<GlobalContextType>({
    categories: [],
    products: [],
    sales: [],
    employees: [],
    customers: [],
    config: null,
    isLoading: true,
    refreshCategories: async () => { },
    refreshProducts: async () => { },
    refreshSales: async () => { },
    refreshEmployees: async () => { },
    refreshCustomers: async () => { },
    refreshConfig: async () => { },
});

export function GlobalProvider({ children }: { children: ReactNode }) {
    const [categories, setCategories] = useState<any[]>([]);
    const [products, setProducts] = useState<any[]>([]);
    const [sales, setSales] = useState<any[]>([]);
    const [employees, setEmployees] = useState<any[]>([]);
    const [customers, setCustomers] = useState<any[]>([]);
    const [config, setConfig] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    const refreshCategories = async () => {
        try {
            const res = await fetch('/api/catalog?type=categories');
            if (res.ok) setCategories(await res.json());
        } catch (e) {
            console.error("Erro ao carregar categorias:", e);
        }
    };

    const refreshProducts = async () => {
        try {
            const res = await fetch('/api/catalog?type=products');
            if (res.ok) setProducts(await res.json());
        } catch (e) {
            console.error("Erro ao carregar produtos:", e);
        }
    };

    const refreshSales = async () => {
        try {
            const res = await fetch('/api/sales?limit=100');
            if (res.ok) setSales(await res.json());
        } catch (e) {
            console.error("Erro ao carregar vendas:", e);
        }
    };

    const refreshEmployees = async () => {
        try {
            const res = await fetch('/api/employees');
            if (res.ok) setEmployees(await res.json());
        } catch (e) {
            console.error("Erro ao carregar funcionarios:", e);
        }
    };

    const refreshCustomers = async () => {
        try {
            const res = await fetch('/api/customers');
            if (res.ok) setCustomers(await res.json());
        } catch (e) {
            console.error("Erro ao carregar clientes:", e);
        }
    };

    const refreshConfig = async () => {
        try {
            const res = await fetch('/api/config');
            if (res.ok) setConfig(await res.json());
        } catch (e) {
            console.error("Erro ao carregar config:", e);
        }
    };

    useEffect(() => {
        const init = async () => {
            setIsLoading(true);
            await Promise.all([
                refreshCategories(),
                refreshProducts(),
                refreshSales(),
                refreshEmployees(),
                refreshCustomers(),
                refreshConfig()
            ]);
            setIsLoading(false);
        };
        init();
    }, []);

    return (
        <GlobalContext.Provider value={{
            categories,
            products,
            sales,
            employees,
            customers,
            config,
            isLoading,
            refreshCategories,
            refreshProducts,
            refreshSales,
            refreshEmployees,
            refreshCustomers,
            refreshConfig
        }}>
            {children}
        </GlobalContext.Provider>
    );
}

export const useGlobal = () => useContext(GlobalContext);
