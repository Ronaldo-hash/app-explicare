import { useState, useEffect, useCallback } from 'react';

/**
 * Hook that fetches real dashboard metrics from Supabase.
 * Returns: storageStats, growthPercent, processByType, monthlyActivity, systemHealth
 */
export function useDashboardStats(supabase) {
    const [stats, setStats] = useState({
        // Storage
        storageUsedMB: 0,
        storageTotalMB: 1024, // Supabase free tier = 1 GB
        storagePercent: 0,

        // Growth
        growthPercent: 0,
        currentMonthCount: 0,
        lastMonthCount: 0,

        // Process types
        processByType: [],

        // Monthly activity (last 6 months)
        monthlyActivity: [],

        // System health
        systemHealth: {
            api: null,     // 'online' | 'offline' | null (loading)
            storage: null,
            database: null,
        },

        loading: true,
    });

    const fetchStorageStats = useCallback(async () => {
        try {
            let totalBytes = 0;
            const buckets = ['videos-final-v3', 'pecas-final-v3'];

            for (const bucket of buckets) {
                const { data, error } = await supabase.storage
                    .from(bucket)
                    .list('', { limit: 1000 });

                if (!error && data) {
                    // Each file object has metadata.size or we sum from listing
                    for (const file of data) {
                        if (file.metadata && file.metadata.size) {
                            totalBytes += file.metadata.size;
                        }
                    }

                    // Also try listing subdirectories
                    for (const item of data) {
                        if (!item.id && item.name) {
                            // It's a folder, list its contents
                            const { data: subData } = await supabase.storage
                                .from(bucket)
                                .list(item.name, { limit: 1000 });

                            if (subData) {
                                for (const subFile of subData) {
                                    if (subFile.metadata && subFile.metadata.size) {
                                        totalBytes += subFile.metadata.size;
                                    }
                                }
                            }
                        }
                    }
                }
            }

            const usedMB = Math.round(totalBytes / (1024 * 1024));
            const totalMB = 1024; // 1 GB
            const percent = Math.min(Math.round((usedMB / totalMB) * 100), 100);

            return { storageUsedMB: usedMB, storageTotalMB: totalMB, storagePercent: percent };
        } catch (err) {
            console.error('Error fetching storage stats:', err);
            return { storageUsedMB: 0, storageTotalMB: 1024, storagePercent: 0 };
        }
    }, [supabase]);

    const fetchGrowthStats = useCallback(async () => {
        try {
            const now = new Date();
            const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
            const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
            const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59).toISOString();

            // Current month count
            const { count: currentCount } = await supabase
                .from('videos_pecas')
                .select('*', { count: 'exact', head: true })
                .gte('created_at', startOfCurrentMonth);

            // Last month count
            const { count: lastCount } = await supabase
                .from('videos_pecas')
                .select('*', { count: 'exact', head: true })
                .gte('created_at', startOfLastMonth)
                .lte('created_at', endOfLastMonth);

            const current = currentCount || 0;
            const last = lastCount || 0;
            let growthPercent = 0;

            if (last > 0) {
                growthPercent = Math.round(((current - last) / last) * 100);
            } else if (current > 0) {
                growthPercent = 100; // From 0 to something = 100% growth
            }

            return { growthPercent, currentMonthCount: current, lastMonthCount: last };
        } catch (err) {
            console.error('Error fetching growth stats:', err);
            return { growthPercent: 0, currentMonthCount: 0, lastMonthCount: 0 };
        }
    }, [supabase]);

    const fetchProcessByType = useCallback(async () => {
        try {
            const { data, error } = await supabase
                .from('videos_pecas')
                .select('tipo_acao');

            if (error || !data || data.length === 0) {
                return [];
            }

            // Group by tipo_acao
            const counts = {};
            data.forEach(item => {
                const type = item.tipo_acao || 'Não Classificado';
                counts[type] = (counts[type] || 0) + 1;
            });

            const total = data.length;
            const COLORS = ['#c9a857', '#1e3a5f', '#4a5568', '#27272a', '#6366f1', '#f59e0b'];

            const result = Object.entries(counts)
                .sort((a, b) => b[1] - a[1])
                .map(([label, count], i) => ({
                    label,
                    value: Math.round((count / total) * 100),
                    count,
                    color: COLORS[i % COLORS.length],
                }));

            return result;
        } catch (err) {
            console.error('Error fetching process types:', err);
            return [];
        }
    }, [supabase]);

    const fetchMonthlyActivity = useCallback(async () => {
        try {
            const now = new Date();
            const months = [];

            // Build last 6 months
            for (let i = 5; i >= 0; i--) {
                const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
                months.push({
                    label: d.toLocaleString('pt-BR', { month: 'short' }).replace('.', ''),
                    start: new Date(d.getFullYear(), d.getMonth(), 1).toISOString(),
                    end: new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59).toISOString(),
                    count: 0,
                });
            }

            // Fetch all from last 6 months
            const { data } = await supabase
                .from('videos_pecas')
                .select('created_at')
                .gte('created_at', months[0].start)
                .order('created_at', { ascending: true });

            if (data) {
                data.forEach(item => {
                    const date = new Date(item.created_at);
                    for (const month of months) {
                        if (date >= new Date(month.start) && date <= new Date(month.end)) {
                            month.count++;
                            break;
                        }
                    }
                });
            }

            // Calculate heights as percentage of max
            const maxCount = Math.max(...months.map(m => m.count), 1);
            return months.map(m => ({
                label: m.label.charAt(0).toUpperCase() + m.label.slice(1),
                count: m.count,
                heightPercent: Math.max(Math.round((m.count / maxCount) * 100), 5), // min 5% for visibility
            }));
        } catch (err) {
            console.error('Error fetching monthly activity:', err);
            return [];
        }
    }, [supabase]);

    const checkSystemHealth = useCallback(async () => {
        const health = { api: 'offline', storage: 'offline', database: 'offline' };

        try {
            // DB check: simple query
            const { error: dbError } = await supabase
                .from('profiles')
                .select('id', { count: 'exact', head: true });
            health.database = dbError ? 'offline' : 'online';

            // API check: if Supabase responds to query, REST API is online
            health.api = health.database === 'online' ? 'online' : 'offline';

            // Storage check: try listing a bucket
            const { error: stError } = await supabase.storage
                .from('videos-final-v3')
                .list('', { limit: 1 });
            health.storage = stError ? 'offline' : 'online';
        } catch {
            // All offline if exception
        }

        return health;
    }, [supabase]);

    const fetchAll = useCallback(async () => {
        setStats(prev => ({ ...prev, loading: true }));

        const [storageData, growthData, typeData, monthData, healthData] = await Promise.all([
            fetchStorageStats(),
            fetchGrowthStats(),
            fetchProcessByType(),
            fetchMonthlyActivity(),
            checkSystemHealth(),
        ]);

        setStats({
            ...storageData,
            ...growthData,
            processByType: typeData,
            monthlyActivity: monthData,
            systemHealth: healthData,
            loading: false,
        });
    }, [fetchStorageStats, fetchGrowthStats, fetchProcessByType, fetchMonthlyActivity, checkSystemHealth]);

    useEffect(() => {
        if (supabase) {
            fetchAll();
        }
    }, [supabase, fetchAll]);

    return { ...stats, refresh: fetchAll };
}
