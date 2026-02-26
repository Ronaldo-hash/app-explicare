import React, { useEffect, useState, useRef } from 'react';
import {
    motion,
    useScroll,
    useTransform,
    useSpring,
    useMotionValue,
} from 'framer-motion';
import {
    ShieldCheck, Video, Lock, FileText,
    ArrowRight, CheckCircle, PlayCircle, Smartphone,
} from 'lucide-react';
import { useWhitelabel } from '../context/WhitelabelContext';
import { ParallaxShowcase } from './ParallaxShowcase';

// ─── Animation Variants ───────────────────────────────────────────────────────
const EASE_OUT = [0.22, 0.61, 0.36, 1];

const fadeInUp = {
    hidden: { opacity: 0, y: 44 },
    visible: (delay = 0) => ({
        opacity: 1, y: 0,
        transition: { duration: 0.75, ease: EASE_OUT, delay },
    }),
};

const containerStagger = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.13, delayChildren: 0.05 } },
};

const cardVariant = {
    hidden: { opacity: 0, y: 32, scale: 0.97 },
    visible: {
        opacity: 1, y: 0, scale: 1,
        transition: { duration: 0.55, ease: EASE_OUT },
    },
};

const stepVariant = {
    hidden: { opacity: 0, x: -24 },
    visible: (i) => ({
        opacity: 1, x: 0,
        transition: { duration: 0.6, ease: EASE_OUT, delay: i * 0.15 },
    }),
};

// ─── Feature Card ─────────────────────────────────────────────────────────────
function FeatureCard({ icon: Icon, title, description }) {
    return (
        <motion.div
            variants={cardVariant}
            whileHover={{ y: -12, scale: 1.03, boxShadow: '0 20px 40px -10px rgba(201,168,87,0.15)', transition: { duration: 0.4, ease: EASE_OUT } }}
            className="relative bg-white/[0.025] border border-white/[0.07] rounded-2xl p-8 group overflow-hidden cursor-default transition-all duration-300 hover:bg-white/[0.04] hover:border-[#c9a857]/30"
        >
            {/* Hover glow */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"
                style={{ background: 'radial-gradient(circle at 50% 120%, rgba(201,168,87,0.15) 0%, transparent 70%)' }} />
            {/* Top gradient line */}
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#c9a857]/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

            <motion.div
                className="w-14 h-14 rounded-xl bg-[#c9a857]/10 border border-[#c9a857]/20 flex items-center justify-center mb-6"
                whileHover={{ scale: 1.12, rotate: 6 }}
                transition={{ type: 'spring', stiffness: 350, damping: 18 }}
            >
                <Icon size={26} className="text-[#c9a857]" />
            </motion.div>
            <h3 className="text-xl font-semibold mb-3 text-white">{title}</h3>
            <p className="text-zinc-400 leading-relaxed text-sm">{description}</p>
        </motion.div>
    );
}

// ─── Step Card ─────────────────────────────────────────────────────────────────
function StepCard({ number, title, description, index }) {
    return (
        <motion.div
            className="relative text-center group cursor-default"
            custom={index}
            variants={stepVariant}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
            whileHover={{ y: -8 }}
            transition={{ duration: 0.4, ease: EASE_OUT }}
        >
            <motion.div
                className="w-24 h-24 mx-auto bg-[#0a0a0b] border-4 border-[#c9a857] rounded-full flex items-center justify-center mb-6 relative z-10 transition-all duration-500 group-hover:scale-110 group-hover:shadow-[0_0_40px_rgba(201,168,87,0.4)] group-hover:border-white"
                style={{ boxShadow: '0 0 25px rgba(201,168,87,0.25)' }}
                whileInView={{ scale: [0.6, 1.08, 1] }}
                viewport={{ once: true }}
                transition={{ duration: 0.7, ease: EASE_OUT, delay: index * 0.15 }}
            >
                <span className="text-3xl font-bold text-[#c9a857]">{number}</span>
            </motion.div>
            <h3 className="text-xl font-bold mb-3 text-white">{title}</h3>
            <p className="text-zinc-400 text-sm leading-relaxed">{description}</p>
        </motion.div>
    );
}

// ─── Benefit Item ──────────────────────────────────────────────────────────────
function BenefitItem({ text, index }) {
    return (
        <motion.div
            className="flex items-start gap-3 p-3 rounded-lg hover:bg-white/[0.02] transition-colors cursor-default"
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.5, ease: EASE_OUT, delay: index * 0.1 }}
            whileHover={{ x: 8 }}
        >
            <motion.div whileHover={{ scale: 1.2, rotate: 10 }} transition={{ type: 'spring', stiffness: 400 }}>
                <CheckCircle size={22} className="text-emerald-400 mt-0.5 shrink-0" />
            </motion.div>
            <span className="text-zinc-300">{text}</span>
        </motion.div>
    );
}

// ─── Scroll Indicator ─────────────────────────────────────────────────────────
function ScrollIndicator() {
    return (
        <motion.div
            className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.4, duration: 0.8 }}
        >
            <span className="text-[10px] uppercase tracking-widest text-zinc-600 font-medium">Scroll</span>
            <motion.div
                className="w-5 h-9 border border-white/15 rounded-full flex items-start justify-center pt-1.5"
                animate={{ borderColor: ['rgba(255,255,255,0.1)', 'rgba(201,168,87,0.4)', 'rgba(255,255,255,0.1)'] }}
                transition={{ duration: 3, repeat: Infinity }}
            >
                <motion.div
                    className="w-1 h-2 bg-[#c9a857] rounded-full"
                    animate={{ y: [0, 14, 0], opacity: [1, 0.3, 1] }}
                    transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
                />
            </motion.div>
        </motion.div>
    );
}

// ─── Main Component ────────────────────────────────────────────────────────────
export function SalesLandingPage() {
    const { background_url } = useWhitelabel();
    const BG_URL = background_url || 'https://zrssvsfxxtjieoyurzms.supabase.co/storage/v1/object/sign/arquivos%20da%20empresa/fundo%20site.png?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV9mMGYzMmMyYS05ODRhLTQwMjctOTA1YS05NGU1NWQ3ZmY3NzEiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJhcnF1aXZvcyBkYSBlbXByZXNhL2Z1bmRvIHNpdGUucG5nIiwiaWF0IjoxNzcwMTg4ODIyLCJleHAiOjE4MDE3MjQ4MjJ9._Ov3-JO41bj6oDDjyMV3PkOUDVLe1ETN8hskLn0vfQ8';

    const [bgLoaded, setBgLoaded] = useState(false);
    const heroRef = useRef(null);

    /* Scroll-based parallax */
    const { scrollY } = useScroll();
    const bgY = useTransform(scrollY, [0, 700], [0, 200]);
    const textY = useTransform(scrollY, [0, 600], [0, -70]);
    const heroOpacity = useTransform(scrollY, [0, 380], [1, 0]);

    /* Mouse parallax */
    const rawMouseX = useMotionValue(0);
    const rawMouseY = useMotionValue(0);
    const mouseX = useSpring(rawMouseX, { stiffness: 55, damping: 22 });
    const mouseY = useSpring(rawMouseY, { stiffness: 55, damping: 22 });

    const orb1X = useTransform(mouseX, v => v * 35);
    const orb1Y = useTransform(mouseY, v => v * 35);
    const orb2X = useTransform(mouseX, v => v * -22);
    const orb2Y = useTransform(mouseY, v => v * -22);
    const orb3X = useTransform(mouseX, v => v * 16);
    const orb3Y = useTransform(mouseY, v => v * -16);
    const gridX = useTransform(mouseX, v => v * 6);
    const gridY = useTransform(mouseY, v => v * 6);

    useEffect(() => {
        document.body.style.pointerEvents = 'auto';
        document.body.style.userSelect = 'auto';
        document.querySelectorAll('.app-loader').forEach(el => el.remove());

        const img = new Image();
        img.onload = () => setBgLoaded(true);
        img.src = BG_URL;
    }, [BG_URL]);

    const handleMouseMove = (e) => {
        const rect = heroRef.current?.getBoundingClientRect();
        if (!rect) return;
        rawMouseX.set((e.clientX - rect.left - rect.width / 2) / rect.width);
        rawMouseY.set((e.clientY - rect.top - rect.height / 2) / rect.height);
    };
    const handleMouseLeave = () => { rawMouseX.set(0); rawMouseY.set(0); };

    const scrollTo = (e, id) => {
        e.preventDefault();
        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    };

    const NAV_LINKS = [
        { label: 'A Solução', id: 'solucao' },
        { label: 'Benefícios', id: 'beneficios' },
        { label: 'Como Funciona', id: 'como-funciona' },
    ];

    const FEATURES = [
        {
            icon: Video,
            title: 'Vídeo Transparente',
            description: 'Grave um vídeo rápido explicando a peça protocolada. O cliente sente proximidade, entende a estratégia e valoriza o seu esforço.',
        },
        {
            icon: Smartphone,
            title: 'Acesso na Palma da Mão',
            description: 'Entregue a petição física com um QR Code ou envie um Link Único. O cliente acessa tudo pelo celular, sem precisar criar contas complexas.',
        },
        {
            icon: Lock,
            title: 'Segurança Total',
            description: 'Seus documentos são confidenciais. O acesso ao link e vídeos é protegido por senha forte, garantindo o sigilo advogado-cliente.',
        },
    ];

    const STEPS = [
        {
            n: '1', title: 'Upload & Gravação',
            desc: 'Importe o PDF da petição para a plataforma e cadastre o link do vídeo explicativo (hospedado no Youtube ou Vimeo).',
        },
        {
            n: '2', title: 'Geração Automática',
            desc: 'O sistema vincula os arquivos, cria uma senha de acesso e embute um QR Code mágico e um link clicável na última página do seu PDF.',
        },
        {
            n: '3', title: 'Portal do Cliente',
            desc: 'Seu cliente usa o QR Code ou o link, digita a senha e é recebido no portal whitelabel, com sua logo e cores, para ver o vídeo e baixar os anexos.',
        },
    ];

    const BENEFITS = [
        'Aumente a percepção do honorário cobrado.',
        'Reduza mensagens de WhatsApp ansiosas.',
        'Evite falhas de comunicação e frustração.',
        'Destaque seu escritório na era tecnológica.',
        'Gestão centralizada: saiba quantas vezes o vídeo foi visto.',
    ];

    return (
        <div className="min-h-screen font-sans bg-[#0a0a0b] text-white overflow-x-hidden">

            {/* ── HEADER ──────────────────────────────────────────────────── */}
            <motion.header
                className="fixed w-full top-0 z-50 border-b border-white/[0.06]"
                style={{ backdropFilter: 'blur(22px)', background: 'rgba(10,10,11,0.82)' }}
                initial={{ y: -80, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.65, ease: EASE_OUT }}
            >
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <motion.div className="flex items-center gap-3" whileHover={{ scale: 1.02 }}>
                        <img src="/logo-nova-2502.png" alt="Explicare" className="w-14 h-14 md:w-16 md:h-16 object-contain" />
                        <span className="text-xl font-bold tracking-wide">Explicare</span>
                    </motion.div>

                    <nav className="hidden md:flex items-center gap-8">
                        {NAV_LINKS.map(({ label, id }) => (
                            <a
                                key={id}
                                href={`#${id}`}
                                onClick={(e) => scrollTo(e, id)}
                                className="text-sm font-medium text-zinc-400 hover:text-white transition-colors relative group"
                            >
                                {label}
                                <span className="absolute -bottom-0.5 left-0 w-0 group-hover:w-full h-px bg-[#c9a857] transition-all duration-300" />
                            </a>
                        ))}
                    </nav>

                    <div className="flex items-center gap-4">
                        <a href="/login" className="text-sm font-medium text-zinc-400 hover:text-white transition-colors">
                            Entrar
                        </a>
                        <motion.a
                            href="https://wa.me/5531993988889"
                            target="_blank" rel="noopener noreferrer"
                            className="hidden md:flex items-center gap-2 px-5 py-2.5 rounded-full text-zinc-900 text-sm font-bold"
                            style={{ background: 'linear-gradient(135deg, #c9a857, #b3954d)' }}
                            whileHover={{ scale: 1.05, boxShadow: '0 0 28px rgba(201,168,87,0.4)' }}
                            whileTap={{ scale: 0.96 }}
                        >
                            Falar com Consultor
                        </motion.a>
                    </div>
                </div>
            </motion.header>

            {/* ── HERO ────────────────────────────────────────────────────── */}
            <section
                ref={heroRef}
                className="relative min-h-screen flex items-center justify-center overflow-hidden"
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
            >
                {/* Parallax background layer */}
                <motion.div
                    className="absolute inset-0 z-0"
                    style={{ y: bgY, scale: 1.12 }}
                >
                    <div
                        className="absolute inset-0 transition-opacity duration-1000"
                        style={{
                            backgroundImage: bgLoaded ? `url(${BG_URL})` : 'none',
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                            opacity: bgLoaded ? 0.22 : 0,
                            filter: 'blur(3px)',
                        }}
                    />
                </motion.div>

                {/* Gradient overlays */}
                <div className="absolute inset-0 z-0 pointer-events-none">
                    <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0b]/75 via-transparent to-[#0a0a0b]" />
                    <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0b]/50 via-transparent to-[#0a0a0b]/50" />
                </div>

                {/* Mouse parallax orbs */}
                <motion.div
                    className="absolute top-[20%] right-[25%] w-[520px] h-[520px] rounded-full pointer-events-none z-0"
                    style={{ x: orb1X, y: orb1Y }}
                >
                    <div className="w-full h-full rounded-full" style={{ background: 'radial-gradient(circle, rgba(201,168,87,0.14) 0%, transparent 68%)', filter: 'blur(50px)' }} />
                </motion.div>
                <motion.div
                    className="absolute bottom-[25%] left-[15%] w-[380px] h-[380px] rounded-full pointer-events-none z-0"
                    style={{ x: orb2X, y: orb2Y }}
                >
                    <div className="w-full h-full rounded-full" style={{ background: 'radial-gradient(circle, rgba(30,58,95,0.4) 0%, transparent 70%)', filter: 'blur(70px)' }} />
                </motion.div>
                <motion.div
                    className="absolute top-[55%] right-[10%] w-[260px] h-[260px] rounded-full pointer-events-none z-0"
                    style={{ x: orb3X, y: orb3Y }}
                >
                    <div className="w-full h-full rounded-full" style={{ background: 'radial-gradient(circle, rgba(201,168,87,0.08) 0%, transparent 70%)', filter: 'blur(40px)' }} />
                </motion.div>

                {/* Grid / dot pattern parallax */}
                <motion.div
                    className="absolute inset-0 z-0 opacity-[0.022] pointer-events-none"
                    style={{
                        x: gridX, y: gridY,
                        backgroundImage: 'radial-gradient(rgba(255,255,255,0.8) 1px, transparent 1px)',
                        backgroundSize: '44px 44px',
                    }}
                />

                {/* Hero content */}
                <motion.div
                    className="relative z-10 max-w-5xl mx-auto px-6 text-center pt-28 pb-32"
                    style={{ y: textY, opacity: heroOpacity }}
                >
                    {/* Badge */}
                    <motion.div
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.06] border border-white/[0.1] mb-10 backdrop-blur-sm"
                        initial={{ opacity: 0, y: -18 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.25, ease: EASE_OUT }}
                    >
                        <span className="w-2 h-2 rounded-full bg-[#c9a857] animate-pulse" />
                        <span className="text-xs font-semibold tracking-widest text-zinc-300 uppercase">
                            A Revolução no Atendimento Jurídico
                        </span>
                    </motion.div>

                    {/* Heading */}
                    <motion.h1
                        className="text-5xl md:text-7xl lg:text-[5.5rem] font-extrabold tracking-tight mb-8 leading-[1.04]"
                        initial={{ opacity: 0, y: 36 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.85, delay: 0.35, ease: EASE_OUT }}
                    >
                        Seu escritório{' '}
                        <br className="hidden md:block" />
                        <span className="text-gradient-hero">
                            Explicado e Valorizado.
                        </span>
                    </motion.h1>

                    {/* Subtitle */}
                    <motion.p
                        className="text-lg md:text-xl text-zinc-400 max-w-2xl mx-auto mb-12 leading-relaxed"
                        initial={{ opacity: 0, y: 24 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.75, delay: 0.5, ease: EASE_OUT }}
                    >
                        Transforme petições complexas em vídeos claros com links seguros e QR Codes
                        exclusivos para cada cliente. Reduza dúvidas e aumente a percepção do seu valor.
                    </motion.p>

                    {/* CTAs */}
                    <motion.div
                        className="flex flex-col sm:flex-row items-center justify-center gap-4"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.7, delay: 0.65, ease: EASE_OUT }}
                    >
                        <motion.a
                            href="https://wa.me/5531993988889"
                            target="_blank" rel="noopener noreferrer"
                            className="w-full sm:w-auto flex items-center justify-center gap-2.5 px-9 py-4 text-zinc-900 text-base font-bold rounded-full"
                            style={{ background: 'linear-gradient(135deg, #c9a857 0%, #d4b76a 50%, #b3954d 100%)', backgroundSize: '200% auto' }}
                            whileHover={{ scale: 1.05, backgroundPosition: 'right center', boxShadow: '0 0 45px rgba(201,168,87,0.5)' }}
                            whileTap={{ scale: 0.97 }}
                            transition={{ duration: 0.3 }}
                        >
                            Agendar Demonstração
                            <ArrowRight size={20} />
                        </motion.a>
                        <motion.a
                            href="#como-funciona"
                            onClick={(e) => scrollTo(e, 'como-funciona')}
                            className="w-full sm:w-auto flex items-center justify-center gap-2.5 px-9 py-4 bg-white/[0.05] text-white text-base font-semibold rounded-full border border-white/[0.08] backdrop-blur-sm"
                            whileHover={{ scale: 1.03, backgroundColor: 'rgba(255,255,255,0.08)' }}
                            whileTap={{ scale: 0.97 }}
                            transition={{ duration: 0.25 }}
                        >
                            Como funciona?
                            <PlayCircle size={20} className="text-zinc-500" />
                        </motion.a>
                    </motion.div>


                </motion.div>

                <ScrollIndicator />
            </section>

            {/* ── A SOLUÇÃO ───────────────────────────────────────────────── */}
            <section id="solucao" className="py-28 bg-[#0a0a0b] relative border-t border-white/[0.05]">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[350px] pointer-events-none"
                    style={{ background: 'radial-gradient(ellipse, rgba(201,168,87,0.06) 0%, transparent 70%)', filter: 'blur(60px)' }} />

                <div className="max-w-7xl mx-auto px-6 relative z-10">
                    <motion.div
                        className="text-center max-w-3xl mx-auto mb-20"
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, margin: '-100px' }}
                        variants={fadeInUp}
                        custom={0}
                    >
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#c9a857]/10 border border-[#c9a857]/20 mb-5">
                            <span className="text-[11px] font-bold uppercase tracking-widest text-[#c9a857]">A Solução</span>
                        </div>
                        <h2 className="text-3xl md:text-5xl font-bold mb-6 leading-tight">
                            Porque seus clientes<br className="hidden md:block" /> não leem petições.
                        </h2>
                        <p className="text-zinc-400 text-lg leading-relaxed">
                            O "juridiquês" gera ansiedade, ligações fora de hora e a falsa sensação de
                            que "nada está sendo feito". O Explicare resolve a comunicação no momento exato da dúvida.
                        </p>
                    </motion.div>

                    <motion.div
                        className="grid md:grid-cols-3 gap-6"
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, margin: '-80px' }}
                        variants={containerStagger}
                    >
                        {FEATURES.map(f => <FeatureCard key={f.title} {...f} />)}
                    </motion.div>
                </div>
            </section>

            {/* ── PARALLAX 3D SHOWCASE ────────────────────────────────────── */}
            <ParallaxShowcase />

            {/* ── COMO FUNCIONA ──────────────────────────────────────────── */}
            <section id="como-funciona" className="py-28 bg-zinc-900/60 border-y border-white/[0.05] relative overflow-hidden">
                {/* Decorative background texture */}
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
                    style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\'%3E%3Cpath d=\'M36 34v26H24V34h12zM24 34h-8v-8h8v8zM24 18h-8V8h8v10z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")', backgroundSize: '60px 60px' }} />

                <div className="max-w-7xl mx-auto px-6 relative z-10">
                    <motion.div
                        className="text-center mb-20"
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, margin: '-80px' }}
                        variants={fadeInUp}
                        custom={0}
                    >
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#c9a857]/10 border border-[#c9a857]/20 mb-5">
                            <span className="text-[11px] font-bold uppercase tracking-widest text-[#c9a857]">Como Funciona</span>
                        </div>
                        <h2 className="text-3xl md:text-5xl font-bold mb-4 leading-tight">Como Funciona o Explicare</h2>
                        <p className="text-zinc-400 text-lg">Em 3 passos simples você revoluciona sua entrega.</p>
                    </motion.div>

                    <div className="grid md:grid-cols-3 gap-12 relative">
                        {/* Connecting line */}
                        <motion.div
                            className="hidden md:block absolute top-[45px] left-[15%] right-[15%] h-px"
                            style={{ background: 'linear-gradient(to right, transparent, rgba(201,168,87,0.5), transparent)' }}
                            initial={{ scaleX: 0 }}
                            whileInView={{ scaleX: 1 }}
                            viewport={{ once: true }}
                            transition={{ duration: 1, ease: EASE_OUT, delay: 0.3 }}
                        />
                        {STEPS.map((s, i) => (
                            <StepCard key={s.n} number={s.n} title={s.title} description={s.desc} index={i} />
                        ))}
                    </div>
                </div>
            </section>

            {/* ── BENEFÍCIOS ────────────────────────────────────────────── */}
            <section id="beneficios" className="py-28 bg-[#0a0a0b]">
                <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-20 items-center">
                    {/* Left: copy */}
                    <motion.div
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, margin: '-80px' }}
                        variants={fadeInUp}
                        custom={0}
                    >
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#c9a857]/10 border border-[#c9a857]/20 mb-5">
                            <span className="text-[11px] font-bold uppercase tracking-widest text-[#c9a857]">Benefícios</span>
                        </div>
                        <h2 className="text-3xl md:text-5xl font-bold mb-6 leading-tight">
                            O Fim das Dúvidas<br className="hidden md:block" /> Recorrentes
                        </h2>
                        <p className="text-zinc-400 text-lg mb-10 leading-relaxed">
                            Advogados perdem em média 10 horas por semana apenas respondendo atualizações processuais
                            e traduzindo termos técnicos. O Explicare atua como seu assistente 24h.
                        </p>

                        <div className="space-y-4">
                            {BENEFITS.map((item, i) => <BenefitItem key={i} text={item} index={i} />)}
                        </div>
                    </motion.div>

                    {/* Right: mockup */}
                    <motion.div
                        className="relative"
                        initial={{ opacity: 0, x: 40 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true, margin: '-80px' }}
                        transition={{ duration: 0.8, ease: EASE_OUT, delay: 0.15 }}
                    >
                        {/* Glow behind card */}
                        <div className="absolute -inset-8 rounded-3xl pointer-events-none"
                            style={{ background: 'radial-gradient(ellipse, rgba(30,58,95,0.4) 0%, rgba(201,168,87,0.12) 50%, transparent 70%)', filter: 'blur(40px)' }} />

                        <motion.div
                            className="relative bg-[#111214] border border-white/[0.08] rounded-2xl p-6 shadow-2xl"
                            whileHover={{ y: -6, transition: { duration: 0.4, ease: EASE_OUT } }}
                        >
                            {/* Browser chrome */}
                            <div className="flex items-center gap-2 mb-6 border-b border-white/[0.05] pb-4">
                                <div className="w-3 h-3 rounded-full bg-red-500/80" />
                                <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                                <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                                <div className="ml-3 flex-1 h-5 bg-white/[0.04] rounded-md border border-white/[0.05] flex items-center px-3 gap-1.5">
                                    <Lock size={9} className="text-[#c9a857]" />
                                    <span className="text-[9px] text-zinc-600 font-mono">explicare.com/petica…</span>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div className="h-7 w-2/5 bg-white/[0.04] rounded-lg animate-pulse" />
                                <div className="h-3.5 w-1/2 bg-white/[0.03] rounded animate-pulse" />
                                <div className="h-52 w-full bg-white/[0.03] rounded-xl border border-white/[0.05] flex items-center justify-center relative overflow-hidden">
                                    <div className="absolute inset-0" style={{ background: 'radial-gradient(circle at 50% 40%, rgba(30,58,95,0.3), transparent 70%)' }} />
                                    <motion.div
                                        animate={{ scale: [1, 1.08, 1] }}
                                        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                                    >
                                        <PlayCircle size={52} className="text-[#c9a857]/50" />
                                    </motion.div>
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                                    {/* Fake progress */}
                                    <div className="absolute bottom-4 left-4 right-4 flex items-center gap-2 bg-black/50 backdrop-blur-sm px-3 py-2 rounded-lg border border-white/[0.05]">
                                        <span className="text-[10px] font-mono text-white/80">01:24</span>
                                        <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
                                            <motion.div
                                                className="h-full bg-[#c9a857] rounded-full"
                                                initial={{ width: '0%' }}
                                                whileInView={{ width: '62%' }}
                                                viewport={{ once: true }}
                                                transition={{ duration: 1.2, ease: 'easeOut', delay: 0.5 }}
                                            />
                                        </div>
                                        <span className="text-[10px] font-mono text-white/80">02:15</span>
                                    </div>
                                </div>
                                <motion.div
                                    className="h-11 w-full bg-[#1e3a5f]/30 rounded-xl flex items-center justify-center gap-2 border border-[#1e3a5f]/40 cursor-pointer"
                                    whileHover={{ backgroundColor: 'rgba(30,58,95,0.5)', transition: { duration: 0.2 } }}
                                >
                                    <FileText size={15} className="text-[#c9a857]" />
                                    <span className="text-xs font-medium text-[#c9a857]">Baixar Petição Inicial.pdf</span>
                                </motion.div>
                            </div>
                        </motion.div>
                    </motion.div>
                </div>
            </section>

            {/* ── FAQ SECTION ────────────────────────────────────────────────── */}
            <section className="py-24 bg-[#0a0a0b] relative z-20 border-t border-white/[0.05]">
                <div className="max-w-4xl mx-auto px-6">
                    <motion.div variants={fadeInUp} initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-50px' }} className="text-center mb-16">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#c9a857]/10 border border-[#c9a857]/20 mb-6">
                            <span className="text-[11px] font-bold uppercase tracking-widest text-[#c9a857]">Dúvidas Frequentes</span>
                        </div>
                        <h2 className="text-3xl md:text-5xl font-bold mb-6">Como podemos ajudar?</h2>
                        <p className="text-zinc-400 text-lg">Respostas para as principais dúvidas sobre o Cérebro Explicare.</p>
                    </motion.div>

                    <div className="space-y-4">
                        {[
                            {
                                q: "Como o Explicare funciona na prática?",
                                a: "É muito simples: você faz o upload da documentação no nosso sistema. Configuramos uma página com a sua identidade visual contendo um vídeo explicativo animado de alta conversão. Em vez de enviar uma petição pesada, você envia esse link visual e limpo para o seu cliente final com o vídeo didático e o documento acoplado. Ele acessa e entende tudo de forma fácil, aliviando o suporte do escritório."
                            },
                            {
                                q: "Isso realmente diminui a taxa de dúvidas no meu WhatsApp?",
                                a: "Sim! Um dos maiores gargalos dos escritórios é o volume de clientes perguntando as mesmas coisas sobre andamentos processuais ou o jargão jurídico de uma petição. Com o vídeo didático humanizado da Explicare, a compreensão do cliente aumenta drasticamente."
                            },
                            {
                                q: "É seguro utilizar a plataforma para meus clientes?",
                                a: "Com certeza. Todo o tráfego é criptografado. Os links do portal do cliente são estruturados de forma segura para focar apenas na explicação e acompanhamento visual, sem expor dados desnecessários ou sensíveis da ação."
                            },
                            {
                                q: "O visual da página de vídeo será adaptado para a minha marca?",
                                a: "Sim, a plataforma possui Whitelabel completo! Configuramos o logo do seu escritório e as principais cores de sua identidade visual nos documentos e no portal do cliente para manter a credibilidade alta."
                            }
                        ].map((faq, i) => (
                            <motion.div
                                key={i}
                                variants={fadeInUp}
                                initial="hidden"
                                whileInView="visible"
                                viewport={{ once: true, margin: '-20px' }}
                                custom={i * 0.15}
                                whileHover={{ scale: 1.01, backgroundColor: 'rgba(255,255,255,0.03)' }}
                                transition={{ duration: 0.2 }}
                                className="p-6 md:p-8 rounded-2xl bg-[#121214] border border-white/[0.05] relative overflow-hidden group cursor-default"
                            >
                                <div className="absolute top-0 left-0 w-1 h-full bg-[#c9a857] opacity-0 group-hover:opacity-100 transition-opacity" />
                                <h3 className="text-xl font-bold text-zinc-100 mb-3 group-hover:text-[#c9a857] transition-colors">{faq.q}</h3>
                                <p className="text-zinc-400 leading-relaxed text-sm md:text-base">{faq.a}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── CTA ───────────────────────────────────────────────────── */}
            <section className="py-28 relative border-t border-white/[0.05] text-center overflow-hidden">
                {/* Multi-layer background */}
                <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0b] to-[#0e1a2e]/80" />
                <div className="absolute inset-0 pointer-events-none"
                    style={{ background: 'radial-gradient(ellipse at 50% 60%, rgba(30,58,95,0.3) 0%, transparent 60%)' }} />
                <motion.div
                    className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] rounded-full pointer-events-none"
                    style={{ background: 'radial-gradient(ellipse, rgba(201,168,87,0.07) 0%, transparent 70%)', filter: 'blur(60px)' }}
                    animate={{ scale: [1, 1.1, 1], opacity: [0.5, 0.9, 0.5] }}
                    transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
                />

                <motion.div
                    className="relative z-10 max-w-3xl mx-auto px-6"
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: '-80px' }}
                    variants={containerStagger}
                >
                    <motion.div variants={fadeInUp} custom={0}
                        className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#c9a857]/10 border border-[#c9a857]/20 mb-6">
                        <span className="text-[11px] font-bold uppercase tracking-widest text-[#c9a857]">Comece Hoje</span>
                    </motion.div>
                    <motion.h2 variants={fadeInUp} custom={0.1}
                        className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
                        Pronto para inovar<br className="hidden md:block" /> seu escritório?
                    </motion.h2>
                    <motion.p variants={fadeInUp} custom={0.2}
                        className="text-zinc-400 text-lg mb-12 leading-relaxed">
                        Inicie sua jornada hoje e entregue uma experiência premium que fideliza e encanta seus clientes.
                    </motion.p>
                    <motion.a
                        href="https://wa.me/5531993988889"
                        target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-3 px-12 py-5 text-zinc-900 text-lg font-bold rounded-full"
                        style={{ background: 'linear-gradient(135deg, #c9a857, #b3954d)' }}
                        initial={{ opacity: 0, y: 24 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.65, ease: EASE_OUT, delay: 0.35 }}
                        whileHover={{ scale: 1.06, boxShadow: '0 0 55px rgba(201,168,87,0.55)' }}
                        whileTap={{ scale: 0.97 }}
                    >
                        Assine Agora pelo WhatsApp
                        <ArrowRight size={22} />
                    </motion.a>
                </motion.div>
            </section>

            {/* ── FOOTER ────────────────────────────────────────────────── */}
            <footer className="py-8 bg-[#0a0a0b] border-t border-white/[0.05] text-zinc-500 text-sm">
                <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                        <ShieldCheck size={17} className="text-[#c9a857]" />
                        <span className="text-zinc-300 font-semibold">Explicare Digital</span>
                    </div>
                    <p>© {new Date().getFullYear()} Explicare. Todos os direitos reservados.</p>
                    <a href="/login" className="text-zinc-600 hover:text-zinc-300 transition-colors">Área do Advogado →</a>
                </div>
            </footer>

            {/* ── FLOATING WHATSAPP BUTTON ────────────────────────────────────────────────── */}
            <a
                href="https://wa.me/5531993988889"
                target="_blank"
                rel="noopener noreferrer"
                className="fixed bottom-6 right-6 z-50 flex items-center justify-center w-14 h-14 rounded-full bg-[#25D366] text-white shadow-xl hover:scale-110 transition-transform shadow-[#25D366]/30"
                aria-label="Fale conosco no WhatsApp"
            >
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8">
                    <path d="M12.031 0C5.385 0 0 5.385 0 12.031c0 2.126.549 4.195 1.593 6.014L.135 23.4l5.485-1.44c1.761.968 3.737 1.478 5.86 1.478 6.646 0 12.031-5.385 12.031-12.031S18.677 0 12.031 0zm0 21.411c-1.802 0-3.56-.484-5.112-1.405l-.367-.217-3.8.996.996-3.8-.217-.367c-.92-.1552-1.405-3.31-1.405-5.112 0-5.529 4.498-10.027 10.027-10.027 5.529 0 10.027 4.498 10.027 10.027 0 5.529-4.498 10.027-10.027 10.027zm5.52-7.55c-.303-.152-1.792-.885-2.07-987-.278-.102-.482-.152-.685.152s-.786.987-.963 1.189c-.177.203-.354.228-.657.076-1.393-.7-2.67-1.496-3.766-2.593-1.096-1.096-1.892-2.373-2.593-3.766-.152-.303-.127-.48.076-.657.177-.152.38-.405.582-.607.202-.202.303-.38.455-.633.152-.253.102-.506-.05-.81-.152-.303-.685-1.644-.938-2.251-.253-.607-.506-.531-.685-.531-.177 0-.38-.025-.582-.025s-.531.076-.81.38c-.278.303-1.063 1.037-1.063 2.53 0 1.493 1.088 2.936 1.24 3.138.152.202 2.15 3.284 5.212 4.549 1.992.835 2.872.936 3.882.784 1.012-.152 2.126-.885 2.454-1.745.329-.86.329-1.593.228-1.745-.101-.152-.38-.253-.683-.405z" />
                </svg>
            </a>
        </div>
    );
}
