import React, { useState } from 'react';
import { HelpCircle, X } from 'lucide-react';

export function HelpTooltip({ title, content, position = 'top' }) {
    const [isOpen, setIsOpen] = useState(false);

    const positionClasses = {
        top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
        bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
        left: 'right-full top-1/2 -translate-y-1/2 mr-2',
        right: 'left-full top-1/2 -translate-y-1/2 ml-2'
    };

    const arrowClasses = {
        top: 'top-full left-1/2 -translate-x-1/2 border-t-zinc-800',
        bottom: 'bottom-full left-1/2 -translate-x-1/2 border-b-zinc-800',
        left: 'left-full top-1/2 -translate-y-1/2 border-l-zinc-800',
        right: 'right-full top-1/2 -translate-y-1/2 border-r-zinc-800'
    };

    return (
        <div className="relative inline-flex">
            <button
                onClick={() => setIsOpen(!isOpen)}
                onBlur={() => setTimeout(() => setIsOpen(false), 150)}
                className="p-1 rounded-full text-zinc-500 hover:text-[#c9a857] hover:bg-zinc-800/50 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#c9a857]/30"
                aria-label="Ajuda"
            >
                <HelpCircle size={16} />
            </button>

            {isOpen && (
                <div
                    className={`absolute z-50 ${positionClasses[position]} animate-fade-in`}
                    style={{ minWidth: '250px', maxWidth: '320px' }}
                >
                    <div className="bg-zinc-800 border border-zinc-700 rounded-lg shadow-xl p-4">
                        <div className="flex items-start justify-between gap-3 mb-2">
                            <h4 className="text-sm font-semibold text-[#c9a857]">{title}</h4>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="text-zinc-500 hover:text-white transition-colors"
                            >
                                <X size={14} />
                            </button>
                        </div>
                        <p className="text-xs text-zinc-400 leading-relaxed">{content}</p>
                    </div>
                    {/* Arrow */}
                    <div className={`absolute w-0 h-0 border-8 border-transparent ${arrowClasses[position]}`} />
                </div>
            )}
        </div>
    );
}

// Textos de ajuda para cada seção
export const HELP_TEXTS = {
    dashboard: {
        title: "Dashboard",
        content: "Visão geral do seu escritório. Aqui você vê estatísticas de processos ativos, membros da equipe e visualizações de clientes."
    },
    processosAtivos: {
        title: "Processos Ativos",
        content: "Número total de processos cadastrados no sistema que estão em andamento."
    },
    equipe: {
        title: "Equipe",
        content: "Total de membros cadastrados no seu escritório, incluindo administradores e colaboradores."
    },
    visualizacoes: {
        title: "Visualizações",
        content: "Quantidade de vezes que seus clientes acessaram os documentos compartilhados através dos links únicos."
    },
    novoProcesso: {
        title: "Novo Processo",
        content: "Cadastre um novo processo enviando o PDF do documento e um vídeo explicativo. Ao final, um link único será gerado para compartilhar com o cliente."
    },
    meusCasos: {
        title: "Meus Casos",
        content: "Lista de todos os processos cadastrados. Use a busca para encontrar processos específicos. Clique em um processo para ver detalhes ou copiar o link."
    },
    relatorios: {
        title: "Relatórios",
        content: "Análises e métricas de desempenho do escritório. Acompanhe tendências, visualizações por período e outros indicadores."
    },
    equipeAdmin: {
        title: "Gerenciar Equipe",
        content: "Adicione novos membros, promova colaboradores a administradores ou remova usuários. Administradores têm acesso total ao sistema."
    },
    configuracoes: {
        title: "Configurações",
        content: "Personalize a aparência do seu portal. Altere o nome da empresa, logotipo e imagem de fundo que os clientes verão."
    },
    uploadPdf: {
        title: "Upload de PDF",
        content: "Envie o documento do processo em formato PDF. Após o upload, você poderá posicionar o QR Code que direcionará o cliente para a página de visualização."
    },
    uploadVideo: {
        title: "Upload de Vídeo",
        content: "Envie um vídeo explicativo (MP4, WebM ou MOV) para ajudar o cliente a entender o documento. O vídeo aparecerá na página do cliente junto com o PDF."
    },
    posicaoQrCode: {
        title: "Posição do QR Code",
        content: "Clique e arraste para posicionar o QR Code no PDF. O cliente poderá escanear esse código para acessar a página de explicação."
    },
    copiarLink: {
        title: "Copiar Link",
        content: "Link único gerado para este processo. Compartilhe com o cliente via WhatsApp, e-mail ou qualquer outro meio."
    },
    darkMode: {
        title: "Modo Escuro/Claro",
        content: "Alterne entre o tema escuro e claro conforme sua preferência. A escolha é salva automaticamente."
    },
    linkCadastro: {
        title: "Link de Cadastro",
        content: "Este link permite que novos membros se cadastrem na sua equipe. Compartilhe apenas com pessoas de confiança."
    }
};
