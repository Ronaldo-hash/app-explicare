import React, { useState, useEffect } from 'react';
import { X, ChevronRight, CheckCircle, Smartphone, Upload, Eye } from 'lucide-react';

export function TutorialModal({ onClose }) {
    const [step, setStep] = useState(0);
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        // Check if tutorial has been seen
        const hasSeen = localStorage.getItem('tutorial_seen_v1');
        if (!hasSeen) {
            // Delay slighty to appear after fade-ins
            setTimeout(() => setIsOpen(true), 1000);
        }
    }, []);

    const handleClose = () => {
        setIsOpen(false);
        localStorage.setItem('tutorial_seen_v1', 'true');
        if (onClose) onClose();
    };

    const steps = [
        {
            title: "Bem-vindo ao App Explicare",
            desc: "Sua plataforma white-label para entregar peças jurídicas com vídeos explicativos.",
            icon: <Smartphone size={40} className="text-[#C9A857]" />,
            image: null
        },
        {
            title: "1. Envie seu Processo",
            desc: "Clique na aba 'Upload' para cadastrar um novo processo. Você precisará do PDF da peça e do vídeo explicativo.",
            icon: <Upload size={40} className="text-[#C9A857]" />,
        },
        {
            title: "2. Gere o Link",
            desc: "O sistema irá gerar um link seguro e um QR Code automaticamente no PDF para você enviar ao cliente.",
            icon: <CheckCircle size={40} className="text-[#C9A857]" />,
        },
        {
            title: "3. Acompanhe Visualizações",
            desc: "Na aba 'Processos', você pode ver quem assistiu seus vídeos e quando.",
            icon: <Eye size={40} className="text-[#C9A857]" />,
        }
    ];

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
            <div className="w-full max-w-md bg-[#1a1a1a] border border-[#C9A857]/50 rounded-2xl shadow-[0_0_50px_rgba(201,168,87,0.2)] overflow-hidden flex flex-col relative">

                {/* Progress Bar */}
                <div className="w-full h-1 bg-[#333]">
                    <div
                        className="h-full bg-[#C9A857] transition-all duration-300 ease-out"
                        style={{ width: `${((step + 1) / steps.length) * 100}%` }}
                    />
                </div>

                {/* Content */}
                <div className="p-8 flex-1 flex flex-col items-center text-center">
                    <div className="w-20 h-20 rounded-full bg-[#C9A857]/10 flex items-center justify-center mb-6 ring-1 ring-[#C9A857]/30 shadow-[0_0_30px_rgba(201,168,87,0.1)]">
                        {steps[step].icon}
                    </div>

                    <h2 className="text-2xl font-serif font-bold text-white mb-3">
                        {steps[step].title}
                    </h2>

                    <p className="text-gray-400 text-sm leading-relaxed mb-8">
                        {steps[step].desc}
                    </p>
                </div>

                {/* Footer Actions */}
                <div className="p-6 bg-[#111] border-t border-[#333] flex justify-between items-center">
                    <button
                        onClick={handleClose}
                        className="text-xs uppercase tracking-wider text-gray-500 hover:text-white transition-colors"
                    >
                        Pular
                    </button>

                    <button
                        onClick={() => {
                            if (step < steps.length - 1) {
                                setStep(s => s + 1);
                            } else {
                                handleClose();
                            }
                        }}
                        className="bg-[#C9A857] text-black px-6 py-2 rounded-lg font-bold text-sm uppercase tracking-wide hover:bg-[#b08d40] transition-colors flex items-center gap-2"
                    >
                        {step === steps.length - 1 ? 'Começar' : 'Próximo'}
                        {step < steps.length - 1 && <ChevronRight size={16} />}
                    </button>
                </div>

            </div>
        </div>
    );
}
