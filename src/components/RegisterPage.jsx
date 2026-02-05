import React, { useState } from 'react';
import { Logo } from './Logo';
import { UserPlus, Shield, CheckCircle, AlertTriangle, Loader2 } from 'lucide-react';
import { OptimizedBackground } from './OptimizedBackground';

export function RegisterPage({ supabase }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);

    const handleRegister = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const { error: signUpError } = await supabase.auth.signUp({
                email,
                password,
            });

            if (signUpError) throw signUpError;

            setSuccess(true);
        } catch (err) {
            let msg = err.message;
            if (msg.includes("already registered")) msg = "Este e-mail já está cadastrado.";
            if (msg.includes("weak")) msg = "A senha é muito fraca (mínimo 6 caracteres).";
            if (msg.includes("rate limit")) msg = "Muitas tentativas. Verifique seu e-mail ou aguarde alguns minutos.";
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4 font-sans relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#1a1a1a] via-[#050505] to-[#000000]"></div>
                <div className="w-full max-w-md bg-[#121212]/80 backdrop-blur-xl border border-green-500/30 p-10 rounded-2xl shadow-2xl text-center relative z-10 animate-scale-in">
                    <div className="flex justify-center mb-6">
                        <div className="w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center text-green-500 border border-green-500/20">
                            <CheckCircle size={40} />
                        </div>
                    </div>
                    <h2 className="text-2xl text-white font-serif font-bold mb-2">Conta Criada!</h2>
                    <p className="text-gray-400 text-sm mb-8 leading-relaxed">
                        Seu cadastro foi realizado com sucesso. Verifique seu e-mail para confirmar o acesso.
                    </p>
                    <button
                        onClick={() => window.location.href = '/login'}
                        className="w-full bg-gradient-to-r from-[#C9A857] to-[#aa8a39] hover:to-[#C9A857] text-[#050505] font-bold py-4 rounded-xl text-sm transition-all shadow-lg shadow-[#C9A857]/20 hover:shadow-[#C9A857]/40 hover:-translate-y-0.5"
                    >
                        Ir para Login
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center font-sans relative overflow-hidden bg-[#050505]">
            <div className="absolute inset-0 z-0 bg-[#0a0a0a]">
                <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-[#C9A857]/10 blur-[100px] rounded-full sm:blur-[150px] animate-pulse-slow"></div>
                <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#4A3B18]/10 blur-[100px] rounded-full animate-pulse-slower"></div>
                <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.05) 1px, transparent 0)', backgroundSize: '24px 24px' }}></div>
            </div>

            <div className="relative z-10 w-full max-w-md p-4">
                <div className="w-full max-w-md bg-[#111]/70 backdrop-blur-xl border border-white/5 p-8 md:p-10 rounded-2xl shadow-2xl relative z-10 animate-fade-in-up ring-1 ring-white/5">

                    {/* Subtle Internal Glow */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-[#C9A857]/5 blur-[50px] rounded-full pointer-events-none"></div>

                    <div className="flex justify-center mb-8 relative z-10">
                        <Logo size="medium" />
                    </div>

                    <div className="text-center mb-8 relative z-10">
                        <h2 className="text-xl text-white font-bold mb-2 flex items-center justify-center gap-2">
                            <UserPlus size={20} className="text-[#E5B935]" /> Cadastro de Equipe
                        </h2>
                        <p className="text-gray-500 text-xs uppercase tracking-widest">Acesso Exclusivo para Advogados</p>
                    </div>

                    {error && (
                        <div className="mb-6 p-4 bg-red-900/40 border border-red-500/30 rounded-lg flex items-center gap-3 text-red-200 text-sm animate-shake backdrop-blur-sm">
                            <AlertTriangle size={18} className="shrink-0" />
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleRegister} className="space-y-5 relative z-10">
                        <div>
                            <label className="block text-[10px] font-bold text-[#C9A857] uppercase tracking-wider mb-2">E-mail Corporativo</label>
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full bg-black/40 border border-white/10 text-white px-4 py-3.5 rounded-xl focus:border-[#C9A857] focus:ring-1 focus:ring-[#C9A857] outline-none transition-all placeholder-gray-600 hover:border-white/20"
                                placeholder="seu.nome@advocacia.com"
                            />
                        </div>

                        <div>
                            <label className="block text-[10px] font-bold text-[#C9A857] uppercase tracking-wider mb-2">Definir Senha</label>
                            <input
                                type="password"
                                required
                                minLength={6}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-black/40 border border-white/10 text-white px-4 py-3.5 rounded-xl focus:border-[#C9A857] focus:ring-1 focus:ring-[#C9A857] outline-none transition-all placeholder-gray-600 hover:border-white/20"
                                placeholder="••••••••"
                            />
                        </div>

                        <div className="pt-2">
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-gradient-to-r from-[#C9A857] to-[#aa8a39] hover:to-[#C9A857] text-[#050505] font-bold py-4 rounded-xl text-sm transition-all shadow-lg shadow-[#C9A857]/20 hover:shadow-[#C9A857]/40 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed group flex justify-center items-center gap-2"
                            >
                                {loading ? <Loader2 className="animate-spin" size={20} /> : "Criar Conta"}
                            </button>
                        </div>
                    </form>

                    <div className="mt-8 text-center pt-6 border-t border-white/5 relative z-10">
                        <a href="/login" className="text-gray-500 text-xs hover:text-[#C9A857] transition-colors uppercase tracking-wider">
                            Já possui conta? Fazer Login
                        </a>
                    </div>
                </div>
                {/* Legal Footer */}
                <div className="absolute bottom-6 text-center w-full z-10 opacity-30 pointer-events-none left-0">
                    <p className="text-[10px] text-white uppercase tracking-[0.2em] font-light">
                        Sistema de Gestão Jurídica &bull; Acesso Restrito &bull; © 2026
                    </p>
                </div>
            </div>
        </div>
    );
}
