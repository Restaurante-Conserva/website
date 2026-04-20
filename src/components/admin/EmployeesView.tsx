"use client";

import { useState } from 'react';
import { Shield, User, Lock, Trash2, Plus, Loader2 } from 'lucide-react';

interface EmployeesViewProps {
    employees: any[];
    refreshEmployees: () => Promise<void>;
}

export default function EmployeesView({ employees, refreshEmployees }: EmployeesViewProps) {
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

    const handleDelete = async (id: string) => {
        if (!confirm('Excluir este funcionário?')) return;
        await fetch(`/api/employees?id=${id}`, { method: 'DELETE' });
        await refreshEmployees();
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-widest italic">Equipe de Operação</h3>
                <p className="text-[9px] text-[#444] font-medium uppercase mt-0.5">Controle de acesso e permissões</p>
            </div>

            <div className="bg-[#111] border border-[#1a1a1a] p-5 rounded-xl grid grid-cols-1 md:grid-cols-4 gap-4 items-end shadow-lg">
                <div className="space-y-2">
                    <label className="text-[9px] font-bold text-[#333] uppercase ml-1 tracking-widest">Nome do Operador</label>
                    <input className="w-full bg-[#0a0a0a] border border-[#222] rounded-lg px-4 py-2 text-xs outline-none focus:border-orange-500 text-white" value={newEmp.name} onChange={e => setNewEmp({...newEmp, name: e.target.value})} />
                </div>
                <div className="space-y-2">
                    <label className="text-[9px] font-bold text-[#333] uppercase ml-1 tracking-widest">PIN / Senha</label>
                    <input className="w-full bg-[#0a0a0a] border border-[#222] rounded-lg px-4 py-2 text-xs outline-none focus:border-orange-500 text-center font-black tracking-widest text-white" type="password" value={newEmp.password} onChange={e => setNewEmp({...newEmp, password: e.target.value})} />
                </div>
                <div className="space-y-2">
                    <label className="text-[9px] font-bold text-[#333] uppercase ml-1 tracking-widest">Cargo</label>
                    <select className="w-full bg-[#0a0a0a] border border-[#222] rounded-lg px-3 py-2 text-[10px] font-bold outline-none text-white uppercase" value={newEmp.role} onChange={e => setNewEmp({...newEmp, role: e.target.value})}>
                        <option value="cashier">CASHIER (CAIXA)</option>
                        <option value="manager">MANAGER (GERENTE)</option>
                        <option value="admin">ADMIN (ADMINISTRADOR)</option>
                    </select>
                </div>
                <button 
                    onClick={handleAdd} 
                    disabled={isCreating || !newEmp.name}
                    className="bg-orange-600 text-white px-4 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-orange-500 disabled:opacity-50 transition-all flex items-center justify-center gap-2 h-[38px]"
                >
                    {isCreating ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />} Adicionar
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {employees.map(emp => (
                    <div key={emp.id || emp._id} className="bg-[#111] border border-[#1a1a1a] p-5 rounded-xl group hover:border-[#333] transition-all relative overflow-hidden">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-4">
                                <div className={`w-12 h-12 rounded-lg flex items-center justify-center border transition-all ${emp.role === 'admin' ? 'bg-orange-500/10 border-orange-500/20 text-orange-500' : 'bg-[#1a1a1a] border-[#222] text-[#333] group-hover:text-white group-hover:border-white/10'}`}>
                                    {emp.role === 'admin' ? <Shield size={24} /> : <User size={24} />}
                                </div>
                                <div>
                                    <h4 className="text-sm font-bold text-white truncate uppercase italic tracking-tight">{emp.name}</h4>
                                    <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full border ${emp.role === 'admin' ? 'bg-orange-600 text-white border-orange-400' : 'bg-[#0a0a0a] text-[#444] border-[#1a1a1a]'}`}>
                                        {emp.role}
                                    </span>
                                </div>
                            </div>
                            <button onClick={() => handleDelete(emp.id || emp._id)} className="p-2 text-[#222] hover:text-red-500 transition-colors"><Trash2 size={16} /></button>
                        </div>
                        <div className="flex items-center gap-2 mt-4 pt-4 border-t border-[#1a1a1a]">
                            <Lock size={12} className="text-[#222]" />
                            <span className="text-[10px] font-black tracking-widest text-[#222] group-hover:text-[#444] transition-colors uppercase">Acesso Bloqueado (PIN)</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
