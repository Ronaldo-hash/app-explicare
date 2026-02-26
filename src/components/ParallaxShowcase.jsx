import React, { useRef, useState } from 'react';
import { motion, useSpring, useMotionValue, useTransform } from 'framer-motion';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(ScrollTrigger);

const EASE_OUT = [0.22, 0.61, 0.36, 1];

export function ParallaxShowcase() {
    const containerRef = useRef(null);
    const sceneRef = useRef(null);

    /* Mouse-driven tilt */
    const rawX = useMotionValue(0);
    const rawY = useMotionValue(0);
    const springX = useSpring(rawX, { stiffness: 45, damping: 18 });
    const springY = useSpring(rawY, { stiffness: 45, damping: 18 });

    const rotateY = useTransform(springX, [-0.5, 0.5], [-8, 8]);
    const rotateX = useTransform(springY, [-0.5, 0.5], [6, -6]);

    const handleMouseMove = (e) => {
        const rect = containerRef.current?.getBoundingClientRect();
        if (!rect) return;
        rawX.set((e.clientX - rect.left - rect.width / 2) / rect.width);
        rawY.set((e.clientY - rect.top - rect.height / 2) / rect.height);
    };
    const handleMouseLeave = () => { rawX.set(0); rawY.set(0); };

    /* GSAP ScrollTrigger scroll animation */
    useGSAP(() => {
        const tl = gsap.timeline({
            scrollTrigger: {
                trigger: containerRef.current,
                start: 'top top',
                end: '+=130%',
                scrub: 1.2,
                pin: true,
                anticipatePin: 1,
            },
        });

        tl
            .to('.showcase-title', {
                opacity: 1, y: 0,
                duration: 0.6, ease: 'power3.out',
            }, 0)
            .to('.pdf-document', {
                rotateX: 8,
                rotateZ: 0,
                rotateY: 0,
                scale: 1,
                boxShadow:
                    '-1px 1px 0 #e2e8f0, -2px 2px 0 #cbd5e1, -3px 3px 0 #94a3b8, -4px 4px 0 #64748b, -18px 30px 60px rgba(0,0,0,0.75), inset 0 0 0 1px rgba(255,255,255,0.9)',
                duration: 2.2,
                ease: 'power2.inOut',
            }, 0)
            .to('.paper-glare', {
                translateX: '160%',
                duration: 1.6,
                ease: 'power2.inOut',
            }, 0.1)
            .to('.qr-code', {
                opacity: 1,
                scale: 1,
                translateZ: 20,
                duration: 1.4,
                ease: 'back.out(2)',
            }, 0.9)
            .to('.video-glow', {
                opacity: 1,
                translateZ: 80,
                yPercent: -18,
                duration: 2,
                ease: 'power3.out',
            }, 1.4)
            .to('.video-glow-badge', {
                opacity: 1,
                y: 0,
                duration: 0.8,
                ease: 'power2.out',
            }, 2);

    }, { scope: containerRef });

    return (
        <div
            ref={containerRef}
            className="h-screen w-full relative overflow-hidden"
            style={{
                backgroundColor: '#050506',
                borderTop: '1px solid rgba(255,255,255,0.05)',
                borderBottom: '1px solid rgba(255,255,255,0.05)',
                perspective: '1400px',
            }}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
        >
            <style>{`
                .showcase-scene, .pdf-document { transform-style: preserve-3d; }

                .pdf-document {
                    background-color: #f8f8f6;
                    transform: rotateX(58deg) rotateZ(-22deg) rotateY(12deg);
                    box-shadow:
                        -1px 1px 0 #e2e8f0,
                        -2px 2px 0 #cbd5e1,
                        -3px 3px 0 #94a3b8,
                        -4px 4px 0 #64748b,
                        -28px 40px 80px rgba(0,0,0,0.9),
                        inset 0 0 0 1px rgba(255,255,255,1);
                    border-radius: 4px;
                    overflow: hidden;
                    will-change: transform;
                }

                .paper-glare {
                    position: absolute; inset: 0;
                    background: linear-gradient(108deg, transparent 22%, rgba(255,255,255,0.75) 44%, rgba(255,255,255,0.92) 50%, transparent 56%);
                    transform: translateX(-160%);
                    z-index: 15; pointer-events: none;
                }
                .watermark {
                    position: absolute; top: 50%; left: 50%;
                    transform: translate(-50%, -50%) rotate(-45deg);
                    font-size: 3.2rem; font-weight: 800; color: rgba(0,0,0,0.025);
                    white-space: nowrap; pointer-events: none; z-index: 5; letter-spacing: 0.15em;
                    font-family: 'Inter', sans-serif;
                }
                .shimmer-line {
                    background: linear-gradient(90deg, rgba(200,200,200,0.28) 25%, rgba(210,210,210,0.55) 50%, rgba(200,200,200,0.28) 75%);
                    background-size: 200% 100%;
                    animation: shimmer-doc 2.8s ease-in-out infinite;
                    border-radius: 4px;
                }
                @keyframes shimmer-doc {
                    0%   { background-position: 200% 0; }
                    100% { background-position: -200% 0; }
                }
                .video-glow {
                    background: rgba(12, 12, 16, 0.45);
                    backdrop-filter: blur(24px);
                    -webkit-backdrop-filter: blur(24px);
                    border: 1px solid rgba(255,255,255,0.12);
                    box-shadow: 0 40px 80px rgba(0,0,0,0.95), 0 0 60px rgba(201,168,87,0.18), inset 0 0 24px rgba(255,255,255,0.04);
                    transform: translateZ(-60px) scale(0.88);
                    opacity: 0;
                    will-change: transform, opacity;
                }
                .qr-code {
                    transform: translateZ(80px) scale(1.6);
                    opacity: 0;
                    will-change: transform, opacity;
                }
                .scan-line {
                    position: absolute; top: 0; left: 0; width: 100%; height: 2px;
                    background: linear-gradient(90deg, transparent, #c9a857, transparent);
                    box-shadow: 0 0 12px 2px rgba(201,168,87,0.9);
                    animation: scan-doc 2.2s ease-in-out infinite alternate;
                    opacity: 0.9; z-index: 10;
                }
                @keyframes scan-doc { 0% { top: 5%; } 100% { top: 93%; } }

                .video-glow-badge {
                    opacity: 0;
                    transform: translateY(12px);
                }
            `}</style>

            {/* Background glow layers */}
            <div className="absolute top-1/2 left-1/2 w-[900px] h-[900px] rounded-full pointer-events-none"
                style={{ transform: 'translate(-50%, -50%)', background: 'rgba(201,168,87,0.04)', filter: 'blur(130px)' }} />
            <div className="absolute top-1/2 left-1/2 w-[500px] h-[500px] rounded-full pointer-events-none"
                style={{ transform: 'translate(-50%, -50%)', background: 'rgba(30,58,95,0.15)', filter: 'blur(90px)' }} />

            <div className="absolute inset-0 flex flex-col items-center justify-center pt-8">
                {/* Title */}
                <div
                    className="showcase-title text-center mb-8 relative z-40 px-4"
                    style={{ opacity: 0, transform: 'translateY(28px)' }}
                >
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border mb-4 backdrop-blur-sm"
                        style={{ background: 'rgba(201,168,87,0.1)', borderColor: 'rgba(201,168,87,0.22)' }}>
                        <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: '#c9a857' }} />
                        <span className="text-[10px] md:text-[11px] font-bold tracking-widest uppercase"
                            style={{ color: '#c9a857' }}>O Diferencial Explicare</span>
                    </div>
                    <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight text-white leading-tight">
                        A Magia do{' '}
                        <span style={{
                            backgroundImage: 'linear-gradient(135deg, #c9a857 0%, #e8d5a1 50%, #b3954d 100%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            backgroundClip: 'text',
                        }}>
                            Explicare
                        </span>
                    </h2>
                    <p className="mt-3 text-sm md:text-base max-w-lg mx-auto" style={{ color: '#71717a' }}>
                        Da petição física, tediosa e complexa, para um vídeo claro e direto em segundos.
                    </p>
                </div>

                {/* 3D Scene — mouse tilt wraps the whole scene */}
                <motion.div
                    className="showcase-scene relative mx-auto"
                    style={{
                        width: 'min(90vw, 370px)',
                        height: 'min(120vw, 510px)',
                        zIndex: 20,
                        rotateY,
                        rotateX,
                        transformStyle: 'preserve-3d',
                    }}
                >
                    {/* 1. PDF Document */}
                    <div
                        className="pdf-document absolute inset-0 p-5 md:p-8 flex flex-col z-10 w-full h-full"
                        style={{ transformOrigin: 'center center' }}
                    >
                        <div className="paper-glare" />
                        <div className="watermark">PETIÇÃO INICIAL</div>

                        <div className="mt-4" />

                        {/* Header */}
                        <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200 relative z-20">
                            <div className="flex items-center gap-2.5">
                                <div className="w-12 h-12 md:w-16 md:h-16 rounded-lg flex items-center justify-center overflow-hidden"
                                    style={{ background: '#1e3a5f' }}>
                                    <img
                                        src="/logo-nova-2502.png"
                                        alt="Explicare"
                                        className="w-full h-full object-contain"
                                        onError={(e) => {
                                            e.target.style.display = 'none';
                                            e.target.parentElement.innerHTML = `<svg class="w-4 h-4" style="color:#c9a857" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg>`;
                                        }}
                                    />
                                </div>
                                <div>
                                    <div className="w-24 md:w-28 h-2.5 shimmer-line mb-1.5" />
                                    <div className="w-16 md:w-20 h-1.5 shimmer-line" />
                                </div>
                            </div>
                            <div className="w-12 h-3 shimmer-line" />
                        </div>

                        {/* Title line */}
                        <div className="w-3/4 h-4 md:h-5 shimmer-line mb-6 relative z-20" />

                        {/* Body lines */}
                        <div className="space-y-3 flex-1 relative z-20">
                            <div className="w-full h-2 shimmer-line" />
                            <div className="w-full h-2 shimmer-line" />
                            <div className="w-11/12 h-2 shimmer-line" />
                            <div className="w-full h-2 shimmer-line" />
                            <div className="w-4/5 h-2 shimmer-line" />
                            <div className="mt-2" />
                            <div className="w-full h-2 shimmer-line" />
                            <div className="w-full h-2 shimmer-line" />
                            <div className="w-3/4 h-2 shimmer-line" />
                        </div>

                        {/* Signature */}
                        <div className="mt-auto pt-6 flex justify-end relative z-20">
                            <div className="flex flex-col items-center">
                                <div className="w-28 md:w-32 h-px bg-gray-300 mb-1.5" />
                                <div className="w-20 md:w-24 h-1.5 shimmer-line" />
                            </div>
                        </div>

                        {/* 2. QR Code */}
                        <div
                            className="qr-code absolute bottom-7 left-1/2 -translate-x-1/2 w-24 h-24 md:w-28 md:h-28 bg-white border border-gray-200/80 p-1.5 shadow-2xl rounded-xl z-20 overflow-hidden"
                            style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.25), 0 0 0 1px rgba(201,168,87,0.2)' }}
                        >
                            <div className="scan-line" />
                            <div className="absolute inset-0 z-0 opacity-40" style={{ background: 'linear-gradient(to bottom right, rgba(201,168,87,0.15), transparent)' }} />
                            <img
                                src="https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=https://explicare.com&color=1e3a5f&bgcolor=FFFFFF"
                                alt="QR Code Explicare"
                                className="w-full h-full object-contain relative z-10 rounded-lg"
                            />
                        </div>
                    </div>

                    {/* 3. Floating Video Player */}
                    <div
                        className="video-glow absolute top-1/2 left-1/2 rounded-2xl flex flex-col overflow-hidden z-30"
                        style={{
                            width: 'min(100vw, 450px)',
                            height: 'min(62vw, 265px)',
                            transform: 'translate(-50%, -52%) translateZ(-60px) scale(0.88)',
                        }}
                    >
                        {/* Browser top bar */}
                        <div
                            className="h-9 flex items-center px-3 gap-1.5 border-b shrink-0"
                            style={{ backgroundColor: 'rgba(18,18,22,0.92)', borderColor: 'rgba(255,255,255,0.06)' }}
                        >
                            <div className="w-2.5 h-2.5 rounded-full" style={{ background: 'rgba(239,68,68,0.8)' }} />
                            <div className="w-2.5 h-2.5 rounded-full" style={{ background: 'rgba(234,179,8,0.8)' }} />
                            <div className="w-2.5 h-2.5 rounded-full" style={{ background: 'rgba(34,197,94,0.8)' }} />
                            <div
                                className="ml-3 flex-1 h-5 rounded flex items-center px-2.5 gap-1.5"
                                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
                            >
                                <svg className="w-2.5 h-2.5 shrink-0" style={{ color: '#c9a857' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                                <span className="text-[9px] font-mono" style={{ color: '#52525b' }}>
                                    explicare.com · peticao-explicada.mp4
                                </span>
                            </div>
                        </div>

                        {/* Video area */}
                        <div className="flex-1 relative flex items-center justify-center overflow-hidden"
                            style={{ background: '#0d0f14' }}>
                            <div
                                className="absolute inset-0 bg-cover opacity-80"
                                style={{
                                    backgroundImage: "url('https://images.unsplash.com/photo-1560250097001-a47732a3ecaf?auto=format&fit=crop&q=85&w=800')",
                                    backgroundPosition: 'center 20%',
                                }}
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                            {/* Ping ring */}
                            <div className="absolute w-14 h-14 rounded-full animate-ping"
                                style={{ background: 'rgba(201,168,87,0.25)' }} />

                            {/* Play button */}
                            <div
                                className="relative w-14 h-14 rounded-full flex items-center justify-center z-10 border"
                                style={{
                                    background: 'linear-gradient(135deg, #c9a857, #b3954d)',
                                    borderColor: 'rgba(232,213,161,0.4)',
                                    boxShadow: '0 0 35px rgba(201,168,87,0.7)',
                                }}
                            >
                                <svg className="w-6 h-6 ml-0.5 drop-shadow" style={{ color: '#1a1000' }} fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M8 5v14l11-7z" />
                                </svg>
                            </div>

                            {/* Progress bar */}
                            <div
                                className="absolute bottom-3 left-3 right-3 flex items-center gap-2.5 px-3 py-2 rounded-lg border"
                                style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(8px)', borderColor: 'rgba(255,255,255,0.06)' }}
                            >
                                <span className="text-[10px] font-mono font-medium" style={{ color: 'rgba(255,255,255,0.85)' }}>00:42</span>
                                <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.1)' }}>
                                    <div
                                        className="h-full w-[40%] rounded-full relative"
                                        style={{ background: '#c9a857', boxShadow: '0 0 8px rgba(201,168,87,0.8)' }}
                                    >
                                        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-white shadow-sm" />
                                    </div>
                                </div>
                                <span className="text-[10px] font-mono font-medium" style={{ color: 'rgba(255,255,255,0.85)' }}>02:15</span>
                            </div>
                        </div>

                        {/* Live badge below video */}
                        <div
                            className="video-glow-badge absolute -top-4 right-4 flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider"
                            style={{
                                background: 'rgba(201,168,87,0.15)',
                                border: '1px solid rgba(201,168,87,0.3)',
                                color: '#c9a857',
                                backdropFilter: 'blur(8px)',
                            }}
                        >
                            <span className="w-1.5 h-1.5 rounded-full bg-[#c9a857] animate-pulse" />
                            Ao Vivo
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
