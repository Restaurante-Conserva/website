"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface Category {
    _id: string;
    name: string;
    image?: string;
    order?: number;
}

export interface Product {
    _id: string;
    name: string;
    price: number;
    category: string;
    image?: string;
    stock?: number;
    unit?: string;
}

export interface Payment {
    method: 'money' | 'pix' | 'credit' | 'debit' | 'fiado';
    amount: number;
}

export interface SaleItem {
    productId: string;
    name: string;
    quantity: number;
    price: number;
    category?: string;
    volume?: string;
}

export interface Sale {
    _id: string;
    date: string;
    total: number;
    items: SaleItem[];
    payments: Payment[];
    employee?: string;
    customer?: string;
    customerName?: string;
}

export interface Customer {
    _id: string;
    name: string;
    phone?: string;
    address?: { street?: string; number?: string };
    debt?: number;
    debtBalance?: number;
    loyaltyPoints?: number;
}

export interface Employee {
    _id: string;
    name: string;
    role: string;
    pin: string;
}

interface GlobalContextType {
    categories: Category[];
    products: Product[];
    sales: Sale[];
    employees: Employee[];
    customers: Customer[];
    config: Record<string, unknown> | null;
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
    const [categories, setCategories] = useState<Category[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [sales, setSales] = useState<Sale[]>([]);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [config, setConfig] = useState<Record<string, unknown> | null>(null);
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
