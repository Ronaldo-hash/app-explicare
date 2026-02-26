import { useEffect, useCallback, useRef } from 'react';
import introJs from 'intro.js';
import 'intro.js/introjs.css';
import '../styles/introjs-custom.css';

const STORAGE_KEY = 'explicare_onboarding_done';

/**
 * All onboarding steps.
 * On desktop, sidebar steps target sidebar IDs.
 * On mobile, sidebar steps are replaced with bottom-nav IDs.
 */
const DESKTOP_STEPS = [
    {
        element: '#onboarding-sidebar-logo',
        title: '👋 Bem-vindo ao Explicare!',
        intro: 'Este é o seu painel de gestão jurídica. Vamos fazer um tour rápido pelas funcionalidades.',
        position: 'right',
    },
    {
        element: '#onboarding-nav-dashboard',
        title: '🏠 Painel Inicial',
        intro: 'Veja um resumo geral: processos ativos, equipe e métricas em tempo real.',
        position: 'right',
    },
    {
        element: '#onboarding-nav-upload',
        title: '📁 Novo Processo',
        intro: 'Crie um novo processo enviando vídeo explicativo e PDF da peça jurídica.',
        position: 'right',
    },
    {
        element: '#onboarding-nav-processos',
        title: '📋 Meus Casos',
        intro: 'Gerencie todos os seus casos, copie links e veja analytics.',
        position: 'right',
    },
    {
        element: '#onboarding-nav-reports',
        title: '📊 Relatórios',
        intro: 'Estatísticas detalhadas de visualizações, dispositivos e engajamento.',
        position: 'right',
    },
    {
        element: '#onboarding-nav-equipe',
        title: '👥 Equipe',
        intro: 'Adicione membros, promova administradores e gerencie o acesso.',
        position: 'right',
        adminOnly: true,
    },
    {
        element: '#onboarding-nav-settings',
        title: '⚙️ Configurações',
        intro: 'Personalize cores, logotipo e preferências. Refaça este tour a qualquer momento aqui.',
        position: 'right',
    },
    {
        element: '#onboarding-theme-toggle',
        title: '🌓 Tema Claro/Escuro',
        intro: 'Alterne entre modo claro e escuro com um clique.',
        position: 'bottom',
    },
    {
        element: '#onboarding-user-avatar',
        title: '👤 Sua Conta',
        intro: 'Suas informações de acesso. Gerencie seu perfil e sessão.',
        position: 'bottom',
    },
    {
        element: '#onboarding-hero-card',
        title: '🎯 Ações Rápidas',
        intro: 'Acesse rapidamente as funções mais utilizadas: criar processo ou ver casos existentes.',
        position: 'bottom',
    },
    {
        element: '#onboarding-stats-grid',
        title: '📈 Métricas em Tempo Real',
        intro: 'Acompanhe processos ativos, tamanho da equipe e relatórios. Clique em qualquer card para ir direto à seção.',
        position: 'top',
    },
];

/**
 * Mobile-specific steps use bottom-nav IDs instead of sidebar IDs.
 */
const MOBILE_STEPS = [
    {
        title: '👋 Bem-vindo ao Explicare!',
        intro: 'Este é o seu painel de gestão jurídica. Vamos fazer um tour rápido! Use a barra inferior para navegar.',
        position: 'top',
    },
    {
        element: '#bottom-nav-dashboard',
        title: '🏠 Início',
        intro: 'Seu painel inicial com resumo de processos, equipe e métricas.',
        position: 'top',
    },
    {
        element: '#bottom-nav-processos',
        title: '📋 Meus Casos',
        intro: 'Gerencie todos os seus casos, copie links e veja analytics.',
        position: 'top',
    },
    {
        element: '#bottom-nav-upload',
        title: '📁 Novo Processo',
        intro: 'Toque aqui para criar um novo processo com vídeo e PDF.',
        position: 'top',
    },
    {
        element: '#bottom-nav-reports',
        title: '📊 Relatórios',
        intro: 'Estatísticas de visualizações, dispositivos e engajamento.',
        position: 'top',
    },
    {
        element: '#bottom-nav-settings',
        title: '⚙️ Configurações',
        intro: 'Personalize logotipo e preferências. Refaça este tour a qualquer momento aqui.',
        position: 'top',
    },
    {
        element: '#onboarding-theme-toggle',
        title: '🌓 Tema',
        intro: 'Alterne entre modo claro e escuro.',
        position: 'bottom',
    },
    {
        element: '#onboarding-hero-card',
        title: '🎯 Ações Rápidas',
        intro: 'Acesse rapidamente criar processo ou ver casos.',
        position: 'bottom',
    },
    {
        element: '#onboarding-stats-grid',
        title: '📈 Métricas',
        intro: 'Acompanhe processos, equipe e relatórios. Toque em qualquer card para navegar.',
        position: 'top',
    },
];

/**
 * Helper: check if viewport is mobile
 */
function isMobileViewport() {
    return window.innerWidth < 1024;
}

/**
 * Hook that manages the Intro.js onboarding tour.
 * @param {string} userRole - 'admin' or 'member'
 * @returns {{ startTour: () => void, resetTour: () => void }}
 */
export function useOnboarding(userRole) {
    const introInstance = useRef(null);

    const getSteps = useCallback(() => {
        const mobile = isMobileViewport();
        const steps = mobile ? MOBILE_STEPS : DESKTOP_STEPS;

        return steps.filter(step => {
            if (step.adminOnly && userRole !== 'admin') return false;
            return true;
        });
    }, [userRole]);

    const startTour = useCallback(() => {
        // Delay to ensure DOM elements are rendered
        setTimeout(async () => {
            const steps = getSteps();
            const mobile = isMobileViewport();

            // Small wait for DOM to settle
            await new Promise(resolve => setTimeout(resolve, 300));

            // Filter steps whose target elements exist in the DOM
            const validSteps = steps.filter(step => {
                if (!step.element) return true;
                return document.querySelector(step.element);
            });

            if (validSteps.length === 0) return;

            const intro = introJs();
            introInstance.current = intro;

            intro.setOptions({
                steps: validSteps.map(({ adminOnly, ...rest }) => rest),
                showProgress: true,
                showBullets: true,
                exitOnOverlayClick: false,
                disableInteraction: false,
                scrollToElement: true,
                scrollPadding: mobile ? 100 : 30,
                nextLabel: mobile ? 'Próximo →' : 'Próximo →',
                prevLabel: '← Anterior',
                doneLabel: '✓ Concluir',
                skipLabel: '✕',
                hidePrev: true,
                overlayOpacity: mobile ? 0.8 : 0.7,
            });

            intro.oncomplete(() => {
                localStorage.setItem(STORAGE_KEY, 'true');
            });

            intro.onexit(() => {
                localStorage.setItem(STORAGE_KEY, 'true');
            });

            intro.start();
        }, 800);
    }, [getSteps]);

    const resetTour = useCallback(() => {
        localStorage.removeItem(STORAGE_KEY);
        startTour();
    }, [startTour]);

    // Auto-start on first visit
    useEffect(() => {
        const done = localStorage.getItem(STORAGE_KEY);
        if (!done && userRole) {
            startTour();
        }
    }, [userRole, startTour]);

    return { startTour, resetTour };
}
