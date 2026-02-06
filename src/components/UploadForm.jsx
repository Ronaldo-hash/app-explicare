import React, { useState } from 'react';
import { Upload, Video, Loader2, FileCheck, AlertTriangle, Eye, EyeOff, FileText, ArrowRight } from 'lucide-react';
import { PDFDocument, rgb, StandardFonts, PDFName } from 'pdf-lib';
import QRCode from 'qrcode';
import { cn } from '../lib/utils';
import { PdfVisualEditor } from './PdfVisualEditor';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../lib/config';
import { HelpTooltip, HELP_TEXTS } from './HelpTooltip';

export function UploadForm({ onSuccess, supabase }) {
    const [loading, setLoading] = useState(false);
    const [statusMsg, setStatusMsg] = useState("");
    const [processo, setProcesso] = useState("");
    const [cliente, setCliente] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [tipoAcao, setTipoAcao] = useState("");
    const [statusProcesso, setStatusProcesso] = useState("em_andamento");
    const [pdfFile, setPdfFile] = useState(null);
    const [videoFile, setVideoFile] = useState(null);
    const [dragActive, setDragActive] = useState(null);
    const [errorMsg, setErrorMsg] = useState(null);

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
                        throw new Error("O arquivo é maior que o limite permitido pelo banco de dados.");
                    }
                    throw new Error(`Erro Resgate (${res.status}): ${text}`);
                }
                return { path: path };
            }
            throw err;
        }
    };

    const handleInitialProcess = async () => {
        if (!processo || !pdfFile || !videoFile) { setErrorMsg("Por favor, preencha número, anexe PDF e vídeo."); return; }
        setLoading(true); setErrorMsg(null);

        try {
            const slug = Math.random().toString(36).substring(2, 8).toUpperCase();
            const landingUrl = `${window.location.origin}?v=${slug}`;

            setStatusMsg("Verificando arquivo...");
            const LIMIT_MB = 50;
            const LIMIT_BYTES = LIMIT_MB * 1024 * 1024;

            if (videoFile.size > LIMIT_BYTES) {
                setErrorMsg(`O vídeo tem ${(videoFile.size / 1024 / 1024).toFixed(2)}MB (Limite: 50MB).`);
                setLoading(false);
                return;
            }

            setStatusMsg("Enviando vídeo...");
            const fileExt = videoFile.name.split('.').pop() || 'mp4';
            const safeRandomName = `video_${Date.now()}_${Math.floor(Math.random() * 10000)}.${fileExt}`;
            const videoPath = `videos/${slug}_${safeRandomName}`;

            await robustUpload('videos-final-v3', videoPath, videoFile);

            const { data: videoUrlData } = supabase.storage.from('videos-final-v3').getPublicUrl(videoPath);
            const publicUrl = videoUrlData.publicUrl;

            setStatusMsg("Gerando QR Code...");
            const qrCodeDataUrl = await QRCode.toDataURL(landingUrl, { errorCorrectionLevel: 'H', margin: 1, color: { dark: '#000000', light: '#FFFFFF' } });

            setTempSlug(slug);
            setTempVideoUrl(publicUrl);
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
        setStatusMsg("Finalizando PDF...");

        try {
            const landingUrl = `${window.location.origin}?v=${tempSlug}`;
            const pdfBytes = await pdfFile.arrayBuffer();
            const pdfDoc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
            const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
            const qrImage = await pdfDoc.embedPng(generatedQrData);
            const pages = pdfDoc.getPages();
            const firstPage = pages[0];

            const qrSize = 80;
            const { x, y } = coords;

            // Draw the QR Code
            firstPage.drawImage(qrImage, { x, y, width: qrSize, height: qrSize });

            // Draw the access link - position depends on where QR code is placed
            const displayUrl = landingUrl.replace(/^https?:\/\//, '').replace(/^www\./, '');

            // If QR is near bottom of page (y < 40), put text ABOVE the QR Code
            // Otherwise, put it BELOW
            const textAbove = y < 40;
            const linkY = textAbove ? y + qrSize + 5 : y - 14;
            const urlY = textAbove ? y + qrSize + 18 : y - 24;

            // Draw label
            firstPage.drawText('Acesse o vídeo explicativo:', {
                x,
                y: linkY,
                size: 8,
                font: helveticaFont,
                color: rgb(0.3, 0.3, 0.3)
            });

            // Draw the URL in blue (clickable appearance)
            firstPage.drawText(displayUrl, {
                x,
                y: urlY,
                size: 7,
                font: helveticaFont,
                color: rgb(0, 0.4, 0.8)
            });

            // Add clickable link annotation for PDF readers (Fixed Implementation)
            try {
                const linkAnnotation = pdfDoc.context.register(
                    pdfDoc.context.obj({
                        Type: 'Annot',
                        Subtype: 'Link',
                        Rect: [x, Math.min(linkY, urlY) - 2, x + 200, Math.max(linkY, urlY) + 12], // Expanded click area
                        Border: [0, 0, 0],
                        C: [0, 0, 1],
                        A: {
                            Type: 'Action',
                            S: 'URI',
                            URI: landingUrl,
                        },
                    })
                );

                const pages = pdfDoc.getPages();
                const firstPage = pages[0];
                const annots = firstPage.node.lookup(PDFName.of('Annots'));

                if (annots) {
                    annots.push(linkAnnotation);
                } else {
                    firstPage.node.set(PDFName.of('Annots'), pdfDoc.context.obj([linkAnnotation]));
                }
            } catch (e) {
                console.log('Could not add link annotation:', e.message);
            }

            const modifiedPdfBytes = await pdfDoc.save();
            const modifiedPdfBlob = new Blob([modifiedPdfBytes], { type: 'application/pdf' });

            setStatusMsg("Enviando PDF...");
            const pdfPath = `pecas/${tempSlug}_COM_QR.pdf`;

            await robustUpload('pecas-final-v3', pdfPath, modifiedPdfBlob);

            const { data: pdfUrlData } = supabase.storage.from('pecas-final-v3').getPublicUrl(pdfPath);
            const pdfPublicUrl = pdfUrlData.publicUrl;

            const record = {
                slug: tempSlug,
                processo,
                titulo_peca: cliente || "Peça Processual",
                video_url: tempVideoUrl,
                pdf_final_url: pdfPublicUrl,
                access_password: password || null,
                action_type: tipoAcao || null,
                // status: statusProcesso, // Temporarily disabled due to Supabase schema cache issue
            };

            const { error: dbErr } = await supabase.from('videos_pecas').insert([record]);
            if (dbErr) throw dbErr;

            onSuccess({ ...record, landingUrl, qrCodeDataUrl: generatedQrData });
        } catch (error) {
            console.error(error);
            setErrorMsg("Erro ao finalizar: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    if (showVisualEditor) {
        return (
            <PdfVisualEditor
                pdfFile={pdfFile}
                qrCodeDataUrl={generatedQrData}
                onSave={handleFinalizePdf}
                onCancel={() => { setShowVisualEditor(false); setLoading(false); }}
            />
        );
    }

    return (
        <div className="w-full flex justify-center items-start pt-4 h-full">
            <div className="w-full max-w-4xl card-law p-8 animate-fade-in">

                {/* Header */}
                <div className="mb-6 pb-5 border-b border-white/5">
                    <div className="flex items-center gap-2">
                        <h2 className="text-xl font-semibold text-white">Novo Processo</h2>
                        <HelpTooltip title={HELP_TEXTS.novoProcesso.title} content={HELP_TEXTS.novoProcesso.content} position="right" />
                    </div>
                    <p className="text-zinc-500 text-sm mt-1">Cadastre um novo processo com vídeo explicativo</p>
                </div>

                {/* Messages */}
                {errorMsg && (
                    <div className="mb-5 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm flex items-center gap-2">
                        <AlertTriangle size={16} /> {errorMsg}
                    </div>
                )}
                {loading && (
                    <div className="mb-5 p-3 bg-[#c9a857]/10 border border-[#c9a857]/20 rounded-lg text-[#c9a857] text-sm flex items-center gap-2">
                        <Loader2 size={16} className="animate-spin" /> {statusMsg || "Processando..."}
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Column 1: Form Fields */}
                    <div className="flex flex-col gap-4">
                        {/* Process Number */}
                        <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Nº do Processo</label>
                            <input
                                type="text"
                                value={processo}
                                onChange={(e) => setProcesso(e.target.value)}
                                className="input-premium"
                                placeholder="0000000-00.0000.0.00.0000"
                            />
                        </div>

                        {/* Client Name */}
                        <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Cliente</label>
                            <input
                                type="text"
                                value={cliente}
                                onChange={(e) => setCliente(e.target.value)}
                                className="input-premium"
                                placeholder="Nome do cliente"
                            />
                        </div>

                        {/* Action Type */}
                        <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Tipo de Ação</label>
                            <div className="relative">
                                <select
                                    value={tipoAcao}
                                    onChange={(e) => setTipoAcao(e.target.value)}
                                    className="input-premium appearance-none cursor-pointer"
                                >
                                    <option value="" disabled>Selecione o tipo...</option>
                                    <option value="civil">Direito Civil</option>
                                    <option value="criminal">Direito Criminal</option>
                                    <option value="trabalhista">Direito Trabalhista</option>
                                    <option value="tributario">Direito Tributário</option>
                                    <option value="familia">Direito de Família</option>
                                    <option value="empresarial">Direito Empresarial</option>
                                </select>
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m6 9 6 6 6-6" /></svg>
                                </div>
                            </div>
                        </div>

                        {/* Status do Processo */}
                        <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Status do Processo</label>
                            <div className="relative">
                                <select
                                    value={statusProcesso}
                                    onChange={(e) => setStatusProcesso(e.target.value)}
                                    className="input-premium appearance-none cursor-pointer"
                                >
                                    <option value="em_andamento">🟡 Em Andamento</option>
                                    <option value="concluido">🟢 Concluído</option>
                                    <option value="arquivado">⚫ Arquivado</option>
                                </select>
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m6 9 6 6 6-6" /></svg>
                                </div>
                            </div>
                        </div>

                        {/* Password */}
                        <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Senha de Acesso (Opcional)</label>
                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="input-premium pr-10"
                                    placeholder="••••••••"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
                                >
                                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Column 2: Uploads */}
                    <div className="flex flex-col gap-4">
                        {/* PDF Upload */}
                        <div className="flex flex-col gap-1.5 flex-1">
                            <div className="flex items-center gap-2">
                                <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Documento PDF</label>
                                <HelpTooltip title={HELP_TEXTS.uploadPdf.title} content={HELP_TEXTS.uploadPdf.content} position="top" />
                            </div>
                            <div
                                className={cn(
                                    "rounded-lg flex-1 min-h-[120px] flex flex-col items-center justify-center p-5 text-center border border-dashed transition-all cursor-pointer",
                                    dragActive === 'pdf' ? "border-[#c9a857] bg-[#c9a857]/5" : "border-zinc-700 hover:border-zinc-600",
                                    pdfFile ? "border-emerald-500/50 bg-emerald-500/5" : ""
                                )}
                                onDragEnter={(e) => handleDrag(e, 'pdf')}
                                onDragLeave={(e) => handleDrag(e, 'pdf')}
                                onDragOver={(e) => handleDrag(e, 'pdf')}
                                onDrop={(e) => handleDrop(e, 'pdf')}
                                onClick={() => document.getElementById('pdf-upload').click()}
                            >
                                <input type="file" id="pdf-upload" accept=".pdf" className="hidden" onChange={(e) => setPdfFile(e.target.files[0])} />

                                {pdfFile ? (
                                    <>
                                        <FileCheck size={28} className="text-emerald-500 mb-2" />
                                        <p className="text-sm text-emerald-400 font-medium truncate max-w-full">{pdfFile.name}</p>
                                    </>
                                ) : (
                                    <>
                                        <FileText size={28} className="text-zinc-500 mb-2" />
                                        <p className="text-sm text-zinc-400">Arraste ou clique para selecionar</p>
                                        <p className="text-xs text-zinc-600 mt-1">PDF até 50MB</p>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Video Upload */}
                        <div className="flex flex-col gap-1.5 flex-1">
                            <div className="flex items-center gap-2">
                                <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Vídeo Explicativo</label>
                                <HelpTooltip title={HELP_TEXTS.uploadVideo.title} content={HELP_TEXTS.uploadVideo.content} position="top" />
                            </div>
                            <div
                                className={cn(
                                    "rounded-lg flex-1 min-h-[120px] flex flex-col items-center justify-center p-5 text-center border border-dashed transition-all cursor-pointer",
                                    dragActive === 'video' ? "border-[#c9a857] bg-[#c9a857]/5" : "border-zinc-700 hover:border-zinc-600",
                                    videoFile ? "border-emerald-500/50 bg-emerald-500/5" : ""
                                )}
                                onDragEnter={(e) => handleDrag(e, 'video')}
                                onDragLeave={(e) => handleDrag(e, 'video')}
                                onDragOver={(e) => handleDrag(e, 'video')}
                                onDrop={(e) => handleDrop(e, 'video')}
                                onClick={() => document.getElementById('video-upload').click()}
                            >
                                <input type="file" id="video-upload" accept="video/*" className="hidden" onChange={(e) => setVideoFile(e.target.files[0])} />

                                {videoFile ? (
                                    <>
                                        <Video size={28} className="text-emerald-500 mb-2" />
                                        <p className="text-sm text-emerald-400 font-medium truncate max-w-full">{videoFile.name}</p>
                                    </>
                                ) : (
                                    <>
                                        <Video size={28} className="text-zinc-500 mb-2" />
                                        <p className="text-sm text-zinc-400">Arraste ou clique para selecionar</p>
                                        <p className="text-xs text-zinc-600 mt-1">MP4, MOV até 50MB</p>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end mt-6 pt-5 border-t border-white/5">
                    <button
                        onClick={handleInitialProcess}
                        disabled={loading}
                        className="btn-primary flex items-center gap-2"
                    >
                        {loading ? (
                            <>
                                <Loader2 size={16} className="animate-spin" />
                                Processando...
                            </>
                        ) : (
                            <>
                                Continuar
                                <ArrowRight size={16} />
                            </>
                        )}
                    </button>
                </div>

            </div>
        </div>
    );
}
