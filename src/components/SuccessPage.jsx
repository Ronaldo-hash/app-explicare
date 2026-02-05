import React, { useEffect, useState } from 'react';
import { CheckCircle, Download, ExternalLink, ArrowRight, RefreshCw, Edit2, Sparkles } from 'lucide-react';

export function SuccessPage({ data, onReset, onEdit }) {
    const [showConfetti, setShowConfetti] = useState(true);
    const [showContent, setShowContent] = useState(false);

    useEffect(() => {
        // Stagger the animations
        setTimeout(() => setShowContent(true), 300);
        // Hide confetti after 3 seconds
        setTimeout(() => setShowConfetti(false), 3000);
    }, []);

    return (
        <div className="fixed inset-0 z-50 bg-mainDark/90 backdrop-blur-md flex flex-col items-center justify-center p-6 overflow-y-auto">

            {/* Confetti Animation */}
            {showConfetti && (
                <div className="fixed inset-0 pointer-events-none z-[60] overflow-hidden">
                    {[...Array(50)].map((_, i) => (
                        <div
                            key={i}
                            className="absolute animate-confetti"
                            style={{
                                left: `${Math.random() * 100}%`,
                                top: '-10px',
                                animationDelay: `${Math.random() * 2}s`,
                                animationDuration: `${2 + Math.random() * 2}s`,
                            }}
                        >
                            <div
                                className="w-3 h-3 rounded-sm"
                                style={{
                                    backgroundColor: ['#c9a857', '#1e3a5f', '#10b981', '#3b82f6', '#f59e0b'][Math.floor(Math.random() * 5)],
                                    transform: `rotate(${Math.random() * 360}deg)`,
                                }}
                            />
                        </div>
                    ))}
                </div>
            )}

            <div className={`w-full max-w-5xl bg-cardDark border border-gray-700/50 shadow-2xl rounded-2xl overflow-hidden flex flex-col md:flex-row shadow-black/50 transition-all duration-500 ${showContent ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>

                {/* Left Column: Actions */}
                <div className="flex-1 flex flex-col items-center text-center justify-center p-8 md:p-12 border-r border-gray-700/30">
                    {/* Success Icon with pulse */}
                    <div className="relative mb-6">
                        <div className="absolute inset-0 bg-emerald-500/20 rounded-full animate-ping"></div>
                        <div className="relative w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center ring-2 ring-emerald-500/30 shadow-[0_0_30px_rgba(16,185,129,0.3)]">
                            <CheckCircle className="h-10 w-10 text-emerald-500" strokeWidth={1.5} />
                        </div>
                        <Sparkles className="absolute -top-1 -right-1 w-5 h-5 text-yellow-400 animate-pulse" />
                    </div>

                    <h2 className="text-3xl text-white font-bold mb-2 tracking-tight">Processo Iniciado!</h2>
                    <p className="text-gray-400 mb-8 max-w-sm text-sm leading-relaxed">
                        O processo <span className="text-white font-mono bg-white/5 px-1.5 py-0.5 rounded border border-white/10">{data.processo || "N/A"}</span> foi registrado com sucesso e já está disponível para visualização.
                    </p>

                    <div className="w-full max-w-xs space-y-3">
                        <a
                            href={data.landingUrl}
                            target="_blank"
                            className="bg-activeBlue hover:bg-blue-600 text-white w-full py-3.5 rounded-lg font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-900/20 group"
                        >
                            Visualizar Página Cliente
                            <ExternalLink size={16} className="group-hover:translate-x-0.5 transition-transform" />
                        </a>

                        <a
                            href={data.pdf_final_url}
                            target="_blank"
                            className="flex items-center justify-center gap-2 text-white bg-white/5 border border-white/10 hover:bg-white/10 w-full py-3.5 rounded-lg font-medium transition-colors"
                        >
                            <Download size={18} className="text-emerald-400" />
                            Baixar PDF com QR
                        </a>

                        <div className="flex gap-3 mt-6 pt-6 border-t border-white/5 w-full">
                            <button
                                onClick={onEdit}
                                className="flex-1 py-2.5 text-xs font-medium text-gray-400 hover:text-white bg-transparent hover:bg-white/5 rounded-lg transition-colors flex items-center justify-center gap-1.5"
                            >
                                <Edit2 size={14} /> Corrigir
                            </button>
                            <button
                                onClick={onReset}
                                className="flex-1 py-2.5 text-xs font-bold text-gray-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/5 rounded-lg transition-all flex items-center justify-center gap-1.5"
                            >
                                <RefreshCw size={14} /> Novo Envio
                            </button>
                        </div>
                    </div>
                </div>

                {/* Right Column: PDF Preview */}
                <div className="flex-1 bg-[#151518] flex flex-col min-h-[500px] relative">
                    <div className="absolute inset-0 bg-[radial-gradient(#ffffff05_1px,transparent_1px)] [background-size:16px_16px]"></div>

                    <div className="relative z-10 flex items-center justify-between p-4 border-b border-white/5 bg-cardDark/50 backdrop-blur-sm">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-red-500/50"></div>
                            <div className="w-2 h-2 rounded-full bg-yellow-500/50"></div>
                            <div className="w-2 h-2 rounded-full bg-green-500/50"></div>
                        </div>
                        <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wider flex items-center gap-1">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                            Documento Gerado
                        </span>
                    </div>

                    <div className="flex-1 p-6 flex items-center justify-center relative z-10">
                        <div className="w-full h-full shadow-2xl rounded-sm overflow-hidden bg-white relative">
                            {data.pdf_final_url ? (
                                <iframe
                                    src={`${data.pdf_final_url}#toolbar=0&navpanes=0&scrollbar=0`}
                                    className="w-full h-full border-none"
                                    title="PDF Preview"
                                />
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full text-gray-400">
                                    <p className="text-sm">Pré-visualização indisponível</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
