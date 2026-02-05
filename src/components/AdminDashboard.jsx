import React, { useEffect, useState } from 'react';
import { Logo } from './Logo';
import {
    LogOut, Trash2, ExternalLink, Eye, Copy, FileText, Activity, Calendar,
    Users, UserPlus, Shield, Smartphone, Monitor, MapPin, Clock, Briefcase,
    CheckCircle, Lock, Loader2, Info, ChevronRight, Search, Upload, ChevronLeft, Database, HelpCircle,
    Menu, Download
} from 'lucide-react';
import { UploadForm } from './UploadForm';
import { Sidebar } from './Sidebar';
import { ConfiguracoesPage } from './ConfiguracoesPage';
import { useTheme } from '../context/ThemeContext';
import { HelpTooltip, HELP_TEXTS } from './HelpTooltip';

export function AdminDashboard({ supabase, session, onLogout }) {
    const { theme, toggleTheme } = useTheme();

    const [videos, setVideos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard', 'processos', 'upload', 'equipe', 'reports', 'settings'
    const [notification, setNotification] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [users, setUsers] = useState([]);

    // Create User States
    const [newUserEmail, setNewUserEmail] = useState('');
    const [newUserPassword, setNewUserPassword] = useState('');
    const [newIsAdmin, setNewIsAdmin] = useState(false);
    const [loadingCreate, setLoadingCreate] = useState(false);

    // Current User State
    const [currentUserRole, setCurrentUserRole] = useState(null);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [_showDeleteUserModal, setShowDeleteUserModal] = useState(false);
    const [userToDelete, setUserToDelete] = useState(null);

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const ITEMS_PER_PAGE = 9;

    const [copiedId, setCopiedId] = useState(null);

    useEffect(() => {
        fetchVideos();
        checkUserRole();
        fetchUsers();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentPage, searchQuery]); // Re-fetch when page changes or search query updates

    const showToast = (type, message) => {
        setNotification({ type, message });
        setTimeout(() => setNotification(null), 4000);
    };

    const fetchVideos = async () => {
        setLoading(true);
        const from = (currentPage - 1) * ITEMS_PER_PAGE;
        const to = from + ITEMS_PER_PAGE - 1;

        let query = supabase
            .from('videos_pecas')
            .select('*', { count: 'exact' });

        if (searchQuery) {
            query = query.or(`processo.ilike.%${searchQuery}%,titulo_peca.ilike.%${searchQuery}%`);
        }

        const { data, count, error } = await query
            .order('created_at', { ascending: false })
            .range(from, to);

        if (error) {
            console.error('Error fetching videos:', error);
            showToast('error', 'Erro ao carregar vídeos.');
        } else {
            setVideos(data || []);
            setTotalItems(count || 0);
        }
        setLoading(false);
    };

    const _totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);

    const fetchUsers = async () => {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching users:', error);
        } else {
            setUsers(data || []);
        }
    };

    const copyLink = (slug) => {
        const url = `${window.location.origin}/?v=${slug}`;
        navigator.clipboard.writeText(url);
        setCopiedId(slug);
        setTimeout(() => setCopiedId(null), 2000);
        showToast('success', 'Link copiado!');
    };

    const checkUserRole = async () => {
        if (!session?.user?.id) return;

        // Bypass for Demo Admin
        if (session.user.email === 'admin@admin.com') {
            setCurrentUserRole('admin');
            return;
        }

        const { data } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', session.user.id)
            .single();

        if (data && data.role === 'admin') {
            setCurrentUserRole('admin');
        } else {
            setCurrentUserRole('user');
            if (activeTab === 'equipe') setActiveTab('processos');
        }
    };

    // Delete Modal State
    const [_showDeleteModal, setShowDeleteModal] = useState(false);
    const [videoToDelete, setVideoToDelete] = useState(null);

    const _handleDelete = (id) => {
        setVideoToDelete(id);
        setShowDeleteModal(true);
    };

    const _confirmDelete = async () => {
        if (!videoToDelete) return;
        setShowDeleteModal(false); // Close immediately for UX

        const { error } = await supabase.from('videos_pecas').delete().eq('id', videoToDelete);

        if (!error) {
            setVideos(videos.filter(v => v.id !== videoToDelete));
            showToast('success', 'Processo removido com sucesso.');
        } else {
            showToast('error', "Erro ao excluir: " + error.message);
        }
        setVideoToDelete(null);
    };

    const handleSignOut = async () => {
        if (typeof onLogout === 'function') {
            onLogout();
            return;
        }
        await supabase.auth.signOut();
        window.location.reload();
    };

    const handleCreateUserRequest = (e) => {
        e.preventDefault();
        setShowConfirmModal(true);
    };

    const confirmCreateUser = async () => {
        setShowConfirmModal(false);
        setLoadingCreate(true);
        const email = newUserEmail.trim();
        const password = newUserPassword.trim();

        if (!email || !password) {
            showToast('error', 'Preencha email e senha.');
            setLoadingCreate(false);
            return;
        }

        try {
            const { data, error } = await supabase.auth.signUp({ email, password });
            if (error) throw error;

            if (data?.user && newIsAdmin) {
                await supabase.from('profiles').update({ role: 'admin' }).eq('id', data.user.id);
            }
            showToast('success', 'Novo usuário criado com sucesso.');
            setTimeout(() => window.location.reload(), 1500);
        } catch (err) {
            showToast('error', err.message);
        } finally {
            setLoadingCreate(false);
        }
    };

    const handleDeleteUserRequest = (userId) => {
        setUserToDelete(userId);
        setShowDeleteUserModal(true);
    };

    const _confirmDeleteUser = async () => {
        if (!userToDelete) return;

        try {
            const { error } = await supabase.from('profiles').delete().eq('id', userToDelete);

            if (error) throw error;

            // Immediately update UI
            setUsers(users.filter(u => u.id !== userToDelete));
            showToast('success', 'Membro removido da equipe com sucesso.');
        } catch (error) {
            console.error("Erro ao deletar usuário:", error);
            showToast('error', 'Erro ao remover. Verifique suas permissões.');
        } finally {
            setShowDeleteUserModal(false);
            setUserToDelete(null);
        }
    };

    const handleToggleRole = async (userId, currentRole) => {
        const newRole = currentRole === 'admin' ? 'member' : 'admin';
        try {
            const { error } = await supabase
                .from('profiles')
                .update({ role: newRole })
                .eq('id', userId);

            if (error) throw error;

            // Update UI immediately
            setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
            showToast('success', newRole === 'admin' ? 'Usuário promovido a Admin!' : 'Usuário rebaixado a Membro.');
        } catch (error) {
            console.error('Erro ao alterar role:', error);
            showToast('error', 'Erro ao alterar permissões.');
        }
    };

    // --- RENDER ---

    return (
        <div className="flex h-screen w-full overflow-hidden bg-premium text-white font-sans">
            {/* Left Sidebar */}
            <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} onLogout={handleSignOut} userRole={currentUserRole} />

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col h-full relative overflow-y-auto">
                {/* Premium Background Effect */}
                <div className="fixed inset-0 pointer-events-none z-0">
                    <div
                        className="absolute inset-0 opacity-20"
                        style={{
                            backgroundImage: 'url(https://zrssvsfxxtjieoyurzms.supabase.co/storage/v1/object/sign/arquivos%20da%20empresa/fundo%20site.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV9mMGYzMmMyYS05ODRhLTQwMjctOTA1YS05NGU1NWQ3ZmY3NzEiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJhcnF1aXZvcyBkYSBlbXByZXNhL2Z1bmRvIHNpdGUucG5nIiwiaWF0IjoxNzcwMTg4ODIyLCJleHAiOjE4MDE3MjQ4MjJ9._Ov3-JO41bj6oDDjyMV3PkOUDVLe1ETN8hskLn0vfQ8)',
                            backgroundSize: 'cover',
                            backgroundPosition: 'center'
                        }}
                    />
                    <div className="absolute inset-0 bg-[#0c0c0e]/90" />
                    <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#1e3a5f]/20 rounded-full blur-3xl" />
                    <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[#c9a857]/10 rounded-full blur-3xl" />
                </div>

                {/* Top Header */}
                <header className="w-full h-16 lg:h-20 px-4 lg:px-8 flex items-center justify-end gap-3 z-30 mt-12 lg:mt-0 relative">
                    {/* Theme Toggle */}
                    <button
                        onClick={toggleTheme}
                        className="p-2.5 rounded-lg bg-zinc-800/50 hover:bg-zinc-700/50 border border-white/5 transition-all duration-300 group"
                        title={theme === 'dark' ? 'Modo Claro' : 'Modo Escuro'}
                    >
                        {theme === 'dark' ? (
                            <svg className="w-5 h-5 text-[#c9a857] group-hover:rotate-12 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                            </svg>
                        ) : (
                            <svg className="w-5 h-5 text-[#1e3a5f] group-hover:-rotate-12 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                            </svg>
                        )}
                    </button>

                    <div className="glass-card flex items-center gap-3 py-2 px-4 cursor-pointer hover:border-[#c9a857]/30 transition-all duration-300">
                        <span className="text-gray-300 text-sm font-medium hidden sm:block">{session?.user?.email}</span>
                        <div className="w-10 h-10 rounded-xl overflow-hidden bg-[#1e3a5f] flex items-center justify-center">
                            <span className="text-[#c9a857] font-bold text-sm">
                                {session?.user?.email?.charAt(0).toUpperCase()}
                            </span>
                        </div>
                    </div>
                </header>

                <div className="flex-1 px-4 lg:px-8 pb-10 overflow-x-hidden relative z-10">
                    <div className="w-full h-full flex flex-col">
                        {/* Notifications */}
                        {notification && (
                            <div className={`fixed top-6 right-6 z-[100] animate-slide-in glass-card px-6 py-4 flex items-center gap-3 ${notification.type === 'success' ? 'border-emerald-500/30 text-emerald-400' : 'border-red-500/30 text-red-400'}`}>
                                {notification.type === 'success' ? <CheckCircle size={18} /> : <LogOut size={18} />}
                                <span className="font-medium text-sm">{notification.message}</span>
                            </div>
                        )}

                        {/* Tab Content */}
                        {activeTab === 'dashboard' && (
                            <div className="animate-fade-in space-y-6">
                                {/* Hero Card */}
                                <div className="card-premium">
                                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                                        <div>
                                            <h1 className="text-2xl lg:text-3xl font-semibold text-white mb-2">
                                                Bom dia, <span className="text-[#c9a857]">{session?.user?.email?.split('@')[0]}</span>
                                            </h1>
                                            <p className="text-zinc-500 text-sm lg:text-base max-w-lg">
                                                Painel de gestão jurídica. Gerencie processos, acompanhe métricas e organize sua equipe.
                                            </p>
                                        </div>
                                        <div className="flex gap-3">
                                            <button
                                                onClick={() => setActiveTab('upload')}
                                                className="btn-primary flex items-center gap-2"
                                            >
                                                <Upload size={16} /> Novo Processo
                                            </button>
                                            <button
                                                onClick={() => setActiveTab('processos')}
                                                className="btn-secondary flex items-center gap-2"
                                            >
                                                <Briefcase size={16} /> Ver Casos
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Stats Grid */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {/* Processos */}
                                    <div
                                        onClick={() => setActiveTab('processos')}
                                        className="card-law cursor-pointer group"
                                    >
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="flex items-center gap-2">
                                                <div className="w-10 h-10 rounded-lg bg-[#1e3a5f] flex items-center justify-center">
                                                    <FileText size={20} className="text-[#c9a857]" />
                                                </div>
                                                <HelpTooltip title={HELP_TEXTS.processosAtivos.title} content={HELP_TEXTS.processosAtivos.content} position="right" />
                                            </div>
                                            <ChevronRight size={18} className="text-zinc-600 group-hover:text-zinc-400 transition-colors" />
                                        </div>
                                        <p className="text-zinc-500 text-xs uppercase tracking-wider mb-1">Processos Ativos</p>
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-3xl font-semibold text-white">{totalItems}</span>
                                            <span className="text-zinc-600 text-sm">casos</span>
                                        </div>
                                    </div>

                                    {/* Equipe */}
                                    <div
                                        onClick={() => setActiveTab('equipe')}
                                        className="card-law cursor-pointer group"
                                    >
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="flex items-center gap-2">
                                                <div className="w-10 h-10 rounded-lg bg-[#1e3a5f] flex items-center justify-center">
                                                    <Users size={20} className="text-[#c9a857]" />
                                                </div>
                                                <HelpTooltip title={HELP_TEXTS.equipe.title} content={HELP_TEXTS.equipe.content} position="right" />
                                            </div>
                                            <ChevronRight size={18} className="text-zinc-600 group-hover:text-zinc-400 transition-colors" />
                                        </div>
                                        <p className="text-zinc-500 text-xs uppercase tracking-wider mb-1">Equipe</p>
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-3xl font-semibold text-white">{users.length}</span>
                                            <span className="text-zinc-600 text-sm">membros</span>
                                        </div>
                                    </div>

                                    {/* Métricas */}
                                    <div
                                        onClick={() => setActiveTab('reports')}
                                        className="card-law cursor-pointer group"
                                    >
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="flex items-center gap-2">
                                                <div className="w-10 h-10 rounded-lg bg-[#1e3a5f] flex items-center justify-center">
                                                    <Activity size={20} className="text-[#c9a857]" />
                                                </div>
                                                <HelpTooltip title={HELP_TEXTS.relatorios.title} content={HELP_TEXTS.relatorios.content} position="right" />
                                            </div>
                                            <ChevronRight size={18} className="text-zinc-600 group-hover:text-zinc-400 transition-colors" />
                                        </div>
                                        <p className="text-zinc-500 text-xs uppercase tracking-wider mb-1">Relatórios</p>
                                        <span className="badge-success">Atualizado</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'processos' && (
                            <div className="animate-fade-in h-full">
                                <ClientProcessView
                                    videos={videos}
                                    loading={loading}
                                    searchQuery={searchQuery}
                                    setSearchQuery={setSearchQuery}
                                    copyLink={copyLink}
                                    copiedId={copiedId}
                                    onNewUpload={() => setActiveTab('upload')}
                                    supabase={supabase}
                                />
                            </div>
                        )}

                        {activeTab === 'upload' && (
                            <div className="animate-fade-in-up w-full flex justify-center h-full">
                                <div className="w-full h-full">
                                    <UploadForm supabase={supabase} session={session} onSuccess={() => {
                                        setActiveTab('processos');
                                        setSearchQuery('');
                                        setCurrentPage(1);
                                        fetchVideos();
                                        showToast('success', 'Upload concluído!');
                                    }} />
                                </div>
                            </div>
                        )}

                        {activeTab === 'equipe' && (
                            <div className="animate-fade-in space-y-6">
                                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 pb-5 border-b border-white/5">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h1 className="text-xl font-semibold text-white">Gestão de Equipe</h1>
                                            <HelpTooltip title={HELP_TEXTS.equipeAdmin.title} content={HELP_TEXTS.equipeAdmin.content} position="right" />
                                        </div>
                                        <p className="text-zinc-500 text-sm mt-1">Gerencie os membros que têm acesso ao portal</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => { navigator.clipboard.writeText(window.location.origin + '/cadastro'); showToast('success', 'Link copiado!'); }}
                                            className="btn-secondary flex items-center gap-2 text-xs"
                                        >
                                            <Copy size={14} /> Link de Cadastro
                                        </button>
                                        <HelpTooltip title={HELP_TEXTS.linkCadastro.title} content={HELP_TEXTS.linkCadastro.content} position="left" />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                    <div className="card-law p-6 h-fit sticky top-28">
                                        <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
                                            <div className="p-1.5 bg-[#1e3a5f] rounded"><UserPlus size={14} className="text-[#c9a857]" /></div>
                                            Adicionar Membro
                                        </h3>
                                        <form onSubmit={handleCreateUserRequest} className="space-y-4">
                                            <div className="space-y-1.5">
                                                <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">E-mail</label>
                                                <input
                                                    type="email"
                                                    required
                                                    value={newUserEmail}
                                                    onChange={e => setNewUserEmail(e.target.value)}
                                                    className="input-premium"
                                                    placeholder="colaborador@email.com"
                                                />
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Senha</label>
                                                <input
                                                    type="text"
                                                    required
                                                    minLength={6}
                                                    value={newUserPassword}
                                                    onChange={e => setNewUserPassword(e.target.value)}
                                                    className="input-premium"
                                                    placeholder="••••••"
                                                />
                                            </div>
                                            {/* Admin Toggle */}
                                            <div className="flex items-center gap-3 p-3 bg-zinc-900/50 rounded-lg border border-white/5">
                                                <input
                                                    type="checkbox"
                                                    id="isAdminCheck"
                                                    checked={newIsAdmin}
                                                    onChange={e => setNewIsAdmin(e.target.checked)}
                                                    className="w-4 h-4 rounded bg-zinc-800 border-zinc-600 text-[#c9a857] focus:ring-[#c9a857] focus:ring-offset-0"
                                                />
                                                <label htmlFor="isAdminCheck" className="text-sm text-zinc-300 cursor-pointer flex items-center gap-2">
                                                    <Shield size={14} className="text-[#c9a857]" />
                                                    Criar como Administrador
                                                </label>
                                            </div>
                                            <button
                                                type="submit"
                                                disabled={loadingCreate}
                                                className="btn-primary w-full flex justify-center items-center gap-2 mt-2"
                                            >
                                                {loadingCreate ? <Loader2 size={14} className="animate-spin" /> : 'Criar Conta'}
                                            </button>
                                        </form>
                                    </div>

                                    <div className="lg:col-span-2 space-y-3">
                                        {users.map(user => (
                                            <div key={user.id} className="card-law p-4 flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center font-medium text-sm ${user.role === 'admin' ? 'bg-[#1e3a5f] text-[#c9a857]' : 'bg-zinc-800 text-zinc-400'}`}>
                                                        {user.email.slice(0, 2).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <h4 className="text-white font-medium text-sm">{user.email}</h4>
                                                        <p className="text-xs text-zinc-500 flex items-center gap-1">
                                                            {user.role === 'admin' ? (
                                                                <><Shield size={10} className="text-[#c9a857]" /> Administrador</>
                                                            ) : (
                                                                'Membro'
                                                            )}
                                                        </p>
                                                    </div>
                                                </div>
                                                {session.user.id !== user.id && (
                                                    <div className="flex items-center gap-2">
                                                        {/* Promote/Demote Button */}
                                                        <button
                                                            onClick={() => handleToggleRole(user.id, user.role)}
                                                            className={`text-xs px-3 py-2 rounded-lg transition-colors flex items-center gap-1.5 ${user.role === 'admin'
                                                                ? 'text-zinc-400 bg-zinc-800 hover:bg-zinc-700'
                                                                : 'text-[#c9a857] bg-[#c9a857]/10 hover:bg-[#c9a857]/20'
                                                                }`}
                                                            title={user.role === 'admin' ? 'Rebaixar para Membro' : 'Promover a Admin'}
                                                        >
                                                            <Shield size={12} />
                                                            {user.role === 'admin' ? 'Rebaixar' : 'Promover'}
                                                        </button>
                                                        {/* Delete Button */}
                                                        <button
                                                            onClick={() => handleDeleteUserRequest(user.id)}
                                                            className="text-red-400 bg-red-500/10 p-2 rounded-lg hover:bg-red-500/20 transition-colors"
                                                            title="Remover membro"
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Reports View */}
                        {activeTab === 'reports' && (
                            <div className="animate-fade-in space-y-5 flex-1">
                                {/* Header */}
                                <div className="mb-6 pb-5 border-b border-white/5">
                                    <h1 className="text-xl font-semibold text-white">Dashboard Analítico</h1>
                                    <p className="text-zinc-500 text-sm mt-1">Visão geral do sistema e métricas de desempenho</p>
                                </div>

                                {/* Main Stats Row */}
                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                    <div className="card-law group">
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="w-10 h-10 rounded-lg bg-[#1e3a5f] flex items-center justify-center">
                                                <FileText size={20} className="text-[#c9a857]" />
                                            </div>
                                            <span className="text-emerald-400 text-xs bg-emerald-500/10 px-2 py-1 rounded-full">+12%</span>
                                        </div>
                                        <p className="text-zinc-500 text-xs uppercase tracking-wider mb-1">Processos</p>
                                        <span className="text-2xl font-semibold text-white">{totalItems}</span>
                                    </div>

                                    <div className="card-law group">
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="w-10 h-10 rounded-lg bg-[#1e3a5f] flex items-center justify-center">
                                                <Users size={20} className="text-[#c9a857]" />
                                            </div>
                                            <span className="text-[#c9a857] text-xs bg-[#c9a857]/10 px-2 py-1 rounded-full">Ativo</span>
                                        </div>
                                        <p className="text-zinc-500 text-xs uppercase tracking-wider mb-1">Clientes</p>
                                        <span className="text-2xl font-semibold text-white">{videos.length > 0 ? new Set(videos.map(v => v.titulo_peca)).size : 0}</span>
                                    </div>

                                    <div className="card-law group">
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="w-10 h-10 rounded-lg bg-[#1e3a5f] flex items-center justify-center">
                                                <Eye size={20} className="text-[#c9a857]" />
                                            </div>
                                        </div>
                                        <p className="text-zinc-500 text-xs uppercase tracking-wider mb-1">Visualizações</p>
                                        <span className="text-2xl font-semibold text-white">{videos.reduce((acc, v) => acc + (v.views || 0), 0)}</span>
                                    </div>

                                    <div className="card-law group">
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="w-10 h-10 rounded-lg bg-[#1e3a5f] flex items-center justify-center">
                                                <Shield size={20} className="text-[#c9a857]" />
                                            </div>
                                        </div>
                                        <p className="text-zinc-500 text-xs uppercase tracking-wider mb-1">Equipe</p>
                                        <span className="text-2xl font-semibold text-white">{users.length}</span>
                                    </div>
                                </div>

                                {/* Charts Row */}
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                    {/* Process Types Distribution */}
                                    <div className="card-law">
                                        <h3 className="text-base font-medium text-white mb-4">Processos por Tipo</h3>
                                        <div className="space-y-3">
                                            {[
                                                { label: 'Direito Civil', value: 35, color: '#c9a857' },
                                                { label: 'Direito Trabalhista', value: 28, color: '#1e3a5f' },
                                                { label: 'Direito Criminal', value: 18, color: '#4a5568' },
                                                { label: 'Outros', value: 19, color: '#27272a' },
                                            ].map((item, i) => (
                                                <div key={i}>
                                                    <div className="flex justify-between text-sm mb-1">
                                                        <span className="text-zinc-400">{item.label}</span>
                                                        <span className="text-white font-medium">{item.value}%</span>
                                                    </div>
                                                    <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full rounded-full transition-all duration-500"
                                                            style={{ width: `${item.value}%`, backgroundColor: item.color }}
                                                        />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Monthly Activity */}
                                    <div className="card-law">
                                        <h3 className="text-base font-medium text-white mb-4">Atividade Mensal</h3>
                                        <div className="flex items-end justify-between h-32 gap-2">
                                            {['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'].map((month, i) => {
                                                const heights = [40, 65, 45, 80, 60, 90];
                                                return (
                                                    <div key={month} className="flex-1 flex flex-col items-center gap-2">
                                                        <div
                                                            className="w-full bg-gradient-to-t from-[#1e3a5f] to-[#c9a857]/80 rounded-t-lg transition-all hover:opacity-80"
                                                            style={{ height: `${heights[i]}%` }}
                                                        />
                                                        <span className="text-zinc-600 text-[10px] uppercase">{month}</span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>

                                {/* Recent Activity & Storage */}
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                                    {/* Recent Activity */}
                                    <div className="card-law lg:col-span-2">
                                        <h3 className="text-base font-medium text-white mb-4">Atividade Recente</h3>
                                        <div className="space-y-3">
                                            {videos.slice(0, 5).map((video, i) => (
                                                <div key={video.id} className="flex items-center gap-3 p-3 bg-zinc-800/30 rounded-lg">
                                                    <div className="w-8 h-8 rounded-lg bg-[#1e3a5f] flex items-center justify-center shrink-0">
                                                        <FileText size={14} className="text-[#c9a857]" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm text-white truncate">{video.titulo_peca || 'Processo'}</p>
                                                        <p className="text-xs text-zinc-500">Nº {video.processo}</p>
                                                    </div>
                                                    <div className="text-xs text-zinc-500">
                                                        {new Date(video.created_at).toLocaleDateString()}
                                                    </div>
                                                </div>
                                            ))}
                                            {videos.length === 0 && (
                                                <div className="text-center py-8 text-zinc-500 text-sm">
                                                    Nenhuma atividade recente
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Storage & System */}
                                    <div className="space-y-4">
                                        <div className="card-law">
                                            <h3 className="text-sm font-medium text-white mb-3">Armazenamento</h3>
                                            <div className="relative w-24 h-24 mx-auto mb-3">
                                                <svg className="w-full h-full -rotate-90">
                                                    <circle cx="48" cy="48" r="40" stroke="#27272a" strokeWidth="8" fill="none" />
                                                    <circle
                                                        cx="48" cy="48" r="40"
                                                        stroke="#c9a857"
                                                        strokeWidth="8"
                                                        fill="none"
                                                        strokeDasharray={`${0.45 * 251.2} 251.2`}
                                                        strokeLinecap="round"
                                                    />
                                                </svg>
                                                <div className="absolute inset-0 flex items-center justify-center">
                                                    <span className="text-xl font-semibold text-white">45%</span>
                                                </div>
                                            </div>
                                            <p className="text-center text-zinc-500 text-xs">450 MB de 1 GB usado</p>
                                        </div>

                                        <div className="card-law">
                                            <h3 className="text-sm font-medium text-white mb-3">Status do Sistema</h3>
                                            <div className="space-y-2">
                                                <div className="flex items-center justify-between text-sm">
                                                    <span className="text-zinc-500">API</span>
                                                    <span className="flex items-center gap-1.5 text-emerald-400">
                                                        <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                                                        Online
                                                    </span>
                                                </div>
                                                <div className="flex items-center justify-between text-sm">
                                                    <span className="text-zinc-500">Storage</span>
                                                    <span className="flex items-center gap-1.5 text-emerald-400">
                                                        <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                                                        Online
                                                    </span>
                                                </div>
                                                <div className="flex items-center justify-between text-sm">
                                                    <span className="text-zinc-500">Banco</span>
                                                    <span className="flex items-center gap-1.5 text-emerald-400">
                                                        <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                                                        Online
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Settings View */}
                        {activeTab === 'settings' && (
                            <ConfiguracoesPage supabase={supabase} />
                        )}
                    </div>
                </div>
            </main>

            {/* Modals remain mostly unchanged but with updated colors if needed. For brevity I kept them compatible. */}
            {/* Confirm Modal */}
            {
                showConfirmModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
                        <div className="bg-[#18181b] border border-gray-700 p-8 rounded-2xl max-w-sm w-full shadow-2xl animate-scale-in">
                            <h3 className="text-lg font-bold text-white mb-2 text-center">Confirmar Criação?</h3>
                            <p className="text-center text-gray-400 text-sm mb-6">Um novo membro será adicionado à equipe.</p>
                            <div className="flex gap-3">
                                <button onClick={() => setShowConfirmModal(false)} className="flex-1 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-xl font-bold transition-colors">Cancelar</button>
                                <button onClick={confirmCreateUser} className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold transition-colors shadow-lg shadow-blue-900/20">Confirmar</button>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
}

// Sub-component for Client Logic
function ClientProcessView({ videos, loading, searchQuery, setSearchQuery, copyLink, copiedId, onNewUpload, supabase }) {
    const [selectedClient, setSelectedClient] = useState(null);
    const [selectedVideo, setSelectedVideo] = useState(null);
    const [viewLogs, setViewLogs] = useState([]);
    const [loadingLogs, setLoadingLogs] = useState(false);

    // Client info state - must be at top level
    const [clientInfo, setClientInfo] = useState({ email: '', phone: '', address: '', notes: '' });
    const [editingClient, setEditingClient] = useState(false);
    const [savingClient, setSavingClient] = useState(false);

    // Fetch view logs when a video is selected
    const fetchViewLogs = async (videoSlug) => {
        if (!supabase || !videoSlug) return;
        setLoadingLogs(true);
        try {
            const { data, error } = await supabase
                .from('view_logs')
                .select('*')
                .eq('video_slug', videoSlug)
                .order('created_at', { ascending: false })
                .limit(50);
            if (error) throw error;
            setViewLogs(data || []);
        } catch (err) {
            console.error('Error fetching view logs:', err);
            setViewLogs([]);
        } finally {
            setLoadingLogs(false);
        }
    };

    // Parse device type from user agent
    const getDeviceType = (userAgent) => {
        if (!userAgent) return 'Desconhecido';
        const ua = userAgent.toLowerCase();
        if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) return 'Mobile';
        if (ua.includes('tablet') || ua.includes('ipad')) return 'Tablet';
        return 'Desktop';
    };

    // Get device icon
    const getDeviceIcon = (type) => {
        if (type === 'Mobile' || type === 'Tablet') return <Smartphone size={14} className="text-blue-400" />;
        return <Monitor size={14} className="text-green-400" />;
    };

    // Analytics summary
    const getAnalyticsSummary = () => {
        const total = viewLogs.length;
        const mobile = viewLogs.filter(l => getDeviceType(l.device) === 'Mobile').length;
        const desktop = viewLogs.filter(l => getDeviceType(l.device) === 'Desktop').length;
        const regions = {};
        viewLogs.forEach(l => {
            const region = l.location || 'Desconhecido';
            regions[region] = (regions[region] || 0) + 1;
        });
        const topRegions = Object.entries(regions).sort((a, b) => b[1] - a[1]).slice(0, 3);
        return { total, mobile, desktop, topRegions };
    };

    const clients = React.useMemo(() => {
        const groups = {};
        videos.forEach(v => {
            const clientName = v.titulo_peca || "Sem Cliente";
            if (!groups[clientName]) groups[clientName] = [];
            groups[clientName].push(v);
        });
        return groups;
    }, [videos]);

    const filteredClients = React.useMemo(() => {
        if (!searchQuery) return Object.keys(clients);
        return Object.keys(clients).filter(name =>
            name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            clients[name].some(v => v.processo.includes(searchQuery))
        );
    }, [clients, searchQuery]);

    if (loading) {
        return (
            <div className="py-20 flex flex-col items-center justify-center animate-fade-in">
                <div className="spinner-premium mb-4"></div>
                <p className="text-zinc-500 text-sm">Carregando dados...</p>
            </div>
        );
    }

    if (videos.length === 0) {
        return (
            <div className="w-full py-16 card-law flex flex-col items-center justify-center text-center animate-fade-in">
                <div className="w-14 h-14 bg-[#1e3a5f] rounded-xl flex items-center justify-center mb-4">
                    <Upload size={24} className="text-[#c9a857]" />
                </div>
                <h3 className="text-lg font-medium text-white mb-2">Nenhum processo encontrado</h3>
                <p className="text-zinc-500 text-sm mb-4">Comece cadastrando um novo processo</p>
                <button onClick={onNewUpload} className="btn-primary">
                    Novo Processo
                </button>
            </div>
        );
    }

    // ANALYTICS MODAL
    if (selectedVideo) {
        const stats = getAnalyticsSummary();
        return (
            <div className="animate-fade-in space-y-5">
                <button onClick={() => { setSelectedVideo(null); setViewLogs([]); }} className="flex items-center gap-2 text-zinc-500 hover:text-white transition-colors text-sm">
                    <ChevronLeft size={16} /> Voltar para Processos
                </button>

                {/* Header */}
                <div className="card-law">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 bg-[#1e3a5f] rounded-lg flex items-center justify-center">
                            <Activity size={24} className="text-[#c9a857]" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-white">Analytics do Vídeo</h2>
                            <p className="text-zinc-500 text-sm">Processo Nº {selectedVideo.processo}</p>
                        </div>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="card-law text-center">
                        <Eye size={20} className="mx-auto mb-2 text-[#c9a857]" />
                        <p className="text-2xl font-bold text-white">{loadingLogs ? '...' : stats.total}</p>
                        <p className="text-xs text-zinc-500">Visualizações</p>
                    </div>
                    <div className="card-law text-center">
                        <Smartphone size={20} className="mx-auto mb-2 text-blue-400" />
                        <p className="text-2xl font-bold text-white">{loadingLogs ? '...' : stats.mobile}</p>
                        <p className="text-xs text-zinc-500">Mobile</p>
                    </div>
                    <div className="card-law text-center">
                        <Monitor size={20} className="mx-auto mb-2 text-green-400" />
                        <p className="text-2xl font-bold text-white">{loadingLogs ? '...' : stats.desktop}</p>
                        <p className="text-xs text-zinc-500">Desktop</p>
                    </div>
                    <div className="card-law text-center">
                        <MapPin size={20} className="mx-auto mb-2 text-purple-400" />
                        <p className="text-2xl font-bold text-white">{loadingLogs ? '...' : stats.topRegions.length}</p>
                        <p className="text-xs text-zinc-500">Regiões</p>
                    </div>
                </div>

                {/* Top Regions */}
                {stats.topRegions.length > 0 && (
                    <div className="card-law">
                        <h3 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
                            <MapPin size={14} className="text-[#c9a857]" />
                            Principais Regiões
                        </h3>
                        <div className="space-y-2">
                            {stats.topRegions.map(([region, count], i) => (
                                <div key={i} className="flex justify-between items-center text-sm">
                                    <span className="text-zinc-400">{region}</span>
                                    <span className="text-white font-medium bg-zinc-800 px-2 py-0.5 rounded">{count} views</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* View Logs History */}
                <div className="card-law">
                    <h3 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
                        <Clock size={14} className="text-[#c9a857]" />
                        Histórico de Acessos
                    </h3>
                    {loadingLogs ? (
                        <div className="py-4 text-center text-zinc-500 text-sm">Carregando...</div>
                    ) : viewLogs.length === 0 ? (
                        <div className="py-4 text-center text-zinc-500 text-sm">Nenhum acesso registrado</div>
                    ) : (
                        <div className="space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar">
                            {viewLogs.map((log, i) => (
                                <div key={i} className="flex items-center justify-between py-2 px-3 bg-zinc-800/30 rounded-lg text-sm">
                                    <div className="flex items-center gap-3">
                                        {getDeviceIcon(getDeviceType(log.device))}
                                        <div>
                                            <p className="text-white text-xs">{log.location || 'Local desconhecido'}</p>
                                            <p className="text-zinc-600 text-[10px]">{getDeviceType(log.device)}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-zinc-400 text-xs">{new Date(log.created_at).toLocaleDateString()}</p>
                                        <p className="text-zinc-600 text-[10px]">{new Date(log.created_at).toLocaleTimeString()}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // DETAIL VIEW (Specific Client)
    if (selectedClient) {
        const clientVideos = clients[selectedClient] || [];
        const firstVideo = clientVideos[0] || {};

        // Initialize client info when client is selected (using immediate update pattern)
        if (clientInfo.email === '' && clientInfo.phone === '' && firstVideo.client_email) {
            setClientInfo({
                email: firstVideo.client_email || '',
                phone: firstVideo.client_phone || '',
                address: firstVideo.client_address || '',
                notes: firstVideo.client_notes || ''
            });
        }

        const saveClientInfo = async () => {
            if (!supabase) return;
            setSavingClient(true);
            try {
                // Update all videos for this client
                const { error } = await supabase
                    .from('videos_pecas')
                    .update({
                        client_email: clientInfo.email || null,
                        client_phone: clientInfo.phone || null,
                        client_address: clientInfo.address || null,
                        client_notes: clientInfo.notes || null
                    })
                    .eq('titulo_peca', selectedClient);
                if (error) throw error;
                setEditingClient(false);
            } catch (err) {
                console.error('Error saving client info:', err);
                alert('Erro ao salvar: ' + err.message);
            } finally {
                setSavingClient(false);
            }
        };

        return (
            <div className="animate-fade-in">
                <button onClick={() => { setSelectedClient(null); setEditingClient(false); }} className="flex items-center gap-2 text-zinc-500 hover:text-white transition-colors text-sm mb-4">
                    <ChevronLeft size={16} /> Voltar para Clientes
                </button>

                {/* Unified Client Card */}
                <div className="card-law mb-4">
                    <div className="flex flex-col md:flex-row md:items-start gap-4">
                        {/* Client Info Section */}
                        <div className="flex-1">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-12 h-12 bg-[#1e3a5f] rounded-lg flex items-center justify-center text-xl font-medium text-[#c9a857]">
                                    {selectedClient.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <h2 className="text-lg font-semibold text-white">{selectedClient}</h2>
                                    <span className="text-xs text-[#c9a857]">{clientVideos.length} Processos</span>
                                </div>
                            </div>

                            {editingClient ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-[10px] text-zinc-500 uppercase mb-1 block">Email</label>
                                        <input type="email" value={clientInfo.email} onChange={(e) => setClientInfo({ ...clientInfo, email: e.target.value })} className="input-premium w-full text-sm py-2" placeholder="cliente@email.com" />
                                    </div>
                                    <div>
                                        <label className="text-[10px] text-zinc-500 uppercase mb-1 block">Telefone</label>
                                        <input type="tel" value={clientInfo.phone} onChange={(e) => setClientInfo({ ...clientInfo, phone: e.target.value })} className="input-premium w-full text-sm py-2" placeholder="(00) 00000-0000" />
                                    </div>
                                    <div>
                                        <label className="text-[10px] text-zinc-500 uppercase mb-1 block">Endereço</label>
                                        <input type="text" value={clientInfo.address} onChange={(e) => setClientInfo({ ...clientInfo, address: e.target.value })} className="input-premium w-full text-sm py-2" placeholder="Cidade - UF" />
                                    </div>
                                    <div>
                                        <label className="text-[10px] text-zinc-500 uppercase mb-1 block">Anotações</label>
                                        <input type="text" value={clientInfo.notes} onChange={(e) => setClientInfo({ ...clientInfo, notes: e.target.value })} className="input-premium w-full text-sm py-2" placeholder="Observações..." />
                                    </div>
                                    <div className="md:col-span-2 flex gap-2">
                                        <button onClick={() => setEditingClient(false)} className="btn-secondary flex-1 text-xs py-2">Cancelar</button>
                                        <button onClick={saveClientInfo} disabled={savingClient} className="btn-primary flex-1 text-xs py-2">{savingClient ? 'Salvando...' : 'Salvar'}</button>
                                    </div>
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                    <div className="py-2 px-3 bg-zinc-800/30 rounded-lg">
                                        <p className="text-[10px] text-zinc-600 uppercase">Email</p>
                                        <p className="text-zinc-300 text-xs truncate">{clientInfo.email || 'Não informado'}</p>
                                    </div>
                                    <div className="py-2 px-3 bg-zinc-800/30 rounded-lg">
                                        <p className="text-[10px] text-zinc-600 uppercase">Telefone</p>
                                        <p className="text-zinc-300 text-xs">{clientInfo.phone || 'Não informado'}</p>
                                    </div>
                                    <div className="py-2 px-3 bg-zinc-800/30 rounded-lg">
                                        <p className="text-[10px] text-zinc-600 uppercase">Endereço</p>
                                        <p className="text-zinc-300 text-xs truncate">{clientInfo.address || 'Não informado'}</p>
                                    </div>
                                    <div className="py-2 px-3 bg-zinc-800/30 rounded-lg flex items-center justify-between">
                                        <div>
                                            <p className="text-[10px] text-zinc-600 uppercase">Notas</p>
                                            <p className="text-zinc-300 text-xs truncate">{clientInfo.notes || '-'}</p>
                                        </div>
                                        <button onClick={() => setEditingClient(true)} className="text-[#c9a857] hover:text-white transition-colors ml-2">
                                            <Info size={14} />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Processes with PDF Preview */}
                <div className="space-y-3">
                    {clientVideos.map((video, index) => (
                        <div key={video.id} className="card-law p-4" style={{ animationDelay: `${index * 0.03}s` }}>
                            <div className="flex flex-col md:flex-row gap-4">
                                {/* PDF Preview */}
                                <div className="w-full md:w-32 flex-shrink-0">
                                    <div className="bg-gradient-to-br from-zinc-800 to-zinc-900 rounded-lg overflow-hidden aspect-[3/4] flex items-center justify-center border border-white/5">
                                        {video.pdf_final_url ? (
                                            <div className="w-full h-full relative group cursor-pointer" onClick={() => window.open(video.pdf_final_url, '_blank')}>
                                                <div className="absolute inset-0 bg-[#c9a857]/10 flex items-center justify-center">
                                                    <FileText size={32} className="text-[#c9a857]" />
                                                </div>
                                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                    <Eye size={20} className="text-white" />
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="text-center p-2">
                                                <FileText size={24} className="text-zinc-600 mx-auto mb-1" />
                                                <p className="text-[8px] text-zinc-600">Sem PDF</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Process Info */}
                                <div className="flex-1 flex flex-col justify-between">
                                    <div>
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-xs font-mono text-zinc-500 bg-zinc-800/50 px-2 py-1 rounded uppercase">
                                                Processo Nº {video.processo}
                                            </span>
                                            {video.views > 0 && (
                                                <div className="flex items-center gap-1 text-zinc-500 text-xs">
                                                    <Eye size={12} /> {video.views} views
                                                </div>
                                            )}
                                        </div>
                                        <div className="text-xs text-zinc-600 flex items-center gap-1 mb-3">
                                            <Calendar size={12} /> Criado em {new Date(video.created_at).toLocaleDateString()}
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex flex-wrap gap-2">
                                        <button onClick={() => copyLink(video.slug)} className={`btn-secondary text-xs py-2 px-4 ${copiedId === video.slug ? 'text-[#c9a857] border-[#c9a857]/30' : ''}`}>
                                            {copiedId === video.slug ? '✓ Copiado' : 'Copiar Link'}
                                        </button>
                                        <a href={`/?v=${video.slug}`} target="_blank" className="btn-primary text-xs py-2 px-4 flex items-center gap-2">
                                            <ExternalLink size={12} /> Abrir Página
                                        </a>
                                        {video.pdf_final_url && (
                                            <a href={video.pdf_final_url} download target="_blank" className="btn-secondary text-xs py-2 px-4 flex items-center gap-2 text-green-400 border-green-400/30 hover:bg-green-400/10">
                                                <Download size={12} /> Baixar PDF
                                            </a>
                                        )}
                                        <button onClick={() => { setSelectedVideo(video); fetchViewLogs(video.slug); }} className="btn-secondary text-xs py-2 px-4 flex items-center gap-2 text-purple-400 border-purple-400/30 hover:bg-purple-400/10">
                                            <Activity size={12} /> Analytics
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    // LIST VIEW (Clients)
    return (
        <div className="animate-fade-in space-y-5">
            {/* Header */}
            <div className="mb-6 pb-5 border-b border-white/5">
                <h1 className="text-xl font-semibold text-white">Meus Casos</h1>
                <p className="text-zinc-500 text-sm mt-1">Gerencie processos por cliente</p>
            </div>

            {/* Search */}
            <div className="card-law flex items-center gap-4">
                <div className="relative flex-1">
                    <input
                        type="text"
                        placeholder="Buscar cliente ou processo..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="input-premium pl-10"
                    />
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600" size={16} />
                </div>
                <div className="hidden md:block text-xs text-zinc-500 bg-zinc-800/50 px-3 py-1.5 rounded-lg">
                    {filteredClients.length} Clientes
                </div>
            </div>

            {/* Client Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredClients.length === 0 ? (
                    <div className="col-span-full py-10 text-center text-zinc-500 text-sm">
                        Nenhum cliente encontrado.
                    </div>
                ) : (
                    filteredClients.map((clientName, index) => {
                        const count = clients[clientName].length;
                        const lastUpdate = clients[clientName].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0].created_at;

                        return (
                            <div
                                key={index}
                                onClick={() => setSelectedClient(clientName)}
                                className="card-law cursor-pointer group"
                                style={{ animationDelay: `${index * 0.03}s` }}
                            >
                                <div className="flex items-center justify-between mb-3">
                                    <div className="w-10 h-10 bg-[#1e3a5f] rounded-lg flex items-center justify-center text-[#c9a857] font-medium">
                                        {clientName.charAt(0).toUpperCase()}
                                    </div>
                                    <ChevronRight className="text-zinc-600 group-hover:text-[#c9a857] transition-colors" size={18} />
                                </div>
                                <h3 className="text-base font-medium text-white mb-2 truncate">{clientName}</h3>
                                <div className="flex items-center gap-1 text-xs text-zinc-500">
                                    <FileText size={12} />
                                    {count} {count === 1 ? 'Processo' : 'Processos'}
                                </div>
                                <div className="mt-3 pt-3 border-t border-white/5 text-xs text-zinc-600 flex justify-between">
                                    <span>Atualizado</span>
                                    <span>{new Date(lastUpdate).toLocaleDateString()}</span>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
