import React, { useState, useRef } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { Loader2, Move, AlertTriangle, Check, X, MousePointer2, Info } from 'lucide-react';
import { createPortal } from 'react-dom';

// Import CSS
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Worker Config
pdfjs.GlobalWorkerOptions.workerSrc = window.location.origin + '/pdf.worker.min.mjs';

// --- Error Boundary ---
class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }
    static getDerivedStateFromError(error) { return { hasError: true, error }; }
    render() {
        if (this.state.hasError) {
            return (
                <div className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center p-6 text-white text-center">
                    <AlertTriangle size={50} className="text-red-500 mb-4" />
                    <h2 className="text-xl font-bold">Erro no Editor de PDF</h2>
                    <p className="text-gray-400 mt-2">{this.state.error?.message}</p>
                    <button onClick={() => window.location.reload()} className="mt-4 bg-blue-600 px-4 py-2 rounded">Recarregar App</button>
                </div>
            );
        }
        return this.props.children;
    }
}

function PdfVisualEditorContent({ pdfFile, qrCodeDataUrl, onSave, onCancel }) {
    const [_numPages, setNumPages] = useState(null);
    const [pageWidth, setPageWidth] = useState(0);
    const [pageHeight, setPageHeight] = useState(0);
    const [pdfDimensions, setPdfDimensions] = useState({ width: 0, height: 0 });
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [error, setError] = useState(null);
    const [isLoaded, setIsLoaded] = useState(false);
    const nodeRef = useRef(null); // Node Ref for Draggable (React 19 fix)

    // State to track password attempts
    const [passwordError, setPasswordError] = useState(false);

    const onDocumentLoadSuccess = ({ numPages }) => {
        setNumPages(numPages);
        setError(null);
    };

    const onDocumentLoadError = (err) => {
        console.error("PDF Load Error:", err);
        // Specialized error message for password failure
        if (err.name === 'PasswordException') {
            setError("Senha incorreta. Não foi possível abrir o PDF.");
        } else {
            setError(`Falha ao carregar PDF: ${err.message}`);
        }
    };

    // Callback para lidar com SENHA
    const onPassword = (callback, reason) => {
        console.log("PDF Password Requested. Reason:", reason);
        // Reason 1: NEED_PASSWORD - First attempt
        // Reason 2: INCORRECT_PASSWORD - Previous attempt failed

        if (reason === 1) {
            // First try empty password (common for owner-locked files)
            console.log("Attempting empty password bypass...");
            callback('');
        } else {
            // Failed empty password or user typed wrong password
            setPasswordError(true);
            const userPass = prompt("Este arquivo é protegido por senha. Por favor, digite a senha de abertura:");
            callback(userPass);
        }
    };

    const onPageLoadSuccess = (page) => {
        setPageWidth(page.width);
        setPageHeight(page.height);
        setPdfDimensions({ width: page.originalWidth, height: page.originalHeight });
        setPosition({ x: (page.width / 2) - 40, y: (page.height / 2) - 40 });
        setIsLoaded(true);
    };

    const handleConfirm = () => {
        if (!isLoaded || pageWidth === 0) return;
        const scaleX = pdfDimensions.width / pageWidth;
        const scaleY = pdfDimensions.height / pageHeight;
        const finalX = position.x * scaleX;
        let finalY = pdfDimensions.height - (position.y * scaleY) - 80;
        if (finalY < 0) finalY = 40;
        onSave({ x: finalX, y: finalY });
    };

    // State for dragging
    const [isDragging, setIsDragging] = useState(false);
    const containerRef = useRef(null);

    const handleMouseDown = (e) => {
        if (!isLoaded) return;
        e.preventDefault();
        setIsDragging(true);
    };

    const handleMouseMove = (e) => {
        if (!isDragging || !containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const qrSize = 40; // Half of QR size
        let newX = e.clientX - rect.left - qrSize;
        let newY = e.clientY - rect.top - qrSize;
        // Clamp to PDF bounds
        newX = Math.max(0, Math.min(newX, pageWidth - 80));
        newY = Math.max(0, Math.min(newY, pageHeight - 80));
        setPosition({ x: newX, y: newY });
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    const handleClick = (e) => {
        if (!isLoaded || isDragging) return;
        const rect = e.currentTarget.getBoundingClientRect();
        const qrSize = 40;
        let newX = e.clientX - rect.left - qrSize;
        let newY = e.clientY - rect.top - qrSize;
        newX = Math.max(0, Math.min(newX, pageWidth - 80));
        newY = Math.max(0, Math.min(newY, pageHeight - 80));
        setPosition({ x: newX, y: newY });
    };

    return (
        <div
            className="fixed inset-0 z-[60] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4"
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
        >
            <div className="bg-[#121214] rounded-2xl w-full max-w-5xl h-[90vh] flex flex-col border border-white/10 shadow-2xl relative">
                <div className="p-4 border-b border-white/5 flex justify-between items-center bg-[#1a1a1e] rounded-t-2xl">
                    <h3 className="text-white font-bold flex items-center gap-2">
                        <MousePointer2 size={18} className="text-blue-500" />
                        Posicionar QR Code
                    </h3>
                    <div className="flex gap-2">
                        <button onClick={onCancel} className="px-4 py-2 text-gray-400 hover:text-white transition-colors text-sm font-medium">Cancelar</button>
                        <button
                            onClick={handleConfirm}
                            disabled={!isLoaded}
                            className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-lg text-sm font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoaded ? "Confirmar Posição" : "Lendo PDF..."}
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-auto bg-[#0a0a0a] flex justify-center p-8 relative">
                    <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.05)_1px,transparent_1px)] [background-size:20px_20px] pointer-events-none"></div>
                    {error ? (
                        <div className="flex flex-col items-center justify-center text-red-500 gap-2">
                            <AlertTriangle size={40} />
                            <p className="font-medium text-center">{error}</p>
                            {passwordError && <button onClick={() => window.location.reload()} className="text-blue-400 text-sm underline">Tentar Novamente</button>}
                        </div>
                    ) : (
                        <div
                            ref={containerRef}
                            className="relative shadow-2xl cursor-crosshair select-none"
                            onClick={handleClick}
                        >
                            <Document
                                file={pdfFile}
                                onLoadSuccess={onDocumentLoadSuccess}
                                onLoadError={onDocumentLoadError}
                                onPassword={onPassword}
                                loading={<div className="text-blue-500 font-bold p-10 flex items-center"><Loader2 className="animate-spin mr-2" /> Carregando Motor PDF...</div>}
                            >
                                <Page
                                    pageNumber={1}
                                    onLoadSuccess={onPageLoadSuccess}
                                    renderTextLayer={false}
                                    renderAnnotationLayer={false}
                                    width={Math.min(window.innerWidth - 80, 650)}
                                />
                            </Document>
                            {isLoaded && (
                                <div
                                    ref={nodeRef}
                                    onMouseDown={handleMouseDown}
                                    style={{
                                        position: 'absolute',
                                        left: position.x,
                                        top: position.y,
                                        cursor: isDragging ? 'grabbing' : 'grab',
                                        transition: isDragging ? 'none' : 'left 0.1s ease-out, top 0.1s ease-out'
                                    }}
                                    className="z-10 w-20 h-20 border-2 border-blue-500 bg-white p-1 shadow-lg shadow-blue-500/30"
                                >
                                    <img src={qrCodeDataUrl} alt="QR" className="w-full h-full object-contain pointer-events-none" />
                                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[9px] px-2 py-0.5 rounded-full whitespace-nowrap pointer-events-none">
                                        {isDragging ? 'Soltando...' : 'Arraste-me'}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
                {/* Help text */}
                <div className="p-3 border-t border-white/5 bg-[#1a1a1e] rounded-b-2xl">
                    <p className="text-zinc-500 text-xs text-center flex items-center justify-center gap-2">
                        <Info size={12} />
                        Arraste o QR Code ou clique em qualquer lugar do PDF para posicioná-lo
                    </p>
                </div>
            </div>
        </div>
    );
}

export function PdfVisualEditor(props) {
    if (typeof document === 'undefined') return null;

    const handleSave = (coords) => {
        if (!coords || isNaN(coords.x) || isNaN(coords.y)) {
            console.error("Coordenadas inválidas detectadas:", coords);
            return;
        }
        props.onSave(coords);
    };

    return createPortal(
        <ErrorBoundary>
            <PdfVisualEditorContent {...props} onSave={handleSave} />
        </ErrorBoundary>,
        document.body
    );
}
