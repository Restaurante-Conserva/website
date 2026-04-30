"use client";

import React, { useState, useEffect } from 'react';
import { X, Search, User, Phone, MapPin, Users, Plus, ChevronRight, Loader2, Gift } from 'lucide-react';
import { useGlobal } from '../context/GlobalContext';
import { useToast } from '../context/ToastContext';

interface CustomerModalProps {
    onSelect: (customer: any) => void;
    onClose: () => void;
    showDebtorsOnly?: boolean;
}

export default function CustomerModal({ onSelect, onClose, showDebtorsOnly = false }: CustomerModalProps) {
    const { customers, refreshCustomers } = useGlobal();
    const { showToast } = useToast();

    const [mode, setMode] = useState<'search' | 'register'>('search');
    const [searchTerm, setSearchTerm] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const [newCustomer, setNewCustomer] = useState({
        name: '',
        cpf: '',
        email: '',
        phone: '',
        address: { street: '', number: '', complement: '', neighborhood: '', city: '', state: '', zipCode: '' }
    });

    const [addressSuggestions, setAddressSuggestions] = useState<any[]>([]);

    useEffect(() => {
        if (showDebtorsOnly) setMode('search');
    }, [showDebtorsOnly]);

    const handleCepLookup = async (cep: string) => {
        const cleanCep = cep.replace(/\D/g, '');
        setNewCustomer(prev => ({ ...prev, address: { ...prev.address, zipCode: cep } }));
        if (cleanCep.length === 8) {
            try {
                const res = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
                const data = await res.json();
                if (!data.erro) {
                    setNewCustomer(prev => ({
                        ...prev,
                        address: { ...prev.address, street: data.logradouro, neighborhood: data.bairro, city: data.localidade, state: data.uf }
                    }));
                }
            } catch (e) { console.error(e); }
        }
    };

    const handleAddressSearch = async (q: string) => {
        setNewCustomer(prev => ({ ...prev, address: { ...prev.address, street: q } }));
        if (q.length < 3) { setAddressSuggestions([]); return; }
        try {
            const res = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(q)}&limit=5`);
            const data = await res.json();
            setAddressSuggestions(data.features || []);
        } catch (e) { console.error(e); }
    };

    const selectAddress = (feature: any) => {
        const p = feature.properties;
        setNewCustomer(prev => ({
            ...prev,
            address: { ...prev.address, street: p.name || prev.address.street, neighborhood: p.district || p.suburb || '', city: p.city || '', state: p.state || '', zipCode: p.postcode || prev.address.zipCode }
        }));
        setAddressSuggestions([]);
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newCustomer.name) { showToast('Nome é obrigatório', 'error'); return; }
        setIsSaving(true);
        try {
            const res = await fetch('/api/customers', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newCustomer)
            });
            const data = await res.json();
            if (res.ok) {
                await refreshCustomers();
                showToast('Cliente cadastrado com sucesso!', 'success');
                onSelect(data);
            } else {
                showToast(data.error || 'Erro ao cadastrar', 'error');
            }
        } catch { showToast('Erro ao processar cadastro', 'error'); }
        finally { setIsSaving(false); }
    };

    const filtered = customers.filter((c: any) => {
        const matchesSearch =
            c.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (c.cpf && c.cpf.includes(searchTerm)) ||
            (c.phone && c.phone.includes(searchTerm));
        return showDebtorsOnly ? matchesSearch && (c.debtBalance || 0) > 0 : matchesSearch;
    });

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-full max-w-lg bg-white dark:bg-[#0a0a0a] border border-gray-100 dark:border-[#1a1a1a] rounded-xl shadow-xl overflow-hidden flex flex-col h-[600px] max-h-[90vh] animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="px-5 py-4 flex items-center justify-between border-b border-gray-100 dark:border-[#1a1a1a] shrink-0">
                    <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {showDebtorsOnly ? 'Gerenciar Fiados' : mode === 'search' ? 'Identificar Cliente' : 'Novo Cliente'}
                        </p>
                        <p className="text-xs text-gray-400 dark:text-[#555] mt-0.5">
                            {showDebtorsOnly ? 'Clientes com pendências em aberto' : mode === 'search' ? 'Busque por nome, CPF ou telefone' : 'Preencha os dados do cliente'}
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        {mode === 'search' && !showDebtorsOnly && (
                            <button
                                onClick={() => setMode('register')}
                                className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-500 dark:text-[#555] hover:text-gray-900 dark:hover:text-white border border-gray-200 dark:border-[#1a1a1a] rounded-md transition-all cursor-pointer bg-transparent"
                            >
                                <Plus size={13} /> Novo
                            </button>
                        )}
                        <button onClick={onClose} className="p-1.5 rounded-md text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-[#1a1a1a] border-none bg-transparent cursor-pointer transition-all">
                            <X size={16} />
                        </button>
                    </div>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto px-5 py-4" style={{ scrollbarWidth: 'thin', scrollbarColor: '#333 transparent' }}>
                    {mode === 'register' ? (
                        <form onSubmit={handleRegister} className="space-y-5 animate-in slide-in-from-bottom-2 duration-200">
                            <div>
                                <p className="text-xs text-gray-400 dark:text-[#555] mb-3 flex items-center gap-1.5">
                                    <User size={12} /> Informações Pessoais
                                </p>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="col-span-2">
                                        <Field label="Nome completo *" value={newCustomer.name} onChange={v => setNewCustomer({ ...newCustomer, name: v })} placeholder="Ex: João da Silva" />
                                    </div>
                                    <Field label="CPF / CNPJ" value={newCustomer.cpf} onChange={v => setNewCustomer({ ...newCustomer, cpf: v })} placeholder="000.000.000-00" />
                                    <Field label="Telefone" value={newCustomer.phone} onChange={v => setNewCustomer({ ...newCustomer, phone: v })} placeholder="(00) 00000-0000" />
                                    <div className="col-span-2">
                                        <Field label="E-mail" value={newCustomer.email} onChange={v => setNewCustomer({ ...newCustomer, email: v })} placeholder="cliente@exemplo.com" />
                                    </div>
                                </div>
                            </div>

                            <div>
                                <p className="text-xs text-gray-400 dark:text-[#555] mb-3 flex items-center gap-1.5">
                                    <MapPin size={12} /> Endereço
                                </p>
                                <div className="grid grid-cols-12 gap-3">
                                    <div className="col-span-4">
                                        <Field label="CEP" value={newCustomer.address.zipCode} onChange={handleCepLookup} placeholder="00000-000" />
                                    </div>
                                    <div className="col-span-8 relative">
                                        <Field label="Rua" value={newCustomer.address.street} onChange={handleAddressSearch} placeholder="Buscar endereço..." />
                                        {addressSuggestions.length > 0 && (
                                            <div className="absolute top-full left-0 right-0 z-[100] mt-1 overflow-hidden rounded-lg shadow-xl bg-white dark:bg-[#0f0f0f] border border-gray-100 dark:border-[#1a1a1a] divide-y divide-gray-50 dark:divide-[#111]">
                                                {addressSuggestions.map((f, i) => (
                                                    <button key={i} type="button" onClick={() => selectAddress(f)} className="w-full px-3 py-2.5 text-left text-xs flex items-center gap-2 border-none cursor-pointer bg-transparent hover:bg-gray-50 dark:hover:bg-[#111] text-gray-700 dark:text-gray-300">
                                                        <MapPin size={12} className="text-gray-300 shrink-0" />
                                                        <span>{f.properties.name}{f.properties.city ? `, ${f.properties.city}` : ''}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    <div className="col-span-3">
                                        <Field label="Nº" value={newCustomer.address.number} onChange={v => setNewCustomer({ ...newCustomer, address: { ...newCustomer.address, number: v } })} placeholder="123" />
                                    </div>
                                    <div className="col-span-9">
                                        <Field label="Complemento" value={newCustomer.address.complement} onChange={v => setNewCustomer({ ...newCustomer, address: { ...newCustomer.address, complement: v } })} placeholder="Apto, Bloco..." />
                                    </div>
                                    <div className="col-span-6">
                                        <Field label="Bairro" value={newCustomer.address.neighborhood} onChange={v => setNewCustomer({ ...newCustomer, address: { ...newCustomer.address, neighborhood: v } })} placeholder="Bairro" />
                                    </div>
                                    <div className="col-span-4">
                                        <Field label="Cidade" value={newCustomer.address.city} onChange={v => setNewCustomer({ ...newCustomer, address: { ...newCustomer.address, city: v } })} placeholder="Cidade" />
                                    </div>
                                    <div className="col-span-2">
                                        <Field label="UF" value={newCustomer.address.state} onChange={v => setNewCustomer({ ...newCustomer, address: { ...newCustomer.address, state: v } })} placeholder="MG" />
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-2 pt-2">
                                <button type="button" onClick={() => setMode('search')} className="flex-1 py-2 text-xs border border-gray-200 dark:border-[#1a1a1a] rounded-md text-gray-500 dark:text-[#555] hover:text-gray-900 dark:hover:text-white transition-all bg-transparent cursor-pointer">
                                    Cancelar
                                </button>
                                <button type="submit" disabled={isSaving} className="flex-[2] py-2 bg-orange-600 text-white text-xs rounded-md hover:bg-orange-500 transition-all disabled:opacity-40 border-none cursor-pointer flex items-center justify-center gap-2">
                                    {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Users size={14} />}
                                    Finalizar Cadastro
                                </button>
                            </div>
                        </form>
                    ) : (
                        <div className="space-y-3 animate-in slide-in-from-top-2 duration-200">
                            <div className="relative group">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-[#555] group-focus-within:text-orange-500 transition-colors" size={14} />
                                <input
                                    autoFocus
                                    className="w-full bg-gray-50 dark:bg-black border border-gray-100 dark:border-[#1a1a1a] rounded-md pl-9 pr-4 py-2 text-xs outline-none focus:border-orange-500/50 transition-all text-gray-900 dark:text-white placeholder:text-gray-300 dark:placeholder:text-[#333]"
                                    placeholder="Nome, CPF ou telefone..."
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                />
                            </div>

                            {filtered.length === 0 ? (
                                <div className="py-10 text-center">
                                    <User size={28} className="mx-auto mb-2 text-gray-200 dark:text-[#222]" />
                                    <p className="text-xs text-gray-400 dark:text-[#555]">
                                        {searchTerm ? `Sem resultados para "${searchTerm}"` : 'Nenhum cliente cadastrado'}
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-1">
                                    {filtered.map((c: any) => (
                                        <button
                                            key={c._id || c.id}
                                            onClick={() => onSelect(c)}
                                            className="w-full bg-white dark:bg-[#0a0a0a] border border-gray-100 dark:border-[#1a1a1a] px-4 py-3 rounded-lg flex items-center justify-between transition-all group cursor-pointer hover:border-orange-500/30 hover:bg-gray-50 dark:hover:bg-black"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-md flex items-center justify-center border border-gray-100 dark:border-[#1a1a1a] bg-gray-50 dark:bg-black text-gray-400 dark:text-[#555] group-hover:text-orange-600 dark:group-hover:text-orange-500 group-hover:border-orange-100 dark:group-hover:border-orange-500/20 transition-all text-sm font-medium">
                                                    {c.name?.charAt(0)?.toUpperCase()}
                                                </div>
                                                <div className="text-left">
                                                    <p className="text-xs font-medium text-gray-900 dark:text-gray-100">{c.name}</p>
                                                    <p className="text-[10px] text-gray-400 dark:text-[#555] mt-0.5">{c.phone || c.cpf || 'Sem identificação'}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                {(c.debtBalance || 0) > 0 && (
                                                    <span className="text-[10px] text-red-600 dark:text-red-500">R$ {c.debtBalance.toFixed(2)}</span>
                                                )}
                                                <div className="flex items-center gap-1 text-[10px] text-gray-400 dark:text-[#555]">
                                                    <Gift size={11} /> {c.loyaltyPoints || 0} pts
                                                </div>
                                                <ChevronRight size={14} className="text-gray-200 dark:text-[#222] group-hover:text-orange-500 transition-colors" />
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="px-5 py-3 border-t border-gray-100 dark:border-[#1a1a1a] shrink-0">
                    <p className="text-[10px] text-gray-300 dark:text-[#333] text-center">
                        {mode === 'register' ? 'Sincronização em tempo real ativada' : 'Pressione ESC para cancelar'}
                    </p>
                </div>
            </div>
        </div>
    );
}

function Field({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
    return (
        <div className="space-y-1">
            <label className="text-[10px] text-gray-400 dark:text-[#555]">{label}</label>
            <input
                className="w-full bg-gray-50 dark:bg-black border border-gray-100 dark:border-[#1a1a1a] rounded-md px-3 py-2 text-xs outline-none focus:border-orange-500/50 text-gray-900 dark:text-white transition-all placeholder:text-gray-300 dark:placeholder:text-[#333]"
                value={value}
                onChange={e => onChange(e.target.value)}
                placeholder={placeholder}
            />
        </div>
    );
}
