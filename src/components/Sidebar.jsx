import React, { useState, useEffect } from 'react';
import { House, FilePlus, Briefcase, ChartBar, Gear, SignOut, Scales, List, X, UsersThree } from '@phosphor-icons/react';
import { useWhitelabel } from '../context/WhitelabelContext';

export function Sidebar({ activeTab, setActiveTab, onLogout, userRole }) {
    const [isOpen, setIsOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const { company_name, logo_url } = useWhitelabel();

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

    // Split company name for styling: first word bold white, rest gold
    const nameParts = (company_name || 'Explicare').split(' ');
    const firstName = nameParts[0];
    const restName = nameParts.slice(1).join(' ');

    return (
        <>
            {/* Mobile Toggle - Hidden when bottom nav is present */}
            <div className="hidden">
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
                    <div id="onboarding-sidebar-logo" className="flex items-center gap-3 mb-8 mt-10 lg:mt-0 pb-5 border-b border-white/5">
                        {logo_url ? (
                            <img
                                src={logo_url}
                                alt={company_name}
                                className="h-10 w-10 object-contain rounded-lg"
                                onError={(e) => { e.target.style.display = 'none'; e.target.nextElementSibling && (e.target.nextElementSibling.style.display = 'flex'); }}
                            />
                        ) : null}
                        {!logo_url && (
                            <div className="w-10 h-10 flex items-center justify-center rounded-lg bg-transparent overflow-hidden">
                                <img src="/logo.png" alt="Explicare Logo" className="w-full h-full object-cover scale-150" />
                            </div>
                        )}
                        <div>
                            <span className="font-semibold text-white text-base block leading-tight">{firstName}</span>
                            {restName && (
                                <span className="text-[10px] tracking-[0.15em] text-[#c9a857] uppercase font-medium">{restName}</span>
                            )}
                        </div>
                    </div>

                    {/* Navigation */}
                    <nav className="space-y-1">
                        {navItems.map((item) => {
                            const isActive = activeTab === item.id;
                            const Icon = item.icon;
                            const onboardingIdMap = {
                                dashboard: 'onboarding-nav-dashboard',
                                upload: 'onboarding-nav-upload',
                                processos: 'onboarding-nav-processos',
                                reports: 'onboarding-nav-reports',
                                equipe: 'onboarding-nav-equipe',
                                settings: 'onboarding-nav-settings',
                            };
                            return (
                                <button
                                    key={item.id}
                                    id={onboardingIdMap[item.id]}
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
