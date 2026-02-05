import React, { useState, useEffect } from 'react';
import { Upload, Image as ImageIcon, Save, Loader2, Check, AlertCircle, RefreshCw, Settings } from 'lucide-react';
import { HelpTooltip, HELP_TEXTS } from './HelpTooltip';

export function ConfiguracoesPage({ supabase }) {
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
            setTimeout(() => setSuccess(false), 3000);

        } catch (err) {
            console.error('Erro ao salvar:', err);
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="spinner-premium"></div>
            </div>
        );
    }

    return (
        <div className="animate-fade-in max-w-2xl mx-auto">
            {/* Header */}
            <div className="mb-6 pb-5 border-b border-white/5">
                <div className="flex items-center gap-2">
                    <h1 className="text-xl font-semibold text-white">Configurações</h1>
                    <HelpTooltip title={HELP_TEXTS.configuracoes.title} content={HELP_TEXTS.configuracoes.content} position="right" />
                </div>
                <p className="text-zinc-500 text-sm mt-1">Personalize a aparência do seu portal</p>
            </div>

            {/* Status Messages */}
            {success && (
                <div className="mb-5 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex items-center gap-3 text-emerald-400 text-sm">
                    <Check size={16} />
                    <span>Configurações salvas com sucesso!</span>
                </div>
            )}
            {error && (
                <div className="mb-5 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-3 text-red-400 text-sm">
                    <AlertCircle size={16} />
                    <span>{error}</span>
                </div>
            )}

            <div className="space-y-4">

                {/* Company Name */}
                <div className="card-law">
                    <h2 className="text-base font-medium text-white mb-4 flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-[#1e3a5f] flex items-center justify-center">
                            <Settings size={16} className="text-[#c9a857]" />
                        </div>
                        Identidade
                    </h2>
                    <div className="space-y-1.5">
                        <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Nome da Empresa</label>
                        <input
                            type="text"
                            value={config.company_name}
                            onChange={(e) => setConfig(prev => ({ ...prev, company_name: e.target.value }))}
                            className="input-premium"
                            placeholder="Nome da sua empresa"
                        />
                    </div>
                </div>

                {/* Logo Upload */}
                <div className="card-law">
                    <h2 className="text-base font-medium text-white mb-4 flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-[#1e3a5f] flex items-center justify-center">
                            <Upload size={16} className="text-[#c9a857]" />
                        </div>
                        Logo da Empresa
                    </h2>
                    <div
                        className="border border-dashed border-zinc-700 rounded-lg p-5 text-center cursor-pointer hover:border-[#c9a857]/50 transition-colors"
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
                                <img
                                    src={logoPreview}
                                    alt="Logo Preview"
                                    className="max-h-16 mx-auto object-contain"
                                />
                                <p className="text-xs text-zinc-500">Clique para trocar</p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                <Upload size={24} className="mx-auto text-zinc-600" />
                                <p className="text-zinc-400 text-sm">Arraste ou clique para enviar</p>
                                <p className="text-xs text-zinc-600">PNG, JPG ou SVG (max 2MB)</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Background Upload */}
                <div className="card-law">
                    <h2 className="text-base font-medium text-white mb-4 flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-[#1e3a5f] flex items-center justify-center">
                            <ImageIcon size={16} className="text-[#c9a857]" />
                        </div>
                        Plano de Fundo
                    </h2>
                    <div
                        className="border border-dashed border-zinc-700 rounded-lg p-5 text-center cursor-pointer hover:border-[#c9a857]/50 transition-colors"
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
                                <img
                                    src={bgPreview}
                                    alt="Background Preview"
                                    className="max-h-16 mx-auto object-cover rounded-lg"
                                />
                                <p className="text-xs text-zinc-500">Clique para trocar</p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                <ImageIcon size={24} className="mx-auto text-zinc-600" />
                                <p className="text-zinc-400 text-sm">Arraste ou clique para enviar</p>
                                <p className="text-xs text-zinc-600">Recomendado: 1920x1080px</p>
                            </div>
                        )}
                    </div>
                </div>

            </div>

            {/* Save Button */}
            <div className="mt-6 pt-5 border-t border-white/5 flex justify-end gap-3">
                <button
                    onClick={loadConfig}
                    className="btn-secondary flex items-center gap-2"
                >
                    <RefreshCw size={14} />
                    Restaurar
                </button>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    data-testid="save-config-button"
                    className="btn-primary flex items-center gap-2"
                    style={{ pointerEvents: saving ? 'none' : 'auto' }}
                >
                    {saving ? (
                        <>
                            <Loader2 size={14} className="animate-spin" />
                            Salvando...
                        </>
                    ) : (
                        <>
                            <Save size={14} />
                            Salvar Configurações
                        </>
                    )}
                </button>
            </div>
        </div>
    );
}
