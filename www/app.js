async function enviarDiretoWhatsApp(tipo) {
    fecharModalWhatsApp();
    if (typeof itensOrcamento !== 'undefined' && itensOrcamento.length === 0) return alert("Adicione itens ao documento.");
    
    const nome = document.getElementById('cli-nome') ? document.getElementById('cli-nome').value || "Cliente" : "Cliente";
    const container = criarElementoDocumentoParaRender();
    document.body.appendChild(container);

    try {
        const canvas = await html2canvas(container, { scale: 2, useCORS: true, logging: false });
        document.body.removeChild(container);

        if (tipo === 'img') {
            canvas.toBlob(async (blob) => {
                const arquivo = new File([blob], `Documento_${nome.replace(/\s+/g, '_')}.png`, { type: 'image/png' });
                
                // Dispara o compartilhamento direto nativo do sistema
                if (navigator.canShare && navigator.canShare({ files: [arquivo] })) {
                    try {
                        await navigator.share({
                            files: [arquivo],
                            title: 'Documento de Serviço',
                            text: `Olá ${nome}, segue a imagem do serviço realizado.`
                        });
                        return;
                    } catch (err) {
                        if (err.name !== 'AbortError') console.error("Erro no compartilhamento:", err);
                        return;
                    }
                }
                
                // Fallback se o navegador/sistema bloquear o compartilhamento direto de arquivos
                alert("O seu dispositivo não permitiu o envio direto. O arquivo será baixado.");
                const link = document.createElement('a');
                link.download = `Documento_${nome.replace(/\s+/g, '_')}.png`;
                link.href = canvas.toDataURL('image/png');
                link.click();
            }, 'image/png');
        } else {
            if (!window.jspdf || !window.jspdf.jsPDF) {
                alert("Biblioteca de PDF não carregada.");
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

            // Gera o Blob do PDF para envio direto
            const pdfBlob = pdf.output('blob');
            const arquivoPdf = new File([pdfBlob], `Documento_${nome.replace(/\s+/g, '_')}.pdf`, { type: 'application/pdf' });

            if (navigator.canShare && navigator.canShare({ files: [arquivoPdf] })) {
                try {
                    await navigator.share({
                        files: [arquivoPdf],
                        title: 'Orçamento / Nota de Serviço',
                        text: `Olá ${nome}, segue o documento em PDF referente ao atendimento.`
                    });
                    return;
                } catch (err) {
                    if (err.name !== 'AbortError') console.error("Erro no compartilhamento:", err);
                    return;
                }
            }

            // Fallback se o sistema bloquear
            alert("O seu dispositivo não permitiu o envio direto. O arquivo será baixado.");
            pdf.save(`Documento_${nome.replace(/\s+/g, '_')}.pdf`);
        }
    } catch (error) {
        if (container.parentNode) document.body.removeChild(container);
        console.error("Erro no envio direto:", error);
        alert("Ocorreu um erro ao processar o arquivo para envio.");
    }
}
