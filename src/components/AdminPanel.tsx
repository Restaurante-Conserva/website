"use client";

import { useState } from 'react';
import { useGlobal } from '../context/GlobalContext';

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
import SaleDetails from './admin/SaleDetails';

// Shared Modals
import CustomerModal from './CustomerModal';
import DebtModal from './DebtModal';
import { Save, X, ImageIcon, Loader2 } from 'lucide-react';

interface AdminPanelProps {
    onClose: () => void;
}

export default function AdminPanel({ onClose }: AdminPanelProps) {
    const {
        sales, products, categories, employees, customers, config, isLoading,
        refreshSales, refreshProducts, refreshCategories, refreshEmployees, refreshCustomers, refreshConfig
    } = useGlobal();

    const [view, setView] = useState<'stats' | 'catalog' | 'inventory' | 'employees' | 'sales' | 'customers' | 'fiscal'>('stats');
    
    // UI Local State
    const [isRegisteringCustomer, setIsRegisteringCustomer] = useState(false);
    const [selectedCustomerForDebt, setSelectedCustomerForDebt] = useState<any>(null);
    const [selectedSaleForDetails, setSelectedSaleForDetails] = useState<any>(null);
    const [editingProduct, setEditingProduct] = useState<any>(null);
    const [editingCategory, setEditingCategory] = useState<any>(null);
    const [isSaving, setIsSaving] = useState(false);

    // Optimized Refresh Trigger (only fetch what is needed when view changes or action happens)
    const handleViewChange = (newView: any) => {
        setView(newView);
        // Optional: Trigger refresh based on view
        if (newView === 'stats') refreshSales();
        if (newView === 'catalog') { refreshCategories(); refreshProducts(); }
        if (newView === 'customers') refreshCustomers();
        if (newView === 'employees') refreshEmployees();
    };

    const handleDelete = async (type: 'category' | 'product' | 'customer', id: string) => {
        if (!confirm(`Excluir este ${type}?`)) return;
        const url = type === 'customer' ? `/api/customers?id=${id}` : `/api/catalog?type=${type}&id=${id}`;
        await fetch(url, { method: 'DELETE' });
        if (type === 'customer') refreshCustomers();
        else { refreshCategories(); refreshProducts(); }
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
            if (target === 'prod') setEditingProduct({ ...editingProduct, image: reader.result as string });
            else setEditingCategory({ ...editingCategory, image: reader.result as string });
        };
        reader.readAsDataURL(file);
    };

    const saveProduct = async () => {
        setIsSaving(true);
        try {
            await fetch('/api/catalog', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: 'product', id: editingProduct.id || editingProduct._id, data: editingProduct })
            });
            setEditingProduct(null);
            refreshProducts();
        } finally { setIsSaving(false); }
    };

    const saveCategory = async () => {
        setIsSaving(true);
        try {
            await fetch('/api/catalog', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: 'category', id: editingCategory.id || editingCategory._id, data: editingCategory })
            });
            setEditingCategory(null);
            refreshCategories();
        } finally { setIsSaving(false); }
    };

    return (
        <div className="absolute inset-0 bg-gray-50 dark:bg-[#0a0a0a] z-[100] flex text-gray-700 dark:text-[#888] font-sans selection:bg-orange-500/20 overflow-hidden transition-colors">
            <Sidebar currentView={view} setView={handleViewChange} />
            
            <div className="flex-1 flex flex-col min-w-0 bg-gray-50 dark:bg-[#0e0e0e] transition-colors">
                <Header 
                    title={view === 'stats' ? 'Dashboard' : view} 
                    onClose={onClose} 
                />
                
                <main className="flex-1 overflow-y-auto p-8 relative" style={{ scrollbarWidth: 'thin' }}>
                    {isLoading && view === 'stats' && (
                        <div className="absolute inset-0 flex items-center justify-center bg-gray-50/80 dark:bg-[#0e0e0e]/50 backdrop-blur-sm z-50">
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
                            onEditProduct={setEditingProduct}
                            onEditCategory={setEditingCategory}
                            onDelete={(t, id) => handleDelete(t as any, id)}
                            onReorderCategory={handleReorderCategory}
                        />
                    )}
                    {view === 'inventory' && <InventoryView products={products} categories={categories} />}
                    {view === 'customers' && (
                        <CustomersView 
                            customers={customers} 
                            onSelectDebt={setSelectedCustomerForDebt}
                            onDelete={(id) => handleDelete('customer', id)}
                            onRegister={() => setIsRegisteringCustomer(true)}
                        />
                    )}
                    {view === 'employees' && <EmployeesView employees={employees} refreshEmployees={refreshEmployees} />}
                    {view === 'fiscal' && <FiscalView config={config} refreshConfig={refreshConfig} />}
                    {view === 'sales' && <SalesView sales={sales} onSelectSale={setSelectedSaleForDetails} />}
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
                    initialRegister={true}
                    dark={true}
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
                    dark={true}
                    onUpdate={refreshCustomers}
                    onClose={() => {
                        setSelectedCustomerForDebt(null);
                        refreshCustomers();
                    }}
                />
            )}



            {/* Edit Product Modal */}
            {editingProduct && (
                <div className="fixed inset-0 z-[250] flex items-center justify-center bg-gray-900/60 dark:bg-black/80 p-4 animate-in fade-in duration-300">
                    <div className="w-full max-w-sm bg-white dark:bg-[#111] border border-gray-200 dark:border-[#1a1a1a] rounded-2xl overflow-hidden shadow-2xl">
                        <header className="px-6 py-5 border-b border-gray-100 dark:border-[#1a1a1a] flex items-center justify-between">
                            <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-widest">Editar Produto</h3>
                            <button onClick={() => setEditingProduct(null)} className="text-gray-400 dark:text-[#333] hover:text-gray-900 dark:hover:text-white border-none bg-transparent cursor-pointer"><X size={20} /></button>
                        </header>
                        <div className="p-6 space-y-5">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-gray-500 dark:text-[#444] uppercase tracking-widest">Nome Item</label>
                                <input className="w-full bg-gray-50 dark:bg-[#0a0a0a] border border-gray-200 dark:border-[#222] rounded-xl px-4 py-3 text-sm font-bold text-gray-900 dark:text-white outline-none focus:border-orange-500 transition-all" value={editingProduct.name} onChange={e => setEditingProduct({...editingProduct, name: e.target.value})} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-gray-500 dark:text-[#444] uppercase tracking-widest">Preço R$</label>
                                    <input className="w-full bg-gray-50 dark:bg-[#0a0a0a] border border-gray-200 dark:border-[#222] rounded-xl px-4 py-3 text-sm font-bold text-gray-900 dark:text-white outline-none focus:border-orange-500 transition-all" type="number" step="0.01" value={editingProduct.price} onChange={e => setEditingProduct({...editingProduct, price: parseFloat(e.target.value)})} />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-gray-500 dark:text-[#444] uppercase tracking-widest">Estoque</label>
                                    <input className="w-full bg-gray-50 dark:bg-[#0a0a0a] border border-gray-200 dark:border-[#222] rounded-xl px-4 py-3 text-sm font-bold text-gray-900 dark:text-white outline-none focus:border-orange-500 transition-all" type="number" value={editingProduct.stock || ''} onChange={e => setEditingProduct({...editingProduct, stock: parseInt(e.target.value)})} />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-gray-500 dark:text-[#444] uppercase tracking-widest">Imagem</label>
                                <div className="flex gap-3">
                                    <input type="file" accept="image/*" className="hidden" id="edit-prod-img" onChange={(e) => handleImageChange(e, 'prod')} />
                                    <label htmlFor="edit-prod-img" className="flex-1 bg-gray-50 dark:bg-[#0a0a0a] border border-gray-200 dark:border-[#222] rounded-xl px-4 py-3 text-xs font-bold text-gray-500 dark:text-[#444] text-center cursor-pointer hover:border-orange-500 transition-all flex items-center justify-center gap-2">
                                        <ImageIcon size={16} /> Selecionar Foto
                                    </label>
                                    {editingProduct.image && <div className="w-12 h-12 rounded-xl border border-gray-200 dark:border-[#1a1a1a] overflow-hidden shadow-sm"><img src={editingProduct.image} className="w-full h-full object-cover" /></div>}
                                </div>
                            </div>
                        </div>
                        <footer className="px-6 py-5 bg-gray-50 dark:bg-[#0a0a0a] border-t border-gray-100 dark:border-[#1a1a1a] flex gap-3">
                            <button onClick={() => setEditingProduct(null)} className="flex-1 px-4 py-3 text-xs font-black uppercase tracking-widest text-gray-500 dark:text-[#333] hover:text-gray-900 dark:hover:text-white transition-colors border-none bg-transparent cursor-pointer">Cancelar</button>
                            <button onClick={saveProduct} disabled={isSaving} className="flex-1 bg-orange-600 text-white py-3 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-orange-500 transition-all shadow-lg shadow-orange-600/20 flex items-center justify-center gap-2 border-none cursor-pointer disabled:opacity-60">
                                {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Salvar
                            </button>
                        </footer>
                    </div>
                </div>
            )}

            {/* Edit Category Modal */}
            {editingCategory && (
                <div className="fixed inset-0 z-[250] flex items-center justify-center bg-gray-900/60 dark:bg-black/80 p-4 animate-in fade-in duration-300">
                    <div className="w-full max-w-sm bg-white dark:bg-[#111] border border-gray-200 dark:border-[#1a1a1a] rounded-2xl overflow-hidden shadow-2xl">
                        <header className="px-6 py-5 border-b border-gray-100 dark:border-[#1a1a1a] flex items-center justify-between">
                            <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-widest">Editar Categoria</h3>
                            <button onClick={() => setEditingCategory(null)} className="text-gray-400 dark:text-[#333] hover:text-gray-900 dark:hover:text-white border-none bg-transparent cursor-pointer"><X size={20} /></button>
                        </header>
                        <div className="p-6 space-y-5">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-gray-500 dark:text-[#444] uppercase tracking-widest">Nome Categoria</label>
                                <input className="w-full bg-gray-50 dark:bg-[#0a0a0a] border border-gray-200 dark:border-[#222] rounded-xl px-4 py-3 text-sm font-bold text-gray-900 dark:text-white outline-none focus:border-orange-500 transition-all" value={editingCategory.name} onChange={e => setEditingCategory({...editingCategory, name: e.target.value})} />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-gray-500 dark:text-[#444] uppercase tracking-widest">Imagem / Ícone</label>
                                <div className="flex gap-3">
                                    <input type="file" accept="image/*" className="hidden" id="edit-cat-img" onChange={(e) => handleImageChange(e, 'cat')} />
                                    <label htmlFor="edit-cat-img" className="flex-1 bg-gray-50 dark:bg-[#0a0a0a] border border-gray-200 dark:border-[#222] rounded-xl px-4 py-3 text-xs font-bold text-gray-500 dark:text-[#444] text-center cursor-pointer hover:border-orange-500 transition-all flex items-center justify-center gap-2">
                                        <ImageIcon size={16} /> Alterar Ícone
                                    </label>
                                    {editingCategory.image && <div className="w-12 h-12 rounded-xl border border-gray-200 dark:border-[#1a1a1a] overflow-hidden shadow-sm"><img src={editingCategory.image} className="w-full h-full object-cover" /></div>}
                                </div>
                            </div>
                        </div>
                        <footer className="px-6 py-5 bg-gray-50 dark:bg-[#0a0a0a] border-t border-gray-100 dark:border-[#1a1a1a] flex gap-3">
                            <button onClick={() => setEditingCategory(null)} className="flex-1 px-4 py-3 text-xs font-black uppercase tracking-widest text-gray-500 dark:text-[#333] hover:text-gray-900 dark:hover:text-white transition-colors border-none bg-transparent cursor-pointer">Cancelar</button>
                            <button onClick={saveCategory} disabled={isSaving} className="flex-1 bg-orange-600 text-white py-3 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-orange-500 transition-all shadow-lg shadow-orange-600/20 flex items-center justify-center gap-2 border-none cursor-pointer disabled:opacity-60">
                                {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Salvar
                            </button>
                        </footer>
                    </div>
                </div>
            )}
        </div>
    );
}
