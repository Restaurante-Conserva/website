"use client";

import { Search, User, Phone, MapPin, Receipt, Trash2, Plus } from 'lucide-react';
import { Customer } from '../../context/GlobalContext';

interface CustomersViewProps {
    customers: Customer[];
    onDebt: (c: Customer) => void;
    onDelete: (id: string) => Promise<void>;
    onRegister: () => void;
}
 
export default function CustomersView({ customers, onDebt, onDelete, onRegister }: CustomersViewProps) {
    return (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Clientes</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Gestão de CRM e Crédito</p>
                </div>
                <button 
                    onClick={onRegister}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-600/90 hover:bg-orange-500 text-white rounded-md text-xs font-medium transition-all border-none cursor-pointer"
                >
                    <Plus size={14} /> Novo Cliente
                </button>
            </div>

            <div className="relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-[#555] group-focus-within:text-orange-500 transition-colors" size={14} />
                <input 
                    className="w-full bg-gray-50 dark:bg-black border border-gray-200 dark:border-[#222] rounded-md pl-9 pr-3 py-1.5 text-xs outline-none focus:border-orange-500/50 text-gray-900 dark:text-gray-100 transition-all placeholder:text-gray-400 dark:placeholder:text-[#555]" 
                    placeholder="Buscar por nome, CPF ou telefone..." 
                />
            </div>

            <div className="border border-gray-100 dark:border-[#1a1a1a] rounded-lg overflow-hidden bg-white dark:bg-[#0a0a0a] shadow-sm dark:shadow-none">
                <table className="w-full text-left text-xs">
                    <thead className="bg-gray-50 dark:bg-[#111] border-b border-gray-100 dark:border-[#1a1a1a] text-gray-500 dark:text-gray-400 font-medium">
                        <tr>
                            <th className="px-4 py-2.5 font-medium">Cliente</th>
                            <th className="px-4 py-2.5 font-medium">Contato</th>
                            <th className="px-4 py-2.5 font-medium">Endereço</th>
                            <th className="px-4 py-2.5 font-medium text-right">Saldo Devedor</th>
                            <th className="px-4 py-2.5 font-medium text-right">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 dark:divide-[#1a1a1a]">
                        {customers.map(c => (
                            <tr key={c._id} className="hover:bg-gray-50/50 dark:hover:bg-[#111] group transition-colors">
                                <td className="px-4 py-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-7 h-7 rounded-md bg-gray-50 dark:bg-[#1a1a1a] border border-gray-100 dark:border-[#222] flex items-center justify-center text-gray-400 dark:text-[#555] group-hover:border-orange-200 dark:group-hover:border-orange-500/30 transition-all">
                                            <User size={14} />
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-900 dark:text-gray-100">{c.name}</p>
                                            <p className="text-[10px] text-gray-500 dark:text-gray-400">{c.loyaltyPoints || 0} pts fidelidade</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-4 py-3">
                                    <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
                                        <Phone size={12} className="opacity-50" />
                                        <span>{c.phone || '—'}</span>
                                    </div>
                                </td>
                                <td className="px-4 py-3">
                                    <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400 max-w-[180px] truncate">
                                        <MapPin size={12} className="opacity-50 shrink-0" />
                                        <span className="truncate">{c.address?.street ? `${c.address.street}, ${c.address.number}` : '—'}</span>
                                    </div>
                                </td>
                                <td className="px-4 py-3 text-right">
                                    <span className={`font-medium tabular-nums ${ (c.debtBalance || 0) > 0 ? 'text-red-600 dark:text-red-500' : 'text-gray-400 dark:text-[#444]'}`}>
                                        R$ {(c.debtBalance || 0).toFixed(2)}
                                    </span>
                                </td>
                                <td className="px-4 py-3 text-right">
                                    <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-all">
                                        <button 
                                            onClick={() => onDebt(c)}
                                            className="p-1.5 bg-gray-50 dark:bg-black text-gray-500 dark:text-[#666] hover:text-orange-500 rounded-md border border-gray-200 dark:border-[#222] hover:border-orange-200 dark:hover:border-orange-500/30 cursor-pointer"
                                            title="Ver Fiados"
                                        >
                                            <Receipt size={14} />
                                        </button>
                                        <button 
                                            onClick={() => onDelete(c._id)}
                                            className="p-1.5 bg-gray-50 dark:bg-black text-gray-500 dark:text-[#666] hover:text-red-600 dark:hover:text-red-500 rounded-md border border-gray-200 dark:border-[#222] hover:border-red-200 dark:hover:border-[#333] cursor-pointer"
                                            title="Excluir"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {customers.length === 0 && (
                            <tr>
                                <td colSpan={5} className="px-4 py-10 text-center text-gray-400 dark:text-[#333]">
                                    Nenhum cliente cadastrado
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
