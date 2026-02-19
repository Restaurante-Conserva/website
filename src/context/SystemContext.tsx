'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';

export type Category = { id: string; name: string };
export type Product = {
  id: string;
  categoryId: string;
  name: string;
  price: number;
  stock: number | null;
};
export type OrderItem = { productId: string; quantity: number };
export type Table = {
  id: string;
  number: number;
  status: 'free' | 'occupied';
  orders: OrderItem[];
  customerName?: string;
};

interface SystemContextType {
  // Auth
  isLoading: boolean;
  loginAdmin: (password: string) => Promise<boolean>;

  // Catalog
  categories: Category[];
  addCategory: (name: string) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  products: Product[];
  addProduct: (product: Omit<Product, 'id'>) => Promise<void>;
  updateProduct: (id: string, updates: Partial<Product>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;

  // Tables
  tables: Table[];
  config: { tableCount: number };
  refreshTables: () => void;
  updateTableConfig: (count: number) => Promise<void>;
  openTable: (tableId: string, customerName?: string) => Promise<void>;
  closeTable: (tableId: string, paymentMethod?: string, transactionId?: string) => Promise<void>;
  addToTable: (tableId: string, productId: string, quantity: number) => Promise<void>; // returns true if success
}

const SystemContext = createContext<SystemContextType | undefined>(undefined);

export function SystemProvider({ children }: { children: React.ReactNode }) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [tables, setTables] = useState<Table[]>([]);
  const [config, setConfig] = useState({ tableCount: 12 });
  const [isLoading, setIsLoading] = useState(true);

  const router = useRouter();

  const fetchData = useCallback(async () => {
    try {
      const [catsRes, prodsRes, tablesRes, configRes] = await Promise.all([
        fetch('/api/catalog?type=categories'),
        fetch('/api/catalog?type=products'),
        fetch('/api/tables'),
        fetch('/api/config')
      ]);

      if (catsRes.ok) setCategories(await catsRes.json());
      if (prodsRes.ok) setProducts(await prodsRes.json());
      if (tablesRes.ok) setTables(await tablesRes.json());
      if (configRes.ok) setConfig(await configRes.json());
    } catch (err) {
      console.error("Failed to fetch data", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const loginAdmin = async (password: string) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ password }),
    });
    return res.ok;
  };

  const addCategory = async (name: string) => {
    await fetch('/api/catalog', {
      method: 'POST',
      body: JSON.stringify({ type: 'category', data: { name } }),
    });
    fetchData();
  };

  const deleteCategory = async (id: string) => {
    await fetch(`/api/catalog?type=category&id=${id}`, { method: 'DELETE' });
    fetchData();
  };

  const addProduct = async (product: Omit<Product, 'id'>) => {
    await fetch('/api/catalog', {
      method: 'POST',
      body: JSON.stringify({ type: 'product', data: product }),
    });
    fetchData();
  };

  const updateProduct = async (id: string, updates: Partial<Product>) => {
    await fetch('/api/catalog', {
      method: 'PUT',
      body: JSON.stringify({ type: 'product', id, data: updates }),
    });
    fetchData();
  }

  const deleteProduct = async (id: string) => {
    await fetch(`/api/catalog?type=product&id=${id}`, { method: 'DELETE' });
    fetchData();
  };

  const updateTableConfig = async (count: number) => {
    await fetch('/api/config', {
      method: 'POST',
      body: JSON.stringify({ tableCount: count })
    });
    fetchData();
  };

  const openTable = async (tableId: string, customerName?: string) => {
    await fetch('/api/tables', {
      method: 'PUT',
      body: JSON.stringify({ id: tableId, action: 'open', payload: { customerName } })
    });
    fetchData();
  }

  const closeTable = async (tableId: string, paymentMethod?: string, transactionId?: string) => {
    await fetch('/api/tables', {
      method: 'PUT',
      body: JSON.stringify({
        id: tableId,
        action: 'close',
        payload: { paymentMethod, transactionId }
      }),
    });
    fetchData();
  };

  const addToTable = async (tableId: string, productId: string, quantity: number) => {
    // We remove optimistic update here because logic is now complex (stock check server side)
    // and we want source of truth from server response like 'Out of Stock'
    const res = await fetch('/api/tables', {
      method: 'PUT',
      body: JSON.stringify({
        id: tableId,
        action: 'update_order',
        payload: { productId, quantity }
      }),
    });

    if (!res.ok) {
      throw new Error((await res.json()).error || 'Failed');
    }

    fetchData();
  };

  return (
    <SystemContext.Provider
      value={{
        isLoading,
        loginAdmin,
        categories,
        addCategory,
        deleteCategory,
        products,
        addProduct,
        updateProduct,
        deleteProduct,
        tables,
        config,
        refreshTables: fetchData,
        updateTableConfig,
        openTable,
        closeTable,
        addToTable,
      }}
    >
      {children}
    </SystemContext.Provider>
  );
}

export function useSystem() {
  const context = useContext(SystemContext);
  if (context === undefined) {
    throw new Error('useSystem must be used within a SystemProvider');
  }
  return context;
}
