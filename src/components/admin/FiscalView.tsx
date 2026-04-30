"use client";

import { FileText, Shield, AlertCircle, RefreshCw } from 'lucide-react';

interface FiscalViewProps {
    config: Record<string, unknown> | null;
    refreshConfig: () => Promise<void>;
}

export default function FiscalView({ config, refreshConfig }: FiscalViewProps) {
    const focusUrl = process.env.NEXT_PUBLIC_FOCUS_URL || 'https://api.focusnfe.com.br';

    return (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">Monitoramento Fiscal</h3>
                    <p className="text-xs text-gray-400 dark:text-[#555] mt-0.5">Integração SEFAZ / NFC-e</p>
                </div>
                <button
                    onClick={refreshConfig}
                    className="p-1.5 rounded-md text-gray-400 hover:text-orange-600 hover:bg-gray-100 dark:hover:bg-[#1a1a1a] transition-all border-none bg-transparent cursor-pointer"
                >
                    <RefreshCw size={15} />
                </button>
            </div>

            {/* Status cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="bg-white dark:bg-[#0a0a0a] border border-gray-100 dark:border-[#1a1a1a] p-4 rounded-lg flex items-center gap-3 shadow-sm dark:shadow-none">
                    <div className="p-2 bg-emerald-50 dark:bg-emerald-500/10 rounded-md text-emerald-600 dark:text-emerald-500 shrink-0">
                        <Shield size={16} />
                    </div>
                    <div>
                        <p className="text-xs text-gray-400 dark:text-[#555]">Status SEFAZ</p>
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Operacional</p>
                    </div>
                </div>
                <div className="bg-white dark:bg-[#0a0a0a] border border-gray-100 dark:border-[#1a1a1a] p-4 rounded-lg flex items-center gap-3 shadow-sm dark:shadow-none">
                    <div className="p-2 bg-blue-50 dark:bg-blue-500/10 rounded-md text-blue-600 dark:text-blue-500 shrink-0">
                        <FileText size={16} />
                    </div>
                    <div>
                        <p className="text-xs text-gray-400 dark:text-[#555]">Ambiente</p>
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Produção</p>
                    </div>
                </div>
                <div className="bg-white dark:bg-[#0a0a0a] border border-gray-100 dark:border-[#1a1a1a] p-4 rounded-lg flex items-center gap-3 shadow-sm dark:shadow-none">
                    <div className="p-2 bg-orange-50 dark:bg-orange-500/10 rounded-md text-orange-600 dark:text-orange-500 shrink-0">
                        <AlertCircle size={16} />
                    </div>
                    <div>
                        <p className="text-xs text-gray-400 dark:text-[#555]">Certificado</p>
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Válido 11m</p>
                    </div>
                </div>
            </div>

            {/* Emitter config */}
            <div className="bg-white dark:bg-[#0a0a0a] border border-gray-100 dark:border-[#1a1a1a] rounded-lg overflow-hidden shadow-sm dark:shadow-none">
                <div className="px-4 py-3 border-b border-gray-100 dark:border-[#1a1a1a] flex items-center gap-2">
                    <FileText size={14} className="text-orange-600" />
                    <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Configuração do Emitente</span>
                </div>
                <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                        <div>
                            <p className="text-xs text-gray-400 dark:text-[#555]">Razão Social</p>
                            <p className="text-xs font-medium text-gray-900 dark:text-gray-100 mt-0.5">{(config?.razaoSocial as string) || 'Não configurado'}</p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-400 dark:text-[#555]">CNPJ</p>
                            <p className="text-xs font-medium text-gray-900 dark:text-gray-100 mt-0.5">{(config?.cnpj as string) || '00.000.000/0000-00'}</p>
                        </div>
                    </div>
                    <div className="space-y-4">
                        <div>
                            <p className="text-xs text-gray-400 dark:text-[#555]">Inscrição Estadual</p>
                            <p className="text-xs font-medium text-gray-900 dark:text-gray-100 mt-0.5">{(config?.inscricaoEstadual as string) || 'Isento'}</p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-400 dark:text-[#555]">Endpoint SEFAZ</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 break-all">{focusUrl}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Alert */}
            <div className="p-4 bg-orange-50 dark:bg-orange-600/5 border border-orange-100 dark:border-orange-500/20 rounded-lg flex items-start gap-3">
                <AlertCircle className="text-orange-600 dark:text-orange-500 shrink-0 mt-0.5" size={15} />
                <div>
                    <p className="text-xs font-medium text-orange-800 dark:text-orange-500 mb-0.5">Avisos do Sistema</p>
                    <p className="text-xs text-orange-700/80 dark:text-[#888]">O sistema está operando em conformidade com as normas da SEFAZ-MG. Mantenha o Bridge local ativo para impressão de DANFE NFC-e.</p>
                </div>
            </div>
        </div>
    );
}
