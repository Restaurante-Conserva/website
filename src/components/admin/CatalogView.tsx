"use client";

import { useState } from 'react';
import { Plus, Pencil, Trash2, LayoutGrid, Image as ImageIcon, Loader2, ChevronUp, ChevronDown } from 'lucide-react';

import { Category, Product } from '../../context/GlobalContext';

interface CatalogViewProps {
    categories: Category[];
    products: Product[];
    refreshCategories: () => Promise<void>;
    refreshProducts: () => Promise<void>;
    onEditProduct: (p: Product) => void;
    onEditCategory: (c: Category) => void;
    onDelete: (type: 'category' | 'product', id: string) => Promise<void>;
    onReorderCategory: (id: string, dir: 'up' | 'down') => Promise<void>;
}

export default function CatalogView({ 
    categories, products, refreshCategories, refreshProducts, 
    onEditProduct, onEditCategory, onDelete, onReorderCategory 
}: CatalogViewProps) {
    const [newCatName, setNewCatName] = useState('');
    const [newCatImage, setNewCatImage] = useState('');
    const [isCreatingCat, setIsCreatingCat] = useState(false);

    const [newProd, setNewProd] = useState({ name: '', price: '', categoryId: '', stock: '', image: '' });
    const [isCreatingProd, setIsCreatingProd] = useState(false);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>, target: 'cat' | 'prod') => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onloadend = () => {
            if (target === 'cat') setNewCatImage(reader.result as string);
            else setNewProd({ ...newProd, image: reader.result as string });
        };
        reader.readAsDataURL(file);
    };

    const handleAddCategory = async () => {
        if (!newCatName) return;
        setIsCreatingCat(true);
        try {
            await fetch('/api/catalog', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: 'category', data: { name: newCatName, image: newCatImage } })
            });
            setNewCatName('');
            setNewCatImage('');
            await refreshCategories();
        } finally {
            setIsCreatingCat(false);
        }
    };

    const handleAddProduct = async () => {
        if (!newProd.name || !newProd.price || !newProd.categoryId) return;
        setIsCreatingProd(true);
        try {
            await fetch('/api/catalog', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: 'product',
                    data: {
                        ...newProd,
                        price: parseFloat(newProd.price),
                        stock: newProd.stock ? parseInt(newProd.stock) : null
                    }
                })
            });
            setNewProd({ name: '', price: '', categoryId: '', stock: '', image: '' });
            await refreshProducts();
        } finally {
            setIsCreatingProd(false);
        }
    };

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-2 duration-500">
            {/* Categorias Section */}
            <section className="space-y-3">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Categorias</h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Organização do Cardápio</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-white dark:bg-[#0a0a0a] p-3 rounded-lg border border-gray-100 dark:border-[#1a1a1a] items-end shadow-sm dark:shadow-none">
                    <div className="space-y-1.5 md:col-span-2">
                        <label className="text-xs font-medium text-gray-600 dark:text-gray-400">Nome da Categoria</label>
                        <input
                            type="text"
                            className="w-full bg-gray-50 dark:bg-black border border-gray-200 dark:border-[#222] rounded-md px-3 py-1.5 text-xs outline-none focus:border-orange-500 text-gray-900 dark:text-gray-100 transition-all"
                            placeholder="Ex: Bebidas, Lanches..."
                            value={newCatName}
                            onChange={e => setNewCatName(e.target.value)}
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-xs font-medium text-gray-600 dark:text-gray-400">Ícone / Foto</label>
                        <div className="flex gap-2">
                            <input type="file" accept="image/*" onChange={(e) => handleImageChange(e, 'cat')} className="hidden" id="new-cat-img" />
                            <label htmlFor="new-cat-img" className="flex-1 bg-gray-50 dark:bg-black border border-gray-200 dark:border-[#222] rounded-md px-3 py-1.5 text-xs font-medium text-gray-500 dark:text-gray-400 cursor-pointer text-center hover:border-orange-500 transition-all flex items-center justify-center gap-1.5">
                                {newCatImage ? <span className="text-emerald-500">✓</span> : <ImageIcon size={14} />} 
                                {newCatImage ? "Alterar" : "Selecionar"}
                            </label>
                        </div>
                    </div>
                    <button 
                        onClick={handleAddCategory} 
                        disabled={isCreatingCat || !newCatName}
                        className="bg-orange-600/90 text-white px-4 py-1.5 rounded-md hover:bg-orange-500 disabled:opacity-50 flex items-center justify-center gap-1.5 text-xs font-medium transition-all h-[30px] cursor-pointer border-none"
                    >
                        {isCreatingCat ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />} Criar
                    </button>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                    {categories.map(cat => (
                        <div key={cat.id || cat._id} className="bg-white dark:bg-[#0a0a0a] border border-gray-100 dark:border-[#1a1a1a] rounded-lg p-3 flex flex-row md:flex-col gap-2 group hover:border-gray-200 dark:hover:border-[#333] items-center justify-center text-center relative overflow-hidden transition-all shadow-sm dark:shadow-none h-20">
                            <div className="w-8 h-8 bg-gray-50 dark:bg-black rounded-md flex items-center justify-center overflow-hidden border border-gray-100 dark:border-[#222] group-hover:border-orange-200 dark:group-hover:border-orange-500/50 transition-all shrink-0">
                                {cat.image ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img src={cat.image} className="w-full h-full object-cover" alt="" />
                                ) : (
                                    <LayoutGrid size={16} className="text-gray-400 dark:text-[#555] group-hover:text-orange-500 transition-colors" />
                                )}
                            </div>
                            <span className="text-xs font-medium text-gray-700 dark:text-[#888] group-hover:text-gray-900 dark:group-hover:text-gray-100 transition-colors line-clamp-1">{cat.name}</span>
                            
                            <div className="absolute top-1 left-1 flex flex-col gap-0.5 opacity-0 group-hover:opacity-100 transition-all translate-x-[-5px] group-hover:translate-x-0">
                                <button onClick={() => onReorderCategory(cat.id ?? cat._id ?? '', 'up')} className="p-0.5 bg-gray-50 dark:bg-black text-gray-500 dark:text-[#666] hover:text-gray-900 dark:hover:text-white rounded border border-gray-200 dark:border-[#222] hover:border-gray-300 dark:hover:border-[#333] cursor-pointer"><ChevronUp size={12} /></button>
                                <button onClick={() => onReorderCategory(cat.id ?? cat._id ?? '', 'down')} className="p-0.5 bg-gray-50 dark:bg-black text-gray-500 dark:text-[#666] hover:text-gray-900 dark:hover:text-white rounded border border-gray-200 dark:border-[#222] hover:border-gray-300 dark:hover:border-[#333] cursor-pointer"><ChevronDown size={12} /></button>
                            </div>

                            <div className="absolute top-1 right-1 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-all translate-x-[5px] group-hover:translate-x-0">
                                <button onClick={() => onEditCategory(cat)} className="p-1 bg-gray-50 dark:bg-black text-gray-500 dark:text-[#666] hover:text-gray-900 dark:hover:text-white rounded border border-gray-200 dark:border-[#222] hover:border-gray-300 dark:hover:border-[#333] cursor-pointer"><Pencil size={12} /></button>
                                <button onClick={() => onDelete('category', cat.id ?? cat._id ?? '')} className="p-1 bg-gray-50 dark:bg-black text-gray-500 dark:text-[#666] hover:text-red-600 dark:hover:text-red-500 rounded border border-gray-200 dark:border-[#222] hover:border-red-200 dark:hover:border-[#333] cursor-pointer"><Trash2 size={12} /></button>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Produtos Section */}
            <section className="space-y-5">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Produtos</h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Gestão de Itens Individuais</p>
                    </div>
                    <button
                        onClick={() => {
                            const headers = ['Nome', 'Categoria', 'Preço (R$)', 'Estoque'];
                            let csv = '\uFEFF' + headers.join(';') + '\n';
                            products.forEach(p => {
                                const catName = categories.find(c => (c.id || c._id) === p.categoryId)?.name || 'Avulso';
                                const row = [
                                    p.name,
                                    catName,
                                    p.price.toFixed(2).replace('.', ','),
                                    p.stock !== null ? String(p.stock) : 'Ilimitado'
                                ].map(v => `"${String(v).replace(/"/g, '""')}"`);
                                csv += row.join(';') + '\n';
                            });
                            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = `lista_produtos_${new Date().toISOString().slice(0, 10)}.csv`;
                            a.click();
                            URL.revokeObjectURL(url);
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600/90 hover:bg-emerald-600 text-white rounded-md text-xs font-medium transition-colors border-none cursor-pointer"
                    >
                        <Plus size={13} className="rotate-45" /> Exportar Produtos
                    </button>
                </div>

                <div className="bg-white dark:bg-[#0a0a0a] p-3 rounded-lg border border-gray-100 dark:border-[#1a1a1a] grid grid-cols-1 md:grid-cols-5 gap-3 items-end shadow-sm dark:shadow-none">
                    <div className="space-y-1.5">
                        <label className="text-xs font-medium text-gray-600 dark:text-gray-400">Nome</label>
                        <input className="w-full bg-gray-50 dark:bg-black border border-gray-200 dark:border-[#222] rounded-md px-3 py-1.5 text-xs outline-none focus:border-orange-500 text-gray-900 dark:text-gray-100" placeholder="Ex: X-Burger" value={newProd.name} onChange={e => setNewProd({...newProd, name: e.target.value})} />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-xs font-medium text-gray-600 dark:text-gray-400">Preço R$</label>
                        <input className="w-full bg-gray-50 dark:bg-black border border-gray-200 dark:border-[#222] rounded-md px-3 py-1.5 text-xs outline-none focus:border-orange-500 text-gray-900 dark:text-gray-100" type="number" step="0.01" value={newProd.price} onChange={e => setNewProd({...newProd, price: e.target.value})} />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-xs font-medium text-gray-600 dark:text-gray-400">Categoria</label>
                        <select className="w-full bg-gray-50 dark:bg-black border border-gray-200 dark:border-[#222] rounded-md px-2 py-1.5 text-xs font-medium outline-none cursor-pointer text-gray-900 dark:text-gray-100" value={newProd.categoryId} onChange={e => setNewProd({...newProd, categoryId: e.target.value})}>
                            <option value="">Selecionar...</option>
                            {categories.map(c => <option key={c.id || c._id} value={c.id || c._id}>{c.name}</option>)}
                        </select>
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-xs font-medium text-gray-600 dark:text-gray-400">Imagem</label>
                        <div className="flex gap-2">
                            <input type="file" accept="image/*" onChange={(e) => handleImageChange(e, 'prod')} className="hidden" id="new-prod-img" />
                            <label htmlFor="new-prod-img" className="flex-1 bg-gray-50 dark:bg-black border border-gray-200 dark:border-[#222] rounded-md px-3 py-1.5 text-xs font-medium text-gray-500 dark:text-gray-400 cursor-pointer text-center truncate hover:border-orange-500 transition-all flex items-center justify-center gap-1.5">
                                {newProd.image ? <span className="text-emerald-500">✓</span> : <ImageIcon size={14} />}
                                {newProd.image ? "OK" : "Foto"}
                            </label>
                        </div>
                    </div>
                    <button 
                        onClick={handleAddProduct} 
                        disabled={isCreatingProd || !newProd.name}
                        className="bg-orange-600/90 text-white px-4 py-1.5 rounded-md hover:bg-orange-500 disabled:opacity-50 text-xs font-medium transition-all h-[30px] cursor-pointer border-none"
                    >
                        Criar Item
                    </button>
                </div>

                <div className="border border-gray-100 dark:border-[#1a1a1a] rounded-lg overflow-hidden bg-white dark:bg-[#0a0a0a] shadow-sm dark:shadow-none">
                    <table className="w-full text-left text-xs">
                        <thead className="bg-gray-50 dark:bg-[#111] border-b border-gray-100 dark:border-[#1a1a1a] text-gray-500 dark:text-gray-400 font-medium">
                            <tr>
                                <th className="px-4 py-2.5 font-medium">Produto</th>
                                <th className="px-4 py-2.5 font-medium">Categoria</th>
                                <th className="px-4 py-2.5 font-medium">Preço</th>
                                <th className="px-4 py-2.5 font-medium text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 dark:divide-[#1a1a1a]">
                            {products.map(p => (
                                <tr key={p.id || p._id} className="hover:bg-gray-50/50 dark:hover:bg-[#111] group transition-colors">
                                    <td className="px-4 py-2.5">
                                        <div className="flex items-center gap-3">
                                            <div className="w-7 h-7 rounded-md bg-gray-50 dark:bg-[#1a1a1a] border border-gray-100 dark:border-[#222] overflow-hidden flex items-center justify-center group-hover:border-orange-200 dark:group-hover:border-orange-500/30 transition-all">
                                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                                {p.image ? <img src={p.image} className="w-full h-full object-cover" alt={p.name} /> : <span className="text-xs font-medium text-gray-400 dark:text-[#555]">{p.name.charAt(0).toUpperCase()}</span>}
                                            </div>
                                            <span className="font-medium text-gray-900 dark:text-gray-100">{p.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-2.5">
                                        <span className="text-[11px] font-medium text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-[#1a1a1a] px-1.5 py-0.5 rounded border border-gray-100 dark:border-[#222]">
                                            {categories.find(c => (c.id || c._id) === p.categoryId)?.name || 'Avulso'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-2.5 font-medium text-gray-900 dark:text-gray-100 tabular-nums">R$ {p.price.toFixed(2)}</td>
                                    <td className="px-4 py-2.5 text-right flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0 h-[46px]">
                                        <button onClick={() => onEditProduct(p)} className="p-1.5 bg-gray-50 dark:bg-black text-gray-500 dark:text-[#666] hover:text-gray-900 dark:hover:text-white rounded-md border border-gray-200 dark:border-[#222] hover:border-gray-300 dark:hover:border-[#333] cursor-pointer"><Pencil size={12} /></button>
                                        <button onClick={() => onDelete('product', p.id ?? p._id ?? '')} className="p-1.5 bg-gray-50 dark:bg-black text-gray-500 dark:text-[#666] hover:text-red-600 dark:hover:text-red-500 rounded-md border border-gray-200 dark:border-[#222] hover:border-red-200 dark:hover:border-[#333] cursor-pointer"><Trash2 size={12} /></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>
        </div>
    );
}
