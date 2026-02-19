"use client";

import { useState } from 'react';
import { User, MapPin, Mail, Phone, CreditCard, Save } from 'lucide-react';

export default function CustomersPage() {
    const [formData, setFormData] = useState({
        name: '',
        cpf: '',
        email: '',
        phone: '',
        cep: '',
        address: '',
        number: '',
        city: '',
        state: ''
    });
    const [loading, setLoading] = useState(false);
    const [cepLoading, setCepLoading] = useState(false);

    const handleCepBlur = async () => {
        if (formData.cep.length === 8) {
            setCepLoading(true);
            try {
                const res = await fetch(`https://viacep.com.br/ws/${formData.cep}/json/`);
                const data = await res.json();
                if (!data.erro) {
                    setFormData(prev => ({
                        ...prev,
                        address: data.logradouro,
                        city: data.localidade,
                        state: data.uf
                    }));
                }
            } catch (err) {
                console.error("CEP Error", err);
            } finally {
                setCepLoading(false);
            }
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        // Call API to save (Need to implement /api/customers)
        try {
            await fetch('/api/customers', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            alert('Cliente cadastrado com sucesso!');
            setFormData({ name: '', cpf: '', email: '', phone: '', cep: '', address: '', number: '', city: '', state: '' });
        } catch (err) {
            alert('Erro ao salvar');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex h-screen bg-neutral-950 text-white">
            {/* Sidebar placeholder - using partial import or mocked div if not exists */}
            <div className="w-64 bg-neutral-900 border-r border-neutral-800 p-4">
                <h1 className="text-xl font-bold mb-8 pl-2">Conserva</h1>
                <nav className="space-y-2">
                    <a href="/" className="block px-4 py-2 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800">Vendas (PDV)</a>
                    <a href="/customers" className="block px-4 py-2 rounded-lg bg-neutral-800 text-white">Clientes</a>
                    <a href="/test-print" className="block px-4 py-2 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800">Teste Impressora</a>
                </nav>
            </div>

            <main className="flex-1 p-8 overflow-y-auto">
                <header className="mb-8">
                    <h1 className="text-3xl font-bold mb-2">Novo Cliente</h1>
                    <p className="text-neutral-400">Cadastre as informações para fidelidade e nota fiscal.</p>
                </header>

                <form onSubmit={handleSubmit} className="max-w-4xl bg-neutral-900 border border-neutral-800 rounded-2xl p-8 shadow-xl">
                    {/* Personal Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-neutral-400 flex items-center gap-2">
                                <User size={16} /> Nome Completo *
                            </label>
                            <input
                                required
                                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-3 focus:border-blue-500 outline-none transition-colors"
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-neutral-400 flex items-center gap-2">
                                <CreditCard size={16} /> CPF
                            </label>
                            <input
                                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-3 focus:border-blue-500 outline-none transition-colors"
                                placeholder="000.000.000-00"
                                value={formData.cpf}
                                onChange={e => setFormData({ ...formData, cpf: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-neutral-400 flex items-center gap-2">
                                <Mail size={16} /> Email
                            </label>
                            <input
                                type="email"
                                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-3 focus:border-blue-500 outline-none transition-colors"
                                value={formData.email}
                                onChange={e => setFormData({ ...formData, email: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-neutral-400 flex items-center gap-2">
                                <Phone size={16} /> Telefone
                            </label>
                            <input
                                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-3 focus:border-blue-500 outline-none transition-colors"
                                value={formData.phone}
                                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                            />
                        </div>
                    </div>

                    {/* Address */}
                    <h2 className="text-lg font-semibold mb-4 text-neutral-300 border-b border-neutral-800 pb-2">Endereço</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-neutral-400 flex items-center gap-2">
                                <MapPin size={16} /> CEP
                            </label>
                            <div className="relative">
                                <input
                                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-3 focus:border-blue-500 outline-none transition-colors"
                                    value={formData.cep}
                                    onChange={e => setFormData({ ...formData, cep: e.target.value })}
                                    onBlur={handleCepBlur}
                                    placeholder="00000000"
                                />
                                {cepLoading && <div className="absolute right-3 top-3.5 animate-spin w-4 h-4 border-2 border-blue-500 rounded-full border-t-transparent"></div>}
                            </div>
                        </div>
                        <div className="col-span-2 space-y-2">
                            <label className="text-sm font-medium text-neutral-400">Rua / Logradouro</label>
                            <input
                                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-3 focus:border-blue-500 outline-none transition-colors"
                                value={formData.address}
                                onChange={e => setFormData({ ...formData, address: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-neutral-400">Número</label>
                            <input
                                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-3 focus:border-blue-500 outline-none transition-colors"
                                value={formData.number}
                                onChange={e => setFormData({ ...formData, number: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-neutral-400">Cidade</label>
                            <input
                                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-3 focus:border-blue-500 outline-none transition-colors"
                                value={formData.city}
                                onChange={e => setFormData({ ...formData, city: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-neutral-400">Estado</label>
                            <input
                                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-3 focus:border-blue-500 outline-none transition-colors"
                                value={formData.state}
                                onChange={e => setFormData({ ...formData, state: e.target.value })}
                            />
                        </div>
                    </div>

                    <button
                        disabled={loading}
                        className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold transition-all shadow-lg shadow-blue-500/20 active:scale-[0.99] flex items-center justify-center gap-2"
                    >
                        <Save size={20} />
                        {loading ? 'Salvando...' : 'Cadastrar Cliente'}
                    </button>
                </form>
            </main>
        </div>
    );
}
