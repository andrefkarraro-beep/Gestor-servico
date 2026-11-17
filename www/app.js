// 1. CRIAR ELEMENTO DO DOCUMENTO CORRIGIDO E BLINDADO
function criarElementoDocumentoParaRender() {
    const nomeCliente = document.getElementById('cli-nome') ? document.getElementById('cli-nome').value : "Cliente";
    const foneCliente = document.getElementById('cli-fone') ? document.getElementById('cli-fone').value : "";
    const endCliente = document.getElementById('cli-endereco') ? document.getElementById('cli-endereco').value : "";
    const tipoDoc = document.getElementById('doc-tipo') ? document.getElementById('doc-tipo').value : "ORÇAMENTO";
    
    const empNome = localStorage.getItem('emp_nome') || "Gestor de Serviços";
    const empDoc = localStorage.getItem('emp_doc') || "";
    const empFone = localStorage.getItem('emp_fone') || "";
    const linkQr = localStorage.getItem('emp_link_qr') || "";
    const formaPagto = document.getElementById('pagamento-forma') ? document.getElementById('pagamento-forma').value : "Pix";

    let subtotal = 0;
    let htmlItens = '';
    if (typeof itensOrcamento !== 'undefined') {
        itensOrcamento.forEach(i => {
            let sub = i.qtd * i.valor;
            subtotal += sub;
            htmlItens += `<tr><td style="padding: 8px; border-bottom: 1px solid #ddd;">${i.desc}</td><td style="padding: 8px; border-bottom: 1px solid #ddd; text-align:center;">${i.qtd}</td><td style="padding: 8px; border-bottom: 1px solid #ddd; text-align:right;">R$ ${i.valor.toFixed(2)}</td><td style="padding: 8px; border-bottom: 1px solid #ddd; text-align:right;">R$ ${sub.toFixed(2)}</td></tr>`;
        });
    }

    const descTipoEl = document.getElementById('desc-tipo');
    const descValInputEl = document.getElementById('desc-valor');
    const descTipo = descTipoEl ? descTipoEl.value : 'rs';
    const descValInput = descValInputEl ? parseFloat(descValInputEl.value) || 0 : 0;
    
    let descCalc = descTipo === 'rs' ? descValInput : (subtotal * descValInput) / 100;
    let totalFinal = subtotal - descCalc;
    if (totalFinal < 0) totalFinal = 0;

    let assinaturaTecnicoImg = (typeof canvasAssinatura !== 'undefined' && canvasAssinatura) ? canvasAssinatura.toDataURL('image/png') : '';
    let logoBase64 = localStorage.getItem('gestor_logo_b64') || '';
    let logoHtml = logoBase64 ? `<img src="${logoBase64}" style="max-height: 50px; max-width: 120px; float: right; object-fit: contain;">` : '';
    
    let dataDocEl = document.getElementById('cli-data');
    let dataDoc = dataDocEl ? dataDocEl.value : new Date().toLocaleDateString();

    const containerDoc = document.createElement('div');
    containerDoc.style.position = 'fixed';
    containerDoc.style.top = '-9999px';
    containerDoc.style.left = '-9999px';
    containerDoc.style.width = '600px';
    containerDoc.style.backgroundColor = '#ffffff';
    containerDoc.style.color = '#111111';
    containerDoc.style.padding = '24px';
    containerDoc.style.zIndex = '99999';

    containerDoc.innerHTML = `
        <div style="font-family: Arial, sans-serif;">
            ${logoHtml}
            <h2 style="color: #d97706; margin: 0 0 4px 0; font-size: 18px;">${empNome}</h2>
            <p style="font-size: 11px; color: #555; margin: 0;">CNPJ/CPF: ${empDoc} | Fone: ${empFone}</p>
            <hr style="border: 1px solid #d97706; margin: 10px 0;">
            <div style="background: #f3f4f6; padding: 8px; border-radius: 6px; display: flex; justify-content: space-between;">
                <h3 style="margin: 0; font-size: 14px; color: #1e293b;">${tipoDoc}</h3>
                <span style="font-size: 11px;">Data: ${dataDoc}</span>
            </div>
            <div style="margin: 10px 0; font-size: 12px; background: #fafafa; padding: 8px; border-radius: 6px; border: 1px solid #eee;">
                <p style="margin: 2px 0;"><strong>Cliente:</strong> ${nomeCliente}</p>
                <p style="margin: 2px 0;"><strong>Fone:</strong> ${foneCliente}</p>
                <p style="margin: 2px 0;"><strong>Endereço:</strong> ${endCliente}</p>
            </div>
            <table style="width: 100%; border-collapse: collapse; font-size: 11px; margin-top: 10px;">
                <thead><tr style="background: #e5e7eb;"><th style="padding: 6px; text-align:left;">Descrição</th><th style="padding: 6px; text-align:center;">Qtd</th><th style="padding: 6px; text-align:right;">Unit.</th><th style="padding: 6px; text-align:right;">Total</th></tr></thead>
                <tbody>${htmlItens}</tbody>
            </table>
            <div style="margin-top: 15px; text-align: right; font-size: 12px;">
                <p style="margin: 2px 0;">Subtotal: R$ ${subtotal.toFixed(2)}</p>
                <p style="margin: 2px 0; color: #dc2626;">Desconto: - R$ ${descCalc.toFixed(2)}</p>
                <h3 style="margin: 5px 0; color: #1e293b; font-size: 14px;">TOTAL: R$ ${totalFinal.toFixed(2)}</h3>
                <p style="margin: 5px 0; font-size: 11px;">Pagamento: <strong>${formaPagto}</strong></p>
            </div>
            <div style="margin-top: 30px; display: flex; justify-content: space-between;">
                <div style="text-align: center; width: 45%;"><div style="height: 35px;"><img src="${assinaturaTecnicoImg}" style="max-height: 35px; max-width: 140px;"></div><div style="border-top: 1px solid #333; padding-top: 4px;"><p style="font-size: 10px; margin: 0; font-weight: bold;">Assinatura do Técnico</p></div></div>
                <div style="text-align: center; width: 45%;"><div style="height: 35px;"></div><div style="border-top: 1px solid #333; padding-top: 4px;"><p style="font-size: 10px; margin: 0; font-weight: bold;">Assinatura do Cliente</p></div></div>
            </div>
        </div>
    `;
    return containerDoc;
}

// 2. SALVAR OU ENVIAR ARQUIVO DE FORMA SEGURA
async function enviarDiretoWhatsApp(tipo) {
    fecharModalWhatsApp();
    if (typeof itensOrcamento !== 'undefined' && itensOrcamento.length === 0) return alert("Adicione itens ao documento.");
    
    const nomeEl = document.getElementById('cli-nome');
    const foneEl = document.getElementById('cli-fone');
    const nome = nomeEl ? nomeEl.value || "Cliente" : "Cliente";
    const fone = foneEl ? foneEl.value.replace(/\D/g, '') : '';
    
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
            
            alert("Imagem salva nos downloads! O WhatsApp será aberto para você anexá-la.");
            setTimeout(() => {
                const urlWpp = fone ? `https://api.whatsapp.com/send?phone=${fone}` : `https://api.whatsapp.com/send`;
                window.open(urlWpp, '_blank');
            }, 800);
        } else {
            if (!window.jspdf || !window.jspdf.jsPDF) {
                alert("Biblioteca de PDF não carregada. Verifique sua conexão.");
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
            
            alert("PDF salvo na pasta Downloads! O WhatsApp será aberto para você anexá-lo.");
            setTimeout(() => {
                const urlWpp = fone ? `https://api.whatsapp.com/send?phone=${fone}` : `https://api.whatsapp.com/send`;
                window.open(urlWpp, '_blank');
            }, 800);
        }
    } catch (error) {
        if (container.parentNode) document.body.removeChild(container);
        console.error("Erro no processamento:", error);
        alert("Ocorreu um erro ao gerar o arquivo para envio.");
    }
}
