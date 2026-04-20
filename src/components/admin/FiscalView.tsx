"use client";

import { FileText, Shield, AlertCircle, RefreshCw } from 'lucide-react';

interface FiscalViewProps {
    config: any;
    refreshConfig: () => Promise<void>;
}

export default function FiscalView({ config, refreshConfig }: FiscalViewProps) {
    const focusUrl = process.env.NEXT_PUBLIC_FOCUS_URL || 'https://api.focusnfe.com.br';
    
    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-sm font-bold text-white uppercase tracking-widest italic">Monitoramento Fiscal</h3>
                    <p className="text-[9px] text-[#444] font-medium uppercase mt-0.5">Integração SEFAZ / NFC-e</p>
                </div>
                <button onClick={refreshConfig} className="p-2 text-[#222] hover:text-orange-500 transition-colors"><RefreshCw size={16} /></button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-[#111] border border-[#1a1a1a] p-5 rounded-xl flex items-center gap-4 relative overflow-hidden group">
                    <div className="p-3 bg-green-500/10 rounded-lg text-green-500"><Shield size={20} /></div>
                    <div>
                        <p className="text-[10px] font-bold text-[#333] uppercase tracking-widest">Status SEFAZ</p>
                        <h4 className="text-xs font-black text-white italic tracking-tight uppercase">OPERACIONAL</h4>
                    </div>
                    <div className="absolute top-0 right-0 w-1 h-full bg-green-500/20" />
                </div>
                <div className="bg-[#111] border border-[#1a1a1a] p-5 rounded-xl flex items-center gap-4 relative overflow-hidden group">
                    <div className="p-3 bg-blue-500/10 rounded-lg text-blue-500"><FileText size={20} /></div>
                    <div>
                        <p className="text-[10px] font-bold text-[#333] uppercase tracking-widest">Ambiente</p>
                        <h4 className="text-xs font-black text-white italic tracking-tight uppercase">PRODUÇÃO</h4>
                    </div>
                </div>
                <div className="bg-[#111] border border-[#1a1a1a] p-5 rounded-xl flex items-center gap-4 relative overflow-hidden group">
                    <div className="p-3 bg-orange-500/10 rounded-lg text-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.1)]"><AlertCircle size={20} /></div>
                    <div>
                        <p className="text-[10px] font-bold text-[#333] uppercase tracking-widest">Certificado</p>
                        <h4 className="text-xs font-black text-white italic tracking-tight uppercase">VÁLIDO 11M</h4>
                    </div>
                </div>
            </div>

            <div className="bg-[#0a0a0a] border border-[#1a1a1a] p-6 rounded-xl space-y-4 shadow-2xl">
                <div className="flex items-center gap-2 mb-4">
                    <FileText size={16} className="text-orange-600" />
                    <h4 className="text-[10px] font-black text-white uppercase tracking-widest">Configuração do Emitente</h4>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                        <div className="flex flex-col gap-1">
                            <label className="text-[8px] font-black text-[#222] uppercase tracking-[0.2em]">Razão Social</label>
                            <p className="text-[11px] font-bold text-[#888] italic">{config?.razaoSocial || 'NÃO CONFIGURADO'}</p>
                        </div>
                        <div className="flex flex-col gap-1">
                            <label className="text-[8px] font-black text-[#222] uppercase tracking-[0.2em]">CNPJ</label>
                            <p className="text-[11px] font-bold text-[#888] italic">{config?.cnpj || '00.000.000/0000-00'}</p>
                        </div>
                    </div>
                    <div className="space-y-4">
                        <div className="flex flex-col gap-1">
                            <label className="text-[8px] font-black text-[#222] uppercase tracking-[0.2em]">Inscrição Estadual</label>
                            <p className="text-[11px] font-bold text-[#888] italic">{config?.inscricaoEstadual || 'ISENTO'}</p>
                        </div>
                        <div className="flex flex-col gap-1">
                            <label className="text-[8px] font-black text-[#222] uppercase tracking-[0.2em]">Endpoint SEFAZ</label>
                            <p className="text-[9px] font-bold text-[#333] break-all opacity-50">{focusUrl}</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="p-4 bg-orange-600/5 border border-orange-500/20 rounded-xl flex items-start gap-4">
                <AlertCircle className="text-orange-500 shrink-0 mt-0.5" size={16} />
                <div>
                    <h5 className="text-[10px] font-black text-orange-500 uppercase tracking-widest mb-1">Avisos do Sistema</h5>
                    <p className="text-[11px] font-medium text-[#555] leading-relaxed">O sistema está operando em conformidade com as normas da SEFAZ-MG. Certifique-se de manter o Bridge local ativo para impressão automática de DANFE NFC-e.</p>
                </div>
            </div>
        </div>
    );
}
