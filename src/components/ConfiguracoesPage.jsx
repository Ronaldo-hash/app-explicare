import React, { useState, useEffect } from 'react';
import { Upload, Image as ImageIcon, Save, Loader2, Check, AlertCircle, RefreshCw, Settings, Play, Palette, Building2, Sparkles, ChevronRight } from 'lucide-react';
import { HelpTooltip, HELP_TEXTS } from './HelpTooltip';
import { useWhitelabel } from '../context/WhitelabelContext';

export function ConfiguracoesPage({ supabase, onResetTour }) {
    const { refresh: refreshWhitelabel } = useWhitelabel();
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState(null);

    const [config, setConfig] = useState({
        company_name: 'Tecnologia & Estratégia Jurídica',
        logo_url: null,
        background_url: null
    });

    const [logoPreview, setLogoPreview] = useState(null);
    const [bgPreview, setBgPreview] = useState(null);
    const [logoFile, setLogoFile] = useState(null);
    const [bgFile, setBgFile] = useState(null);

    useEffect(() => {
        loadConfig();
    }, []);

    const loadConfig = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('whitelabel_config')
                .select('*')
                .single();

            if (data) {
                setConfig({
                    company_name: data.company_name || config.company_name,
                    logo_url: data.logo_url,
                    background_url: data.background_url
                });
                if (data.logo_url) setLogoPreview(data.logo_url);
                if (data.background_url) setBgPreview(data.background_url);
            }
        } catch (err) {
            console.log('Config not found, using defaults');
        } finally {
            setLoading(false);
        }
    };

    const handleLogoChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setLogoFile(file);
            setLogoPreview(URL.createObjectURL(file));
        }
    };

    const handleBgChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setBgFile(file);
            setBgPreview(URL.createObjectURL(file));
        }
    };

    const handleSave = async () => {
        setSaving(true);
        setError(null);
        setSuccess(false);

        try {
            let logoUrl = config.logo_url;
            let bgUrl = config.background_url;

            if (logoFile) {
                const logoPath = `whitelabel/logo_${Date.now()}.${logoFile.name.split('.').pop()}`;
                const { error: uploadError } = await supabase.storage
                    .from('assets')
                    .upload(logoPath, logoFile, { upsert: true });

                if (uploadError) throw uploadError;

                const { data } = supabase.storage.from('assets').getPublicUrl(logoPath);
                logoUrl = data.publicUrl;
            }

            if (bgFile) {
                const bgPath = `whitelabel/bg_${Date.now()}.${bgFile.name.split('.').pop()}`;
                const { error: uploadError } = await supabase.storage
                    .from('assets')
                    .upload(bgPath, bgFile, { upsert: true });

                if (uploadError) throw uploadError;

                const { data } = supabase.storage.from('assets').getPublicUrl(bgPath);
                bgUrl = data.publicUrl;
            }

            const configData = {
                company_name: config.company_name,
                logo_url: logoUrl,
                background_url: bgUrl,
                updated_at: new Date().toISOString()
            };

            const { error: dbError } = await supabase
                .from('whitelabel_config')
                .upsert([{ id: 1, ...configData }]);

            if (dbError) throw dbError;

            setConfig(prev => ({ ...prev, logo_url: logoUrl, background_url: bgUrl }));
            setSuccess(true);
            // Refresh the global whitelabel context so all components update immediately
            await refreshWhitelabel();
            setTimeout(() => setSuccess(false), 4000);

        } catch (err) {
            console.error('Erro ao salvar:', err);
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
                {/* Skeleton header */}
                <div className="skeleton-card">
                    <div className="skeleton skeleton-title w-1/3"></div>
                    <div className="skeleton skeleton-text w-2/3"></div>
                </div>
                {/* Skeleton cards */}
                {[1, 2, 3].map(i => (
                    <div key={i} className={`skeleton-card animate-fade-in-up stagger-${i}`}>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="skeleton skeleton-avatar"></div>
                            <div className="flex-1">
                                <div className="skeleton skeleton-title"></div>
                            </div>
                        </div>
                        <div className="skeleton h-12 w-full rounded-xl"></div>
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div className="animate-fade-in max-w-3xl mx-auto">
            {/* Header Premium */}
            <div className="card-premium mb-8 animate-fade-in-up">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#1e3a5f] to-[#0d1f33] flex items-center justify-center shadow-lg shadow-[#1e3a5f]/20">
                        <Settings size={22} className="text-[#c9a857]" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-xl font-semibold text-white">Configurações</h1>
                            <HelpTooltip title={HELP_TEXTS.configuracoes.title} content={HELP_TEXTS.configuracoes.content} position="right" />
                        </div>
                        <p className="text-zinc-500 text-sm mt-0.5">Personalize a identidade visual e aparência do seu portal</p>
                    </div>
                </div>
            </div>

            {/* Status Messages */}
            {success && (
                <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center gap-3 text-emerald-400 text-sm animate-fade-in-up">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/15 flex items-center justify-center flex-shrink-0">
                        <Check size={16} />
                    </div>
                    <div>
                        <p className="font-medium">Salvo com sucesso!</p>
                        <p className="text-emerald-400/70 text-xs mt-0.5">As configurações foram atualizadas</p>
                    </div>
                </div>
            )}
            {error && (
                <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-400 text-sm animate-fade-in-up">
                    <div className="w-8 h-8 rounded-lg bg-red-500/15 flex items-center justify-center flex-shrink-0">
                        <AlertCircle size={16} />
                    </div>
                    <div>
                        <p className="font-medium">Erro ao salvar</p>
                        <p className="text-red-400/70 text-xs mt-0.5">{error}</p>
                    </div>
                </div>
            )}

            <div className="space-y-5">

                {/* Identidade da Empresa */}
                <div className="card-law animate-fade-in-up stagger-1">
                    <div className="flex items-center gap-3 mb-5">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#1e3a5f] to-[#0d1f33] flex items-center justify-center">
                            <Building2 size={18} className="text-[#c9a857]" />
                        </div>
                        <div>
                            <h2 className="text-base font-medium text-white">Identidade</h2>
                            <p className="text-zinc-500 text-xs">Nome que aparece para seus clientes</p>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider flex items-center gap-1.5">
                            <Sparkles size={12} className="text-[#c9a857]/50" />
                            Nome da Empresa
                        </label>
                        <input
                            type="text"
                            value={config.company_name}
                            onChange={(e) => setConfig(prev => ({ ...prev, company_name: e.target.value }))}
                            className="input-premium focus-gold"
                            placeholder="Nome da sua empresa"
                        />
                    </div>
                </div>

                {/* Logo Upload */}
                <div className="card-law animate-fade-in-up stagger-2">
                    <div className="flex items-center gap-3 mb-5">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#1e3a5f] to-[#0d1f33] flex items-center justify-center">
                            <Upload size={18} className="text-[#c9a857]" />
                        </div>
                        <div>
                            <h2 className="text-base font-medium text-white">Logo da Empresa</h2>
                            <p className="text-zinc-500 text-xs">Exibido no portal e documentos</p>
                        </div>
                    </div>
                    <div
                        className="group border-2 border-dashed border-zinc-700/50 rounded-xl p-6 text-center cursor-pointer hover:border-[#c9a857]/40 hover:bg-[#c9a857]/[0.02] transition-all duration-300"
                        onClick={() => document.getElementById('logo-upload').click()}
                    >
                        <input
                            type="file"
                            id="logo-upload"
                            accept="image/*"
                            className="hidden"
                            onChange={handleLogoChange}
                        />
                        {logoPreview ? (
                            <div className="space-y-3">
                                <div className="w-20 h-20 mx-auto rounded-xl bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden p-2">
                                    <img
                                        src={logoPreview}
                                        alt="Logo"
                                        className="max-h-full max-w-full object-contain"
                                    />
                                </div>
                                <p className="text-xs text-zinc-500 group-hover:text-[#c9a857]/70 transition-colors">Clique para trocar</p>
                            </div>
                        ) : (
                            <div className="space-y-3 py-2">
                                <div className="w-14 h-14 mx-auto rounded-xl bg-zinc-800/50 border border-zinc-700/50 flex items-center justify-center group-hover:border-[#c9a857]/30 group-hover:bg-[#c9a857]/5 transition-all duration-300">
                                    <Upload size={22} className="text-zinc-500 group-hover:text-[#c9a857]/70 transition-colors" />
                                </div>
                                <div>
                                    <p className="text-zinc-400 text-sm font-medium">Arraste ou clique para enviar</p>
                                    <p className="text-xs text-zinc-600 mt-1">PNG, JPG ou SVG — máx. 2MB</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Background Upload */}
                <div className="card-law animate-fade-in-up stagger-3">
                    <div className="flex items-center gap-3 mb-5">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#1e3a5f] to-[#0d1f33] flex items-center justify-center">
                            <Palette size={18} className="text-[#c9a857]" />
                        </div>
                        <div>
                            <h2 className="text-base font-medium text-white">Plano de Fundo</h2>
                            <p className="text-zinc-500 text-xs">Imagem de fundo do portal do cliente</p>
                        </div>
                    </div>
                    <div
                        className="group border-2 border-dashed border-zinc-700/50 rounded-xl p-6 text-center cursor-pointer hover:border-[#c9a857]/40 hover:bg-[#c9a857]/[0.02] transition-all duration-300"
                        onClick={() => document.getElementById('bg-upload').click()}
                    >
                        <input
                            type="file"
                            id="bg-upload"
                            accept="image/*"
                            className="hidden"
                            onChange={handleBgChange}
                        />
                        {bgPreview ? (
                            <div className="space-y-3">
                                <div className="w-full max-w-xs mx-auto aspect-video rounded-xl overflow-hidden border border-white/10">
                                    <img
                                        src={bgPreview}
                                        alt="Background"
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                                <p className="text-xs text-zinc-500 group-hover:text-[#c9a857]/70 transition-colors">Clique para trocar</p>
                            </div>
                        ) : (
                            <div className="space-y-3 py-2">
                                <div className="w-14 h-14 mx-auto rounded-xl bg-zinc-800/50 border border-zinc-700/50 flex items-center justify-center group-hover:border-[#c9a857]/30 group-hover:bg-[#c9a857]/5 transition-all duration-300">
                                    <ImageIcon size={22} className="text-zinc-500 group-hover:text-[#c9a857]/70 transition-colors" />
                                </div>
                                <div>
                                    <p className="text-zinc-400 text-sm font-medium">Arraste ou clique para enviar</p>
                                    <p className="text-xs text-zinc-600 mt-1">Recomendado: 1920×1080px</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Tour Guiado */}
                <div className="card-law animate-fade-in-up stagger-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#1e3a5f] to-[#0d1f33] flex items-center justify-center">
                                <Play size={18} className="text-[#c9a857]" />
                            </div>
                            <div>
                                <h2 className="text-base font-medium text-white">Tour Guiado</h2>
                                <p className="text-zinc-500 text-xs">Reveja o tutorial da plataforma</p>
                            </div>
                        </div>
                        {onResetTour && (
                            <button
                                onClick={onResetTour}
                                className="btn-secondary flex items-center gap-2 text-sm group"
                            >
                                <Play size={14} className="group-hover:text-[#c9a857] transition-colors" />
                                Refazer Tour
                                <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity -ml-1" />
                            </button>
                        )}
                    </div>
                </div>

            </div>

            {/* Action Buttons */}
            <div className="mt-8 mb-16 pt-6 border-t border-white/5">
                <div className="flex flex-col sm:flex-row justify-end gap-3">
                    <button
                        onClick={loadConfig}
                        className="btn-secondary flex items-center justify-center gap-2 order-2 sm:order-1"
                    >
                        <RefreshCw size={14} />
                        Restaurar
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        data-testid="save-config-button"
                        className="btn-gold flex items-center justify-center gap-2 order-1 sm:order-2"
                        style={{ pointerEvents: saving ? 'none' : 'auto' }}
                    >
                        {saving ? (
                            <>
                                <Loader2 size={16} className="animate-spin" />
                                Salvando...
                            </>
                        ) : (
                            <>
                                <Save size={16} />
                                Salvar Configurações
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
