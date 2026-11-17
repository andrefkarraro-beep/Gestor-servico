async function enviarDiretoWhatsApp(tipo) {
    fecharModalWhatsApp();
    if (typeof itensOrcamento !== 'undefined' && itensOrcamento.length === 0) return alert("Adicione itens ao documento.");
    
    const nome = document.getElementById('cli-nome') ? document.getElementById('cli-nome').value || "Cliente" : "Cliente";
    const fone = document.getElementById('cli-fone') ? document.getElementById('cli-fone').value.replace(/\D/g, '') : '';
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
            
            alert("Imagem salva no celular! O WhatsApp será aberto para você anexá-la na conversa.");
            setTimeout(() => {
                const urlWpp = fone ? `https://api.whatsapp.com/send?phone=${fone}` : `https://api.whatsapp.com/send`;
                window.open(urlWpp, '_blank');
            }, 600);
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

            pdf.save(`Documento_${nome.replace(/\s+/g, '_')}.pdf`);
            
            alert("PDF salvo em Downloads! O WhatsApp será aberto para você anexar o documento.");
            setTimeout(() => {
                const urlWpp = fone ? `https://api.whatsapp.com/send?phone=${fone}` : `https://api.whatsapp.com/send`;
                window.open(urlWpp, '_blank');
            }, 600);
        }
    } catch (error) {
        if (container.parentNode) document.body.removeChild(container);
        console.error("Erro no envio:", error);
        alert("Ocorreu um erro ao processar o arquivo.");
    }
}
