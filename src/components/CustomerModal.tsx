"use client";

import React, { useState, useRef } from 'react';
import { useGlobal } from '../context/GlobalContext';
import { useToast } from '../context/ToastContext';
import { Search, UserPlus, X, MapPin, Loader2, Navigation, Users, Gift, User, ChevronRight, Plus } from 'lucide-react';

interface CustomerModalProps {
    onClose: () => void;
    onSelect: (customer: any) => void;
    initialRegister?: boolean;
    showDebtorsOnly?: boolean;
    dark?: boolean; // Kept for backwards compatibility but we are forcing dark in styles
}

export default function CustomerModal({ onClose, onSelect, initialRegister = false, showDebtorsOnly = false }: CustomerModalProps) {
    const { customers, refreshCustomers, isLoading } = useGlobal();
    const { showToast } = useToast();
    
    const [searchTerm, setSearchTerm] = useState('');
    const [mode, setMode] = useState<'search' | 'register'>(initialRegister ? 'register' : 'search');
    const [addressSuggestions, setAddressSuggestions] = useState<any[]>([]);
    const [isSearchingAddress, setIsSearchingAddress] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const [newCustomer, setNewCustomer] = useState({
        name: '',
        cpf: '',
        email: '',
        phone: '',
        address: {
            cep: '',
            street: '',
            number: '',
            neighborhood: '',
            city: 'Caputira',
            state: 'MG'
        }
    });

    const suggestionTimeout = useRef<any>(null);

    const handleCepLookup = async (cep: string) => {
        const cleanCep = cep.replace(/\D/g, '');
        setNewCustomer(prev => ({ ...prev, address: { ...prev.address, cep: cleanCep } }));

        if (cleanCep.length === 8) {
            try {
                const res = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
                const data = await res.json();
                if (!data.erro) {
                    setNewCustomer(prev => ({
                        ...prev,
                        address: {
                            ...prev.address,
                            street: data.logradouro,
                            neighborhood: data.bairro,
                            city: data.localidade,
                            state: data.uf
                        }
                    }));
                }
            } catch (e) {
                console.error("CEP Lookup failed");
            }
        }
    };

    const handleAddressSearch = (query: string) => {
        setNewCustomer(prev => ({ ...prev, address: { ...prev.address, street: query } }));
        if (suggestionTimeout.current) clearTimeout(suggestionTimeout.current);
        if (query.length < 3) {
            setAddressSuggestions([]);
            return;
        }

        suggestionTimeout.current = setTimeout(async () => {
            setIsSearchingAddress(true);
            try {
                const res = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=5&lang=pt`);
                const data = await res.json();
                const bzFeatures = data.features.filter((f: any) => f.properties.country === 'Brazil' || f.properties.countrycode === 'BR');
                setAddressSuggestions(bzFeatures);
            } catch (e) {
                console.error("Address search failed");
            } finally {
                setIsSearchingAddress(false);
            }
        }, 500);
    };

    const selectAddress = (feature: any) => {
        const p = feature.properties;
        setNewCustomer(prev => ({
            ...prev,
            address: {
                ...prev.address,
                street: p.name || p.street || '',
                neighborhood: p.district || p.suburb || '',
                city: p.city || p.town || 'Caputira',
                state: p.state || 'MG',
                cep: p.postcode || prev.address.cep
            }
        }));
        setAddressSuggestions([]);
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newCustomer.name) {
            showToast('O nome é obrigatório.', 'error');
            return;
        }

        const cleanCpf = newCustomer.cpf.replace(/\D/g, '');
        if (cleanCpf) {
            const exists = customers.find(c => c.cpf && c.cpf.replace(/\D/g, '') === cleanCpf);
            if (exists) {
                showToast('CPF já cadastrado para outro cliente!', 'error');
                return;
            }
        }

        const payload = {
            name: newCustomer.name,
            cpf: cleanCpf || null,
            email: newCustomer.email || null,
            phone: newCustomer.phone || null,
            address: {
                cep: newCustomer.address.cep || null,
                street: newCustomer.address.street || null,
                number: newCustomer.address.number || null,
                neighborhood: newCustomer.address.neighborhood || null,
                city: newCustomer.address.city || 'Caputira',
                state: newCustomer.address.state || 'MG'
            }
        };

        setIsSaving(true);
        try {
            const res = await fetch('/api/customers', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await res.json();
            
            if (res.ok) {
                await refreshCustomers();
                showToast('Cliente cadastrado com sucesso!', 'success');
                onSelect(data);
            } else {
                showToast(data.error || 'Erro ao cadastrar', 'error');
            }
        } catch (e) {
            showToast('Erro ao processar cadastro', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const filtered = customers.filter((c: any) => {
        const matchesSearch = c.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (c.cpf && c.cpf.includes(searchTerm)) ||
            (c.phone && c.phone.includes(searchTerm));

        if (showDebtorsOnly) {
            return matchesSearch && (c.debtBalance || 0) > 0;
        }
        return matchesSearch;
    });

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 font-sans text-sm bg-gray-900/60 dark:bg-black/80 backdrop-blur-sm transition-colors">
            <div className="w-full max-w-2xl bg-white dark:bg-[#0c0c0c] border border-gray-200 dark:border-white/[0.06] rounded-[24px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
                <header className="px-6 md:px-8 py-6 flex items-center justify-between bg-gray-50 dark:bg-[#111] border-b border-gray-200 dark:border-white/[0.05] shrink-0 transition-colors">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-orange-50 dark:bg-orange-600/10 text-orange-600 dark:text-orange-500 border border-orange-200 dark:border-orange-500/20 rounded-2xl flex items-center justify-center shadow-sm dark:shadow-none">
                            <Users size={24} />
                        </div>
                        <div>
                            <h3 className="text-xl font-black uppercase tracking-tight text-gray-900 dark:text-white">
                                {showDebtorsOnly ? 'Gerenciar Fiados' : (mode === 'search' ? 'Identificar Cliente' : 'Novo Cliente')}
                            </h3>
                            <p className="text-xs font-bold tracking-widest mt-1 text-gray-500 dark:text-[#555] uppercase">
                                {showDebtorsOnly ? 'Clientes com pendências' : (mode === 'search' ? 'Busque por nome, CPF ou telefone' : 'Preencha os dados do cliente')}
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2.5 rounded-xl transition-colors bg-gray-100 dark:bg-transparent border-none cursor-pointer text-gray-500 dark:text-[#555] hover:bg-gray-200 hover:text-gray-900 dark:hover:bg-white/5 dark:hover:text-white">
                        <X size={24} />
                    </button>
                </header>

                <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
                    {mode === 'register' ? (
                        <form onSubmit={handleRegister} className="p-6 md:p-8 space-y-8 animate-in slide-in-from-bottom-2 duration-300">
                            <div className="space-y-5">
                                <div className="flex items-center justify-between pb-3 border-b border-gray-200 dark:border-white/[0.05]">
                                    <h4 className="text-sm font-black flex items-center gap-2 uppercase text-gray-900 dark:text-white">
                                        <User size={18} className="text-orange-600 dark:text-orange-500" />
                                        Dados Pessoais
                                    </h4>
                                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest bg-orange-50 dark:bg-orange-600/10 text-orange-600 dark:text-orange-500 border border-orange-200 dark:border-orange-500/20 shadow-sm dark:shadow-none">
                                        <Gift size={14} /> Ganha 1 ponto a cada R$ 10,00
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-sm">
                                    <FormInput label="Nome completo" value={newCustomer.name} onChange={(v: string) => setNewCustomer({ ...newCustomer, name: v })} placeholder="Digite o nome..." compulsory={true} />
                                    <FormInput
                                        label="CPF / CNPJ"
                                        value={newCustomer.cpf}
                                        onChange={(v: string) => {
                                            const clean = v.replace(/\D/g, '').substring(0, 14);
                                            let masked = clean;
                                            if (clean.length <= 11) {
                                                masked = clean.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
                                                if (clean.length > 3 && clean.length <= 6) masked = clean.replace(/(\d{3})(\d{0,3})/, "$1.$2");
                                                else if (clean.length > 6 && clean.length <= 9) masked = clean.replace(/(\d{3})(\d{3})(\d{0,3})/, "$1.$2.$3");
                                                else if (clean.length > 9) masked = clean.replace(/(\d{3})(\d{3})(\d{3})(\d{0,2})/, "$1.$2.$3-$4");
                                            } else {
                                                masked = clean.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
                                                if (clean.length > 2 && clean.length <= 5) masked = clean.replace(/(\d{2})(\d{0,3})/, "$1.$2");
                                                else if (clean.length > 5 && clean.length <= 8) masked = clean.replace(/(\d{2})(\d{3})(\d{0,3})/, "$1.$2.$3");
                                                else if (clean.length > 8 && clean.length <= 12) masked = clean.replace(/(\d{2})(\d{3})(\d{3})(\d{0,4})/, "$1.$2.$3/$4");
                                                else if (clean.length > 12) masked = clean.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{0,2})/, "$1.$2.$3/$4-$5");
                                            }
                                            setNewCustomer({ ...newCustomer, cpf: masked });
                                        }}
                                        placeholder="000.000.000-00"
                                    />
                                    <FormInput label="Telefone" value={newCustomer.phone} onChange={(v: string) => setNewCustomer({ ...newCustomer, phone: v })} placeholder="(00) 00000-0000" />
                                    <FormInput label="E-mail" value={newCustomer.email} onChange={(v: string) => setNewCustomer({ ...newCustomer, email: v })} placeholder="exemplo@email.com" />
                                </div>
                            </div>

                            <div className="space-y-5 pt-4">
                                <h4 className="text-sm font-black flex items-center gap-2 pb-3 border-b border-gray-200 dark:border-white/[0.05] uppercase text-gray-900 dark:text-white">
                                    <MapPin size={18} className="text-orange-600 dark:text-orange-500" /> Endereço
                                </h4>
                                <div className="grid grid-cols-12 gap-5 text-sm">
                                    <div className="col-span-12 md:col-span-4">
                                        <FormInput label="CEP" value={newCustomer.address.cep} onChange={handleCepLookup} placeholder="00000-000" />
                                    </div>
                                    <div className="col-span-12 md:col-span-8 relative">
                                        <FormInput label="Logradouro" value={newCustomer.address.street} onChange={handleAddressSearch} placeholder="Rua, Avenida..." />
                                        {addressSuggestions.length > 0 && (
                                            <div className="absolute top-full left-0 right-0 z-50 mt-2 overflow-hidden divide-y rounded-2xl shadow-2xl bg-white dark:bg-[#111] border border-gray-200 dark:border-white/[0.06] divide-gray-100 dark:divide-white/[0.05]">
                                                {addressSuggestions.map((f, i) => (
                                                    <button key={`addr-s-${i}`} type="button" onClick={() => selectAddress(f)} className="w-full px-5 py-4 text-left transition-colors border-none cursor-pointer flex items-start gap-3 bg-transparent hover:bg-gray-50 dark:hover:bg-white/[0.03]">
                                                        <Navigation size={16} className="text-orange-600 dark:text-orange-500 mt-1 shrink-0" />
                                                        <div>
                                                            <p className="text-[12px] font-bold text-gray-900 dark:text-white uppercase tracking-wider">{f.properties.name}</p>
                                                            <p className="text-[10px] font-bold uppercase tracking-widest mt-1 text-gray-500 dark:text-[#555]">{f.properties.district || f.properties.suburb}, {f.properties.city} - {f.properties.state}</p>
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                        {isSearchingAddress && (
                                            <div className="absolute right-4 top-[38px] text-orange-600 dark:text-orange-500">
                                                <Loader2 size={18} className="animate-spin" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="col-span-12 md:col-span-3">
                                        <FormInput label="Número" value={newCustomer.address.number} onChange={(v: string) => setNewCustomer({ ...newCustomer, address: { ...newCustomer.address, number: v } })} placeholder="Nº" />
                                    </div>
                                    <div className="col-span-12 md:col-span-5">
                                        <FormInput label="Bairro" value={newCustomer.address.neighborhood} onChange={(v: string) => setNewCustomer({ ...newCustomer, address: { ...newCustomer.address, neighborhood: v } })} placeholder="Bairro" />
                                    </div>
                                    <div className="col-span-12 md:col-span-4">
                                        <FormInput label="Cidade / UF" value={`${newCustomer.address.city}/${newCustomer.address.state}`} onChange={() => { }} placeholder="Cidade/UF" />
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-4 pt-6 shrink-0 mt-auto">
                                <button type="button" onClick={() => setMode('search')} className="px-8 py-4 rounded-xl text-xs font-black uppercase tracking-widest transition-all border-none cursor-pointer bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-[#aaa] hover:bg-gray-200 dark:hover:bg-white/10 hover:text-gray-900 dark:hover:text-white">
                                    Cancelar
                                </button>
                                <button type="submit" disabled={isSaving || !newCustomer.name} className="flex-1 py-4 rounded-xl font-black text-xs uppercase tracking-widest transition-all shadow-md disabled:opacity-50 border-none cursor-pointer flex justify-center items-center gap-3 bg-orange-600 text-white hover:bg-orange-500 shadow-orange-600/30 dark:shadow-orange-900/30 hover:scale-[1.01] active:scale-[0.99]">
                                    {isSaving ? <Loader2 className="animate-spin" size={20} /> : <UserPlus size={20} />}
                                    {isSaving ? 'Salvando...' : 'Finalizar Cadastro'}
                                </button>
                            </div>
                        </form>
                    ) : (
                        <div className="p-6 md:p-8 space-y-6 md:space-y-8">
                            <div className="relative group text-left">
                                <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-[#555] group-focus-within:text-orange-500 transition-colors" size={22} />
                                <input
                                    className="w-full bg-gray-50 dark:bg-[#111] border border-gray-200 dark:border-white/[0.06] rounded-2xl pl-16 pr-5 py-5 text-sm font-bold text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-[#444] outline-none transition-all shadow-inner focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 dark:focus:ring-orange-500/20"
                                    placeholder="BUSCAR POR NOME, TELEFONE OU CPF..."
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                    autoFocus
                                />
                            </div>

                            <button onClick={() => setMode('register')} className="w-full py-5 px-6 border-2 border-dashed rounded-2xl text-xs flex justify-between items-center transition-all cursor-pointer group border-gray-200 dark:border-white/[0.05] text-gray-600 dark:text-[#555] hover:border-orange-500/30 hover:text-orange-600 dark:hover:text-orange-500 bg-gray-50/50 dark:bg-transparent">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 rounded-xl transition-colors bg-white dark:bg-white/5 border border-gray-200 dark:border-transparent group-hover:bg-orange-50 dark:group-hover:bg-orange-500/10 group-hover:text-orange-600 dark:group-hover:text-orange-500 group-hover:border-orange-200 text-gray-500 dark:text-[#555]">
                                        <UserPlus size={20} />
                                    </div>
                                    <span className="uppercase tracking-widest font-black">Cadastrar novo cliente</span>
                                </div>
                                <Plus size={24} className="group-hover:scale-110 transition-transform" />
                            </button>

                            <div className="space-y-4 mt-6">
                                {isLoading ? (
                                    <div className="py-16 flex flex-col items-center gap-4 text-gray-500 dark:text-[#444]">
                                        <Loader2 className="animate-spin" size={32} />
                                        <p className="text-xs font-black uppercase tracking-widest">Buscando Clientes...</p>
                                    </div>
                                ) : filtered.length === 0 ? (
                                    <div className="py-16 text-center text-gray-500 dark:text-[#444]">
                                        <User size={48} className="mx-auto mb-4 opacity-20" />
                                        <p className="text-xs font-black uppercase tracking-widest">Nenhum cliente catalogado</p>
                                    </div>
                                ) : filtered.map((c: any) => (
                                    <button
                                        key={c._id || c.id}
                                        onClick={() => onSelect(c)}
                                        className="w-full bg-white dark:bg-[#111] border border-gray-200 dark:border-white/[0.04] p-5 rounded-2xl flex items-center justify-between transition-all text-left group cursor-pointer hover:border-orange-500/30 hover:shadow-md dark:hover:bg-[#151515]"
                                    >
                                        <div className="flex items-center gap-5">
                                            <div className="w-14 h-14 rounded-xl flex items-center justify-center transition-colors border bg-gray-50 dark:bg-[#0a0a0a] border-gray-200 dark:border-white/[0.05] text-gray-500 dark:text-[#555] group-hover:text-orange-600 dark:group-hover:text-orange-500 group-hover:border-orange-200 dark:group-hover:border-orange-500/20">
                                                <User size={24} />
                                            </div>
                                            <div>
                                                <h4 className="font-black uppercase text-base tracking-tight text-gray-900 dark:text-white">{c.name}</h4>
                                                <p className="text-xs font-bold uppercase tracking-widest mt-1 text-gray-500 dark:text-[#555]">{c.phone || c.cpf || 'DADOS NÃO CONSTAM'}</p>
                                            </div>
                                        </div>
                                        <div className="text-right flex items-center gap-6">
                                            <div className="flex flex-col items-end">
                                                <div className="text-[10px] font-bold uppercase bg-gray-50 dark:bg-white/5 px-3 py-1.5 rounded-lg flex items-center gap-2 border border-gray-200 dark:border-white/[0.05] text-gray-600 dark:text-[#aaa] group-hover:text-orange-700 dark:group-hover:text-white group-hover:bg-orange-50 dark:group-hover:bg-white/10 group-hover:border-orange-200 dark:group-hover:border-white/[0.1] transition-colors">
                                                    <Gift size={14} className="text-orange-600 dark:text-orange-500" /> {c.loyaltyPoints || 0} PTS
                                                </div>
                                            </div>
                                            <ChevronRight size={24} className="text-gray-300 dark:text-[#333] group-hover:text-orange-600 dark:group-hover:text-orange-500 transition-colors" />
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function FormInput({ label, value, onChange, placeholder, compulsory }: any) {
    return (
        <div className="space-y-2 text-left flex flex-col">
            <label className="text-[10px] font-bold uppercase tracking-widest ml-1 text-gray-600 dark:text-[#777]">
                {label} {compulsory && <span className="text-red-500">*</span>}
            </label>
            <input
                className="w-full rounded-xl px-5 py-4 text-sm font-bold outline-none transition-all focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 dark:focus:ring-orange-500/20 bg-white dark:bg-[#0a0a0a] border border-gray-200 dark:border-white/[0.06] text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-[#444] shadow-inner dark:shadow-none"
                value={value}
                onChange={e => onChange(e.target.value)}
                placeholder={placeholder}
                required={compulsory}
            />
        </div>
    );
}
