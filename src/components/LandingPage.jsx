import React, { useEffect } from 'react';
import { Scale, Lock, Download, PlayCircle, FileText } from 'lucide-react';
import { Logo } from './Logo';
import { WhitelabelConfig } from '../lib/whitelabel';
import noiseBg from '../assets/noise.svg';

export function LandingPage({ data, supabase }) {
    // Inicializa com o valor que veio do banco (ou 0 se for nulo)
    const [_viewCount, setViewCount] = React.useState(data.views || 0);

    // Password Protection State
    const [isLocked, setIsLocked] = React.useState(!!data.access_password);
    const [passwordInput, setPasswordInput] = React.useState("");
    const [passwordError, setPasswordError] = React.useState("");

    // Video State
    const [isPlaying, setIsPlaying] = React.useState(false);

    useEffect(() => {
        // Se estiver bloqueado, não incrementa visualização ainda
        if (isLocked) return;

        const recordView = async () => {
            if (!supabase) return;

            // Evitar contagem duplicada na mesma sessão
            const sessionKey = `viewed_${data.slug}`;
            if (sessionStorage.getItem(sessionKey)) return;

            try {
                // 1. Obter dados do usuário (IP e Localização)
                let ipData = { ip: null, city: null, region: null };
                try {
                    const res = await fetch('https://ipapi.co/json/');
                    if (res.ok) {
                        const json = await res.json();
                        ipData = {
                            ip: json.ip,
                            city: json.city,
                            region: json.region
                        };
                    }
                } catch (e) {
                    console.warn("Não foi possível obter IP/Localização", e);
                }

                const locationString = ipData.city && ipData.region ? `${ipData.city}, ${ipData.region}` : (ipData.city || "Desconhecido");

                // 2. Registrar Log detalhado
                await supabase.from('view_logs').insert({
                    video_slug: data.slug,
                    ip: ipData.ip,
                    location: locationString,
                    device: navigator.userAgent
                });

                // 3. Incrementar contador total (para exibir na tela)
                const { error } = await supabase.rpc('increment_views', { row_id: data.id });

                if (error) {
                    // Fallback se RPC falhar
                    await supabase
                        .from('videos_pecas')
                        .update({ views: (data.views || 0) + 1 })
                        .eq('id', data.id);
                }

                setViewCount(prev => prev + 1);
                sessionStorage.setItem(sessionKey, 'true');

            } catch (err) {
                console.error("Erro ao registrar visualização:", err);
            }
        };

        recordView();
    }, [data.id, data.slug, supabase, data.views, isLocked]);

    const handleUnlock = (e) => {
        e.preventDefault();
        // Simple comparison (client-side for MVP)
        if (passwordInput === data.access_password) {
            setIsLocked(false);
            setPasswordError("");
        } else {
            setPasswordError("Senha incorreta.");
        }
    };

    if (isLocked) {
        return (
            <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4 font-sans relative overflow-hidden">
                {/* Background Effects */}
                <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#1e3a5f]/20 via-[#050505] to-[#000000]"></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#c9a857]/5 rounded-full blur-[100px] animate-pulse"></div>

                <div className="w-full max-w-md bg-[#121212]/80 backdrop-blur-xl border border-[#c9a857]/30 p-6 md:p-10 rounded-2xl shadow-2xl text-center relative z-10 animate-scale-in">
                    <div className="flex justify-center mb-6">
                        <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-gradient-to-br from-[#c9a857]/20 to-transparent flex items-center justify-center text-[#c9a857] border border-[#c9a857]/20 shadow-[0_0_20px_rgba(201,168,87,0.1)]">
                            <Lock size={32} className="md:w-9 md:h-9" />
                        </div>
                    </div>

                    <h2 className="text-xl md:text-2xl text-white font-bold mb-2">Acesso Restrito</h2>
                    <p className="text-gray-400 text-sm mb-6 md:mb-8 leading-relaxed">Este conteúdo é confidencial e protegido. Por favor, insira suas credenciais para continuar.</p>

                    <form onSubmit={handleUnlock} className="space-y-4 md:space-y-5">
                        <div className="relative">
                            <input
                                type="password"
                                value={passwordInput}
                                onChange={(e) => setPasswordInput(e.target.value)}
                                className="w-full bg-[#1a1a1a] border border-[#333] text-white px-4 py-3 md:py-4 rounded-lg focus:border-[#c9a857] focus:ring-1 focus:ring-[#c9a857] outline-none text-center tracking-[0.5em] text-base md:text-lg placeholder-gray-700 transition-all font-mono shadow-inner"
                                placeholder="******"
                                autoFocus
                            />
                        </div>
                        {passwordError && (
                            <p className="text-red-400 text-xs animate-shake font-medium">{passwordError}</p>
                        )}
                        <button type="submit" className="w-full bg-[#c9a857] hover:bg-[#d4b76a] text-[#0a0a0b] py-3 md:py-4 rounded-lg font-bold uppercase tracking-widest text-xs md:text-sm hover:shadow-[0_0_20px_rgba(201,168,87,0.3)] transition-all transform hover:-translate-y-0.5 shadow-lg shadow-[#c9a857]/20">
                            Desbloquear Acesso
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#050505] font-sans flex flex-col relative overflow-x-hidden">
            {/* Premium Background Mesh */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="hidden md:block absolute top-[-10%] right-[-5%] w-[600px] h-[600px] bg-activeBlue/5 rounded-full blur-[120px] opacity-40"></div>
                <div className="hidden md:block absolute bottom-[-10%] left-[-5%] w-[500px] h-[500px] bg-blue-900/10 rounded-full blur-[120px] opacity-30"></div>
                <div
                    className="absolute inset-0 opacity-[0.03]"
                    style={{ backgroundImage: `url(${noiseBg})` }}
                ></div>
            </div>

            {/* Top Navigation */}
            <div className="relative z-20 w-full px-6 py-6 flex justify-center md:justify-between items-center max-w-7xl mx-auto">
                <Logo size="medium" />
                <div className="hidden md:flex items-center gap-2 text-[#c9a857]/70 text-xs font-medium tracking-widest uppercase border border-[#c9a857]/10 px-3 py-1 rounded-full bg-[#c9a857]/5">
                    <Lock size={12} />
                    Ambiente Seguro e Criptografado
                </div>
            </div>

            {/* Main Content */}
            <main className="flex-grow flex items-center justify-center p-4 relative z-10 w-full">
                <div className="w-full max-w-5xl animate-fade-in-up">

                    {/* Header Section */}
                    <div className="text-center mb-8 md:mb-10 space-y-4">
                        <div className="inline-flex items-center gap-2 bg-[#c9a857]/10 text-[#c9a857] px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest border border-[#c9a857]/20 shadow-[0_0_15px_rgba(201,168,87,0.1)] backdrop-blur-sm">
                            <Scale size={14} /> Processo nº {data.processo}
                        </div>
                        <h1 className="text-2xl md:text-5xl font-bold text-white tracking-tight leading-tight drop-shadow-sm px-2">
                            {data.titulo_peca || "Peça Processual Digital"}
                        </h1>
                        <p className="text-gray-400 text-xs md:text-base max-w-2xl mx-auto leading-relaxed px-4">
                            Acompanhe abaixo a explicação detalhada em vídeo referente à peça protocolada.
                            Este formato visa trazer mais clareza e celeridade ao entendimento dos fatos.
                        </p>
                    </div>

                    {/* Video Player Card */}
                    <div className="relative group w-full">
                        {/* Glow Effect behind video - Hidden on mobile for performance */}
                        <div className="hidden md:block absolute -inset-1 bg-gradient-to-r from-activeBlue to-blue-900 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>

                        <div className="relative aspect-video bg-black rounded-xl border border-[#333] shadow-2xl overflow-hidden ring-1 ring-white/10">

                            {!isPlaying ? (
                                /* Facade / Placeholder */
                                <div
                                    className="absolute inset-0 cursor-pointer group/play"
                                    onClick={() => setIsPlaying(true)}
                                >
                                    <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-black/20 via-transparent to-black/60 pointer-events-none z-10"></div>

                                    {/* Thumbnail Placeholder - Could use data.thumbnail_url if available, falling back to black/gradient */}
                                    <div className="absolute inset-0 bg-neutral-900/50 flex items-center justify-center">
                                        {/* Optional: Add a subtle loading or placeholder pattern here */}
                                    </div>

                                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 transition-transform duration-300 group-hover/play:scale-110">
                                        <div className="w-16 h-16 md:w-20 md:h-20 bg-activeBlue/90 rounded-full flex items-center justify-center backdrop-blur-sm shadow-[0_0_30px_rgba(59,130,246,0.3)] group-hover/play:bg-activeBlue cursor-pointer">
                                            <PlayCircle size={32} className="text-white fill-white ml-1" />
                                        </div>
                                    </div>

                                    <div className="absolute top-6 left-6 z-20 flex items-center gap-3">
                                        <span className="flex h-3 w-3 relative">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                                        </span>
                                        <span className="text-white/90 text-xs font-medium bg-black/40 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 shadow-sm">
                                            Toque para assistir
                                        </span>
                                    </div>

                                    <div className="absolute bottom-6 w-full text-center z-20">
                                        <p className="text-white/70 text-xs uppercase tracking-widest font-medium">Carregar Vídeo Explicativo</p>
                                    </div>
                                </div>
                            ) : (
                                /* Actual Video Player */
                                <video
                                    autoPlay
                                    controls
                                    playsInline
                                    preload="metadata"
                                    className="w-full h-full object-cover relative z-0 animate-fade-in"
                                    poster={null}
                                >
                                    <source src={data.video_url} type="video/mp4" />
                                    Seu navegador não suporta a visualização deste vídeo.
                                </video>
                            )}
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="mt-8 md:mt-12 grid grid-cols-1 md:grid-cols-2 gap-6 items-center max-w-4xl mx-auto">
                        {/* Stats */}
                        {/* Stats - Visualizações (Visível apenas para Admin agora) */}
                        <div className="flex justify-center md:justify-start items-center gap-4 text-gray-500">
                            <div className="text-[10px] md:text-xs uppercase tracking-wider opacity-70">
                                {data.created_at ? new Date(data.created_at).toLocaleDateString() : 'Data indisponível'}
                            </div>
                        </div>

                        {/* CTA Button */}
                        <div className="flex justify-center md:justify-end">
                            <a
                                href={data.pdf_final_url}
                                target="_blank"
                                className="group relative inline-flex items-center justify-center gap-3 px-8 py-4 bg-[#c9a857] hover:bg-[#d4b76a] text-[#0a0a0b] font-bold text-sm uppercase tracking-widest rounded-lg overflow-hidden transition-transform transform hover:-translate-y-1 hover:shadow-[0_10px_30px_-10px_rgba(201,168,87,0.5)] shadow-xl shadow-[#c9a857]/20"
                            >
                                <div className="absolute inset-0 bg-white/10 group-hover:bg-white/20 transition-colors"></div>
                                <FileText size={18} className="relative z-10" />
                                <span className="relative z-10">Visualizar Documento (PDF)</span>
                                <div className="absolute right-3 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300">
                                    <Download size={16} />
                                </div>
                            </a>
                        </div>
                    </div>

                </div>
            </main>

            {/* WhatsApp Floating Button */}
            <a
                href={`https://wa.me/5531999999999?text=Olá! Vim através do portal Explicare. Preciso de ajuda com o processo ${data.processo}.`}
                target="_blank"
                rel="noopener noreferrer"
                className="fixed bottom-6 right-6 z-50 group"
                title="Falar com advogado"
            >
                <div className="relative">
                    {/* Pulse animation */}
                    <div className="absolute inset-0 bg-green-500 rounded-full animate-ping opacity-25"></div>
                    {/* Main button */}
                    <div className="relative w-14 h-14 bg-green-500 hover:bg-green-600 rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 group-hover:scale-110">
                        <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                        </svg>
                    </div>
                    {/* Tooltip */}
                    <div className="absolute bottom-full right-0 mb-2 px-3 py-1.5 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                        Falar com advogado
                        <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                    </div>
                </div>
            </a>

            {/* Footer Legal */}
            <footer className="py-12 text-center relative z-10 opacity-60">
                <div className="flex justify-center mb-6 opacity-80">
                    <Logo size="small" />
                </div>
                <p className="text-[10px] text-gray-500 uppercase tracking-widest md:tracking-[0.3em] font-light">
                    {WhitelabelConfig.companyName} &bull; Acesso Seguro &bull; © 2026
                </p>
            </footer>
        </div>
    );
}
