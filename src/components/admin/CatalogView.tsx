"use client";

import { useState } from 'react';
import { Plus, Pencil, Trash2, LayoutGrid, Image as ImageIcon, Loader2, ChevronUp, ChevronDown } from 'lucide-react';

interface CatalogViewProps {
    categories: any[];
    products: any[];
    refreshCategories: () => Promise<void>;
    refreshProducts: () => Promise<void>;
    onEditProduct: (p: any) => void;
    onEditCategory: (c: any) => void;
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
            <section className="space-y-5">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-sm font-bold text-white uppercase tracking-widest">Categorias</h3>
                        <p className="text-[10px] text-[#444] font-medium uppercase mt-1">Organização do Cardápio</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-[#111] p-4 rounded-xl border border-[#1a1a1a] items-end">
                    <div className="space-y-2 md:col-span-2">
                        <label className="text-[9px] font-bold text-[#333] uppercase ml-1 tracking-widest">Nome da Categoria</label>
                        <input
                            type="text"
                            className="w-full bg-[#0a0a0a] border border-[#222] rounded-lg px-4 py-2.5 text-xs outline-none focus:border-orange-500 text-white transition-all"
                            placeholder="Ex: Bebidas, Lanches..."
                            value={newCatName}
                            onChange={e => setNewCatName(e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[9px] font-bold text-[#333] uppercase ml-1 tracking-widest">Ícone / Foto</label>
                        <div className="flex gap-2">
                            <input type="file" accept="image/*" onChange={(e) => handleImageChange(e, 'cat')} className="hidden" id="new-cat-img" />
                            <label htmlFor="new-cat-img" className="flex-1 bg-[#0a0a0a] border border-[#222] rounded-lg px-4 py-2.5 text-[10px] font-bold text-[#555] cursor-pointer text-center hover:border-orange-500 transition-all flex items-center justify-center gap-2">
                                {newCatImage ? <span className="text-green-500">✓</span> : <ImageIcon size={14} />} 
                                {newCatImage ? "Alterar" : "Selecionar"}
                            </label>
                        </div>
                    </div>
                    <button 
                        onClick={handleAddCategory} 
                        disabled={isCreatingCat || !newCatName}
                        className="bg-orange-600 text-white px-6 py-2.5 rounded-lg hover:bg-orange-500 disabled:opacity-50 flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-widest transition-all h-[42px]"
                    >
                        {isCreatingCat ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />} Criar
                    </button>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                    {categories.map(cat => (
                        <div key={cat.id || cat._id} className="bg-[#111] border border-[#1a1a1a] rounded-xl p-4 flex flex-col gap-3 group hover:border-[#333] items-center justify-center text-center relative overflow-hidden transition-all">
                            <div className="w-12 h-12 bg-[#1a1a1a] rounded-lg flex items-center justify-center overflow-hidden border border-[#222] group-hover:border-orange-500/50 transition-all">
                                {cat.image ? (
                                    <img src={cat.image} className="w-full h-full object-cover" alt="" />
                                ) : (
                                    <LayoutGrid size={24} className="text-[#222] group-hover:text-orange-500 transition-colors" />
                                )}
                            </div>
                            <span className="text-[11px] font-bold text-[#888] group-hover:text-white transition-colors">{cat.name}</span>
                            
                            <div className="absolute top-2 left-2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-all translate-x-[-10px] group-hover:translate-x-0">
                                <button onClick={() => onReorderCategory(cat.id || cat._id, 'up')} className="p-1 px-1.5 bg-[#1a1a1a] text-[#444] hover:text-white rounded border border-[#222] hover:border-[#333]"><ChevronUp size={12} /></button>
                                <button onClick={() => onReorderCategory(cat.id || cat._id, 'down')} className="p-1 px-1.5 bg-[#1a1a1a] text-[#444] hover:text-white rounded border border-[#222] hover:border-[#333]"><ChevronDown size={12} /></button>
                            </div>

                            <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-all translate-x-[10px] group-hover:translate-x-0">
                                <button onClick={() => onEditCategory(cat)} className="p-1.5 bg-[#1a1a1a] text-[#444] hover:text-white rounded-lg border border-[#222] hover:border-[#333]"><Pencil size={12} /></button>
                                <button onClick={() => onDelete('category', cat.id || cat._id)} className="p-1.5 bg-[#1a1a1a] text-[#444] hover:text-red-500 rounded-lg border border-[#222] hover:border-[#333]"><Trash2 size={12} /></button>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Produtos Section */}
            <section className="space-y-5">
                <div>
                    <h3 className="text-sm font-bold text-white uppercase tracking-widest">Produtos</h3>
                    <p className="text-[10px] text-[#444] font-medium uppercase mt-1">Gestão de Itens Individuais</p>
                </div>

                <div className="bg-[#111] p-5 rounded-xl border border-[#1a1a1a] grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                    <div className="space-y-2">
                        <label className="text-[9px] font-bold text-[#333] uppercase ml-1 tracking-widest">Nome</label>
                        <input className="w-full bg-[#0a0a0a] border border-[#222] rounded-lg px-4 py-2 text-xs outline-none focus:border-orange-500 text-white" placeholder="Ex: X-Burger" value={newProd.name} onChange={e => setNewProd({...newProd, name: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[9px] font-bold text-[#333] uppercase ml-1 tracking-widest">Preço R$</label>
                        <input className="w-full bg-[#0a0a0a] border border-[#222] rounded-lg px-4 py-2 text-xs outline-none focus:border-orange-500 text-white" type="number" step="0.01" value={newProd.price} onChange={e => setNewProd({...newProd, price: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[9px] font-bold text-[#333] uppercase ml-1 tracking-widest">Categoria</label>
                        <select className="w-full bg-[#0a0a0a] border border-[#222] rounded-lg px-3 py-2 text-[11px] font-bold outline-none cursor-pointer text-white" value={newProd.categoryId} onChange={e => setNewProd({...newProd, categoryId: e.target.value})}>
                            <option value="">SELECIONAR...</option>
                            {categories.map(c => <option key={c.id || c._id} value={c.id || c._id}>{c.name.toUpperCase()}</option>)}
                        </select>
                    </div>
                    <div className="space-y-2">
                        <label className="text-[9px] font-bold text-[#333] uppercase ml-1 tracking-widest">Imagem</label>
                        <div className="flex gap-2">
                            <input type="file" accept="image/*" onChange={(e) => handleImageChange(e, 'prod')} className="hidden" id="new-prod-img" />
                            <label htmlFor="new-prod-img" className="flex-1 bg-[#0a0a0a] border border-[#222] rounded-lg px-4 py-2 text-[10px] font-bold text-[#555] cursor-pointer text-center truncate hover:border-orange-500 transition-all flex items-center justify-center gap-2">
                                {newProd.image ? <span className="text-green-500">✓</span> : <ImageIcon size={14} />}
                                {newProd.image ? "OK" : "FOTO"}
                            </label>
                        </div>
                    </div>
                    <button 
                        onClick={handleAddProduct} 
                        disabled={isCreatingProd || !newProd.name}
                        className="bg-orange-600 text-white px-4 py-2.5 rounded-lg hover:bg-orange-500 disabled:opacity-50 text-[10px] font-bold uppercase tracking-widest transition-all h-[40px]"
                    >
                        Criar Item
                    </button>
                </div>

                <div className="border border-[#1a1a1a] rounded-xl overflow-hidden bg-[#111] shadow-2xl">
                    <table className="w-full text-left text-[11px]">
                        <thead className="bg-[#0a0a0a] border-b border-[#1a1a1a] text-[#333] uppercase tracking-widest text-[8px] font-black">
                            <tr>
                                <th className="px-6 py-4">Produto</th>
                                <th className="px-6 py-4">Categoria</th>
                                <th className="px-6 py-4">Preço</th>
                                <th className="px-6 py-4 text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#1a1a1a]">
                            {products.map(p => (
                                <tr key={p.id || p._id} className="hover:bg-[#161616] group transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-4">
                                            <div className="w-9 h-9 rounded-lg bg-[#1a1a1a] border border-[#222] overflow-hidden flex items-center justify-center group-hover:border-orange-500/30 transition-all">
                                                {p.image ? <img src={p.image} className="w-full h-full object-cover" /> : <span className="text-[10px] font-black text-[#222] italic">{p.name.charAt(0)}</span>}
                                            </div>
                                            <span className="font-bold text-white text-xs">{p.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-[10px] font-black text-[#444] uppercase tracking-widest bg-[#0a0a0a] px-2 py-1 rounded-md border border-[#1a1a1a]">
                                            {categories.find(c => (c.id || c._id) === p.categoryId)?.name || 'AVULSO'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 font-black text-white tabular-nums italic text-sm">R$ {p.price.toFixed(2)}</td>
                                    <td className="px-6 py-4 text-right flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all translate-x-3 group-hover:translate-x-0">
                                        <button onClick={() => onEditProduct(p)} className="p-2 bg-[#1a1a1a] text-[#444] hover:text-white rounded-lg border border-[#222] hover:border-[#333]"><Pencil size={14} /></button>
                                        <button onClick={() => onDelete('product', p.id || p._id)} className="p-2 bg-[#1a1a1a] text-[#444] hover:text-red-500 rounded-lg border border-[#222] hover:border-[#333]"><Trash2 size={14} /></button>
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
