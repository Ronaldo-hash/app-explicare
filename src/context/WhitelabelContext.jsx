import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const WhitelabelContext = createContext(null);

// Default values (same as whitelabel.js for backwards compatibility)
const DEFAULTS = {
    company_name: 'Tecnologia & Estratégia Jurídica',
    logo_url: null,
    background_url: null,
};

export function WhitelabelProvider({ supabase, children }) {
    const [config, setConfig] = useState(DEFAULTS);
    const [loading, setLoading] = useState(true);

    const loadConfig = useCallback(async () => {
        try {
            const { data, error } = await supabase
                .from('whitelabel_config')
                .select('*')
                .single();

            if (!error && data) {
                setConfig({
                    company_name: data.company_name || DEFAULTS.company_name,
                    logo_url: data.logo_url || null,
                    background_url: data.background_url || null,
                });
            }
        } catch (err) {
            // Table might not exist yet — use defaults
            console.log('Whitelabel config not available, using defaults');
        } finally {
            setLoading(false);
        }
    }, [supabase]);

    useEffect(() => {
        loadConfig();
    }, [loadConfig]);

    const updateConfig = useCallback(async (updates) => {
        setConfig(prev => ({ ...prev, ...updates }));
    }, []);

    return (
        <WhitelabelContext.Provider value={{ ...config, loading, refresh: loadConfig, updateConfig }}>
            {children}
        </WhitelabelContext.Provider>
    );
}

export function useWhitelabel() {
    const ctx = useContext(WhitelabelContext);
    if (!ctx) {
        // Fallback for components outside the provider
        return { ...DEFAULTS, loading: false, refresh: () => { }, updateConfig: () => { } };
    }
    return ctx;
}
