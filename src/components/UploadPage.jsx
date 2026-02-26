import React, { useState } from 'react';
import { Upload, FileText, Video, Loader2, FileCheck, AlertTriangle, Lock, LogOut, CheckCircle, ArrowRight, X } from 'lucide-react';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import QRCode from 'qrcode';
import { cn } from '../lib/utils';
import { Logo } from './Logo';
import { PdfVisualEditor } from './PdfVisualEditor';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../lib/config';
import { OptimizedBackground } from './OptimizedBackground';

export function UploadPage({ supabase, session, onSuccess }) {
    const [loading, setLoading] = useState(false);
    const [statusMsg, setStatusMsg] = useState("");
    const [processo, setProcesso] = useState("");
    const [titulo, setTitulo] = useState("");
    const [password, setPassword] = useState(""); // Senha opcional
    const [pdfFile, setPdfFile] = useState(null);
    const [videoFile, setVideoFile] = useState(null);
    const [dragActive, setDragActive] = useState(null);
    const [errorMsg, setErrorMsg] = useState(null);

    // Estados do Editor Visual
    const [showVisualEditor, setShowVisualEditor] = useState(false);
    const [generatedQrData, setGeneratedQrData] = useState(null);
    const [tempSlug, setTempSlug] = useState(null);
    const [tempVideoUrl, setTempVideoUrl] = useState(null);

    const handleDrag = (e, type) => {
        e.preventDefault(); e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") setDragActive(type);
        else if (e.type === "dragleave") setDragActive(null);
    };

    const handleDrop = (e, type) => {
        e.preventDefault(); e.stopPropagation();
        setDragActive(null);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            if (type === 'pdf') setPdfFile(e.dataTransfer.files[0]);
            if (type === 'video') setVideoFile(e.dataTransfer.files[0]);
        }
    };

    const robustUpload = async (bucket, path, file) => {
        try {
            const { data, error } = await supabase.storage.from(bucket).upload(path, file, { upsert: true });
            if (error) throw error;
            return data;
        } catch (err) {
            if (err.message === 'Failed to fetch' || err.name === 'StorageUnknownError') {
                const rawUrl = `${SUPABASE_URL}/storage/v1/object/${bucket}/${path}`;
                const res = await fetch(rawUrl, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${SUPABASE_ANON_KEY}`, 'x-upsert': 'true', 'Content-Type': file.type },
                    body: file
                });
                if (!res.ok) {
                    const text = await res.text();
                    if (text.includes('exceeded the maximum allowed size')) {
                        throw new Error("O arquivo é maior que o limite permitido pelo banco de dados. Execute o comando SQL de atualização.");
                    }
                    throw new Error(`Erro Resgate (${res.status}): ${text}`);
                }
                return { path: path };
            }
            throw err;
        }
    };

    const handleInitialProcess = async () => {
        if (!processo || !pdfFile || !videoFile) { alert("Preencha todos os campos."); return; }
        setLoading(true); setErrorMsg(null);
        try {
            const slug = Math.random().toString(36).substring(2, 8).toUpperCase();
            const landingUrl = `${window.location.origin}?v=${slug}`;

            setStatusMsg("Verificando arquivo...");

            const LIMIT_MB = 50;
            const LIMIT_BYTES = LIMIT_MB * 1024 * 1024;

            if (videoFile.size > LIMIT_BYTES) {
                const sizeMB = (videoFile.size / 1024 / 1024).toFixed(2);
                alert(`⚠️ LIMITE DO PLANO GRATUITO ⚠️\n\nO Supabase Free não aceita arquivos acima de ${LIMIT_MB}MB.\nSeu vídeo tem ${sizeMB}MB.\n\nPor favor, comprima o vídeo (use sites como 'FreeConvert' ou o app 'Handbrake') para menos de 50MB e tente novamente.`);
                setLoading(false);
                return;
            }

            setStatusMsg("Enviando vídeo...");

            const fileExt = videoFile.name.split('.').pop() || 'mp4';
            const safeRandomName = `video_${Date.now()}_${Math.floor(Math.random() * 10000)}.${fileExt}`;
            const videoPath = `videos/${slug}_${safeRandomName}`;

            await robustUpload('videos-final-v3', videoPath, videoFile);
            const { data: videoUrlData } = supabase.storage.from('videos-final-v3').getPublicUrl(videoPath);

            setStatusMsg("Gerando QR Code...");
            const qrCodeDataUrl = await QRCode.toDataURL(landingUrl, { errorCorrectionLevel: 'H', margin: 1, color: { dark: '#000000', light: '#FFFFFF' } });

            setTempSlug(slug);
            setTempVideoUrl(videoUrlData.publicUrl);
            setGeneratedQrData(qrCodeDataUrl);
            setShowVisualEditor(true);
            setLoading(false);

        } catch (error) {
            console.error(error);
            setErrorMsg(error.message || "Erro desconhecido");
            setLoading(false);
        }
    };

    const handleFinalizePdf = async (coords) => {
        setShowVisualEditor(false);
        setLoading(true);
        setStatusMsg("Iniciando processamento...");

        await new Promise(resolve => setTimeout(resolve, 100));

        setStatusMsg("Gerando PDF com QR Code...");

        try {
            const landingUrl = `${window.location.origin}?v=${tempSlug}`;
            const pdfBytes = await pdfFile.arrayBuffer();
            let pdfDoc;
            try {
                pdfDoc = await PDFDocument.load(pdfBytes, { password: password || '' });
            } catch (loadError) {
                if (loadError.message.includes('encrypted')) {
                    throw new Error("Este PDF é protegido por senha. Por favor, digite a senha no campo 'Senha (Opcional)' acima e tente novamente.");
                }
                throw loadError;
            }
            const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
            const qrImage = await pdfDoc.embedPng(generatedQrData);
            const pages = pdfDoc.getPages();
            const firstPage = pages[0];

            const qrSize = 80;
            const { x, y } = coords;

            firstPage.drawImage(qrImage, { x, y, width: qrSize, height: qrSize });

            firstPage.drawText('Acesse o vídeo:', {
                x: x,
                y: y - 12,
                size: 9,
                font: helveticaFont,
                color: rgb(0, 0, 0),
            });

            const displayUrl = landingUrl.replace(/^https?:\/\//, '').replace(/^www\./, '');

            const linkText = displayUrl;
            const linkFontSize = 8;
            const textWidth = helveticaFont.widthOfTextAtSize(linkText, linkFontSize);
            const textHeight = helveticaFont.heightAtSize(linkFontSize);

            firstPage.drawText(linkText, {
                x: x,
                y: y - 22,
                size: linkFontSize,
                font: helveticaFont,
                color: rgb(0, 0, 1),
            });

            firstPage.drawLine({
                start: { x: x, y: y - 23 },
                end: { x: x + textWidth, y: y - 23 },
                thickness: 0.5,
                color: rgb(0, 0, 1),
            });

            const linkAnnotation = pdfDoc.context.register(
                pdfDoc.context.obj({
                    Type: 'Annot',
                    Subtype: 'Link',
                    Rect: [x, y - 25, x + textWidth, y - 22 + textHeight + 2],
                    Border: [0, 0, 0],
                    C: [0, 0, 1],
                    A: {
                        Type: 'Action',
                        S: 'URI',
                        URI: landingUrl,
                    },
                })
            );

            const existingAnnots = firstPage.node.Annots();
            if (existingAnnots) {
                existingAnnots.push(linkAnnotation);
            } else {
                firstPage.node.set(
                    PDFDocument.PDFName.of('Annots'),
                    pdfDoc.context.obj([linkAnnotation])
                );
            }

            const modifiedPdfBytes = await pdfDoc.save();
            const modifiedPdfBlob = new Blob([modifiedPdfBytes], { type: 'application/pdf' });

            setStatusMsg("Enviando PDF...");
            const pdfPath = `pecas/${tempSlug}_COM_QR.pdf`;

            await robustUpload('pecas-final-v3', pdfPath, modifiedPdfBlob);
            const { data: pdfUrlData } = supabase.storage.from('pecas-final-v3').getPublicUrl(pdfPath);

            const record = {
                slug: tempSlug,
                processo,
                titulo_peca: titulo || "Peça Processual",
                video_url: tempVideoUrl,
                pdf_final_url: pdfUrlData.publicUrl,
                access_password: password || null
            };
            const { error: dbErr } = await supabase.from('videos_pecas').insert([record]);
            if (dbErr) throw dbErr;

            onSuccess({ ...record, landingUrl, qrCodeDataUrl: generatedQrData });
        } catch (error) {
            console.error(error);
            setErrorMsg("Erro ao finalizar PDF: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen text-white font-sans flex flex-col animate-fade-in relative z-10 w-full max-w-[1600px] mx-auto">
            {/* Visual Editor Overlay */}
            {showVisualEditor && (
                <PdfVisualEditor
                    pdfFile={pdfFile}
                    qrCodeDataUrl={generatedQrData}
                    onSave={handleFinalizePdf}
                    onCancel={() => { setShowVisualEditor(false); setLoading(false); }}
                />
            )}

            {/* Header */}
            <header className="border-b border-[#c9a857]/10 bg-[#0a0a0b]/60 backdrop-blur-md py-4 px-8 flex justify-center items-center relative rounded-b-xl mx-4 mt-2">
                {session?.user?.email && (
                    <div className="absolute left-8 top-1/2 -translate-y-1/2 text-xs text-zinc-500 font-mono hidden md:block">
                        <span className="text-[#c9a857]">user:</span> {session.user.email}
                    </div>
                )}
                <Logo />
            </header>

            {/* Main Content - 3 Column Grid Layout */}
            <main className="flex-1 p-4 lg:p-8">

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

                    {/* LEFTSIDE: Branding & Benefits (Span 3) */}
                    <div className="lg:col-span-3 space-y-8 animate-fade-in-up card-law" style={{ animationDelay: '0.2s' }}>
                        <div>
                            <h1 className="text-3xl font-bold text-[#c9a857] mb-4 leading-tight drop-shadow-sm">
                                Excelência e <br /> Inovação
                            </h1>
                            <p className="text-zinc-400 text-sm leading-relaxed border-l-2 border-[#c9a857]/30 pl-4">
                                Transformando a prática jurídica com tecnologia de ponta. Agilidade e segurança para seus processos.
                            </p>
                        </div>

                        <div className="space-y-4 pt-4">
                            <h4 className="text-[#c9a857] text-xs font-bold uppercase tracking-wider mb-2">Recursos Premium</h4>

                            <div className="flex items-center gap-3 text-sm text-zinc-300 group">
                                <div className="p-2.5 rounded-xl bg-[#1e3a5f]/30 text-[#c9a857] group-hover:bg-[#1e3a5f]/50 transition-colors duration-300">
                                    <Video size={16} />
                                </div>
                                <span>Explicação em Vídeo</span>
                            </div>
                            <div className="flex items-center gap-3 text-sm text-zinc-300 group">
                                <div className="p-2.5 rounded-xl bg-[#1e3a5f]/30 text-[#c9a857] group-hover:bg-[#1e3a5f]/50 transition-colors duration-300">
                                    <FileCheck size={16} />
                                </div>
                                <span>PDF Integrado</span>
                            </div>
                            <div className="flex items-center gap-3 text-sm text-zinc-300 group">
                                <div className="p-2.5 rounded-xl bg-[#1e3a5f]/30 text-[#c9a857] group-hover:bg-[#1e3a5f]/50 transition-colors duration-300">
                                    <Upload size={16} />
                                </div>
                                <span>Upload Rápido</span>
                            </div>
                        </div>
                    </div>

                    {/* CENTER: Upload Form (Span 6) */}
                    <div className="lg:col-span-6">
                        <div className="card-premium relative overflow-hidden">
                            {/* Decorative Gold Top Line */}
                            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-[#c9a857] to-transparent opacity-80"></div>

                            {/* Subtle Corner Glow */}
                            <div className="absolute top-0 right-0 w-40 h-40 bg-[#c9a857]/5 blur-[60px] rounded-full pointer-events-none"></div>

                            {/* Top Navigation */}
                            <div className="flex justify-between mb-6 items-center">
                                <button
                                    onClick={() => window.location.href = '/admin'}
                                    className="text-zinc-400 hover:text-[#c9a857] text-xs font-bold uppercase tracking-widest flex items-center gap-2 transition-colors duration-300"
                                >
                                    Ir para Meus Processos &rarr;
                                </button>

                                <button
                                    onClick={() => {
                                        if (supabase?.auth) supabase.auth.signOut();
                                        window.location.href = '/login';
                                    }}
                                    className="text-zinc-600 hover:text-red-400 text-xs font-bold uppercase tracking-widest flex items-center gap-2 transition-colors duration-300 ml-4"
                                    title="Sair do Sistema"
                                >
                                    <LogOut size={12} /> Sair
                                </button>
                            </div>

                            <h2 className="text-2xl font-bold text-center mb-8 relative z-10">
                                <span className="inline-block border-b-2 border-[#c9a857]/30 pb-2 text-gradient">
                                    Enviar Documento
                                </span>
                            </h2>

                            {errorMsg && (
                                <div className="mb-6 p-4 bg-red-900/20 border border-red-500/30 rounded-xl text-red-300 text-sm flex items-center gap-3 animate-fade-in backdrop-blur-sm">
                                    <AlertTriangle size={18} className="shrink-0 text-red-400" /> {errorMsg}
                                </div>
                            )}

                            <div className="space-y-5">
                                <div>
                                    <label className="block text-[10px] font-bold text-[#c9a857] mb-2 uppercase tracking-wider">Número do Processo</label>
                                    <input
                                        type="text"
                                        value={processo}
                                        onChange={e => setProcesso(e.target.value)}
                                        className="input-premium"
                                        placeholder="0000000-00.0000.0.00.0000"
                                    />
                                </div>

                                <div>
                                    <label className="block text-[10px] font-bold text-[#c9a857] mb-2 uppercase tracking-wider">Título (Opcional)</label>
                                    <input
                                        type="text"
                                        value={titulo}
                                        onChange={e => setTitulo(e.target.value)}
                                        className="input-premium"
                                        placeholder="Ex: Petição Inicial"
                                    />
                                </div>

                                {/* Password Protection */}
                                <div>
                                    <label className="block text-[10px] font-bold text-[#c9a857] mb-2 flex items-center gap-2 uppercase tracking-wider">
                                        <Lock size={12} className="text-[#c9a857]" /> Proteger com Senha (Opcional)
                                    </label>
                                    <input
                                        type="text"
                                        value={password}
                                        onChange={e => setPassword(e.target.value)}
                                        className="input-premium"
                                        placeholder="Defina uma senha se desejar"
                                    />
                                </div>

                                {/* Upload PDF Box */}
                                <div>
                                    <label className="block text-[10px] font-bold text-[#c9a857] mb-2 uppercase tracking-wider">Documento PDF</label>
                                    <div
                                        className={cn(
                                            "border border-dashed rounded-xl p-8 text-center transition-all relative overflow-hidden group cursor-pointer",
                                            dragActive === 'pdf'
                                                ? "border-[#c9a857] bg-[#c9a857]/5 shadow-[0_0_30px_rgba(201,168,87,0.1)]"
                                                : pdfFile
                                                    ? "border-emerald-500/50 bg-emerald-900/10"
                                                    : "border-white/10 bg-black/20 hover:bg-[#1e3a5f]/10 hover:border-[#c9a857]/30"
                                        )}
                                        onDragEnter={(e) => handleDrag(e, 'pdf')}
                                        onDragLeave={(e) => handleDrag(e, 'pdf')}
                                        onDragOver={(e) => handleDrag(e, 'pdf')}
                                        onDrop={(e) => handleDrop(e, 'pdf')}
                                        onClick={() => !pdfFile && document.getElementById('pdf-upload').click()}
                                    >
                                        <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>

                                        <div className="flex flex-col items-center justify-center relative z-10">
                                            {pdfFile ? (
                                                <>
                                                    <FileCheck size={48} className="text-emerald-500 mb-2 animate-scale-in drop-shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                                                    <span className="text-emerald-400 font-bold text-sm">{pdfFile.name}</span>
                                                    <button onClick={(e) => { e.stopPropagation(); setPdfFile(null); }} className="text-xs text-red-400 hover:text-red-300 hover:underline mt-2 flex items-center gap-1"><X size={10} /> Remover</button>
                                                </>
                                            ) : (
                                                <>
                                                    <div className="bg-[#1e3a5f]/30 text-[#c9a857] p-4 rounded-2xl mb-3 shadow-lg group-hover:scale-110 group-hover:bg-[#1e3a5f]/50 transition-all duration-300 border border-[#c9a857]/10 group-hover:border-[#c9a857]/30 group-hover:shadow-[0_0_20px_rgba(201,168,87,0.15)]">
                                                        <FileText size={24} />
                                                    </div>
                                                    <p className="text-zinc-300 font-medium text-sm mb-1">Arraste ou selecione PDF</p>
                                                    <p className="text-zinc-600 text-xs">Max 50MB</p>
                                                </>
                                            )}
                                            <input type="file" accept="application/pdf" onChange={e => setPdfFile(e.target.files[0])} className="hidden" id="pdf-upload" />
                                        </div>
                                    </div>
                                </div>

                                {/* Upload Video Box */}
                                <div>
                                    <label className="block text-[10px] font-bold text-[#c9a857] mb-2 uppercase tracking-wider">Video Explicativo</label>
                                    <div
                                        className={cn(
                                            "border border-dashed rounded-xl p-8 text-center transition-all relative overflow-hidden group cursor-pointer",
                                            dragActive === 'video'
                                                ? "border-[#c9a857] bg-[#c9a857]/5 shadow-[0_0_30px_rgba(201,168,87,0.1)]"
                                                : videoFile
                                                    ? "border-emerald-500/50 bg-emerald-900/10"
                                                    : "border-white/10 bg-black/20 hover:bg-[#1e3a5f]/10 hover:border-[#c9a857]/30"
                                        )}
                                        onDragEnter={(e) => handleDrag(e, 'video')}
                                        onDragLeave={(e) => handleDrag(e, 'video')}
                                        onDragOver={(e) => handleDrag(e, 'video')}
                                        onDrop={(e) => handleDrop(e, 'video')}
                                        onClick={() => !videoFile && document.getElementById('video-upload').click()}
                                    >
                                        <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>

                                        <div className="flex flex-col items-center justify-center relative z-10">
                                            {videoFile ? (
                                                <>
                                                    <Video size={48} className="text-emerald-500 mb-2 animate-scale-in drop-shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                                                    <span className="text-emerald-400 font-bold text-sm">{videoFile.name}</span>
                                                    <button onClick={(e) => { e.stopPropagation(); setVideoFile(null); }} className="text-xs text-red-400 hover:text-red-300 hover:underline mt-2 flex items-center gap-1"><X size={10} /> Remover</button>
                                                </>
                                            ) : (
                                                <>
                                                    <div className="bg-[#1e3a5f]/30 text-[#c9a857] p-4 rounded-2xl mb-3 shadow-lg group-hover:scale-110 group-hover:bg-[#1e3a5f]/50 transition-all duration-300 border border-[#c9a857]/10 group-hover:border-[#c9a857]/30 group-hover:shadow-[0_0_20px_rgba(201,168,87,0.15)]">
                                                        <Video size={24} />
                                                    </div>
                                                    <p className="text-zinc-300 font-medium text-sm mb-1">Arraste ou selecione Video</p>
                                                    <p className="text-zinc-600 text-xs">Max 50MB</p>
                                                </>
                                            )}
                                            <input type="file" accept="video/*" onChange={e => setVideoFile(e.target.files[0])} className="hidden" id="video-upload" />
                                        </div>
                                    </div>
                                    {videoFile && videoFile.size > 50 * 1024 * 1024 && (
                                        <div className="mt-2 text-xs text-yellow-500 flex items-center justify-center bg-yellow-900/20 p-2 rounded border border-yellow-700/50">
                                            <AlertTriangle size={12} className="mr-1" />
                                            Arquivo grande ({Math.round(videoFile.size / 1024 / 1024)}MB).
                                        </div>
                                    )}
                                </div>

                                {loading ? (
                                    <div className="mt-6 bg-[#0c0c0e] p-6 rounded-xl border border-[#c9a857]/10 animate-fade-in shadow-inner">
                                        <div className="flex justify-between mb-4 relative">
                                            {/* Connecting Line */}
                                            <div className="absolute top-4 left-0 w-full h-0.5 bg-zinc-800 -z-10"></div>

                                            {['Envio do Vídeo', 'Gerando QR Code', 'Finalizando PDF'].map((step, i) => {
                                                const currentStep = statusMsg.includes("Vídeo") ? 0 : statusMsg.includes("QR") ? 1 : statusMsg.includes("PDF") || statusMsg.includes("Enviando PDF") ? 2 : -1;
                                                const isActive = i === currentStep;
                                                const isCompleted = i < currentStep;

                                                return (
                                                    <div key={i} className="flex flex-col items-center flex-1">
                                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all duration-500 bg-[#0c0c0e] ${isActive ? 'border-[#c9a857] text-[#c9a857] scale-125 shadow-[0_0_15px_rgba(201,168,87,0.4)]' : isCompleted ? 'border-emerald-500 text-emerald-500' : 'border-zinc-700 text-zinc-600'}`}>
                                                            {isCompleted ? <CheckCircle size={14} /> : i + 1}
                                                        </div>
                                                        <span className={`text-[9px] uppercase font-bold mt-2 tracking-wider ${isActive ? 'text-[#c9a857]' : isCompleted ? 'text-emerald-400' : 'text-zinc-600'}`}>{step}</span>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                        <div className="text-center text-xs text-zinc-400 mt-4 font-mono animate-pulse flex items-center justify-center gap-2">
                                            <Loader2 size={12} className="animate-spin text-[#c9a857]" />
                                            {statusMsg || "Processando..."}
                                        </div>
                                    </div>
                                ) : (
                                    <button
                                        onClick={handleInitialProcess}
                                        className="w-full bg-gradient-to-r from-[#c9a857] to-[#aa8a39] hover:from-[#d4b76a] hover:to-[#c9a857] text-[#0a0a0b] py-4 rounded-xl text-base shadow-xl mt-6 uppercase tracking-widest hover:scale-[1.01] active:scale-[0.98] transition-all font-bold shadow-[#c9a857]/20 border border-[#c9a857]/30 relative overflow-hidden group"
                                    >
                                        <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                        <span className="relative z-10 flex items-center justify-center gap-2">
                                            Continuar para Editor <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                                        </span>
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* RIGHTSIDE: Trust & Info (Span 3) */}
                    <div className="lg:col-span-3 space-y-8 animate-fade-in-up card-law" style={{ animationDelay: '0.4s' }}>
                        <div className="mb-6 flex justify-center lg:justify-end">
                            <div className="w-16 h-16 rounded-2xl border border-[#c9a857]/20 flex items-center justify-center bg-gradient-to-br from-[#1e3a5f]/30 to-transparent shadow-lg ring-1 ring-[#c9a857]/10">
                                <FileCheck className="text-[#c9a857]" size={28} />
                            </div>
                        </div>

                        <div className="text-center lg:text-right">
                            <h3 className="text-xl font-bold text-white mb-2">
                                Ambiente Seguro
                            </h3>
                            <p className="text-zinc-500 text-xs uppercase tracking-widest mb-4">
                                Criptografia de Ponta a Ponta
                            </p>
                            <div className="text-[#c9a857] text-sm font-medium border-t border-white/5 pt-4 mt-4 flex items-center justify-end gap-2">
                                <CheckCircle size={14} /> Suporte 24h
                            </div>
                        </div>

                        <div className="pt-8">
                            <div className="bg-[#0a0a0b]/80 p-5 rounded-xl border border-[#c9a857]/10">
                                <h5 className="text-[#c9a857] text-[10px] font-bold mb-3 uppercase tracking-widest">COMO FUNCIONA?</h5>
                                <ol className="text-xs text-zinc-400 space-y-3 list-decimal list-inside text-left leading-relaxed">
                                    <li><span className="text-zinc-200">Faça upload</span> do PDF e Vídeo</li>
                                    <li><span className="text-zinc-200">Posicione o QR Code</span> visualmente</li>
                                    <li><span className="text-zinc-200">Baixe o PDF final</span> pronto</li>
                                    <li><span className="text-zinc-200">Anexe</span> ao processo judicial</li>
                                </ol>
                            </div>
                        </div>
                    </div>

                </div>
            </main>
            <footer className="py-6 text-center text-zinc-600 text-[10px] uppercase tracking-widest flex flex-col gap-2">
                <span>© 2026 Explicare Advocacia • Todos os direitos reservados</span>
            </footer>
        </div>
    );
}
