"use client";

import { useState, useEffect, useMemo } from 'react';
import {
    LayoutDashboard, Package, History, Settings, TrendingUp,
    ArrowUpRight, DollarSign, PackageOpen, Plus, Search,
    Trash2, Pencil, Save, X, ChevronRight, FileText,
    Users, Shield, LayoutGrid, Loader2, User, Fingerprint, Mail, Phone, MapPin,
    Printer, Ban, Eye, Receipt, ChevronLeft, ChevronUp, ChevronDown
} from 'lucide-react';

import CustomerModal from './CustomerModal';
import DebtModal from './DebtModal';
import { useGlobal } from '../context/GlobalContext';

interface AdminPanelProps {
    onClose: () => void;
}

export default function AdminPanel({ onClose }: AdminPanelProps) {
    const {
        sales, products, categories, employees, customers, config, isLoading,
        refreshSales, refreshProducts, refreshCategories, refreshEmployees, refreshCustomers, refreshConfig
    } = useGlobal();

    const [view, setView] = useState<'stats' | 'catalog' | 'inventory' | 'employees' | 'sales' | 'customers' | 'fiscal'>('stats');
    // const [sales, setSales] = useState<any[]>([]); // From global
    // const [categories, setCategories] = useState<any[]>([]); // From global
    // const [products, setProducts] = useState<any[]>([]); // From global
    // const [employees, setEmployees] = useState<any[]>([]); // From global
    // const [customers, setCustomers] = useState<any[]>([]); // From global
    // const [isLoading, setIsLoading] = useState(true); // From global
    const [isRegisteringCustomer, setIsRegisteringCustomer] = useState(false);
    const [selectedCustomerForDebt, setSelectedCustomerForDebt] = useState<any>(null);
    const [selectedSaleForDetails, setSelectedSaleForDetails] = useState<any>(null);

    const [newCatName, setNewCatName] = useState('');
    const [newCatImage, setNewCatImage] = useState('');
    const [editingProduct, setEditingProduct] = useState<any>(null);
    const [editingCategory, setEditingCategory] = useState<any>(null);
    const [newProd, setNewProd] = useState({ name: '', price: '', categoryId: '', stock: '', image: '', ncm: '', cfop: '' });
    const [newEmp, setNewEmp] = useState({ name: '', password: '', role: 'cashier' });
    // const [config, setConfig] = useState<any>(null); // From global
    const [isSavingConfig, setIsSavingConfig] = useState(false);



    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>, target: 'new' | 'edit' | 'newCat' | 'editCat') => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onloadend = () => {
            const base64 = reader.result as string;
            if (target === 'new') {
                setNewProd({ ...newProd, image: base64 });
            } else if (target === 'edit') {
                setEditingProduct({ ...editingProduct, image: base64 });
            } else if (target === 'newCat') {
                setNewCatImage(base64);
            } else if (target === 'editCat') {
                setEditingCategory({ ...editingCategory, image: base64 });
            }
        };
        reader.readAsDataURL(file);
    };

    const formatMethod = (method: string) => {
        const methodMap: Record<string, string> = {
            'money': 'Dinheiro',
            'cash': 'Dinheiro',
            'card': 'Cartão',
            'credit': 'Crédito',
            'debit': 'Débito',
            'pix': 'PIX',
            'fiado': 'Fiado'
        };
        return methodMap[method.toLowerCase()] || method;
    };

    // useEffect(() => {
    //     fetchAllData();
    // }, []); // Data is now fetched globally

    const totalRevenue = useMemo(() => sales.reduce((acc: number, sale: any) => acc + (sale.total || 0), 0), [sales]);

    const todaySales = useMemo(() =>
        sales.filter((s: any) => s.date && new Date(s.date).toDateString() === new Date().toDateString()),
        [sales]);

    const todayRevenue = useMemo(() => todaySales.reduce((acc: number, sale: any) => acc + (sale.total || 0), 0), [todaySales]);

    const handleAddCategory = async () => {
        if (!newCatName) return;
        try {
            await fetch('/api/catalog', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: 'category', data: { name: newCatName, image: newCatImage } })
            });
            setNewCatName('');
            setNewCatImage('');
            setNewCatName('');
            setNewCatImage('');
            refreshCategories();
        } catch (e) {
            alert("Erro ao adicionar categoria");
        }
    };

    const handleAddProduct = async () => {
        if (!newProd.name || !newProd.price || !newProd.categoryId) return;
        try {
            await fetch('/api/catalog', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: 'product',
                    data: {
                        ...newProd,
                        price: parseFloat(newProd.price),
                        stock: newProd.stock ? parseInt(newProd.stock) : null,
                        image: newProd.image || undefined
                    }
                })
            });
            setNewProd({ name: '', price: '', categoryId: '', stock: '', image: '', ncm: '', cfop: '' });
            setNewProd({ name: '', price: '', categoryId: '', stock: '', image: '', ncm: '', cfop: '' });
            refreshProducts();
        } catch (e) {
            alert("Erro ao adicionar produto");
        }
    };

    const handleUpdateProduct = async () => {
        if (!editingProduct) return;
        try {
            await fetch('/api/catalog', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: 'product',
                    id: editingProduct.id || editingProduct._id,
                    data: {
                        name: editingProduct.name,
                        price: parseFloat(editingProduct.price),
                        categoryId: editingProduct.categoryId,
                        stock: editingProduct.stock ? parseInt(editingProduct.stock) : null,
                        image: editingProduct.image,
                        ncm: editingProduct.ncm,
                        cfop: editingProduct.cfop
                    }
                })
            });
            setEditingProduct(null);
            setEditingProduct(null);
            setEditingProduct(null);
            refreshProducts();
        } catch (e) {
            alert("Erro ao atualizar produto");
        }
    };

    const handleAddEmployee = async () => {
        if (!newEmp.name || !newEmp.password) return;
        try {
            await fetch('/api/employees', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'add', data: newEmp })
            });
            setNewEmp({ name: '', password: '', role: 'cashier' });
            setNewEmp({ name: '', password: '', role: 'cashier' });
            setEditingCategory(null);
            refreshEmployees();
        } catch (e) {
            alert("Erro ao adicionar funcionário");
        }
    };

    const handleSaveFiscalConfig = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSavingConfig(true);
        try {
            const form = e.target as HTMLFormElement;
            const formData = new FormData(form);
            const fiscal = Object.fromEntries(formData.entries());

            await fetch('/api/config', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ fiscal })
            });
            alert("Configuração fiscal salva com sucesso!");
            setNewEmp({ name: '', password: '', role: 'cashier' });
            setNewEmp({ name: '', password: '', role: 'cashier' });
            refreshEmployees();
        } catch (e) {
            alert("Erro ao salvar configuração fiscal");
        } finally {
            setIsSavingConfig(false);
        }
    };

    const handleDelete = async (type: 'category' | 'product', id: string) => {
        if (!id) return;
        if (!confirm('Excluir permanentemente?')) return;
        try {
            const res = await fetch(`/api/catalog?type=${type}&id=${id}`, { method: 'DELETE' });
            if (res.ok) {
                if (type === 'product') refreshProducts();
                else refreshCategories();
            }
        } catch (e) {
            alert("Erro ao excluir cliente");
        }
    };

    const handleDeleteEmployee = async (id: string) => {
        if (!id) return;
        if (!confirm('Remover funcionário?')) return;
        try {
            const res = await fetch(`/api/customers?id=${id}`, { method: 'DELETE' });
            if (res.ok) refreshCustomers();
        } catch (e) {
            alert("Erro ao excluir funcionário");
        }
    };

    const handleReprintNFCe = (sale: any) => {
        const printerPayload = {
            type: 'fiscal',
            items: sale.items,
            total: sale.total,
            subtotal: sale.subtotal || sale.total,
            discount: sale.discount || 0,
            payments: sale.payments,
            customer: sale.customer,
            paidAmount: sale.paidAmount,
            date: sale.date,
            qrcode_url: sale.qrcode_url,
            nfeQRCode: sale.nfeQRCode,
            nfeNumber: sale.nfeNumber,
            nfeSeries: sale.nfeSeries,
            fiscalReference: sale.fiscalReference,
            nfeId: sale.nfeId,
            nfeExternalUrl: sale.nfeExternalUrl,
            nfeMessage: sale.nfeMessage,
            fiscalData: sale.fiscalData
        };

        fetch('http://localhost:7777/print', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(printerPayload)
        })
            .then(() => alert('Reimpressão enviada com sucesso!'))
            .catch(() => alert('Erro: Impressora offline'));
    };

    const handleCancelSale = async (sale: any) => {
        let justificativa = '';
        if (sale.isFiscal && sale.nfeStatus === 'issued') {
            justificativa = prompt('Justificativa para o cancelamento na SEFAZ (mínimo 15 caracteres):') || '';
            if (!justificativa || justificativa.length < 15) {
                if (justificativa) alert('A justificativa fiscal deve ter no mínimo 15 caracteres.');
                return;
            }
        }

        if (!confirm('Tem certeza que deseja cancelar esta venda? O estoque será devolvido e débitos/pontos serão revertidos.')) return;

        try {
            const res = await fetch(`/api/sales/${sale._id || sale.id}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ justificativa })
            });

            if (res.ok) {
                alert('Venda cancelada com sucesso!');
                refreshSales();
                refreshProducts();
                refreshCustomers();
            } else {
                const data = await res.json();
                alert(`Erro ao cancelar: ${data.error}`);
            }
        } catch (e) {
            alert('Erro de conexão ao cancelar venda');
        }
    };

    const handleViewNFCeDetails = async (sale: any) => {
        try {
            const res = await fetch(`/api/sales/${sale._id || sale.id}?completa=1`);
            if (res.ok) {
                const fullData = await res.json();
                setSelectedSaleForDetails(fullData);
            } else {
                alert('Erro ao buscar dados completos da nota.');
            }
        } catch (e) {
            alert('Erro de conexão ao buscar dados da nota.');
        }
    };

    const handleReorderCategory = async (categoryId: string, direction: 'up' | 'down') => {
        try {
            const res = await fetch('/api/catalog', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: 'category',
                    id: categoryId,
                    action: 'reorder',
                    data: { direction }
                })
            });

            if (res.ok) {
                await refreshCategories(); // Refresh categories
            } else {
                const error = await res.json();
                if (error.error !== 'Cannot move further') {
                    alert('Erro ao reordenar categoria');
                }
            }
        } catch (e) {
            alert('Erro ao reordenar categoria');
        }
    };

    const renderInputRaw = (name: string, label: string, defaultValue: string, placeholder: string = "", colSpan: string = "col-span-1") => (
        <div className={`space-y-1 ${colSpan}`}>
            <label className="text-xs text-gray-600 ml-1">{label}</label>
            <input
                name={name}
                defaultValue={defaultValue}
                placeholder={placeholder}
                className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-blue-500 text-gray-700"
            />
        </div>
    );

    return (
        <div className="absolute inset-0 bg-background z-[100] flex flex-col text-sm">
            <header className="px-6 py-4 border-b border-border flex items-center justify-between bg-card shrink-0">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-secondary rounded-xl flex items-center justify-center text-secondary-foreground shadow-lg">
                        <Settings size={20} />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-card-foreground">Painel Admin</h2>
                        <p className="text-sm text-muted-foreground">Gestão Comercial</p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <button onClick={onClose} className="p-2 hover:bg-muted rounded-xl text-muted-foreground hover:text-destructive transition-colors">
                        <X size={20} />
                    </button>
                </div>
            </header>

            <div className="flex flex-1 overflow-hidden">
                <nav className="w-56 border-r border-border p-4 flex flex-col gap-2 bg-card">
                    {[
                        { id: 'stats', label: 'Início', icon: <LayoutDashboard size={18} /> },
                        { id: 'catalog', label: 'Cardápio', icon: <LayoutGrid size={18} /> },
                        { id: 'inventory', label: 'Estoque', icon: <Package size={18} /> },
                        { id: 'customers', label: 'Clientes', icon: <Users size={18} /> },
                        { id: 'employees', label: 'Equipe', icon: <Shield size={18} /> },
                        { id: 'fiscal', label: 'Fiscal', icon: <FileText size={18} /> },
                        { id: 'sales', label: 'Vendas', icon: <History size={18} /> },
                    ].map(item => (
                        <button
                            key={item.id}
                            onClick={() => setView(item.id as any)}
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${view === item.id ? 'bg-secondary/10 text-secondary' : 'text-muted-foreground hover:bg-muted hover:text-card-foreground'}`}
                        >
                            {item.icon}
                            {item.label}
                        </button>
                    ))}
                    <div className="mt-auto p-4 bg-muted rounded-xl border border-border">
                        <p className="text-xs text-muted-foreground mb-0.5">v2.5.0</p>
                        <p className="text-sm font-medium text-card-foreground">Conserva POS</p>
                    </div>
                </nav>

                <main className="flex-1 overflow-y-auto p-8 bg-background relative">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-4">
                            <div className="w-12 h-12 border-4 border-secondary/20 border-t-secondary rounded-full animate-spin" />
                            <p className="text-sm text-muted-foreground">Carregando dados...</p>
                        </div>
                    ) : (
                        <div className="max-w-7xl mx-auto space-y-8 pb-20">
                            {view === 'stats' && (
                                <div className="space-y-8">
                                    <div>
                                        <h3 className="text-xl font-bold text-foreground">Visão Geral</h3>
                                        <p className="text-sm text-muted-foreground">Resumo das vendas e produtos ativos</p>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                        <div className="bg-card rounded-2xl p-6 border border-border shadow-sm hover:shadow-md transition-all">
                                            <div className="flex items-center justify-between mb-5">
                                                <span className="text-sm font-bold text-secondary uppercase">Vendas</span>
                                                <div className="w-12 h-12 bg-secondary text-secondary-foreground rounded-xl flex items-center justify-center shadow-lg">
                                                    <TrendingUp size={24} />
                                                </div>
                                            </div>
                                            <div className="text-4xl font-black text-card-foreground tabular-nums">{sales.length}</div>
                                            <p className="text-sm text-muted-foreground mt-2">Total de Vendas</p>
                                        </div>
                                        <div className="bg-card rounded-2xl p-6 border border-success/20 shadow-sm hover:shadow-md transition-all">
                                            <div className="flex items-center justify-between mb-5">
                                                <span className="text-sm font-bold text-success uppercase">Receita Hoje</span>
                                                <div className="w-12 h-12 bg-success text-success-foreground rounded-xl flex items-center justify-center shadow-lg">
                                                    <DollarSign size={24} />
                                                </div>
                                            </div>
                                            <div className="text-4xl font-black text-card-foreground tabular-nums">R$ {todayRevenue.toFixed(2)}</div>
                                            <p className="text-sm text-muted-foreground mt-2">Vendas do dia</p>
                                        </div>
                                        <div className="bg-card rounded-2xl p-6 border border-primary/20 shadow-sm hover:shadow-md transition-all">
                                            <div className="flex items-center justify-between mb-5">
                                                <span className="text-sm font-bold text-primary uppercase">Clientes</span>
                                                <div className="w-12 h-12 bg-primary text-primary-foreground rounded-xl flex items-center justify-center shadow-lg">
                                                    <Users size={24} />
                                                </div>
                                            </div>
                                            <div className="text-4xl font-black text-card-foreground tabular-nums">{customers.length}</div>
                                            <p className="text-sm text-muted-foreground mt-2">Clientes cadastrados</p>
                                        </div>
                                    </div>
                                    <div className="bg-card rounded-2xl border border-border p-8 shadow-sm">
                                        <div className="flex items-center justify-between mb-8">
                                            <h3 className="text-lg font-bold text-card-foreground">Desempenho Semanal</h3>
                                            <div className="flex gap-2 px-4 py-2 bg-muted rounded-xl">
                                                <div className="flex items-center gap-2">
                                                    <div className="h-2 w-2 rounded-full bg-secondary" />
                                                    <span className="text-xs font-bold text-muted-foreground uppercase">Receita (R$)</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="h-40 flex items-end gap-2 px-2">
                                            {useMemo(() => {
                                                const last7Days = Array.from({ length: 7 }).map((_, i) => {
                                                    const date = new Date();
                                                    date.setDate(date.getDate() - (6 - i));
                                                    return date.toDateString();
                                                });

                                                const dailyData = last7Days.map(dateStr => {
                                                    const dayRevenue = sales
                                                        .filter((s: any) => s.date && new Date(s.date).toDateString() === dateStr)
                                                        .reduce((sum: number, s: any) => sum + (s.total || 0), 0);
                                                    return { date: dateStr, amount: dayRevenue };
                                                });

                                                const maxAmount = Math.max(...dailyData.map(d => d.amount), 1);

                                                return dailyData.map((d, i) => (
                                                    <div key={`chart-bar-${i}`} className="flex-1 flex flex-col items-center gap-3 group">
                                                        <div className="w-full bg-secondary/10 rounded-xl group-hover:bg-secondary/20 transition-all cursor-help relative h-full flex items-end">
                                                            <div
                                                                className="w-full bg-secondary rounded-xl transition-all duration-500"
                                                                style={{ height: `${(d.amount / maxAmount) * 100}%`, minHeight: '4px' }}
                                                            />
                                                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 px-3 py-1.5 bg-foreground text-background text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 font-bold shadow-xl">
                                                                R$ {d.amount.toFixed(2)}
                                                            </div>
                                                        </div>
                                                        <span className="text-xs font-bold text-muted-foreground uppercase">{new Date(d.date).toLocaleDateString('pt-BR', { weekday: 'short' })}</span>
                                                    </div>
                                                ));
                                            }, [sales])}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {view === 'catalog' && (
                                <div className="space-y-10 animate-in fade-in">
                                    <section>
                                        <div className="flex flex-col gap-6 mb-8">
                                            <div className="flex items-center justify-between">
                                                <div className="space-y-1">
                                                    <h3 className="text-lg font-semibold text-gray-800">Categorias</h3>
                                                    <p className="text-sm text-gray-500">Organize seu cardápio em seções</p>
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-gray-50 p-3 rounded-2xl border border-gray-100 shadow-sm items-end">
                                                <div className="space-y-1 md:col-span-2">
                                                    <label className="text-xs text-gray-600 ml-1">Nome da Categoria</label>
                                                    <input
                                                        type="text"
                                                        className="w-full bg-white border border-gray-100 rounded-xl px-4 py-2.5 text-xs outline-none focus:border-blue-500 transition-all text-gray-700"
                                                        placeholder="Ex: Bebidas, Sobremesas..."
                                                        value={newCatName}
                                                        onChange={e => setNewCatName(e.target.value)}
                                                    />
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="text-xs text-gray-600 ml-1">Capa (PNG/JPG)</label>
                                                    <div className="flex gap-2">
                                                        <input type="file" accept="image/*" onChange={(e) => handleImageChange(e, 'newCat')} className="hidden" id="new-cat-img" />
                                                        <label htmlFor="new-cat-img" className="flex-1 bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-500 cursor-pointer text-center hover:border-blue-500">
                                                            {newCatImage ? "✓ " : ""}Selecionar
                                                        </label>
                                                    </div>
                                                </div>
                                                <button onClick={handleAddCategory} className="bg-blue-600 text-white px-5 py-2.5 rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2 text-sm font-medium"><Plus size={16} /> Criar</button>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                                            {categories.map(cat => (
                                                <div key={cat.id || cat._id} className="bg-white border border-gray-100 rounded-[20px] p-4 flex flex-col gap-4 shadow-sm group hover:border-blue-600 transition-all hover:shadow-lg hover:shadow-blue-500/5 items-center justify-center text-center relative overflow-hidden">
                                                    <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center overflow-hidden shadow-inner group-hover:scale-110 transition-transform">
                                                        {cat.image ? (
                                                            <img src={cat.image} className="w-full h-full object-cover" alt="" />
                                                        ) : (
                                                            <LayoutGrid size={24} className="text-gray-200" />
                                                        )}
                                                    </div>
                                                    <span className="text-sm text-gray-700">{cat.name}</span>
                                                    <div className="absolute top-2 left-2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-all">
                                                        <button
                                                            onClick={() => handleReorderCategory(cat.id || cat._id, 'up')}
                                                            className="p-1 bg-white text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded shadow-sm border-none cursor-pointer"
                                                            title="Mover para cima"
                                                        >
                                                            <ChevronUp size={14} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleReorderCategory(cat.id || cat._id, 'down')}
                                                            className="p-1 bg-white text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded shadow-sm border-none cursor-pointer"
                                                            title="Mover para baixo"
                                                        >
                                                            <ChevronDown size={14} />
                                                        </button>
                                                    </div>
                                                    <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                                                        <button onClick={() => setEditingCategory({ ...cat })} className="p-1.5 bg-gray-50 text-gray-300 hover:text-blue-600 hover:bg-white hover:shadow-sm rounded-lg transition-all border-none cursor-pointer"><Pencil size={12} /></button>
                                                        <button onClick={() => handleDelete('category', cat.id || cat._id)} className="p-1.5 bg-gray-50 text-gray-200 hover:text-red-500 hover:bg-white hover:shadow-sm rounded-lg transition-all border-none cursor-pointer"><Trash2 size={12} /></button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </section>

                                    <section className="space-y-6">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <h3 className="text-lg font-semibold text-gray-800">Itens do Cardápio</h3>
                                                <p className="text-sm text-gray-500">produtos à venda</p>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-6 gap-3 bg-gray-50 p-4 rounded-3xl border border-gray-100 shadow-sm items-end">
                                                <div className="space-y-1">
                                                    <label className="text-[9px] font-bold text-gray-400 uppercase ml-1">Nome</label>
                                                    <input className="w-full bg-white border border-gray-100 rounded-xl px-4 py-3 text-xs font-bold outline-none focus:border-blue-500" placeholder="Ex: Batata Frita" value={newProd.name} onChange={e => setNewProd({ ...newProd, name: e.target.value })} />
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="text-[9px] font-bold text-gray-400 uppercase ml-1">Preço (R$)</label>
                                                    <input className="w-full bg-white border border-gray-100 rounded-xl px-4 py-3 text-xs font-bold outline-none focus:border-blue-500" type="number" step="0.01" placeholder="0,00" value={newProd.price} onChange={e => setNewProd({ ...newProd, price: e.target.value })} />
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="text-[9px] font-bold text-gray-400 uppercase ml-1">Categoria</label>
                                                    <select className="w-full bg-white border border-gray-100 rounded-xl px-4 py-3 text-[10px] font-bold outline-none cursor-pointer" value={newProd.categoryId} onChange={e => setNewProd({ ...newProd, categoryId: e.target.value })}>
                                                        <option value="">Selecionar...</option>
                                                        {categories.map(c => <option key={c.id || c._id} value={c.id || c._id}>{c.name}</option>)}
                                                    </select>
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="text-[9px] font-bold text-gray-400 uppercase ml-1">Imagem</label>
                                                    <div className="flex gap-2">
                                                        <input type="file" accept="image/*" onChange={(e) => handleImageChange(e, 'new')} className="hidden" id="new-prod-img" />
                                                        <label htmlFor="new-prod-img" className="flex-1 bg-white border border-gray-100 rounded-xl px-4 py-3 text-[10px] font-bold text-gray-400 cursor-pointer text-center truncate hover:border-blue-500 transition-all overflow-hidden whitespace-nowrap">
                                                            {newProd.image ? "✓ Alterar" : "Selecionar"}
                                                        </label>
                                                    </div>
                                                </div>
                                                <div className="flex gap-2 h-[46px]">
                                                    <button onClick={handleAddProduct} className="flex-1 bg-gray-900 text-white font-black text-[9px] uppercase tracking-widest px-4 py-3 rounded-xl hover:bg-black transition-all border-none cursor-pointer shadow-lg shadow-gray-200">Criar</button>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="border border-gray-100 rounded-2xl overflow-hidden shadow-sm bg-white">
                                            <table className="w-full text-left text-[10px]">
                                                <thead className="bg-gray-50/50 border-b border-gray-100 text-gray-400 font-bold uppercase tracking-wider text-[8px]">
                                                    <tr>
                                                        <th className="px-6 py-4">Produto</th>
                                                        <th className="px-6 py-4">Categoria</th>
                                                        <th className="px-6 py-4">Preço</th>
                                                        <th className="px-6 py-4">Fiscal</th>
                                                        <th className="px-6 py-4 text-right">Ações</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-50">
                                                    {products.map(p => (
                                                        <tr key={p.id || p._id} className="hover:bg-gray-50/20 transition-colors group">
                                                            <td className="px-8 py-5">
                                                                <div className="flex items-center gap-4">
                                                                    <div className="w-8 h-8 rounded-lg bg-gray-50 text-gray-300 flex items-center justify-center font-black group-hover:bg-blue-50 group-hover:text-blue-600 transition-all">{p.name?.charAt(0)}</div>
                                                                    <span className="font-bold text-gray-800 uppercase tracking-tight">{p.name}</span>
                                                                </div>
                                                            </td>
                                                            <td className="px-8 py-5 text-gray-400 font-bold uppercase text-[9px] tracking-widest">{categories.find(c => (c.id || c._id) === p.categoryId)?.name || 'Sem cat.'}</td>
                                                            <td className="px-8 py-5 font-black text-blue-600 tabular-nums">R$ {p.price.toFixed(2)}</td>
                                                            <td className="px-8 py-5">
                                                                <div className="flex items-center gap-2">
                                                                    <div className="bg-gray-50 border border-gray-100 px-3 py-1 rounded-lg">
                                                                        <span className="text-[8px] font-black text-gray-400 uppercase tracking-tighter">NCM: {p.ncm || '21069090'}</span>
                                                                    </div>
                                                                    <div className="bg-gray-50 border border-gray-100 px-3 py-1 rounded-lg">
                                                                        <span className="text-[8px] font-black text-gray-400 uppercase tracking-tighter">CFOP: {p.cfop || '5102'}</span>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td className="px-8 py-5 text-right flex items-center justify-end gap-2 text-sans">
                                                                <button onClick={() => setEditingProduct({
                                                                    ...p,
                                                                    price: p.price.toString(),
                                                                    stock: p.stock?.toString() || '',
                                                                    ncm: p.ncm || '21069090',
                                                                    cfop: p.cfop || '5102'
                                                                })} className="p-2.5 bg-gray-50 text-gray-300 hover:text-blue-600 hover:bg-white hover:shadow-sm rounded-xl transition-all border-none cursor-pointer"><Pencil size={14} /></button>
                                                                <button onClick={() => handleDelete('product', p.id || p._id)} className="p-2.5 bg-gray-50 text-gray-200 hover:text-red-500 hover:bg-white hover:shadow-sm rounded-xl transition-all border-none cursor-pointer"><Trash2 size={16} /></button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </section>
                                </div>
                            )}

                            {view === 'inventory' && (
                                <div className="space-y-8 animate-in fade-in">
                                    <div className="flex flex-col gap-1">
                                        <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.3em]">Gestão de Estoques</h3>
                                        <p className="text-[9px] text-gray-400 font-bold uppercase italic">Acompanhamento em tempo real das unidades disponíveis</p>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                        {products.map(p => (
                                            <div key={`inv-p-${p.id || p._id}`} className="bg-white border border-gray-100 p-6 rounded-[28px] shadow-sm flex flex-col gap-6 hover:shadow-xl hover:border-blue-500 transition-all group">
                                                <div className="flex justify-between items-start">
                                                    <div className="w-10 h-10 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-300 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-inner"><Package size={20} /></div>
                                                    <div className="flex gap-2">
                                                        {p.stock !== null && (
                                                            <button onClick={() => {
                                                                if (confirm(`Marcar "${p.name}" como estoque livre?`)) {
                                                                    fetch('/api/catalog', {
                                                                        method: 'PUT',
                                                                        headers: { 'Content-Type': 'application/json' },
                                                                        body: JSON.stringify({ type: 'product', id: p.id || p._id, data: { stock: null } })
                                                                    }).then(() => refreshProducts());
                                                                }
                                                            }} className="p-2 bg-gray-50 rounded-lg text-gray-300 hover:text-green-600 transition-all border-none cursor-pointer text-[9px] font-bold" title="Marcar como Livre">LIVRE</button>
                                                        )}
                                                        <button onClick={() => {
                                                            const newVal = prompt('Ajuste de Estoque:', p.stock?.toString() || '');
                                                            if (newVal !== null) {
                                                                fetch('/api/catalog', {
                                                                    method: 'PUT',
                                                                    headers: { 'Content-Type': 'application/json' },
                                                                    body: JSON.stringify({ type: 'product', id: p.id || p._id, data: { stock: newVal === '' ? null : parseInt(newVal) } })
                                                                }).then(() => refreshProducts());
                                                            }
                                                        }} className="p-2 bg-gray-50 rounded-lg text-gray-300 hover:text-blue-600 transition-all border-none cursor-pointer"><Pencil size={12} /></button>
                                                    </div>
                                                </div>
                                                <div>
                                                    <h4 className="text-[10px] font-black text-gray-800 uppercase tracking-widest mb-2 truncate">{p.name}</h4>
                                                    <div className="flex items-center gap-2">
                                                        <span className={`text-[9px] font-black uppercase px-3 py-1 rounded-full ${p.stock === null ? 'bg-gray-100 text-gray-400' : p.stock < 10 ? 'bg-red-50 text-red-600 animate-pulse' : 'bg-green-50 text-green-600'}`}>
                                                            {p.stock === null ? 'Livre' : `${p.stock} UN`}
                                                        </span>
                                                        <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                                            <div className={`h-full transition-all ${p.stock === null ? 'w-full bg-gray-300' : p.stock < 10 ? 'bg-red-500' : 'bg-green-500'}`} style={{ width: p.stock === null ? '100%' : `${Math.min(100, (p.stock / 100) * 100)}%` }} />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {view === 'customers' && (
                                <div className="space-y-8 animate-in fade-in">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.3em]">Gestão de Clientes</h3>
                                            <p className="text-[9px] text-gray-400 font-bold uppercase italic">CRM Integrado e Controle de Débitos</p>
                                        </div>
                                        <button
                                            onClick={() => setIsRegisteringCustomer(true)}
                                            className="bg-blue-600 text-white font-black text-[9px] uppercase tracking-[0.2em] px-10 py-3.5 rounded-2xl hover:bg-blue-700 transition-all shadow-xl shadow-blue-100 border-none flex items-center gap-3 cursor-pointer"
                                        >
                                            <Plus size={16} /> Novo Cliente
                                        </button>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {customers.map(c => (
                                            <div key={c.id || c._id} className="bg-white border border-gray-100 p-8 rounded-[40px] flex flex-col gap-6 shadow-sm hover:shadow-2xl hover:scale-[1.01] transition-all">
                                                <div className="flex justify-between items-start">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-14 h-14 bg-gray-50 text-gray-300 rounded-[20px] flex items-center justify-center shadow-inner border border-gray-100/50"><User size={28} /></div>
                                                        <div>
                                                            <p className="text-sm font-black text-gray-800 uppercase tracking-tight line-clamp-1">{c.name}</p>
                                                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-1">{c.phone || c.cpf || 'Sem contato'}</p>
                                                        </div>
                                                    </div>
                                                    <div className="bg-green-50 px-3 py-1.5 rounded-xl text-green-600 font-black text-[9px] uppercase tracking-widest shadow-sm border border-green-100">
                                                        {c.loyaltyPoints || 0} Pts
                                                    </div>
                                                </div>

                                                <div className="pt-6 border-t border-gray-50 flex items-center justify-between">
                                                    <div>
                                                        <p className="text-[8px] font-black text-gray-300 uppercase tracking-widest mb-1">Saldo Devedor</p>
                                                        <p className={`text-xl font-black tabular-nums tracking-tighter ${c.debtBalance > 0 ? 'text-red-600' : 'text-gray-900'}`}>R$ {(c.debtBalance || 0).toFixed(2)}</p>
                                                    </div>
                                                    <button
                                                        onClick={() => setSelectedCustomerForDebt(c)}
                                                        className={`text-[9px] font-black px-6 py-3 rounded-xl uppercase tracking-widest transition-all border-none cursor-pointer shadow-md ${c.debtBalance > 0 ? 'bg-red-600 text-white hover:bg-red-700 shadow-red-100' : 'bg-gray-900 text-white hover:bg-black shadow-gray-200'}`}
                                                    >
                                                        {c.debtBalance > 0 ? 'Extrato/Pagar' : 'Novo Fiado'}
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {view === 'employees' && (
                                <div className="space-y-8 animate-in fade-in">
                                    <div className="bg-gray-50 rounded-[40px] p-10 border border-gray-100 shadow-sm relative overflow-hidden">
                                        <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none text-gray-900"><Shield size={200} /></div>
                                        <h3 className="text-sm font-black text-gray-800 uppercase tracking-[0.3em] mb-10 relative z-10">Controle de Privilégios</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 relative z-10">
                                            <input className="bg-white border border-gray-100 rounded-2xl px-6 py-4 text-xs font-bold outline-none focus:border-blue-500 transition-all font-sans" value={newEmp.name} onChange={e => setNewEmp({ ...newEmp, name: e.target.value })} placeholder="Nome do usuário..." />
                                            <input className="bg-white border border-gray-100 rounded-2xl px-6 py-4 text-xs font-bold outline-none focus:border-blue-500 transition-all font-sans" type="password" value={newEmp.password} onChange={e => setNewEmp({ ...newEmp, password: e.target.value })} placeholder="Código PIN" />
                                            <select className="bg-white border border-gray-100 rounded-2xl px-6 py-4 text-[11px] font-bold outline-none cursor-pointer font-sans" value={newEmp.role} onChange={e => setNewEmp({ ...newEmp, role: (e.target.value as any) })}>
                                                <option value="cashier">Operador PDV</option>
                                                <option value="admin">Administrador Geral</option>
                                            </select>
                                            <button onClick={handleAddEmployee} className="bg-blue-600 text-white font-black text-[10px] uppercase tracking-[0.2em] rounded-2xl py-4 hover:bg-blue-700 transition-all shadow-xl shadow-blue-100 border-none cursor-pointer">Criar Credencial</button>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        {employees.map(emp => (
                                            <div key={emp.id || emp._id} className="bg-white border border-gray-100 p-8 rounded-[32px] flex items-center justify-between shadow-sm hover:shadow-xl transition-all">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 bg-gray-50 text-gray-400 rounded-2xl border border-gray-100 flex items-center justify-center shadow-inner"><Fingerprint size={24} /></div>
                                                    <div>
                                                        <p className="text-sm font-black text-gray-800 uppercase tracking-tight">{emp.name}</p>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <div className={`w-2 h-2 rounded-full ${emp.role === 'admin' ? 'bg-blue-600' : 'bg-gray-400'}`} />
                                                            <p className={`text-[9px] font-black uppercase tracking-widest ${emp.role === 'admin' ? 'text-blue-600' : 'text-gray-400'}`}>{emp.role === 'admin' ? 'Full Access' : 'Restrito'}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                                {emp.role !== 'admin' && (
                                                    <button onClick={() => handleDeleteEmployee(emp.id || emp._id)} className="p-3 bg-red-50 text-red-400 hover:bg-red-500 hover:text-white transition-all rounded-xl border-none cursor-pointer"><Trash2 size={18} /></button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {view === 'fiscal' && (
                                <div className="space-y-12 animate-in fade-in max-w-5xl mx-auto">
                                    <div className="flex items-center justify-between">
                                        <div className="flex flex-col gap-1">
                                            <h2 className="text-xl font-bold text-gray-800 tracking-tight">Painel de Monitoramento Fiscal</h2>
                                            <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider flex items-center gap-2">
                                                <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                                                Integrado com SEFAZ via FocusNFe
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="px-5 py-2.5 bg-gray-50 border border-gray-100 rounded-2xl flex items-center gap-3">
                                                <div className={`w-2 h-2 rounded-full ${process.env.NEXT_PUBLIC_FOCUS_URL ? 'bg-green-500' : 'bg-red-500'}`} />
                                                <span className="text-[10px] font-bold text-gray-700 uppercase tracking-wide">Status da API</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-6">
                                        <div className="flex items-center justify-between">
                                            <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-2">Monitoramento de Cupons</h3>
                                            <div className="h-0.5 flex-1 mx-6 bg-gray-50 rounded-full" />
                                        </div>
                                        <div className="border border-gray-100 rounded-[40px] overflow-hidden shadow-sm bg-white">
                                            <table className="w-full text-left text-[11px]">
                                                <thead className="bg-gray-50/70 border-b border-gray-100 text-gray-400 font-bold uppercase text-[8px] tracking-wider">
                                                    <tr>
                                                        <th className="px-10 py-6">Venda / Cupom</th>
                                                        <th className="px-10 py-6">Situação SEFAZ</th>
                                                        <th className="px-10 py-6 text-right">Governança</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-50/50">
                                                    {sales.filter(s => s.isFiscal).slice(0, 15).map(s => (
                                                        <tr key={`fiscal-${s.id || s._id}`} className="hover:bg-gray-50/40 transition-colors group">
                                                            <td className="px-10 py-6">
                                                                <div className="flex flex-col gap-1">
                                                                    <p className="font-bold text-gray-800 uppercase tracking-tight text-sm">NFC-e #{s.nfeNumber || "---"}</p>
                                                                    <p className="text-[8px] text-gray-400 font-bold uppercase tracking-widest">{new Date(s.date).toLocaleString('pt-BR')}</p>
                                                                </div>
                                                            </td>
                                                            <td className="px-10 py-6">
                                                                <div className={`px-4 py-1.5 rounded-full inline-flex items-center gap-2 border shadow-sm ${s.nfeStatus === 'issued' ? 'bg-green-50 border-green-100 text-green-600' : s.nfeStatus === 'cancelled' ? 'bg-gray-50 border-gray-100 text-gray-400' : 'bg-red-50 border-red-100 text-red-600'}`}>
                                                                    <div className={`w-1.5 h-1.5 rounded-full ${s.nfeStatus === 'issued' ? 'bg-green-600' : s.nfeStatus === 'cancelled' ? 'bg-gray-400' : 'bg-red-600'}`} />
                                                                    <span className="text-[9px] font-bold uppercase tracking-wider">{s.nfeStatus === 'issued' ? 'Autorizada' : s.nfeStatus === 'cancelled' ? 'Cancelada' : 'Erro / Falha'}</span>
                                                                </div>
                                                            </td>
                                                            <td className="px-10 py-6">
                                                                <div className="flex items-center justify-end gap-2.5">
                                                                    <button onClick={() => handleViewNFCeDetails(s)} className="p-3 bg-gray-50 text-gray-400 hover:text-blue-600 hover:bg-white hover:shadow-xl rounded-[18px] transition-all border-none cursor-pointer" title="Ver SEFAZ">
                                                                        <Eye size={18} />
                                                                    </button>
                                                                    {s.nfeStatus === 'issued' && (
                                                                        <>
                                                                            <button onClick={() => handleReprintNFCe(s)} className="p-3 bg-gray-50 text-gray-400 hover:text-green-600 hover:bg-white hover:shadow-xl rounded-[18px] transition-all border-none cursor-pointer" title="Reprimir">
                                                                                <Printer size={18} />
                                                                            </button>
                                                                            <button onClick={() => handleCancelSale(s)} className="p-3 bg-gray-50 text-gray-400 hover:text-red-500 hover:bg-white hover:shadow-xl rounded-[18px] transition-all border-none cursor-pointer" title="Cancelar Venda">
                                                                                <Ban size={18} />
                                                                            </button>
                                                                        </>
                                                                    )}
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {view === 'sales' && (
                                <div className="space-y-6 animate-in fade-in">
                                    <h3 className="text-[11px] font-black text-gray-800 uppercase tracking-[0.3em] ml-2">Histórico Cronológico</h3>
                                    <div className="border border-gray-100 rounded-[40px] overflow-hidden shadow-sm bg-white">
                                        <table className="w-full text-left text-[11px]">
                                            <thead className="bg-gray-50 border-b border-gray-100 text-gray-400 font-black tracking-[0.2em] uppercase text-[8px]">
                                                <tr>
                                                    <th className="px-10 py-6">Data / Protocolo</th>
                                                    <th className="px-10 py-6">Beneficiário / Origem</th>
                                                    <th className="px-10 py-6 text-right">Montante</th>
                                                    <th className="px-10 py-6 text-right">Ações</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-50 font-medium">
                                                {sales.map(s => (
                                                    <tr key={s.id || s._id} className="hover:bg-gray-50/20 transition-colors group">
                                                        <td className="px-10 py-6 text-left">
                                                            <p className="font-black text-gray-800 text-sm tracking-tighter tabular-nums">{s.date ? new Date(s.date).toLocaleDateString() : '---'}</p>
                                                            <p className="text-[8px] text-gray-400 font-black uppercase tracking-widest mt-0.5">{s.date ? new Date(s.date).toLocaleTimeString() : '---'}</p>
                                                        </td>
                                                        <td className="px-10 py-6 text-left">
                                                            <div className="flex items-center gap-3">
                                                                <p className="font-bold text-gray-700 uppercase tracking-tight line-clamp-1">{s.customer?.name || s.customerName || 'Consumidor Final'}</p>
                                                                {s.fiadoTaker && (
                                                                    <div className="bg-orange-50 border border-orange-100 px-3 py-1 rounded-full text-[8px] font-black text-orange-600 uppercase tracking-tighter">Retirou: {s.fiadoTaker}</div>
                                                                )}
                                                            </div>
                                                            <p className="text-[8px] text-gray-300 font-bold uppercase tracking-widest mt-1">Sessão Processada por: {s.employee || 'Robot'}</p>
                                                        </td>
                                                        <td className="px-10 py-6 text-right">
                                                            <div className="text-base font-black text-gray-900 tracking-tighter tabular-nums">R$ {(s.total || 0).toFixed(2)}</div>
                                                        </td>
                                                        <td className="px-10 py-6 text-right">
                                                            <button
                                                                onClick={() => setSelectedSaleForDetails(s)}
                                                                className="p-3 bg-gray-50 text-gray-400 hover:text-blue-600 hover:bg-white hover:shadow-xl rounded-[18px] transition-all border-none cursor-pointer"
                                                                title="Ver Detalhes"
                                                            >
                                                                <Eye size={18} />
                                                            </button>
                                                            {s.status !== 'refunded' && (
                                                                <button
                                                                    onClick={() => handleCancelSale(s)}
                                                                    className="p-3 bg-gray-50 text-gray-400 hover:text-red-500 hover:bg-white hover:shadow-xl rounded-[18px] transition-all border-none cursor-pointer"
                                                                    title="Cancelar Venda"
                                                                >
                                                                    <Ban size={18} />
                                                                </button>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </main>
            </div >

            {/* Painel Lateral (Slide Overlay) - Redesigned instead of Modal */}
            {
                selectedSaleForDetails && (
                    <div className="fixed inset-0 z-[200] flex justify-end animate-in fade-in duration-300">
                        <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={() => setSelectedSaleForDetails(null)} />
                        <div className="w-full max-w-xl bg-white h-full relative z-[210] shadow-2xl flex flex-col animate-in slide-in-from-right duration-500 border-l border-gray-100">
                            <header className="p-10 border-b border-gray-100 flex items-center justify-between shrink-0">
                                <div>
                                    <button
                                        onClick={() => setSelectedSaleForDetails(null)}
                                        className="flex items-center gap-2 text-gray-400 hover:text-blue-600 font-black text-[9px] uppercase tracking-widest mb-4 transition-all border-none bg-transparent cursor-pointer"
                                    >
                                        <ChevronLeft size={16} /> Voltar para lista
                                    </button>
                                    <h2 className="text-2xl font-black text-gray-800 tracking-tighter">
                                        {selectedSaleForDetails.isFiscal ? 'Detalhamento Fiscal' : 'Detalhes da Venda'}
                                    </h2>
                                    <p className="text-[9px] text-gray-400 font-black uppercase tracking-[0.2em] mt-1 italic">
                                        {selectedSaleForDetails.isFiscal ? 'Interação direta com SEFAZ / NFC-e' : 'Informações completas da transação'}
                                    </p>
                                </div>
                                <div className="bg-blue-50 text-blue-600 p-4 rounded-[24px] shadow-inner font-black text-lg">
                                    {selectedSaleForDetails.isFiscal ? `#${selectedSaleForDetails.nfeNumber || '---'}` : new Date(selectedSaleForDetails.date).toLocaleDateString('pt-BR')}
                                </div>
                            </header>
                            <div className="flex-1 overflow-y-auto p-12 space-y-12">
                                {/* Sale Items */}
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black text-blue-600 uppercase tracking-[0.3em] block ml-1">Itens da Venda</label>
                                    <div className="bg-white rounded-[32px] border border-gray-100 overflow-hidden shadow-sm">
                                        <table className="w-full text-left text-[11px]">
                                            <thead className="bg-gray-50/70 border-b border-gray-100 text-gray-400 font-bold uppercase text-[8px] tracking-wider">
                                                <tr>
                                                    <th className="px-6 py-4">Item</th>
                                                    <th className="px-6 py-4 text-center">Qtd</th>
                                                    <th className="px-6 py-4 text-right">Preço Un.</th>
                                                    <th className="px-6 py-4 text-right">TOTAL</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-50/50">
                                                {(selectedSaleForDetails.items || []).map((item: any, idx: number) => (
                                                    <tr key={`item-${idx}`} className="hover:bg-gray-50/40 transition-colors">
                                                        <td className="px-6 py-4 font-bold text-gray-800">{item.name}</td>
                                                        <td className="px-6 py-4 text-center font-bold text-gray-600">{item.quantity}</td>
                                                        <td className="px-6 py-4 text-right font-bold text-gray-600 tabular-nums">R$ {(item.price || 0).toFixed(2)}</td>
                                                        <td className="px-6 py-4 text-right font-black text-gray-900 tabular-nums">R$ {(item.total || 0).toFixed(2)}</td>
                                                    </tr>
                                                ))}
                                                <tr className="bg-blue-50/30">
                                                    <td colSpan={3} className="px-6 py-5 text-right font-black text-gray-800 uppercase tracking-wider">Total Geral:</td>
                                                    <td className="px-6 py-5 text-right font-black text-blue-600 text-lg tabular-nums">R$ {(selectedSaleForDetails.total || 0).toFixed(2)}</td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                {/* Payments */}
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black text-gray-600 uppercase tracking-[0.3em] block ml-1">Formas de Pagamento</label>
                                    <div className="grid grid-cols-1 gap-3">
                                        {(selectedSaleForDetails.payments || []).map((payment: any, idx: number) => (
                                            <div key={`payment-${idx}`} className="bg-gray-50 border border-gray-100 p-5 rounded-2xl flex items-center justify-between">
                                                <span className="text-xs font-bold text-gray-700 uppercase tracking-wide">{formatMethod(payment.method)}</span>
                                                <span className="text-base font-black text-gray-900 tabular-nums">R$ {(payment.amount || 0).toFixed(2)}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Customer Info */}
                                {selectedSaleForDetails.customer && (
                                    <div className="space-y-4">
                                        <label className="text-[10px] font-black text-gray-600 uppercase tracking-[0.3em] block ml-1">Cliente Identificado</label>
                                        <div className="bg-blue-50/50 border border-blue-100 p-6 rounded-2xl">
                                            <p className="text-sm font-black text-gray-800 uppercase tracking-tight">{selectedSaleForDetails.customer.name}</p>
                                            {selectedSaleForDetails.customer.cpf && <p className="text-[10px] text-gray-500 font-bold mt-1">CPF: {selectedSaleForDetails.customer.cpf}</p>}
                                            {selectedSaleForDetails.customer.phone && <p className="text-[10px] text-gray-500 font-bold mt-1">Tel: {selectedSaleForDetails.customer.phone}</p>}
                                        </div>
                                    </div>
                                )}

                                {/* Fiscal Details (only for fiscal sales) */}
                                {selectedSaleForDetails.isFiscal && (
                                    <>
                                        <div className="grid grid-cols-2 gap-10">
                                            <div>
                                                <label className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] block mb-3">Protocolo de Autorização</label>
                                                <div className="bg-gray-50 border border-gray-100 p-5 rounded-2xl font-black text-xs text-gray-800 shadow-inner">
                                                    {selectedSaleForDetails.fiscalFull?.protocolo || selectedSaleForDetails.nfeId || 'PENDENTE'}
                                                </div>
                                            </div>
                                            <div>
                                                <label className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] block mb-3">Chave de Acesso Única</label>
                                                <div className="bg-gray-50 border border-gray-100 p-5 rounded-2xl font-mono text-[10px] text-gray-600 break-all leading-relaxed shadow-inner">
                                                    {selectedSaleForDetails.fiscalReference || 'NAO DISPONIVEL'}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <label className="text-[10px] font-black text-blue-600 uppercase tracking-[0.3em] block ml-1">Payload Fiscal (JSON/XML)</label>
                                            <div className="bg-gray-50 rounded-[32px] p-8 border border-gray-100 relative shadow-inner">
                                                <div className="absolute top-4 right-8 text-gray-300 font-bold uppercase text-[9px] tracking-widest">Developer View</div>
                                                <pre className="text-[10px] font-sans text-gray-600 whitespace-pre-wrap max-h-96 overflow-y-auto scrollbar-hide pb-4">
                                                    {JSON.stringify(selectedSaleForDetails.fiscalFull || selectedSaleForDetails.fiscalData, null, 2)}
                                                </pre>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                            <footer className="p-10 border-t border-gray-100 flex gap-4 bg-gray-50/50">
                                <button
                                    onClick={() => handleReprintNFCe(selectedSaleForDetails)}
                                    className="flex-1 bg-blue-600 text-white py-5 rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] hover:bg-blue-700 transition-all shadow-xl shadow-blue-500/20 flex items-center justify-center gap-3 border-none cursor-pointer"
                                >
                                    <Printer size={20} /> Reimprimir Cupom
                                </button>
                                {selectedSaleForDetails.status !== 'refunded' && (
                                    <button
                                        onClick={() => {
                                            const s = selectedSaleForDetails;
                                            setSelectedSaleForDetails(null);
                                            handleCancelSale(s);
                                        }}
                                        className="flex-none bg-red-50 text-red-600 px-8 py-5 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-red-600 hover:text-white transition-all flex items-center justify-center gap-3 border-none cursor-pointer"
                                    >
                                        <Ban size={20} /> Cancelar Venda
                                    </button>
                                )}
                            </footer>
                        </div>
                    </div>
                )
            }

            {
                editingProduct && (
                    <div className="fixed inset-0 bg-white/80 backdrop-blur-md z-[200] flex items-center justify-center p-6 animate-in fade-in zoom-in duration-200">
                        <div className="bg-white rounded-[40px] shadow-2xl border border-gray-100 w-full max-w-2xl overflow-hidden flex flex-col">
                            <header className="px-10 py-8 border-b border-gray-50 flex items-center justify-between bg-white shrink-0">
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900 tracking-tight text-sans">Editar Produto</h3>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Configurações detalhadas do item</p>
                                </div>
                                <button onClick={() => setEditingProduct(null)} className="p-3 bg-gray-50 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all border-none cursor-pointer"><X size={20} /></button>
                            </header>

                            <div className="p-10 space-y-8 overflow-y-auto max-h-[70vh] scrollbar-hide">
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Nome do Produto</label>
                                        <input className="w-full bg-gray-50/50 border border-gray-100 rounded-2xl px-6 py-4 text-xs font-bold outline-none focus:border-blue-500 focus:bg-white transition-all text-sans" value={editingProduct.name} onChange={e => setEditingProduct({ ...editingProduct, name: e.target.value })} />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Preço Sugerido (R$)</label>
                                        <input className="w-full bg-gray-50/50 border border-gray-100 rounded-2xl px-6 py-4 text-xs font-bold outline-none focus:border-blue-500 focus:bg-white transition-all text-sans" type="number" step="0.01" value={editingProduct.price} onChange={e => setEditingProduct({ ...editingProduct, price: e.target.value })} />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Categoria</label>
                                        <select className="w-full bg-gray-50/50 border border-gray-100 rounded-2xl px-6 py-4 text-xs font-bold outline-none cursor-pointer focus:bg-white transition-all text-sans" value={editingProduct.categoryId} onChange={e => setEditingProduct({ ...editingProduct, categoryId: e.target.value })}>
                                            {categories.map(c => <option key={c.id || c._id} value={c.id || c._id}>{c.name}</option>)}
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Estoque (Opcional)</label>
                                        <input className="w-full bg-gray-50/50 border border-gray-100 rounded-2xl px-6 py-4 text-xs font-bold outline-none focus:border-blue-500 focus:bg-white transition-all text-sans" type="number" placeholder="Ilimitado" value={editingProduct.stock} onChange={e => setEditingProduct({ ...editingProduct, stock: e.target.value })} />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-6 pb-2">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Imagem do Produto</label>
                                        <div className="flex gap-4">
                                            <div className="w-16 h-16 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center overflow-hidden shrink-0">
                                                {editingProduct.image ? <img src={editingProduct.image} className="w-full h-full object-cover" alt="" /> : <Package className="text-gray-200" size={24} />}
                                            </div>
                                            <div className="flex-1 flex flex-col justify-center">
                                                <input type="file" accept="image/*" onChange={(e) => handleImageChange(e, 'edit')} className="hidden" id="edit-prod-img" />
                                                <label htmlFor="edit-prod-img" className="w-full bg-blue-50 text-blue-600 rounded-xl px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-center cursor-pointer hover:bg-blue-100 transition-all text-sans">Alterar Foto</label>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">NCM</label>
                                            <input className="w-full bg-gray-50/50 border border-gray-100 rounded-2xl px-6 py-4 text-xs font-bold outline-none focus:border-blue-500 focus:bg-white transition-all text-sans" value={editingProduct.ncm} onChange={e => setEditingProduct({ ...editingProduct, ncm: e.target.value })} />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">CFOP</label>
                                            <input className="w-full bg-gray-50/50 border border-gray-100 rounded-2xl px-6 py-4 text-xs font-bold outline-none focus:border-blue-500 focus:bg-white transition-all text-sans" value={editingProduct.cfop} onChange={e => setEditingProduct({ ...editingProduct, cfop: e.target.value })} />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <footer className="p-10 border-t border-gray-50 bg-gray-50/50 flex gap-4">
                                <button onClick={() => setEditingProduct(null)} className="flex-1 bg-white border border-gray-200 text-gray-400 py-4 rounded-2xl font-bold text-[10px] uppercase tracking-widest hover:bg-gray-50 transition-all border-none cursor-pointer">Cancelar</button>
                                <button onClick={handleUpdateProduct} className="flex-1 bg-blue-600 text-white py-4 rounded-2xl font-bold text-[10px] uppercase tracking-widest hover:bg-blue-700 transition-all shadow-xl shadow-blue-100 border-none cursor-pointer">Gravar Alterações</button>
                            </footer>
                        </div>
                    </div>
                )
            }

            {
                editingCategory && (
                    <div className="fixed inset-0 bg-white/80 backdrop-blur-md z-[200] flex items-center justify-center p-6 animate-in fade-in zoom-in duration-200">
                        <div className="bg-white rounded-[40px] shadow-2xl border border-gray-100 w-full max-w-md overflow-hidden flex flex-col">
                            <header className="px-10 py-8 border-b border-gray-50 flex items-center justify-between bg-white shrink-0">
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900 tracking-tight text-sans">Editar Categoria</h3>
                                </div>
                                <button onClick={() => setEditingCategory(null)} className="p-3 bg-gray-50 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all border-none cursor-pointer"><X size={20} /></button>
                            </header>

                            <div className="p-10 space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Nome</label>
                                    <input className="w-full bg-gray-50/50 border border-gray-100 rounded-2xl px-6 py-4 text-xs font-bold outline-none focus:border-blue-500 focus:bg-white transition-all text-sans" value={editingCategory.name} onChange={e => setEditingCategory({ ...editingCategory, name: e.target.value })} />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Ícone / Capa</label>
                                    <div className="flex gap-4 items-center">
                                        <div className="w-12 h-12 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center overflow-hidden shrink-0">
                                            {editingCategory.image ? <img src={editingCategory.image} className="w-full h-full object-cover" alt="" /> : <LayoutGrid className="text-gray-200" size={20} />}
                                        </div>
                                        <input type="file" accept="image/*" onChange={(e) => handleImageChange(e, 'editCat')} className="hidden" id="edit-cat-img" />
                                        <label htmlFor="edit-cat-img" className="flex-1 bg-gray-50 text-gray-400 rounded-xl px-4 py-3 text-[9px] font-bold uppercase tracking-wider text-center cursor-pointer hover:bg-gray-100 transition-all text-sans">Escolher Imagem</label>
                                    </div>
                                </div>
                            </div>

                            <footer className="p-8 border-t border-gray-50 bg-gray-50/50 flex gap-3">
                                <button onClick={() => setEditingCategory(null)} className="flex-1 bg-white border border-gray-100 text-gray-400 py-3.5 rounded-xl font-bold text-[9px] uppercase tracking-widest hover:bg-gray-50 transition-all border-none cursor-pointer">Voltar</button>
                                <button onClick={async () => {
                                    await fetch('/api/catalog', {
                                        method: 'PUT',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({ type: 'category', id: editingCategory.id || editingCategory._id, data: { name: editingCategory.name, image: editingCategory.image } })
                                    });
                                    setEditingCategory(null);
                                    refreshCategories();
                                }} className="flex-1 bg-blue-600 text-white py-3.5 rounded-xl font-bold text-[9px] uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 border-none cursor-pointer">Salvar</button>
                            </footer>
                        </div>
                    </div>
                )
            }

            {
                isRegisteringCustomer && (
                    <CustomerModal
                        initialRegister={true}
                        onClose={() => setIsRegisteringCustomer(false)}
                        onSelect={() => {
                            setIsRegisteringCustomer(false);
                            refreshCustomers();
                        }}
                    />
                )
            }
            {
                selectedCustomerForDebt && (
                    <DebtModal
                        customer={selectedCustomerForDebt}
                        onUpdate={refreshCustomers}
                        onClose={() => {
                            setSelectedCustomerForDebt(null);
                            refreshCustomers();
                        }}
                    />
                )
            }
        </div>
    );
}

function StatCard({ title, value, icon, trend, color }: any) {
    return (
        <div className="bg-white border border-gray-100 p-5 rounded-2xl shadow-sm hover:shadow-md transition-all group overflow-hidden relative">
            <div className="flex justify-between items-center mb-5">
                <div className={`p-2 bg-gray-50 rounded-lg transition-colors group-hover:bg-current/10 ${color}`}>{icon}</div>
                <div className={`flex items-center gap-1 font-bold text-[8px] px-2 py-0.5 rounded-full bg-gray-50 border border-gray-100/50 ${color}`}>
                    {trend}
                </div>
            </div>
            <p className="text-[9px] font-bold text-gray-300 tracking-wider mb-1 uppercase text-sans">{title}</p>
            <h4 className="text-xl font-bold text-gray-900 tracking-tight tabular-nums text-sans">{value}</h4>
        </div>
    );
}
