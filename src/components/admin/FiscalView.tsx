"use client";

import { useState } from 'react';
import { FileText, Shield, AlertCircle, RefreshCw, Save, Key, Building, Settings2 } from 'lucide-react';
import { useToast } from '@/context/ToastContext';

interface FiscalViewProps {
    config: any;
    refreshConfig: () => Promise<void>;
}

export default function FiscalView({ config, refreshConfig }: FiscalViewProps) {
    const { showToast } = useToast();
    const [isSaving, setIsSaving] = useState(false);
    
    // State for fiscal configs
    const [focusToken, setFocusToken] = useState(config?.fiscal?.focusToken || '');
    const [environment, setEnvironment] = useState(config?.fiscal?.environment || 'homologacao');
    
    const [cnpj, setCnpj] = useState(config?.fiscal?.cnpj_emitente || '');
    const [ie, setIe] = useState(config?.fiscal?.inscricao_estadual_emitente || '');
    const [razaoSocial, setRazaoSocial] = useState(config?.fiscal?.nome_emitente || '');
    const [nomeFantasia, setNomeFantasia] = useState(config?.fiscal?.nome_fantasia_emitente || '');
    const [regime, setRegime] = useState(config?.fiscal?.regime_tributario || '1');
    
    const [logradouro, setLogradouro] = useState(config?.fiscal?.logradouro_emitente || '');
    const [numero, setNumero] = useState(config?.fiscal?.numero_emitente || '');
    const [bairro, setBairro] = useState(config?.fiscal?.bairro_emitente || '');
    const [municipio, setMunicipio] = useState(config?.fiscal?.municipio_emitente || '');
    const [uf, setUf] = useState(config?.fiscal?.uf_emitente || '');
    const [cep, setCep] = useState(config?.fiscal?.cep_emitente || '');

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const fiscalData = {
                ...config?.fiscal,
                focusToken,
                environment,
                cnpj_emitente: cnpj,
                inscricao_estadual_emitente: ie,
                nome_emitente: razaoSocial,
                nome_fantasia_emitente: nomeFantasia,
                regime_tributario: regime,
                logradouro_emitente: logradouro,
                numero_emitente: numero,
                bairro_emitente: bairro,
                municipio_emitente: municipio,
                uf_emitente: uf,
                cep_emitente: cep
            };

            const response = await fetch('/api/config', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ fiscal: fiscalData })
            });

            if (response.ok) {
                showToast('Configurações fiscais salvas com sucesso!', 'success');
                await refreshConfig();
            } else {
                throw new Error('Falha ao salvar');
            }
        } catch (error) {
            console.error(error);
            showToast('Erro ao salvar configurações fiscais.', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const isProduction = environment === 'producao';

    return (
        <div className="space-y-4 pb-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">Monitoramento Fiscal (Focus NFE)</h3>
                    <p className="text-xs text-gray-400 dark:text-[#555] mt-0.5">Integração SEFAZ / NFC-e</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={refreshConfig}
                        className="p-1.5 rounded-md text-gray-400 hover:text-orange-600 hover:bg-gray-100 dark:hover:bg-[#1a1a1a] transition-all border-none bg-transparent cursor-pointer"
                    >
                        <RefreshCw size={15} />
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white px-3 py-1.5 rounded-md text-xs font-medium transition-colors disabled:opacity-50"
                    >
                        {isSaving ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
                        Salvar Configurações
                    </button>
                </div>
            </div>

            {/* Status cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="bg-white dark:bg-[#0a0a0a] border border-gray-100 dark:border-[#1a1a1a] p-4 rounded-lg flex items-center gap-3 shadow-sm dark:shadow-none">
                    <div className={`p-2 rounded-md shrink-0 ${focusToken ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-500' : 'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-500'}`}>
                        <Shield size={16} />
                    </div>
                    <div>
                        <p className="text-xs text-gray-400 dark:text-[#555]">Status Focus NFE</p>
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{focusToken ? 'Configurado' : 'Pendente'}</p>
                    </div>
                </div>
                <div className="bg-white dark:bg-[#0a0a0a] border border-gray-100 dark:border-[#1a1a1a] p-4 rounded-lg flex items-center gap-3 shadow-sm dark:shadow-none">
                    <div className={`p-2 rounded-md shrink-0 ${isProduction ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-500' : 'bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-500'}`}>
                        <FileText size={16} />
                    </div>
                    <div>
                        <p className="text-xs text-gray-400 dark:text-[#555]">Ambiente</p>
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{isProduction ? 'Produção' : 'Homologação'}</p>
                    </div>
                </div>
                <div className="bg-white dark:bg-[#0a0a0a] border border-gray-100 dark:border-[#1a1a1a] p-4 rounded-lg flex items-center gap-3 shadow-sm dark:shadow-none">
                    <div className="p-2 bg-purple-50 dark:bg-purple-500/10 rounded-md text-purple-600 dark:text-purple-500 shrink-0">
                        <Building size={16} />
                    </div>
                    <div>
                        <p className="text-xs text-gray-400 dark:text-[#555]">CNPJ Emissor</p>
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{cnpj || 'Não definido'}</p>
                    </div>
                </div>
            </div>

            {/* Emitter config Form */}
            <div className="bg-white dark:bg-[#0a0a0a] border border-gray-100 dark:border-[#1a1a1a] rounded-lg overflow-hidden shadow-sm dark:shadow-none">
                <div className="px-4 py-3 border-b border-gray-100 dark:border-[#1a1a1a] flex items-center gap-2 bg-gray-50/50 dark:bg-[#111]/50">
                    <Settings2 size={14} className="text-orange-600" />
                    <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Autenticação Focus NFE</span>
                </div>
                <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-1">
                            <Key size={12} /> Focus API Token
                        </label>
                        <input
                            type="password"
                            value={focusToken}
                            onChange={(e) => setFocusToken(e.target.value)}
                            placeholder="Insira o token gerado no painel da Focus NFE"
                            className="w-full px-3 py-2 text-sm bg-white dark:bg-[#0a0a0a] border border-gray-200 dark:border-[#222] rounded-md focus:outline-none focus:ring-1 focus:ring-orange-500"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Ambiente de Emissão
                        </label>
                        <select
                            value={environment}
                            onChange={(e) => setEnvironment(e.target.value)}
                            className="w-full px-3 py-2 text-sm bg-white dark:bg-[#0a0a0a] border border-gray-200 dark:border-[#222] rounded-md focus:outline-none focus:ring-1 focus:ring-orange-500"
                        >
                            <option value="homologacao">Homologação (Ambiente de Testes)</option>
                            <option value="producao">Produção (Ambiente Real / Validade Jurídica)</option>
                        </select>
                    </div>
                </div>
            </div>

            <div className="bg-white dark:bg-[#0a0a0a] border border-gray-100 dark:border-[#1a1a1a] rounded-lg overflow-hidden shadow-sm dark:shadow-none">
                <div className="px-4 py-3 border-b border-gray-100 dark:border-[#1a1a1a] flex items-center gap-2 bg-gray-50/50 dark:bg-[#111]/50">
                    <Building size={14} className="text-orange-600" />
                    <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Dados da Empresa (Emitente)</span>
                </div>
                <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">CNPJ</label>
                        <input type="text" value={cnpj} onChange={(e) => setCnpj(e.target.value)} placeholder="00.000.000/0000-00" className="w-full px-3 py-2 text-sm bg-white dark:bg-[#0a0a0a] border border-gray-200 dark:border-[#222] rounded-md focus:outline-none focus:ring-1 focus:ring-orange-500" />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Inscrição Estadual (IE)</label>
                        <input type="text" value={ie} onChange={(e) => setIe(e.target.value)} placeholder="Isento ou numeração" className="w-full px-3 py-2 text-sm bg-white dark:bg-[#0a0a0a] border border-gray-200 dark:border-[#222] rounded-md focus:outline-none focus:ring-1 focus:ring-orange-500" />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Razão Social</label>
                        <input type="text" value={razaoSocial} onChange={(e) => setRazaoSocial(e.target.value)} placeholder="Nome Oficial da Empresa LTDA" className="w-full px-3 py-2 text-sm bg-white dark:bg-[#0a0a0a] border border-gray-200 dark:border-[#222] rounded-md focus:outline-none focus:ring-1 focus:ring-orange-500" />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Nome Fantasia</label>
                        <input type="text" value={nomeFantasia} onChange={(e) => setNomeFantasia(e.target.value)} placeholder="Nome comercial" className="w-full px-3 py-2 text-sm bg-white dark:bg-[#0a0a0a] border border-gray-200 dark:border-[#222] rounded-md focus:outline-none focus:ring-1 focus:ring-orange-500" />
                    </div>
                    <div className="md:col-span-2">
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Regime Tributário</label>
                        <select value={regime} onChange={(e) => setRegime(e.target.value)} className="w-full px-3 py-2 text-sm bg-white dark:bg-[#0a0a0a] border border-gray-200 dark:border-[#222] rounded-md focus:outline-none focus:ring-1 focus:ring-orange-500">
                            <option value="1">Simples Nacional</option>
                            <option value="2">Simples Nacional - Excesso de Sublimite de Receita Bruta</option>
                            <option value="3">Regime Normal</option>
                        </select>
                    </div>
                </div>

                <div className="px-4 py-3 border-y border-gray-100 dark:border-[#1a1a1a] flex items-center gap-2 bg-gray-50/50 dark:bg-[#111]/50 mt-4">
                    <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Endereço do Emitente</span>
                </div>
                <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2">
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Logradouro (Rua/Avenida)</label>
                        <input type="text" value={logradouro} onChange={(e) => setLogradouro(e.target.value)} placeholder="Ex: Av. Principal" className="w-full px-3 py-2 text-sm bg-white dark:bg-[#0a0a0a] border border-gray-200 dark:border-[#222] rounded-md focus:outline-none focus:ring-1 focus:ring-orange-500" />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Número</label>
                        <input type="text" value={numero} onChange={(e) => setNumero(e.target.value)} placeholder="Ex: 123" className="w-full px-3 py-2 text-sm bg-white dark:bg-[#0a0a0a] border border-gray-200 dark:border-[#222] rounded-md focus:outline-none focus:ring-1 focus:ring-orange-500" />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Bairro</label>
                        <input type="text" value={bairro} onChange={(e) => setBairro(e.target.value)} placeholder="Ex: Centro" className="w-full px-3 py-2 text-sm bg-white dark:bg-[#0a0a0a] border border-gray-200 dark:border-[#222] rounded-md focus:outline-none focus:ring-1 focus:ring-orange-500" />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Município</label>
                        <input type="text" value={municipio} onChange={(e) => setMunicipio(e.target.value)} placeholder="Ex: São Paulo" className="w-full px-3 py-2 text-sm bg-white dark:bg-[#0a0a0a] border border-gray-200 dark:border-[#222] rounded-md focus:outline-none focus:ring-1 focus:ring-orange-500" />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">UF</label>
                            <input type="text" value={uf} onChange={(e) => setUf(e.target.value)} placeholder="Ex: SP" maxLength={2} className="w-full px-3 py-2 text-sm bg-white dark:bg-[#0a0a0a] border border-gray-200 dark:border-[#222] rounded-md focus:outline-none focus:ring-1 focus:ring-orange-500 uppercase" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">CEP</label>
                            <input type="text" value={cep} onChange={(e) => setCep(e.target.value)} placeholder="00000-000" className="w-full px-3 py-2 text-sm bg-white dark:bg-[#0a0a0a] border border-gray-200 dark:border-[#222] rounded-md focus:outline-none focus:ring-1 focus:ring-orange-500" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Alert */}
            <div className="p-4 bg-orange-50 dark:bg-orange-600/5 border border-orange-100 dark:border-orange-500/20 rounded-lg flex items-start gap-3">
                <AlertCircle className="text-orange-600 dark:text-orange-500 shrink-0 mt-0.5" size={15} />
                <div>
                    <p className="text-xs font-medium text-orange-800 dark:text-orange-500 mb-0.5">Integração Focus NFE</p>
                    <p className="text-xs text-orange-700/80 dark:text-[#888]">O Focus NFE exige que o CNPJ esteja habilitado na plataforma deles. Preencha todos os dados da empresa exatamente como constam no seu certificado digital e Sintegra para evitar rejeições na SEFAZ.</p>
                </div>
            </div>
        </div>
    );
}
