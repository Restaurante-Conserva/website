"use client";

import { useState, useRef } from 'react';
import { useGlobal } from '../context/GlobalContext';
import { Search, UserPlus, X, Phone, Mail, Fingerprint, MapPin, ChevronRight, Plus, Loader2, Globe, Home, User, Gift, Navigation, Users } from 'lucide-react';

interface CustomerModalProps {
    onClose: () => void;
    onSelect: (customer: any) => void;
    initialRegister?: boolean;
    showDebtorsOnly?: boolean;
}

export default function CustomerModal({ onClose, onSelect, initialRegister = false, showDebtorsOnly = false }: CustomerModalProps) {
    const { customers, refreshCustomers, isLoading } = useGlobal();
    const [searchTerm, setSearchTerm] = useState('');
    const [mode, setMode] = useState<'search' | 'register'>(initialRegister ? 'register' : 'search');
    const [addressSuggestions, setAddressSuggestions] = useState<any[]>([]);
    const [isSearchingAddress, setIsSearchingAddress] = useState(false);

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

    // useEffect(() => {
    //     fetchCustomers();
    // }, []); // Data is now global

    // fetchCustomers removed

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
                // Using Photon (OSM) for address suggestions in Brazil
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
        if (!newCustomer.name) return;

        // Validation for duplicate CPF
        const cleanCpf = newCustomer.cpf.replace(/\D/g, '');
        if (cleanCpf) {
            const exists = customers.find(c => c.cpf && c.cpf.replace(/\D/g, '') === cleanCpf);
            if (exists) {
                alert('CPF já cadastrado para outro cliente!');
                return;
            }
        }

        // Prepare payload with null for empty fields
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

        // setIsLoading(true); // Global loading might be too aggressive here, maybe local loading state for save button?
        // Using local loading just for button
        const btn = e.currentTarget.querySelector('button[type="submit"]');
        if (btn) (btn as HTMLButtonElement).disabled = true;

        try {
            const res = await fetch('/api/customers', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await res.json();
            if (res.ok) {
                await refreshCustomers(); // Update global state
                onSelect(data);
            } else {
                alert(data.error || 'Erro ao cadastrar');
            }
        } catch (e) {
            alert('Erro ao processar cadastro');
        } finally {
            // setIsLoading(false);
            if (btn) (btn as HTMLButtonElement).disabled = false;
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
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-900/40 backdrop-blur-sm p-4 font-sans text-sm selection:bg-blue-100">
            <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-gray-100 animate-in zoom-in duration-200">
                <header className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-white shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shadow-inner">
                            <Users size={24} />
                        </div>
                        <div>
                            <h3 className="text-lg font-extrabold text-gray-800 tracking-tight">{showDebtorsOnly ? 'Gerenciar Fiados' : (mode === 'search' ? 'Identificar Cliente' : 'Novo Cliente')}</h3>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{showDebtorsOnly ? 'Clientes com pendências' : (mode === 'search' ? 'Busque por nome, CPF ou telefone' : 'Preencha os dados abaixo')}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-300 transition-colors bg-transparent border-none">
                        <X size={20} />
                    </button>
                </header>

                <div className="flex-1 overflow-y-auto">
                    {mode === 'register' ? (
                        <form onSubmit={handleRegister} className="p-6 space-y-6 animate-in slide-in-from-bottom-2 duration-300">
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <p className="text-[9px] font-bold text-blue-600 uppercase tracking-widest border-l-2 border-blue-600 pl-2">Dados Pessoais</p>
                                    <div className="flex items-center gap-2 bg-orange-50 px-2 py-1 rounded text-[8px] font-bold text-orange-600 uppercase">
                                        <Gift size={10} /> Ganha 1 ponto a cada R$ 10,00
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <FormInput label="Nome completo *" icon={<User size={14} />} value={newCustomer.name} onChange={(v: string) => setNewCustomer({ ...newCustomer, name: v })} placeholder="Nome..." compulsory />
                                    <FormInput
                                        label="CPF / CNPJ"
                                        icon={<Fingerprint size={14} />}
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
                                        placeholder="000.000.000-00 (Opcional)"
                                    />
                                    <FormInput label="Telefone / Contato" icon={<Phone size={14} />} value={newCustomer.phone} onChange={(v: string) => setNewCustomer({ ...newCustomer, phone: v })} placeholder="(00) 00000-0000" />
                                    <FormInput label="E-mail" icon={<Mail size={14} />} value={newCustomer.email} onChange={(v: string) => setNewCustomer({ ...newCustomer, email: v })} placeholder="exemplo@mail.com" />
                                </div>
                            </div>

                            <div className="space-y-4 pt-4 border-t border-gray-50">
                                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest border-l-2 border-gray-200 pl-2">Endereço</p>
                                <div className="grid grid-cols-12 gap-4">
                                    <div className="col-span-12 md:col-span-4">
                                        <FormInput label="CEP" icon={<Globe size={14} />} value={newCustomer.address.cep} onChange={handleCepLookup} placeholder="00000-000" />
                                    </div>
                                    <div className="col-span-12 md:col-span-8 relative">
                                        <FormInput label="LOGRADOURO / ENDEREÇO" icon={<MapPin size={14} />} value={newCustomer.address.street} onChange={handleAddressSearch} placeholder="Rua, Av..." />
                                        {addressSuggestions.length > 0 && (
                                            <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white border border-gray-100 rounded-xl shadow-xl overflow-hidden divide-y divide-gray-50">
                                                {addressSuggestions.map((f, i) => (
                                                    <button key={`addr-s-${i}`} type="button" onClick={() => selectAddress(f)} className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-start gap-3 transition-colors bg-white border-none">
                                                        <Navigation size={12} className="text-blue-500 mt-1 shrink-0" />
                                                        <div>
                                                            <p className="text-[11px] font-bold text-gray-700 uppercase leading-tight">{f.properties.name}</p>
                                                            <p className="text-[9px] text-gray-400 uppercase mt-0.5">{f.properties.district || f.properties.suburb}, {f.properties.city} - {f.properties.state}</p>
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                        {isSearchingAddress && (
                                            <div className="absolute right-3 bottom-3 text-gray-300">
                                                <Loader2 size={14} className="animate-spin" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="col-span-12 md:col-span-3">
                                        <FormInput label="Nº" icon={<Home size={14} />} value={newCustomer.address.number} onChange={(v: string) => setNewCustomer({ ...newCustomer, address: { ...newCustomer.address, number: v } })} />
                                    </div>
                                    <div className="col-span-12 md:col-span-6">
                                        <FormInput label="BAIRRO" value={newCustomer.address.neighborhood} onChange={(v: string) => setNewCustomer({ ...newCustomer, address: { ...newCustomer.address, neighborhood: v } })} />
                                    </div>
                                    <div className="col-span-12 md:col-span-3">
                                        <FormInput label="CIDADE/UF" value={`${newCustomer.address.city}/${newCustomer.address.state}`} onChange={() => { }} placeholder="Cidade..." />
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button type="button" onClick={() => setMode('search')} className="flex-1 py-3 text-[10px] font-bold text-gray-400 tracking-widest hover:bg-gray-50 rounded-xl transition-all bg-transparent border-none">Voltar</button>
                                <button type="submit" disabled={isLoading || !newCustomer.name} className="flex-[2] bg-blue-600 text-white py-3 rounded-xl font-bold text-[10px] tracking-widest hover:bg-blue-700 transition-all shadow-md disabled:opacity-50 border-none">
                                    {isLoading ? <Loader2 className="animate-spin mx-auto" size={16} /> : 'Salvar Cadastro'}
                                </button>
                            </div>
                        </form>
                    ) : (
                        <div className="p-6 space-y-4">
                            <div className="relative group text-left">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" size={16} />
                                <input
                                    className="w-full bg-gray-50 border border-gray-100 rounded-xl pl-10 pr-4 py-3 text-xs font-bold uppercase placeholder:text-gray-300 outline-none focus:bg-white focus:border-blue-500 transition-all shadow-inner"
                                    placeholder="Buscar por nome, telefone ou CPF..."
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                    autoFocus
                                />
                            </div>

                            <button onClick={() => setMode('register')} className="w-full py-3.5 px-4 border border-dashed border-blue-200 bg-blue-50/10 rounded-xl text-blue-600 text-[10px] font-bold tracking-wider flex justify-between items-center hover:bg-blue-50 hover:border-blue-300 transition-all bg-transparent">
                                <div className="flex items-center gap-2">
                                    <UserPlus size={16} />
                                    <span>NOVO CADASTRO</span>
                                </div>
                                <ChevronRight size={14} />
                            </button>

                            <div className="space-y-2">
                                {isLoading ? (
                                    <div className="py-12 flex flex-col items-center gap-3 text-gray-300">
                                        <Loader2 className="animate-spin" size={24} />
                                        <p className="text-[9px] font-bold uppercase tracking-wider">Carregando...</p>
                                    </div>
                                ) : filtered.length === 0 ? (
                                    <div className="py-12 text-center opacity-40">
                                        <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Nenhum cliente encontrado</p>
                                    </div>
                                ) : filtered.map(c => (
                                    <button
                                        key={c._id || c.id}
                                        onClick={() => onSelect(c)}
                                        className="w-full bg-white border border-gray-100 p-4 rounded-xl flex items-center justify-between hover:border-blue-500 hover:shadow-md transition-all text-left group"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center text-gray-300 group-hover:bg-blue-50 group-hover:text-blue-500 transition-colors">
                                                <User size={18} />
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-gray-700 text-xs uppercase tracking-tight">{c.name}</h4>
                                                <p className="text-[9px] text-gray-400 font-bold mt-0.5 uppercase tracking-wide">{c.phone || c.cpf || 'Sem dados'}</p>
                                            </div>
                                        </div>
                                        <div className="text-right flex items-center gap-4">
                                            <div className="flex flex-col items-end">
                                                <div className="text-[8px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-lg uppercase flex items-center gap-1">
                                                    <Gift size={8} /> {c.loyaltyPoints || 0} PTS
                                                </div>
                                                <p className="text-[7px] text-gray-300 font-bold mt-1 uppercase">Fidelidade</p>
                                            </div>
                                            <ChevronRight size={14} className="text-gray-200 group-hover:text-blue-500 transition-colors" />
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

function FormInput({ label, value, onChange, placeholder, compulsory, icon }: any) {
    return (
        <div className="space-y-1.5 text-left">
            <label className="text-[9px] font-bold text-gray-400 tracking-wider ml-1">{label}</label>
            <div className="relative group">
                {icon && <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-blue-500 transition-colors">{icon}</div>}
                <input
                    className={`w-full bg-gray-50 border border-gray-100 rounded-xl ${icon ? 'pl-9' : 'px-3'} py-2.5 text-xs font-bold placeholder:text-gray-200 outline-none focus:bg-white focus:border-blue-500 transition-all`}
                    value={value}
                    onChange={e => onChange(e.target.value)}
                    placeholder={placeholder}
                    required={compulsory}
                />
            </div>
        </div>
    );
}
