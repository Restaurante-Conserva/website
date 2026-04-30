"use client";

import { useState } from 'react';
import { useGlobal, Product, Customer, Category, Sale } from '../context/GlobalContext';

// Modular Components
import Sidebar from './admin/Sidebar';
import Header from './admin/Header';
import StatsView from './admin/StatsView';
import CatalogView from './admin/CatalogView';
import InventoryView from './admin/InventoryView';
import CustomersView from './admin/CustomersView';
import EmployeesView from './admin/EmployeesView';
import FiscalView from './admin/FiscalView';
import SalesView from './admin/SalesView';
import ReportsView from './admin/ReportsView';
import SaleDetails from './admin/SaleDetails';

// Shared Modals
import { X, Loader2, Save, ImageIcon } from 'lucide-react';
import CustomerModal from './CustomerModal';
import DebtModal from './DebtModal';

interface AdminPanelProps {
    onClose: () => void;
}

export default function AdminPanel({ onClose }: AdminPanelProps) {
    const {
        sales, products, categories, employees, customers, config, isLoading,
        refreshSales, refreshProducts, refreshCategories, refreshEmployees, refreshCustomers, refreshConfig
    } = useGlobal();

    const [view, setView] = useState<'stats' | 'catalog' | 'inventory' | 'employees' | 'sales' | 'customers' | 'fiscal' | 'reports'>('stats');
    
    // UI Local State
    const [isRegisteringCustomer, setIsRegisteringCustomer] = useState(false);
    const [selectedCustomerForDebt, setSelectedCustomerForDebt] = useState<Customer | null>(null);
    const [selectedSaleForDetails, setSelectedSaleForDetails] = useState<Sale | null>(null);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    // Optimized Refresh Trigger (only fetch what is needed when view changes or action happens)
    const handleViewChange = (newView: 'stats' | 'catalog' | 'inventory' | 'employees' | 'sales' | 'customers' | 'fiscal' | 'reports') => {
        setView(newView);
        if (newView === 'stats') refreshSales();
        if (newView === 'catalog') { refreshCategories(); refreshProducts(); }
        if (newView === 'customers') refreshCustomers();
        if (newView === 'employees') refreshEmployees();
    };

    const handleDelete = async (type: 'category' | 'product' | 'employee' | 'customer', id: string) => {
        if (!confirm(`Excluir ${type}?`)) return;
        try {
            const endpoint = type === 'category' || type === 'product' ? '/api/catalog' : `/api/${type}s`;
            const res = await fetch(`${endpoint}?type=${type}&id=${id}`, { method: 'DELETE' });
            if (res.ok) {
                if (type === 'category') refreshCategories();
                else if (type === 'product') refreshProducts();
                else if (type === 'employee') refreshEmployees();
                else refreshCustomers();
            }
        } catch { }
    };

    const handleReorderCategory = async (id: string, dir: 'up' | 'down') => {
        await fetch('/api/catalog', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type: 'category', action: 'reorder', id, direction: dir })
        });
        refreshCategories();
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>, target: 'prod' | 'cat') => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onloadend = () => {
            if (target === 'prod' && editingProduct) setEditingProduct({ ...editingProduct, image: reader.result as string });
            else if (editingCategory) setEditingCategory({ ...editingCategory, image: reader.result as string });
        };
        reader.readAsDataURL(file);
    };

    const saveProduct = async () => {
        if (!editingProduct) return;
        setIsSaving(true);
        try {
            await fetch('/api/catalog', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: 'product', id: editingProduct._id, data: editingProduct })
            });
            setEditingProduct(null);
            refreshProducts();
        } finally { setIsSaving(false); }
    };

    const saveCategory = async () => {
        if (!editingCategory) return;
        setIsSaving(true);
        try {
            await fetch('/api/catalog', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: 'category', id: editingCategory._id, data: editingCategory })
            });
            setEditingCategory(null);
            refreshCategories();
        } finally { setIsSaving(false); }
    };

    return (
        <div className="absolute inset-0 bg-gray-50 dark:bg-[#0d0d0d] z-[100] flex text-gray-700 dark:text-[#888] font-sans selection:bg-orange-500/20 overflow-hidden transition-colors">
            <Sidebar currentView={view} setView={handleViewChange} />
            
            <div className="flex-1 flex flex-col min-w-0 bg-gray-50 dark:bg-[#111] transition-colors">
                <Header 
                    title={view === 'stats' ? 'Dashboard' : view} 
                    onClose={onClose} 
                />
                
                <main className="flex-1 overflow-y-auto p-8 relative" style={{ scrollbarWidth: 'thin' }}>
                    {isLoading && view === 'stats' && (
                        <div className="absolute inset-0 flex items-center justify-center bg-gray-50/60 dark:bg-black/40 backdrop-blur-sm z-50">
                            <Loader2 className="animate-spin text-orange-600" size={32} />
                        </div>
                    )}

                    {view === 'stats' && <StatsView sales={sales} customers={customers} />}
                    {view === 'catalog' && (
                        <CatalogView 
                            categories={categories} 
                            products={products} 
                            refreshCategories={refreshCategories}
                            refreshProducts={refreshProducts}
                            onEditProduct={(p: Product) => setEditingProduct(p)}
                            onEditCategory={(c: Category) => setEditingCategory(c)}
                            onDelete={handleDelete}
                            onReorderCategory={handleReorderCategory}
                        />
                    )}
                    {view === 'inventory' && <InventoryView products={products} categories={categories} />}
                    {view === 'customers' && (
                        <CustomersView 
                            customers={customers} 
                            onDebt={setSelectedCustomerForDebt}
                            onDelete={(id) => handleDelete('customer', id)}
                            onRegister={() => setIsRegisteringCustomer(true)}
                        />
                    )}
                    {view === 'employees' && <EmployeesView employees={employees} refreshEmployees={refreshEmployees} onDelete={(id) => handleDelete('employee', id)} />}
                    {view === 'fiscal' && <FiscalView config={config} refreshConfig={refreshConfig} />}
                    {view === 'sales' && <SalesView sales={sales} onSelectSale={setSelectedSaleForDetails} />}
                    {view === 'reports' && <ReportsView sales={sales} />}
                </main>
            </div>

            {/* Global Overlays */}
            {selectedSaleForDetails && (
                <SaleDetails 
                    sale={selectedSaleForDetails} 
                    onClose={() => setSelectedSaleForDetails(null)} 
                />
            )}

            {isRegisteringCustomer && (
                <CustomerModal
                    onClose={() => setIsRegisteringCustomer(false)}
                    onSelect={() => {
                        setIsRegisteringCustomer(false);
                        refreshCustomers();
                    }}
                />
            )}

            {selectedCustomerForDebt && (
                <DebtModal
                    customer={selectedCustomerForDebt}
                    onClose={() => {
                        setSelectedCustomerForDebt(null);
                        refreshCustomers();
                    }}
                />
            )}

            {/* Edit Product Modal */}
            {editingProduct && (
                <div className="fixed inset-0 z-[250] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="w-full max-w-sm bg-white dark:bg-[#0a0a0a] border border-gray-100 dark:border-[#1a1a1a] rounded-xl overflow-hidden shadow-xl animate-in zoom-in-95 duration-200">
                        <div className="px-5 py-4 border-b border-gray-100 dark:border-[#1a1a1a] flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Editar Produto</p>
                                <p className="text-xs text-gray-400 dark:text-[#555] mt-0.5">Ajuste as propriedades do item</p>
                            </div>
                            <button onClick={() => setEditingProduct(null)} className="p-1.5 rounded-md text-gray-400 hover:text-gray-700 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-[#1a1a1a] border-none bg-transparent cursor-pointer transition-all"><X size={16} /></button>
                        </div>
                        <div className="p-5 space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-xs text-gray-400 dark:text-[#555]">Nome</label>
                                <input className="w-full bg-gray-50 dark:bg-black border border-gray-200 dark:border-[#222] rounded-md px-3 py-2 text-xs text-gray-900 dark:text-gray-100 outline-none focus:border-orange-500 transition-all" value={editingProduct.name} onChange={e => setEditingProduct({...editingProduct, name: e.target.value})} />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <label className="text-xs text-gray-400 dark:text-[#555]">Preço (R$)</label>
                                    <input className="w-full bg-gray-50 dark:bg-black border border-gray-200 dark:border-[#222] rounded-md px-3 py-2 text-xs text-gray-900 dark:text-gray-100 outline-none focus:border-orange-500 transition-all tabular-nums" type="number" step="0.01" value={editingProduct.price} onChange={e => setEditingProduct({...editingProduct, price: parseFloat(e.target.value)})} />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs text-gray-400 dark:text-[#555]">Estoque</label>
                                    <input className="w-full bg-gray-50 dark:bg-black border border-gray-200 dark:border-[#222] rounded-md px-3 py-2 text-xs text-gray-900 dark:text-gray-100 outline-none focus:border-orange-500 transition-all tabular-nums" type="number" value={editingProduct.stock || ''} onChange={e => setEditingProduct({...editingProduct, stock: parseInt(e.target.value)})} />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs text-gray-400 dark:text-[#555]">Imagem</label>
                                <div className="flex gap-2 items-center">
                                    <input type="file" accept="image/*" className="hidden" id="edit-prod-img" onChange={(e) => handleImageChange(e, 'prod')} />
                                    <label htmlFor="edit-prod-img" className="flex-1 bg-gray-50 dark:bg-black border border-gray-200 dark:border-[#222] rounded-md px-3 py-2 text-xs text-gray-500 dark:text-[#666] cursor-pointer hover:border-orange-500 transition-all flex items-center justify-center gap-1.5">
                                        <ImageIcon size={13} /> Selecionar Imagem
                                    </label>
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    {editingProduct.image && <div className="w-9 h-9 rounded-md border border-gray-200 dark:border-[#222] overflow-hidden shrink-0"><img src={editingProduct.image} className="w-full h-full object-cover" alt="Preview" /></div>}
                                </div>
                            </div>
                        </div>
                        <div className="px-5 py-4 border-t border-gray-100 dark:border-[#1a1a1a] flex gap-2">
                            <button onClick={() => setEditingProduct(null)} className="flex-1 py-2 text-xs text-gray-500 dark:text-[#555] hover:text-gray-900 dark:hover:text-gray-100 transition-all border border-gray-200 dark:border-[#1a1a1a] rounded-md bg-transparent cursor-pointer">Descartar</button>
                            <button onClick={saveProduct} disabled={isSaving} className="flex-[1.5] bg-orange-600 text-white py-2 rounded-md text-xs hover:bg-orange-500 transition-all flex items-center justify-center gap-2 border-none cursor-pointer disabled:opacity-50">
                                {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                                {isSaving ? 'Salvando...' : 'Salvar'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Category Modal */}
            {editingCategory && (
                <div className="fixed inset-0 z-[250] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="w-full max-w-xs bg-white dark:bg-[#0a0a0a] border border-gray-100 dark:border-[#1a1a1a] rounded-xl overflow-hidden shadow-xl animate-in zoom-in-95 duration-200">
                        <div className="px-5 py-4 border-b border-gray-100 dark:border-[#1a1a1a] flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Editar Categoria</p>
                                <p className="text-xs text-gray-400 dark:text-[#555] mt-0.5">Identificação do grupo</p>
                            </div>
                            <button onClick={() => setEditingCategory(null)} className="p-1.5 rounded-md text-gray-400 hover:text-gray-700 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-[#1a1a1a] border-none bg-transparent cursor-pointer transition-all"><X size={16} /></button>
                        </div>
                        <div className="p-5 space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-xs text-gray-400 dark:text-[#555]">Nome</label>
                                <input className="w-full bg-gray-50 dark:bg-black border border-gray-200 dark:border-[#222] rounded-md px-3 py-2 text-xs text-gray-900 dark:text-gray-100 outline-none focus:border-orange-500 transition-all" value={editingCategory.name} onChange={e => setEditingCategory({...editingCategory, name: e.target.value})} />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs text-gray-400 dark:text-[#555]">Ícone</label>
                                <div className="flex gap-2 items-center">
                                    <input type="file" accept="image/*" className="hidden" id="edit-cat-img" onChange={(e) => handleImageChange(e, 'cat')} />
                                    <label htmlFor="edit-cat-img" className="flex-1 bg-gray-50 dark:bg-black border border-gray-200 dark:border-[#222] rounded-md px-3 py-2 text-xs text-gray-500 dark:text-[#666] cursor-pointer hover:border-orange-500 transition-all flex items-center justify-center gap-1.5">
                                        <ImageIcon size={13} /> Mudar Ícone
                                    </label>
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    {editingCategory.image && <div className="w-9 h-9 rounded-md border border-gray-200 dark:border-[#222] overflow-hidden shrink-0"><img src={editingCategory.image} className="w-full h-full object-cover" alt="Preview" /></div>}
                                </div>
                            </div>
                        </div>
                        <div className="px-5 py-4 border-t border-gray-100 dark:border-[#1a1a1a] flex gap-2">
                            <button onClick={() => setEditingCategory(null)} className="flex-1 py-2 text-xs text-gray-500 dark:text-[#555] hover:text-gray-900 dark:hover:text-gray-100 transition-all border border-gray-200 dark:border-[#1a1a1a] rounded-md bg-transparent cursor-pointer">Cancelar</button>
                            <button onClick={saveCategory} disabled={isSaving} className="flex-[1.5] bg-orange-600 text-white py-2 rounded-md text-xs hover:bg-orange-500 transition-all flex items-center justify-center gap-2 border-none cursor-pointer disabled:opacity-50">
                                {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                                {isSaving ? 'Salvando...' : 'Salvar'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
