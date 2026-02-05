import React, { useState, useEffect } from 'react';
import { House, FilePlus, Briefcase, ChartBar, Gear, SignOut, Scales, List, X, UsersThree } from '@phosphor-icons/react';

export function Sidebar({ activeTab, setActiveTab, onLogout, userRole }) {
    const [isOpen, setIsOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 1024);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    const navItems = [
        { id: 'dashboard', label: 'Início', icon: House },
        { id: 'upload', label: 'Novo Processo', icon: FilePlus },
        { id: 'processos', label: 'Meus Casos', icon: Briefcase },
        { id: 'reports', label: 'Relatórios', icon: ChartBar },
        // Equipe só aparece para admins
        ...(userRole === 'admin' ? [{ id: 'equipe', label: 'Equipe', icon: UsersThree }] : []),
        { id: 'settings', label: 'Configurações', icon: Gear },
    ];

    const toggleSidebar = () => setIsOpen(!isOpen);

    return (
        <>
            {/* Mobile Toggle */}
            <div className="lg:hidden fixed top-4 left-4 z-50">
                <button
                    onClick={toggleSidebar}
                    className="p-3 bg-[#111113] text-white rounded-lg border border-white/10 active:scale-95 transition-transform"
                >
                    {isOpen ? <X size={22} weight="bold" /> : <List size={22} weight="bold" />}
                </button>
            </div>

            {/* Overlay */}
            {isMobile && isOpen && (
                <div
                    className="fixed inset-0 bg-black/70 z-30 animate-fade-in"
                    onClick={() => setIsOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`
                    fixed lg:static inset-y-0 left-0 z-40
                    w-64 sidebar-premium
                    flex flex-col justify-between
                    transition-transform duration-300
                    ${isMobile && !isOpen ? '-translate-x-full' : 'translate-x-0'}
                `}
            >
                <div className="p-5">
                    {/* Logo */}
                    <div className="flex items-center gap-3 mb-8 mt-10 lg:mt-0 pb-5 border-b border-white/5">
                        <div className="w-10 h-10 flex items-center justify-center rounded-lg bg-[#1e3a5f]">
                            <Scales size={22} weight="fill" className="text-[#c9a857]" />
                        </div>
                        <div>
                            <span className="font-semibold text-white text-base block leading-tight">Explicare</span>
                            <span className="text-[10px] tracking-[0.15em] text-[#c9a857] uppercase font-medium">Advocacia</span>
                        </div>
                    </div>

                    {/* Navigation */}
                    <nav className="space-y-1">
                        {navItems.map((item) => {
                            const isActive = activeTab === item.id;
                            const Icon = item.icon;
                            return (
                                <button
                                    key={item.id}
                                    onClick={() => {
                                        setActiveTab(item.id);
                                        if (isMobile) setIsOpen(false);
                                    }}
                                    className={`sidebar-item w-full ${isActive ? 'active' : ''}`}
                                >
                                    <Icon
                                        size={20}
                                        weight={isActive ? "fill" : "regular"}
                                    />
                                    <span>{item.label}</span>
                                </button>
                            );
                        })}
                    </nav>
                </div>

                {/* Bottom */}
                <div className="p-5 border-t border-white/5">
                    <button
                        onClick={onLogout}
                        className="sidebar-item w-full text-red-400 hover:text-red-300 hover:bg-red-500/5"
                    >
                        <SignOut size={20} />
                        <span>Sair</span>
                    </button>
                    <p className="text-[10px] text-zinc-600 text-center mt-4 uppercase tracking-wider">v2.4 Pro</p>
                </div>
            </aside>
        </>
    );
}
