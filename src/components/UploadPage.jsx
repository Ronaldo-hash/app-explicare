import React, { useState } from 'react';
import { Upload, FileText, Video, Loader2, FileCheck, AlertTriangle, Lock, LogOut, CheckCircle, ArrowRight } from 'lucide-react';
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
            // Tratamento de erro cru habilitado

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

            // VERIFICAÇÃO DO PLANO FREE (50MB)
            const LIMIT_MB = 50;
            const LIMIT_BYTES = LIMIT_MB * 1024 * 1024;

            if (videoFile.size > LIMIT_BYTES) {
                const sizeMB = (videoFile.size / 1024 / 1024).toFixed(2);
                alert(`⚠️ LIMITE DO PLANO GRATUITO ⚠️\n\nO Supabase Free não aceita arquivos acima de ${LIMIT_MB}MB.\nSeu vídeo tem ${sizeMB}MB.\n\nPor favor, comprima o vídeo (use sites como 'FreeConvert' ou o app 'Handbrake') para menos de 50MB e tente novamente.`);
                setLoading(false);
                return;
            }

            setStatusMsg("Enviando vídeo...");

            // EMERGENCY FIX: Ignore original filename completely to avoid "Invalid key"
            // Generate a purely alphanumeric name: video_TIMESTAMP_RANDOM.ext
            const fileExt = videoFile.name.split('.').pop() || 'mp4';
            const safeRandomName = `video_${Date.now()}_${Math.floor(Math.random() * 10000)}.${fileExt}`;
            const videoPath = `videos/${slug}_${safeRandomName}`;

            await robustUpload('videos-final-v3', videoPath, videoFile);
            const { data: videoUrlData } = supabase.storage.from('videos-final-v3').getPublicUrl(videoPath);

            setStatusMsg("Gerando QR Code...");
            const qrCodeDataUrl = await QRCode.toDataURL(landingUrl, { errorCorrectionLevel: 'H', margin: 1, color: { dark: '#000000', light: '#FFFFFF' } });

            // Salvar dados temporários e abrir editor visual
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

        // Pequeno delay para garantir que a interface atualize e mostre o loader
        await new Promise(resolve => setTimeout(resolve, 100));

        setStatusMsg("Gerando PDF com QR Code...");

        try {
            const landingUrl = `${window.location.origin}?v=${tempSlug}`;
            const pdfBytes = await pdfFile.arrayBuffer();
            // Tenta carregar com a senha fornecida ou vazia
            // OBS: pdf-lib exige password se o arquivo for criptografado, mesmo que seja senha vazia
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

            // Desenhar Texto do Link
            firstPage.drawText('Acesse o vídeo:', {
                x: x,
                y: y - 12,
                size: 9,
                font: helveticaFont,
                color: rgb(0, 0, 0),
            });

            // Criar versão encurtada para exibição (sem https://)
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
                color: rgb(0, 0, 1), // Azul para parecer link
            });

            // Desenhar Sublinhado (Underline)
            firstPage.drawLine({
                start: { x: x, y: y - 23 },
                end: { x: x + textWidth, y: y - 23 },
                thickness: 0.5,
                color: rgb(0, 0, 1),
            });

            // Adicionar Anotação de Link Clicável
            const linkAnnotation = pdfDoc.context.register(
                pdfDoc.context.obj({
                    Type: 'Annot',
                    Subtype: 'Link',
                    Rect: [x, y - 25, x + textWidth, y - 22 + textHeight + 2], // Área clicável um pouco maior
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
                access_password: password || null // Salva senha ou null
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
            <header className="border-b border-gray-700/50 bg-[#121212]/50 backdrop-blur-sm py-4 px-8 flex justify-center items-center relative rounded-b-xl mx-4 mt-2">
                {session?.user?.email && (
                    <div className="absolute left-8 top-1/2 -translate-y-1/2 text-xs text-gray-500 font-mono hidden md:block">
                        <span className="text-activeBlue">user:</span> {session.user.email}
                    </div>
                )}
                <Logo />
            </header>

            {/* Main Content - 3 Column Grid Layout */}
            <main className="flex-1 p-8">

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

                    {/* LEFTSIDE: Branding & Benefits (Span 3) */}
                    <div className="lg:col-span-3 space-y-8 animate-slide-up bg-[#18181b]/60 backdrop-blur-md p-6 rounded-2xl border border-gray-700/30 shadow-lg" style={{ animationDelay: '0.2s' }}>
                        <div>
                            <h1 className="text-3xl font-bold text-blue-500 mb-4 leading-tight drop-shadow-sm">
                                Excelência e <br /> Inovação
                            </h1>
                            <p className="text-gray-400 text-sm leading-relaxed border-l-2 border-blue-500/30 pl-4">
                                Transformando a prática jurídica com tecnologia de ponta. Agilidade e segurança para seus processos.
                            </p>
                        </div>

                        <div className="space-y-4 pt-4">
                            <h4 className="text-blue-500 text-xs font-bold uppercase tracking-wider mb-2">Recursos Premium</h4>

                            <div className="flex items-center gap-3 text-sm text-gray-300">
                                <div className="p-2 rounded-full bg-blue-900/20 text-blue-400"><Video size={16} /></div>
                                <span>Explicação em Vídeo</span>
                            </div>
                            <div className="flex items-center gap-3 text-sm text-gray-300">
                                <div className="p-2 rounded-full bg-blue-900/20 text-blue-400"><FileCheck size={16} /></div>
                                <span>PDF Integrado</span>
                            </div>
                            <div className="flex items-center gap-3 text-sm text-gray-300">
                                <div className="p-2 rounded-full bg-blue-900/20 text-blue-400"><Upload size={16} /></div>
                                <span>Upload Rápido</span>
                            </div>
                        </div>
                    </div>

                    {/* CENTER: Upload Form (Span 6) */}
                    <div className="lg:col-span-6">
                        <div className="w-full border border-gray-700/50 rounded-2xl p-8 bg-[#0c0c0e]/80 backdrop-blur-xl shadow-2xl relative animate-scale-in overflow-hidden ring-1 ring-white/5">
                            {/* Decorative Top Line */}
                            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-80"></div>

                            {/* Top Navigation */}
                            <div className="flex justify-between mb-4 items-center">
                                {/* Admin Link */}
                                <button
                                    onClick={() => window.location.href = '/admin'}
                                    className="text-white/50 hover:text-blue-400 text-xs font-bold uppercase tracking-widest flex items-center gap-2 transition-colors"
                                >
                                    Ir para Meus Processos &rarr;
                                </button>

                                {/* Logout Link */}
                                <button
                                    onClick={() => {
                                        if (supabase?.auth) supabase.auth.signOut();
                                        window.location.href = '/login';
                                    }}
                                    className="text-white/30 hover:text-red-400 text-xs font-bold uppercase tracking-widest flex items-center gap-2 transition-colors ml-4"
                                    title="Sair do Sistema"
                                >
                                    <LogOut size={12} /> Sair
                                </button>
                            </div>

                            <h2 className="text-2xl font-bold text-blue-500 text-center mb-6 relative z-10">
                                <span className="inline-block border-b-2 border-blue-500/30 pb-2">
                                    Enviar Documento
                                </span>
                            </h2>

                            {errorMsg && (
                                <div className="mb-6 p-3 bg-red-900/30 border border-red-500/50 rounded-lg text-red-200 text-sm flex items-center animate-pulse">
                                    <AlertTriangle className="mr-2" size={16} /> {errorMsg}
                                </div>
                            )}

                            <div className="space-y-5">
                                <div>
                                    <label className="block text-sm font-bold text-gray-400 mb-2 uppercase tracking-wide text-[10px]">Número do Processo</label>
                                    <input
                                        type="text"
                                        value={processo}
                                        onChange={e => setProcesso(e.target.value)}
                                        className="w-full px-4 py-3.5 bg-black/40 border border-gray-700 text-white rounded-xl outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all placeholder-gray-600"
                                        placeholder="0000000-00.0000.0.00.0000"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-400 mb-2 uppercase tracking-wide text-[10px]">Título (Opcional)</label>
                                    <input
                                        type="text"
                                        value={titulo}
                                        onChange={e => setTitulo(e.target.value)}
                                        className="w-full px-4 py-3.5 bg-black/40 border border-gray-700 text-white rounded-xl outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all placeholder-gray-600"
                                        placeholder="Ex: Petição Inicial"
                                    />
                                </div>

                                {/* Password Protection (NEW) */}
                                <div>
                                    <label className="block text-sm font-bold text-gray-400 mb-2 flex items-center gap-2 uppercase tracking-wide text-[10px]">
                                        <Lock size={12} className="text-blue-500" /> Proteger com Senha (Opcional)
                                    </label>
                                    <input
                                        type="text"
                                        value={password}
                                        onChange={e => setPassword(e.target.value)}
                                        className="w-full px-4 py-3.5 bg-black/40 border border-gray-700 text-white rounded-xl outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all placeholder-gray-600"
                                        placeholder="Defina uma senha se desejar"
                                    />
                                </div>

                                {/* Upload PDF Box */}
                                <div>
                                    <label className="block text-sm font-bold text-gray-400 mb-2 uppercase tracking-wide text-[10px]">Documento PDF</label>
                                    <div
                                        className={cn(
                                            "border border-dashed border-gray-600 rounded-xl p-8 text-center bg-black/20 hover:bg-black/40 transition-all relative overflow-hidden group",
                                            dragActive === 'pdf' ? "border-blue-500 bg-blue-900/10 animate-pulse" : "",
                                            pdfFile && "border-emerald-500 bg-emerald-900/10"
                                        )}
                                        onDragEnter={(e) => handleDrag(e, 'pdf')}
                                        onDragLeave={(e) => handleDrag(e, 'pdf')}
                                        onDragOver={(e) => handleDrag(e, 'pdf')}
                                        onDrop={(e) => handleDrop(e, 'pdf')}
                                        onClick={() => !pdfFile && document.getElementById('pdf-upload').click()}
                                    >
                                        <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>

                                        <div className="flex flex-col items-center justify-center relative z-10 cursor-pointer">
                                            {pdfFile ? (
                                                <>
                                                    <FileCheck size={48} className="text-emerald-500 mb-2 animate-scale-in drop-shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                                                    <span className="text-emerald-500 font-bold text-sm">{pdfFile.name}</span>
                                                    <button onClick={(e) => { e.stopPropagation(); setPdfFile(null); }} className="text-xs text-red-400 hover:text-red-300 hover:underline mt-2 flex items-center gap-1"><X size={10} /> Remover</button>
                                                </>
                                            ) : (
                                                <>
                                                    <div className="bg-[#1e1e24] text-gray-300 p-4 rounded-full mb-3 shadow-lg group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300 border border-gray-700 group-hover:border-blue-400">
                                                        <FileText size={24} />
                                                    </div>
                                                    <p className="text-gray-300 font-medium text-sm mb-1">Arraste ou selecione PDF</p>
                                                    <p className="text-gray-500 text-xs">Max 50MB</p>
                                                </>
                                            )}
                                            <input type="file" accept="application/pdf" onChange={e => setPdfFile(e.target.files[0])} className="hidden" id="pdf-upload" />
                                        </div>
                                    </div>
                                </div>

                                {/* Upload Video Box */}
                                <div>
                                    <label className="block text-sm font-bold text-gray-400 mb-2 uppercase tracking-wide text-[10px]">Video Explicativo</label>
                                    <div
                                        className={cn(
                                            "border border-dashed border-gray-600 rounded-xl p-8 text-center bg-black/20 hover:bg-black/40 transition-all relative overflow-hidden group",
                                            dragActive === 'video' ? "border-blue-500 bg-blue-900/10 animate-pulse" : "",
                                            videoFile && "border-emerald-500 bg-emerald-900/10"
                                        )}
                                        onDragEnter={(e) => handleDrag(e, 'video')}
                                        onDragLeave={(e) => handleDrag(e, 'video')}
                                        onDragOver={(e) => handleDrag(e, 'video')}
                                        onDrop={(e) => handleDrop(e, 'video')}
                                        onClick={() => !videoFile && document.getElementById('video-upload').click()}
                                    >
                                        <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>

                                        <div className="flex flex-col items-center justify-center relative z-10 cursor-pointer">
                                            {videoFile ? (
                                                <>
                                                    <Video size={48} className="text-emerald-500 mb-2 animate-scale-in drop-shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                                                    <span className="text-emerald-500 font-bold text-sm">{videoFile.name}</span>
                                                    <button onClick={(e) => { e.stopPropagation(); setVideoFile(null); }} className="text-xs text-red-400 hover:text-red-300 hover:underline mt-2 flex items-center gap-1"><X size={10} /> Remover</button>
                                                </>
                                            ) : (
                                                <>
                                                    <div className="bg-[#1e1e24] text-gray-300 p-4 rounded-full mb-3 shadow-lg group-hover:scale-110 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300 border border-gray-700 group-hover:border-indigo-400">
                                                        <Video size={24} />
                                                    </div>
                                                    <p className="text-gray-300 font-medium text-sm mb-1">Arraste ou selecione Video</p>
                                                    <p className="text-gray-500 text-xs">Max 50MB</p>
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
                                    <div className="mt-6 bg-[#0c0c0e] p-6 rounded-xl border border-gray-700/50 animate-fade-in shadow-inner">
                                        <div className="flex justify-between mb-4 relative">
                                            {/* Connecting Line */}
                                            <div className="absolute top-4 left-0 w-full h-0.5 bg-gray-700 -z-10"></div>

                                            {['Envio do Vídeo', 'Gerando QR Code', 'Finalizando PDF'].map((step, i) => {
                                                const currentStep = statusMsg.includes("Vídeo") ? 0 : statusMsg.includes("QR") ? 1 : statusMsg.includes("PDF") || statusMsg.includes("Enviando PDF") ? 2 : -1;
                                                const isActive = i === currentStep;
                                                const isCompleted = i < currentStep;

                                                return (
                                                    <div key={i} className="flex flex-col items-center flex-1">
                                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all duration-500 bg-[#0c0c0e] ${isActive ? 'border-blue-500 text-blue-500 scale-125 shadow-[0_0_15px_rgba(59,130,246,0.5)]' : isCompleted ? 'border-emerald-500 text-emerald-500' : 'border-gray-600 text-gray-600'}`}>
                                                            {isCompleted ? <CheckCircle size={14} /> : i + 1}
                                                        </div>
                                                        <span className={`text-[9px] uppercase font-bold mt-2 tracking-wider ${isActive ? 'text-blue-400' : isCompleted ? 'text-emerald-400' : 'text-gray-600'}`}>{step}</span>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                        <div className="text-center text-xs text-gray-400 mt-4 font-mono animate-pulse flex items-center justify-center gap-2">
                                            <Loader2 size={12} className="animate-spin" />
                                            {statusMsg || "Processando..."}
                                        </div>
                                    </div>
                                ) : (
                                    <button
                                        onClick={handleInitialProcess}
                                        className="w-full animate-shimmer text-white py-4 rounded-xl text-base shadow-xl mt-6 uppercase tracking-widest hover:scale-[1.01] active:scale-[0.98] transition-all font-bold shadow-blue-500/20 border border-blue-400/30 relative overflow-hidden group"
                                    >
                                        <span className="relative z-10 flex items-center justify-center gap-2">
                                            Continuar para Editor <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                                        </span>
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* RIGHTSIDE: Trust & Info (Span 3) */}
                    <div className="lg:col-span-3 space-y-8 animate-slide-up bg-[#18181b]/60 backdrop-blur-md p-6 rounded-2xl border border-gray-700/30 shadow-lg" style={{ animationDelay: '0.4s' }}>
                        <div className="mb-6 flex justify-center lg:justify-end">
                            <div className="w-16 h-16 rounded-full border border-gray-700/50 flex items-center justify-center bg-gradient-to-br from-gray-800 to-black shadow-lg ring-1 ring-white/5">
                                <FileCheck className="text-blue-500" size={28} />
                            </div>
                        </div>

                        <div className="text-center lg:text-right">
                            <h3 className="text-xl font-bold text-white mb-2">
                                Ambiente Seguro
                            </h3>
                            <p className="text-gray-500 text-xs uppercase tracking-widest mb-4">
                                Criptografia de Ponta a Ponta
                            </p>
                            <div className="text-blue-500 text-sm font-medium border-t border-gray-700/50 pt-4 mt-4 flex items-center justify-end gap-2">
                                <CheckCircle size={14} /> Suporte 24h
                            </div>
                        </div>

                        <div className="pt-8">
                            <div className="bg-[#111]/80 p-4 rounded-xl border border-gray-700/30">
                                <h5 className="text-blue-500 text-[10px] font-bold mb-3 uppercase tracking-widest">COMO FUNCIONA?</h5>
                                <ol className="text-xs text-gray-400 space-y-3 list-decimal list-inside text-left leading-relaxed">
                                    <li><span className="text-gray-300">Faça upload</span> do PDF e Vídeo</li>
                                    <li><span className="text-gray-300">Posicione o QR Code</span> visualmente</li>
                                    <li><span className="text-gray-300">Baixe o PDF final</span> pronto</li>
                                    <li>Anexe ao processo judicial</li>
                                </ol>
                            </div>
                        </div>
                    </div>

                </div>
            </main>
            <footer className="py-6 text-center text-gray-600 text-[10px] uppercase tracking-widest flex flex-col gap-2">
                <span>© 2026 Tecnologia Legal • Todos os direitos reservados</span>
            </footer>
        </div>
    );
}
