import React, { useState, useEffect } from 'react';
import { Loader2, Lock, Mail, ArrowRight, ShieldCheck, CheckCircle, AlertCircle } from 'lucide-react';

const BG_IMAGE_URL = 'https://zrssvsfxxtjieoyurzms.supabase.co/storage/v1/object/sign/arquivos%20da%20empresa/fundo%20site.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV9mMGYzMmMyYS05ODRhLTQwMjctOTA1YS05NGU1NWQ3ZmY3NzEiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJhcnF1aXZvcyBkYSBlbXByZXNhL2Z1bmRvIHNpdGUucG5nIiwiaWF0IjoxNzcwMTg4ODIyLCJleHAiOjE4MDE3MjQ4MjJ9._Ov3-JO41bj6oDDjyMV3PkOUDVLe1ETN8hskLn0vfQ8';

export function LoginPage({ supabase }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [recoverMsg, setRecoverMsg] = useState(null);
    const [bgLoaded, setBgLoaded] = useState(false);

    useEffect(() => {
        document.body.style.pointerEvents = 'auto';
        document.body.style.userSelect = 'auto';
        const loaders = document.querySelectorAll('.app-loader');
        loaders.forEach(el => el.remove());

        // Preload background image
        const img = new Image();
        img.onload = () => setBgLoaded(true);
        img.src = BG_IMAGE_URL;
    }, []);

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const { data, error } = await supabase.auth.signInWithPassword({ email, password });

            if (error) {
                if (error.message.includes("Email not confirmed")) {
                    setError("Por favor, execute este SQL no Supabase: UPDATE auth.users SET email_confirmed_at = NOW() WHERE email = '" + email + "';");
                    return;
                }
                throw error;
            }

            if (data?.session) {
                window.location.href = '/';
            }
        } catch (err) {
            let msg = err.message;
            if (msg === "Invalid login credentials") msg = "E-mail ou senha incorretos. Verifique seus dados e tente novamente.";
            if (msg.includes("Failed to fetch")) msg = "Erro de conexão. Verifique sua internet e tente novamente.";
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    const handleRecover = async () => {
        if (!email) {
            setError("Digite seu e-mail para recuperar a senha.");
            return;
        }
        setLoading(true);
        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: window.location.origin + '/update-password',
            });
            if (error) throw error;
            setRecoverMsg("E-mail de recuperação enviado! Verifique sua caixa de entrada.");
            setError(null);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            className="min-h-screen flex items-center justify-center font-sans relative transition-all duration-700"
            style={{
                backgroundColor: '#0a0a0b',
                backgroundImage: bgLoaded ? `url(${BG_IMAGE_URL})` : 'none',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat'
            }}
        >
            {/* Overlay for better readability */}
            <div className="absolute inset-0 bg-black/60" />

            <div className="w-full max-w-md p-6 animate-fade-in relative z-10">

                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-xl bg-[#1e3a5f] mb-5">
                        <ShieldCheck size={32} className="text-[#c9a857]" strokeWidth={1.5} />
                    </div>

                    <h1 className="text-2xl font-semibold text-white mb-1">
                        Explicare
                    </h1>
                    <p className="text-zinc-500 text-sm">
                        Portal de Gestão Jurídica
                    </p>
                </div>

                {/* Login Card */}
                <div className="card-law p-8">
                    <div className="mb-6 text-center">
                        <h2 className="text-lg font-medium text-white">Acesso ao Sistema</h2>
                    </div>

                    {/* Messages */}
                    {error && (
                        <div className="mb-5 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm flex items-start gap-3">
                            <AlertCircle size={16} className="shrink-0 mt-0.5" />
                            <span>{error}</span>
                        </div>
                    )}
                    {recoverMsg && (
                        <div className="mb-5 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-400 text-sm flex items-start gap-3">
                            <CheckCircle size={16} className="shrink-0 mt-0.5" />
                            <span>{recoverMsg}</span>
                        </div>
                    )}

                    <form onSubmit={handleLogin} className="space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">E-mail</label>
                            <input
                                type="email"
                                required
                                className="input-premium"
                                placeholder="email@exemplo.com"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                            />
                        </div>

                        <div className="space-y-1.5">
                            <div className="flex justify-between items-center">
                                <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Senha</label>
                                <button type="button" onClick={handleRecover} className="text-xs text-[#c9a857] hover:text-[#d4b76a] transition-colors">
                                    Esqueceu?
                                </button>
                            </div>
                            <input
                                type="password"
                                required
                                className="input-premium"
                                placeholder="••••••••"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="btn-primary w-full flex items-center justify-center gap-2 mt-6"
                        >
                            {loading ? (
                                <Loader2 className="animate-spin" size={18} />
                            ) : (
                                <>
                                    Entrar
                                    <ArrowRight size={16} />
                                </>
                            )}
                        </button>
                    </form>
                </div>

                <div className="mt-6 text-center">
                    <p className="text-zinc-600 text-xs">
                        &copy; 2026 Explicare Advocacia
                    </p>
                </div>

            </div>
        </div>
    );
}
