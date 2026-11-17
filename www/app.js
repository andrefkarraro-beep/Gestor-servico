// SALVAR DOCUMENTO (PDF / IMAGEM) COM SUPORTE MOBILE
function salvarDocumentoArquivo(tipo) {
    if (itensOrcamento.length === 0) return alert("Adicione itens ao documento.");
    const nome = document.getElementById('cli-nome').value || "Cliente";
    const container = criarElementoDocumentoParaRender();
    document.body.appendChild(container);

    html2canvas(container, { scale: 2, useCORS: true, logging: false }).then(canvas => {
        document.body.removeChild(container);
        
        if (tipo === 'img') {
            const link = document.createElement('a');
            link.download = `Documento_${nome.replace(/\s+/g, '_')}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
            alert("Imagem salva na galeria/downloads com sucesso!");
        } else {
            if (!window.jspdf || !window.jspdf.jsPDF) {
                alert("Erro: A biblioteca do PDF não carregou. Verifique sua conexão com a internet.");
                return;
            }

            const { jsPDF } = window.jspdf;
            const pdf = new jsPDF('p', 'mm', 'a4');
            const imgData = canvas.toDataURL('image/png');
            const imgWidth = 190;
            const pageHeight = 295;
            const imgHeight = (canvas.height * imgWidth) / canvas.width;
            
            let heightLeft = imgHeight;
            let position = 10;

            pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
            heightLeft -= pageHeight;

            while (heightLeft >= 0) {
                position = heightLeft - imgHeight;
                pdf.addPage();
                pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
                heightLeft -= pageHeight;
            }

            pdf.save(`Documento_${nome.replace(/\s+/g, '_')}.pdf`);
            alert("PDF gerado e salvo na pasta de Downloads!");
        }
    }).catch(error => {
        if (container.parentNode) document.body.removeChild(container);
        console.error("Erro ao gerar arquivo:", error);
        alert("Ocorreu um erro ao gerar o arquivo.");
    });
}

// COMPARTILHAR WHATSAPP COM ANEXO AUTOMATIZADO
function abrirModalCompartilharWhatsApp() {
    if (itensOrcamento.length === 0) return alert("Adicione itens ao documento.");
    document.getElementById('modal-whatsapp').classList.remove('hidden');
    document.getElementById('modal-whatsapp').classList.add('flex');
}

function fecharModalWhatsApp() {
    document.getElementById('modal-whatsapp').classList.remove('flex');
    document.getElementById('modal-whatsapp').classList.add('hidden');
}

function enviarWhatsAppTexto() {
    fecharModalWhatsApp();
    const fone = document.getElementById('cli-fone').value.replace(/\D/g, '');
    const nome = document.getElementById('cli-nome').value || "Cliente";
    let subtotal = itensOrcamento.reduce((acc, i) => acc + (i.qtd * i.valor), 0);
    
    let texto = `Olá *${nome}*, segue o resumo do seu atendimento:\n\n`;
    itensOrcamento.forEach(i => { 
        texto += `• ${i.desc} (${i.qtd}x) - R$ ${(i.qtd * i.valor).toFixed(2)}\n`; 
    });
    texto += `\n*TOTAL: R$ ${subtotal.toFixed(2)}*`;
    
    const url = fone ? `https://api.whatsapp.com/send?phone=${fone}&text=${encodeURIComponent(texto)}` : `https://api.whatsapp.com/send?text=${encodeURIComponent(texto)}`;
    window.open(url, '_blank');
}

async function enviarDiretoWhatsApp(tipo) {
    fecharModalWhatsApp();
    if (itensOrcamento.length === 0) return alert("Adicione itens ao documento.");
    
    const nome = document.getElementById('cli-nome').value || "Cliente";
    const fone = document.getElementById('cli-fone').value.replace(/\D/g, '');
    const container = criarElementoDocumentoParaRender();
    document.body.appendChild(container);

    try {
        const canvas = await html2canvas(container, { scale: 2, useCORS: true, logging: false });
        document.body.removeChild(container);

        if (tipo === 'img') {
            const link = document.createElement('a');
            link.download = `Documento_${nome.replace(/\s+/g, '_')}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
            
            alert("Imagem salva no aparelho! O WhatsApp será aberto para você anexá-la.");
            setTimeout(() => {
                const urlWpp = fone ? `https://api.whatsapp.com/send?phone=${fone}` : `https://api.whatsapp.com/send`;
                window.open(urlWpp, '_blank');
            }, 1000);
        } else {
            if (!window.jspdf || !window.jspdf.jsPDF) {
                alert("Biblioteca de PDF não carregada.");
                return;
            }

            const { jsPDF } = window.jspdf;
            const pdf = new jsPDF('p', 'mm', 'a4');
            const imgData = canvas.toDataURL('image/png');
            const imgWidth = 190;
            const imgHeight = (canvas.height * imgWidth) / canvas.width;
            
            pdf.addImage(imgData, 'PNG', 10, 10, imgWidth, imgHeight);
            pdf.save(`Documento_${nome.replace(/\s+/g, '_')}.pdf`);
            
            alert("PDF salvo na pasta de Downloads! O WhatsApp será aberto para você anexar o arquivo.");
            setTimeout(() => {
                const urlWpp = fone ? `https://api.whatsapp.com/send?phone=${fone}` : `https://api.whatsapp.com/send`;
                window.open(urlWpp, '_blank');
            }, 1000);
        }
    } catch (error) {
        if (container.parentNode) document.body.removeChild(container);
        console.error("Erro no envio:", error);
        alert("Ocorreu um erro ao processar o arquivo para envio.");
    }
}

// COMPARTILHAR POR E-MAIL BLINDADO
function compartilharEmail() {
    if (itensOrcamento.length === 0) return alert("Adicione itens ao documento.");
    const nome = document.getElementById('cli-nome').value || "Cliente";
    let subtotal = itensOrcamento.reduce((acc, i) => acc + (i.qtd * i.valor), 0);
    
    const assunto = encodeURIComponent(`Documento de Serviço - ${nome}`);
    const corpo = encodeURIComponent(`Olá ${nome},\n\nSegue o resumo do orçamento/serviço realizado.\nValor Total: R$ ${subtotal.toFixed(2)}.\n\nAtenciosamente.`);
    
    // Utiliza URI segura para abrir o aplicativo de e-mail padrão do celular
    const mailtoLink = `mailto:?subject=${assunto}&body=${corpo}`;
    window.location.href = mailtoLink;
}
