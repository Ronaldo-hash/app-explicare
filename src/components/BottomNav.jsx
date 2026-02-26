import React from 'react';
import { House, FilePlus, Briefcase, ChartBar, Gear } from '@phosphor-icons/react';

const NAV_ITEMS = [
    { id: 'dashboard', label: 'Início', icon: House },
    { id: 'processos', label: 'Casos', icon: Briefcase },
    { id: 'upload', label: 'Novo', icon: FilePlus, isCenter: true },
    { id: 'reports', label: 'Relatórios', icon: ChartBar },
    { id: 'settings', label: 'Config', icon: Gear },
];

export function BottomNav({ activeTab, setActiveTab }) {
    return (
        <nav className="bottom-nav lg:hidden">
            {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;

                if (item.isCenter) {
                    return (
                        <button
                            key={item.id}
                            id={`bottom-nav-${item.id}`}
                            onClick={() => setActiveTab(item.id)}
                            className="bottom-nav-center-btn"
                            aria-label={item.label}
                        >
                            <div className={`bottom-nav-center-icon ${isActive ? 'active' : ''}`}>
                                <Icon size={24} weight="bold" />
                            </div>
                            <span className="bottom-nav-label">{item.label}</span>
                        </button>
                    );
                }

                return (
                    <button
                        key={item.id}
                        id={`bottom-nav-${item.id}`}
                        onClick={() => setActiveTab(item.id)}
                        className={`bottom-nav-item ${isActive ? 'active' : ''}`}
                        aria-label={item.label}
                    >
                        <Icon
                            size={22}
                            weight={isActive ? 'fill' : 'regular'}
                        />
                        <span className="bottom-nav-label">{item.label}</span>
                    </button>
                );
            })}
        </nav>
    );
}
