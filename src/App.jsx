import React, { useState, useEffect, useMemo, lazy, Suspense } from 'react';
import { createClient } from '@supabase/supabase-js';

import { GlobalStyles } from './components/GlobalStyles';
import { ErrorBoundary } from './components/ErrorBoundary';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './lib/config';
import { ThemeProvider } from './context/ThemeContext';

// ============================================
// LAZY LOADING
// ============================================

const AdminDashboard = lazy(() => import('./components/AdminDashboard').then(m => ({ default: m.AdminDashboard })));
const UploadPage = lazy(() => import('./components/UploadPage').then(m => ({ default: m.UploadPage })));
const LandingPage = lazy(() => import('./components/LandingPage').then(m => ({ default: m.LandingPage })));
const LoginPage = lazy(() => import('./components/LoginPage').then(m => ({ default: m.LoginPage })));
const RegisterPage = lazy(() => import('./components/RegisterPage').then(m => ({ default: m.RegisterPage })));
const UpdatePasswordPage = lazy(() => import('./components/UpdatePasswordPage').then(m => ({ default: m.UpdatePasswordPage })));
const SuccessPage = lazy(() => import('./components/SuccessPage').then(m => ({ default: m.SuccessPage })));

const PageLoader = () => (
  <div className="min-h-screen flex flex-col items-center justify-center">
    <div className="w-12 h-12 border-3 border-blue-500 border-t-white rounded-full animate-spin mb-4 shadow-[0_0_15px_rgba(59,130,246,0.5)]"></div>
    <p className="text-blue-400 text-sm font-medium tracking-widest uppercase">Carregando...</p>
  </div>
);

// Helper to determine route from URL and session state
function resolveRoute(session) {
  const path = window.location.pathname;
  const params = new URLSearchParams(window.location.search);
  const videoSlug = params.get('v');

  if (videoSlug) return 'fetching_landing';
  if (path === '/cadastro') return 'register';
  if (path === '/update-password') return 'update-password';
  if (path === '/login') return session ? 'admin' : 'login';
  if (!session) return 'login';
  if (path === '/admin' || path === '/' || path === '') return 'admin';
  return '404';
}

export default function App() {

  const [libsLoaded, setLibsLoaded] = useState(false);
  const [supabase, setSupabase] = useState(null);
  const [session, setSession] = useState(null);
  const [landingData, setLandingData] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [uploadSuccessData, setUploadSuccessData] = useState(null);
  const [uploadKey, setUploadKey] = useState(0);
  // Override route for landing page data fetching flow
  const [routeOverride, setRouteOverride] = useState(null);

  // Derive route from state instead of setting it in effects
  const computedRoute = useMemo(() => {
    if (!libsLoaded || !supabase) return null;
    return resolveRoute(session);
  }, [libsLoaded, supabase, session]);

  const currentRoute = routeOverride || computedRoute;

  // --- INITIALIZATION GUARD ---
  useEffect(() => {
    let mounted = true;

    // Safety Timeout: Force load after 3 seconds even if Supabase hangs
    const safetyTimeout = setTimeout(() => {
      if (mounted && !libsLoaded) {
        console.warn("Forcing App Load due to timeout");
        setLibsLoaded(true);
      }
    }, 3000);

    const initApp = async () => {
      try {
        const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
          auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
        });

        if (mounted) {
          setSupabase(client);

          const { data: { session: initialSession } } = await client.auth.getSession();
          setSession(initialSession);

          client.auth.onAuthStateChange((_event, newSession) => {
            if (mounted) {
              setSession(newSession);
            }
          });

          setLibsLoaded(true);
        }

      } catch (err) {
        console.error("Critical Init Error:", err);
        if (mounted) setLoadError(err.message);
      }
    };

    initApp();

    return () => {
      mounted = false;
      clearTimeout(safetyTimeout);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- DATA FETCHING FOR LANDING PAGE ---
  useEffect(() => {
    if (libsLoaded && supabase && currentRoute === 'fetching_landing') {
      const params = new URLSearchParams(window.location.search);
      const slug = params.get('v');
      async function fetchData() {
        const { data } = await supabase.from('videos_pecas').select('*').eq('slug', slug).single();
        if (data) {
          setLandingData(data);
          setRouteOverride('landing');
        } else {
          alert("Processo não encontrado.");
          setRouteOverride(null);
        }
      }
      fetchData();
    }
  }, [libsLoaded, supabase, currentRoute]);

  if (loadError) return (
    <div className="min-h-screen flex items-center justify-center bg-black text-red-500 p-10 flex-col">
      <h1 className="text-2xl font-bold mb-4">Erro de Inicialização</h1>
      <p>{loadError}</p>
      <button onClick={() => window.location.reload()} className="mt-6 px-4 py-2 bg-red-800 text-white rounded">Tentar Novamente</button>
    </div>
  );

  if (!libsLoaded) return <PageLoader />;

  return (
    <ThemeProvider>
      <GlobalStyles />
      <div className="mesh-bg"></div>
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-[-1]">
        <div className="orb orb-1"></div>
        <div className="orb orb-2"></div>
      </div>

      <div className="relative z-10 w-full min-h-screen flex flex-col">
        <ErrorBoundary>
          <Suspense fallback={<PageLoader />}>

            {currentRoute === 'login' && supabase && (
              <LoginPage supabase={supabase} />
            )}

            {currentRoute === 'admin' && supabase && (
              <AdminDashboard
                supabase={supabase}
                session={session}
                onLogout={async () => {
                  await supabase.auth.signOut();
                  window.location.href = '/login';
                }}
              />
            )}

            {currentRoute === '404' && (
              <div className="min-h-screen flex items-center justify-center text-center p-6">
                <div>
                  <h1 className="text-blue-500 text-4xl font-serif font-bold mb-4">404</h1>
                  <p className="text-gray-300">Página não encontrada.</p>
                  <a href="/login" className="mt-6 inline-block text-blue-400 underline hover:text-white">Voltar ao Início</a>
                </div>
              </div>
            )}

            {currentRoute === 'landing' && landingData && supabase && (
              <LandingPage data={landingData} supabase={supabase} />
            )}

            {currentRoute === 'register' && supabase && (
              <RegisterPage supabase={supabase} />
            )}

            {currentRoute === 'update-password' && supabase && (
              <UpdatePasswordPage supabase={supabase} />
            )}

            {/* Default/Upload Route */}
            {currentRoute === 'upload' && supabase && (
              <>
                <div style={{ display: uploadSuccessData ? 'none' : 'block' }}>
                  <UploadPage
                    key={uploadKey}
                    supabase={supabase}
                    session={session}
                    onSuccess={(data) => setUploadSuccessData(data)}
                  />
                </div>
                {uploadSuccessData && (
                  <SuccessPage
                    data={uploadSuccessData}
                    onEdit={() => setUploadSuccessData(null)}
                    onReset={() => {
                      setUploadSuccessData(null);
                      setUploadKey(prev => prev + 1);
                    }}
                  />
                )}
              </>
            )}
          </Suspense>
        </ErrorBoundary>
      </div>
    </ThemeProvider>
  );
}
