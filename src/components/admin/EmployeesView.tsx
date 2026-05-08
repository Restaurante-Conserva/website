"use client";

import { useState } from 'react';
import { Shield, User, Lock, Trash2, Plus, Loader2 } from 'lucide-react';

import { Employee } from '../../context/GlobalContext';

interface EmployeesViewProps {
    employees: Employee[];
    refreshEmployees: () => Promise<void>;
    onDelete: (id: string) => Promise<void>;
}

export default function EmployeesView({ employees, refreshEmployees, onDelete }: EmployeesViewProps) {
    const [newEmp, setNewEmp] = useState({ name: '', password: '', role: 'cashier' });
    const [isCreating, setIsCreating] = useState(false);

    const handleAdd = async () => {
        if (!newEmp.name || !newEmp.password) return;
        setIsCreating(true);
        try {
            await fetch('/api/employees', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'create', ...newEmp })
            });
            setNewEmp({ name: '', password: '', role: 'cashier' });
            await refreshEmployees();
        } finally {
            setIsCreating(false);
        }
    };

    const handleDeleteClick = async (id: string) => {
        await onDelete(id);
        refreshEmployees();
    };

    return (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Equipe de Operação</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Controle de acesso e permissões</p>
            </div>

            <div className="bg-white dark:bg-[#0a0a0a] border border-gray-100 dark:border-[#1a1a1a] p-3 rounded-lg grid grid-cols-1 md:grid-cols-4 gap-3 items-end shadow-sm dark:shadow-none">
                <div className="space-y-1.5">
                    <label className="text-xs font-medium text-gray-600 dark:text-gray-400">Nome do Operador</label>
                    <input className="w-full bg-gray-50 dark:bg-black border border-gray-200 dark:border-[#222] rounded-md px-3 py-1.5 text-xs outline-none focus:border-orange-500 text-gray-900 dark:text-gray-100" value={newEmp.name} onChange={e => setNewEmp({...newEmp, name: e.target.value})} />
                </div>
                <div className="space-y-1.5">
                    <label className="text-xs font-medium text-gray-600 dark:text-gray-400">PIN / Senha</label>
                    <input className="w-full bg-gray-50 dark:bg-black border border-gray-200 dark:border-[#222] rounded-md px-3 py-1.5 text-xs outline-none focus:border-orange-500 text-center text-gray-900 dark:text-gray-100" type="password" value={newEmp.password} onChange={e => setNewEmp({...newEmp, password: e.target.value})} />
                </div>
                <div className="space-y-1.5">
                    <label className="text-xs font-medium text-gray-600 dark:text-gray-400">Cargo</label>
                    <select className="w-full bg-gray-50 dark:bg-black border border-gray-200 dark:border-[#222] rounded-md px-2 py-1.5 text-xs outline-none text-gray-900 dark:text-gray-100 cursor-pointer" value={newEmp.role} onChange={e => setNewEmp({...newEmp, role: e.target.value})}>
                        <option value="cashier">Caixa</option>
                        <option value="manager">Gerente</option>
                        <option value="admin">Administrador</option>
                    </select>
                </div>
                <button 
                    onClick={handleAdd} 
                    disabled={isCreating || !newEmp.name}
                    className="bg-orange-600/90 text-white px-4 py-1.5 rounded-md text-xs font-medium hover:bg-orange-500 disabled:opacity-50 transition-all flex items-center justify-center gap-1.5 h-[30px] cursor-pointer border-none"
                >
                    {isCreating ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />} Adicionar
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {employees.map(emp => (
                    <div key={emp._id} className="bg-white dark:bg-[#0a0a0a] border border-gray-100 dark:border-[#1a1a1a] rounded-lg p-4 flex items-center justify-between shadow-sm dark:shadow-none transition-all hover:border-orange-500/20 group">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-orange-50 dark:bg-orange-500/10 flex items-center justify-center text-orange-600 dark:text-orange-500">
                                <User size={18} />
                            </div>
                            <div>
                                <span className="text-sm font-medium text-gray-900 dark:text-gray-100 block">{emp.name}</span>
                                <div className="inline-flex items-center gap-1 mt-1 text-[10px] font-black uppercase tracking-wider text-gray-500 dark:text-[#666]">
                                    <Shield size={10} /> {emp.role}
                                </div>
                            </div>
                        </div>
                        <button 
                            onClick={() => handleDeleteClick(emp._id ?? '')} 
                            className="p-2 text-gray-400 dark:text-[#333] hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-md transition-all opacity-100 lg:opacity-0 group-hover:opacity-100 cursor-pointer border-none bg-transparent"
                            title="Remover Operador"
                        >
                            <Trash2 size={16} />
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}
