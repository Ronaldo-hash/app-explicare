import React, { useState, useEffect } from 'react';
import { useWhitelabel } from '../context/WhitelabelContext';
import { useTheme } from '../context/ThemeContext';
import { LogOut, FileText, Video, Download, ExternalLink, Calendar, Search, User, ChevronRight, Play, History, ChevronDown, ChevronUp, Clock } from 'lucide-react';
import { HelpTooltip, HELP_TEXTS } from './HelpTooltip';

export function ClientPortal({ supabase, session, onLogout }) {
    const { company_name, logo_url, background_url } = useWhitelabel();
    const { theme, toggleTheme } = useTheme();
    const [videos, setVideos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedVideo, setSelectedVideo] = useState(null);
    const [historyLogs, setHistoryLogs] = useState({}); // Map videoId -> logs
    const [loadingHistory, setLoadingHistory] = useState({}); // Map videoId -> boolean
    const [expandedVideoId, setExpandedVideoId] = useState(null);

    useEffect(() => {
        fetchMyCases();
    }, [session]);

    const fetchMyCases = async () => {
        if (!session?.user?.email) return;

        setLoading(true);
        try {
            // Fetch videos where client_email matches the logged-in user's email
            // Note: This relies on exact string match. 
            // In a production app, we might link via ID, but email is the current link method.
            const { data, error } = await supabase
                .from('videos_pecas')
                .select('*')
                .eq('client_email', session.user.email)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setVideos(data || []);
        } catch (error) {
            console.error('Error fetching client cases:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchHistory = async (videoId) => {
        if (!supabase || !videoId) return;

        // If we already have logs, just toggle expansion (unless force refresh, but simple toggle is fine)
        if (expandedVideoId === videoId) {
            setExpandedVideoId(null);
            return;
        }

        setLoadingHistory(prev => ({ ...prev, [videoId]: true }));
        setExpandedVideoId(videoId);

        try {
            const { data, error } = await supabase
                .from('process_history')
                .select('action, details, created_at') // Clients don't need user_id info usually
                .eq('video_id', videoId)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setHistoryLogs(prev => ({ ...prev, [videoId]: data || [] }));
        } catch (err) {
            console.error('Error fetching history:', err);
        } finally {
            setLoadingHistory(prev => ({ ...prev, [videoId]: false }));
        }
    };

    const handleSignOut = async () => {
        if (typeof onLogout === 'function') {
            onLogout();
            return;
        }
        await supabase.auth.signOut();
        window.location.reload();
    };

    const filteredVideos = videos.filter(v =>
        (v.processo && v.processo.includes(searchQuery)) ||
        (v.titulo_peca && v.titulo_peca.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    const getStatusColor = (status) => {
        switch (status) {
            case 'concluido': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
            case 'arquivado': return 'text-zinc-400 bg-zinc-500/10 border-zinc-500/20';
            default: return 'text-[#c9a857] bg-[#c9a857]/10 border-[#c9a857]/20';
        }
    };

    const getStatusLabel = (status) => {
        switch (status) {
            case 'concluido': return 'Concluído';
            case 'arquivado': return 'Arquivado';
            default: return 'Em Andamento';
        }
    };

    return (
        <div className="flex min-h-screen w-full bg-[#0a0a0b] text-white font-sans relative overflow-x-hidden">
            {/* Background */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div
                    className="absolute inset-0 transition-opacity duration-1000"
                    style={{
                        backgroundImage: `url(${background_url})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        opacity: 0.4
                    }}
                />
                <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0b]/80 via-[#0a0a0b]/50 to-[#0a0a0b]" />
            </div>

            <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">

                {/* Header */}
                <header className="flex flex-col md:flex-row items-center justify-between gap-4 mb-8">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center border border-white/10 backdrop-blur-sm">
                            {logo_url ? (
                                <img src={logo_url} alt={company_name} className="w-8 h-8 object-contain" />
                            ) : (
                                <FileText className="text-[#c9a857]" size={24} />
                            )}
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-white tracking-tight">{company_name || 'Portal do Cliente'}</h1>
                            <p className="text-zinc-400 text-sm">Área Restrita</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <div className="glass-card px-4 py-2 flex items-center gap-3 flex-1 md:flex-none">
                            <div className="w-8 h-8 rounded-full bg-[#c9a857]/20 flex items-center justify-center text-[#c9a857] font-bold text-xs">
                                {session?.user?.email?.charAt(0).toUpperCase()}
                            </div>
                            <span className="text-sm text-zinc-300 truncate max-w-[150px]">{session?.user?.email}</span>
                        </div>
                        <button
                            onClick={handleSignOut}
                            className="bg-red-500/10 hover:bg-red-500/20 text-red-500 p-2.5 rounded-lg transition-colors border border-red-500/20"
                            title="Sair"
                        >
                            <LogOut size={18} />
                        </button>
                    </div>
                </header>

                {/* Welcome Section */}
                <div className="mb-8 animate-fade-in-up">
                    <h2 className="text-2xl font-semibold text-white mb-2">Seus Processos</h2>
                    <p className="text-zinc-400">Acompanhe o andamento dos seus casos e acesse os materiais explicativos.</p>
                </div>

                {/* Search */}
                <div className="mb-6 relative max-w-md animate-fade-in-up stagger-1">
                    <input
                        type="text"
                        placeholder="Buscar por número do processo ou título..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white placeholder-zinc-500 focus:outline-none focus:border-[#c9a857]/50 focus:ring-1 focus:ring-[#c9a857]/50 transition-all"
                    />
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                </div>

                {/* Grid */}
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="glass-card p-4 h-64 animate-pulse">
                                <div className="h-40 bg-white/5 rounded-lg mb-4"></div>
                                <div className="h-6 w-3/4 bg-white/5 rounded mb-2"></div>
                                <div className="h-4 w-1/2 bg-white/5 rounded"></div>
                            </div>
                        ))}
                    </div>
                ) : filteredVideos.length === 0 ? (
                    <div className="glass-card p-12 text-center animate-fade-in-up">
                        <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                            <FileText size={32} className="text-zinc-600" />
                        </div>
                        <h3 className="text-lg font-medium text-white mb-2">Nenhum processo encontrado</h3>
                        <p className="text-zinc-500">
                            {searchQuery ? 'Tente buscar com outros termos.' : 'Você ainda não possui processos cadastrados com este email.'}
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredVideos.map((video, index) => (
                            <div
                                key={video.id}
                                className="glass-card hover:border-[#c9a857]/30 transition-all duration-300 group overflow-hidden flex flex-col"
                                style={{ animationDelay: `${index * 0.1}s` }}
                            >
                                {/* Thumbnail / PDF Preview */}
                                <div className="relative aspect-video bg-zinc-900 overflow-hidden border-b border-white/5 group-hover:opacity-90 transition-opacity cursor-pointer" onClick={() => window.open(`/?v=${video.slug}`, '_blank')}>
                                    {video.pdf_final_url ? (
                                        <div className="w-full h-full flex items-center justify-center bg-zinc-800">
                                            <FileText size={48} className="text-zinc-700 group-hover:text-[#c9a857] transition-colors duration-300" />
                                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                                <div className="bg-[#c9a857] text-[#0a0a0b] px-4 py-2 rounded-full font-medium flex items-center gap-2 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                                                    <Play size={16} fill="currentColor" />
                                                    Assistir Explicação
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-zinc-800">
                                            <Video size={48} className="text-zinc-700" />
                                        </div>
                                    )}

                                    {/* Status Badge */}
                                    <div className={`absolute top-3 right-3 text-[10px] font-bold px-2 py-1 rounded border uppercase tracking-wider ${getStatusColor(video.status)}`}>
                                        {getStatusLabel(video.status)}
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="p-5 flex-1 flex flex-col">
                                    <h3 className="text-lg font-semibold text-white mb-1 line-clamp-1" title={video.titulo_peca}>
                                        {video.titulo_peca || 'Processo sem título'}
                                    </h3>
                                    <p className="text-sm text-zinc-400 mb-4 font-mono">
                                        Nº {video.processo}
                                    </p>

                                    <div className="mt-auto flex items-center gap-3 pt-4 border-t border-white/5">
                                        <a
                                            href={`/?v=${video.slug}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex-1 btn-primary text-center text-sm py-2 flex items-center justify-center gap-2"
                                        >
                                            <ExternalLink size={14} /> Acessar
                                        </a>
                                        {video.pdf_final_url && (
                                            <a
                                                href={video.pdf_final_url}
                                                download
                                                target="_blank"
                                                className="p-2 btn-secondary text-zinc-400 hover:text-white"
                                                title="Baixar PDF"
                                            >
                                                <Download size={18} />
                                            </a>
                                        )}
                                        <button
                                            onClick={() => fetchHistory(video.id)}
                                            className={`p-2 btn-secondary hover:text-white transition-colors ${expandedVideoId === video.id ? 'text-[#c9a857] bg-[#c9a857]/10' : 'text-zinc-400'}`}
                                            title="Ver Histórico"
                                        >
                                            <History size={18} />
                                        </button>
                                    </div>

                                    {/* History Expansion */}
                                    {expandedVideoId === video.id && (
                                        <div className="mt-4 pt-4 border-t border-white/5 animate-fade-in">
                                            <h4 className="text-xs font-semibold text-zinc-400 uppercase mb-3 flex items-center gap-2">
                                                <Clock size={12} /> Histórico de Atualizações
                                            </h4>

                                            {loadingHistory[video.id] ? (
                                                <div className="text-center py-2 text-zinc-500 text-xs">Carregando...</div>
                                            ) : (historyLogs[video.id] || []).length === 0 ? (
                                                <div className="text-center py-2 text-zinc-500 text-xs">Nenhuma atualização registrada.</div>
                                            ) : (
                                                <div className="space-y-3 max-h-40 overflow-y-auto custom-scrollbar pr-1">
                                                    {historyLogs[video.id].map((log, i) => (
                                                        <div key={i} className="flex gap-3 text-xs">
                                                            <div className="flex-col items-center flex">
                                                                <div className="w-1.5 h-1.5 rounded-full bg-[#c9a857]"></div>
                                                                {i < historyLogs[video.id].length - 1 && <div className="w-px h-full bg-zinc-800 my-1"></div>}
                                                            </div>
                                                            <div className="flex-1 pb-1">
                                                                <p className="text-zinc-300 font-medium">
                                                                    {log.action === 'created' ? 'Processo Iniciado' :
                                                                        log.action === 'status_changed' ? `Status alterado para ${getStatusLabel(log.details.new)}` :
                                                                            log.action === 'responsible_changed' ? 'Responsável atualizado' :
                                                                                'Atualização no processo'}
                                                                </p>
                                                                <p className="text-zinc-500 text-[10px]">
                                                                    {new Date(log.created_at).toLocaleDateString()} às {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    <div className="mt-3 flex items-center gap-2 text-xs text-zinc-600">
                                        <Calendar size={12} />
                                        <span>Cadastrado em {new Date(video.created_at).toLocaleDateString()}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Footer */}
                <div className="mt-12 text-center text-zinc-600 text-sm pb-8">
                    <p>&copy; {new Date().getFullYear()} {company_name}. Todos os direitos reservados.</p>
                </div>

            </div>
        </div>
    );
}
