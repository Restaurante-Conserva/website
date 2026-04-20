"use client";

import { Search, User, Phone, MapPin, Receipt, Trash2 } from 'lucide-react';

interface CustomersViewProps {
    customers: any[];
    onSelectDebt: (c: any) => void;
    onDelete: (id: string) => Promise<void>;
    onRegister: () => void;
}

export default function CustomersView({ customers, onSelectDebt, onDelete, onRegister }: CustomersViewProps) {
    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-sm font-bold text-white uppercase tracking-widest italic">Base de Clientes</h3>
                    <p className="text-[9px] text-[#444] font-medium uppercase mt-0.5">Gestão de CRM e Crédito</p>
                </div>
                <button 
                    onClick={onRegister}
                    className="bg-orange-600 text-white px-5 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-orange-500 transition-all shadow-lg shadow-orange-900/10"
                >
                    Novo Cliente
                </button>
            </div>

            <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#333] group-focus-within:text-orange-500 transition-colors" size={16} />
                <input 
                    className="w-full bg-[#111] border border-[#1a1a1a] rounded-xl pl-12 pr-4 py-3 text-xs outline-none focus:border-orange-500/50 text-white transition-all placeholder:text-[#222]" 
                    placeholder="BUSCAR POR NOME, CPF OU TELEFONE..." 
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {customers.map(c => (
                    <div key={c.id || c._id} className="bg-[#111] border border-[#1a1a1a] p-5 rounded-xl group hover:border-[#333] transition-all relative overflow-hidden">
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-[#1a1a1a] border border-[#222] rounded-lg flex items-center justify-center text-[#333] group-hover:text-white transition-all group-hover:border-orange-500/20">
                                    <User size={24} />
                                </div>
                                <div className="min-w-0">
                                    <h4 className="text-sm font-bold text-white truncate uppercase tracking-tight italic">{c.name}</h4>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="text-[8px] font-black text-[#333] uppercase tracking-widest px-1.5 py-0.5 bg-[#0a0a0a] rounded border border-[#1a1a1a]">Fidelidade</span>
                                        <span className="text-[9px] font-black text-orange-500">{c.loyaltyPoints || 0} PTS</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2.5 mb-5">
                            <div className="flex items-center gap-2 text-[#444] group-hover:text-[#666] transition-colors">
                                <Phone size={12} className="text-[#222]" />
                                <span className="text-[10px] font-bold tracking-tight">{c.phone || 'NÃO INFORMADO'}</span>
                            </div>
                            <div className="flex items-center gap-2 text-[#444] group-hover:text-[#666] transition-colors">
                                <MapPin size={12} className="text-[#222]" />
                                <span className="text-[10px] font-bold tracking-tight truncate">{c.address?.street ? `${c.address.street}, ${c.address.number}` : 'ENDEREÇO PENDENTE'}</span>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <button 
                                onClick={() => onSelectDebt(c)}
                                className={`flex-1 flex items-center justify-between px-4 py-2.5 rounded-lg border transition-all ${
                                    (c.debtBalance || 0) > 0 
                                    ? 'bg-red-500/5 border-red-900/20 text-red-500 hover:bg-red-500/10' 
                                    : 'bg-[#1a1a1a]/50 border-[#222] text-[#444] hover:text-white hover:bg-[#1a1a1a]'
                                }`}
                            >
                                <div className="flex flex-col text-left">
                                    <span className="text-[7px] font-black uppercase tracking-widest opacity-60">Dívida Atual</span>
                                    <span className="text-xs font-black tabular-nums italic">R$ {(c.debtBalance || 0).toFixed(2)}</span>
                                </div>
                                <Receipt size={14} />
                            </button>
                            <button 
                                onClick={() => onDelete(c.id || c._id)}
                                className="p-3.5 bg-[#1a1a1a]/50 text-[#333] hover:text-red-500 rounded-lg border border-[#222] hover:border-red-900/20 transition-all opacity-0 group-hover:opacity-100"
                            >
                                <Trash2 size={14} />
                            </button>
                        </div>

                        {/* Background Decoration */}
                        <div className="absolute -bottom-4 -right-4 text-[#1a1a1a] opacity-10 group-hover:opacity-20 transition-opacity">
                            <User size={80} />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
