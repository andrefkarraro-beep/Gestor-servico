// Estado Global do Aplicativo
let itensOrcamento = [];
let catalogoEletrica = [
    { desc: "Instalação de Disjuntor / DR / DPS", valor: 120.00 },
    { desc: "Montagem e Cabeamento de Quadro Elétrico (QGBT)", valor: 450.00 },
    { desc: "Passagem de Fiação por Eletroduto (metro)", valor: 15.00 },
    { desc: "Instalação de Tomada / Interruptor", valor: 35.00 },
    { desc: "Instalação de Chuveiro Elétrico", valor: 90.00 },
    { desc: "Instalação de Luminária / Plafon / Spot", valor: 50.00 },
    { desc: "Laudo de Inspeção e Termografia Básica", href: "#", valor: 350.00 },
    { desc: "Visita Técnica e Diagnóstico de Falha", valor: 150.00 }
];

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('cli-data').valueAsDate = new Date();
    carregarCatalogo();
    carregarApiKeySalva();
});

// Navegação entre Abas
function mudarAba(abaId) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden'));
    document.getElementById(`aba-${abaId}`).classList.remove('hidden');

    ['orcamento', 'catalogo', 'ia', 'config'].forEach(id => {
        const btn = document.getElementById(`nav-btn-${id}`);
        if(btn) {
            btn.classList.remove('text-amber-400');
            btn.classList.add('text-slate-400');
        }
    });

    const ativoBtn = document.getElementById(`nav-btn-${abaId}`);
    if(ativoBtn) {
        ativoBtn.classList.remove('text-slate-400');
        ativoBtn.classList.add('text-amber-400');
    }

    const titles = {
        orcamento: "Painel de Orçamentos",
        catalogo: "Tabela Padrão Elétrica",
        ia: "Assistente IA (Gemini)",
        config: "Configurações e Permissões"
    };
    document.getElementById('header-subtitle').innerText = titles[abaId] || "Gestor Serviços";
}

// Catálogo de Elétrica
function carregarCatalogo() {
    const container = document.getElementById('catalogo-padrao');
    container.innerHTML = '';
    catalogoEletrica.forEach((item, index) => {
        container.innerHTML += `
            <div onclick="adicionarDoCatalogo(${index})" class="bg-slate-900 border border-slate-700/60 p-3 rounded-xl flex justify-between items-center active:border-amber-500 transition cursor-pointer">
                <div>
                    <p class="text-sm font-medium text-slate-200">${item.desc}</p>
                    <p class="text-xs text-amber-400 font-bold">R$ ${item.valor.toFixed(2).replace('.', ',')}</p>
                </div>
                <button class="bg-slate-800 text-amber-400 p-2 rounded-lg text-xs"><i class="fa-solid fa-plus"></i></button>
            </div>
        `;
    });
}

function adicionarDoCatalogo(index) {
    const item = catalogoEletrica[index];
    itensOrcamento.push({ desc: item.desc, qtd: 1, valor: item.valor });
    atualizarTabelaOrcamento();
    mudarAba('orcamento');
}

// Modal de Itens
function abrirModalItem() {
    document.getElementById('modal-desc').value = '';
    document.getElementById('modal-qtd').value = '1';
    document.getElementById('modal-valor').value = '';
    document.getElementById('modal-item').classList.remove('hidden');
    document.getElementById('modal-item').classList.add('flex');
}

function fecharModalItem() {
    document.getElementById('modal-item').classList.remove('flex');
    document.getElementById('modal-item').classList.add('hidden');
}

function adicionarItemOrcamento() {
    const desc = document.getElementById('modal-desc').value;
    const qtd = parseInt(document.getElementById('modal-qtd').value) || 1;
    const valor = parseFloat(document.getElementById('modal-valor').value) || 0;

    if (!desc || valor <= 0) {
        alert('Preencha a descrição e o valor unitário corretamente.');
        return;
    }

    itensOrcamento.push({ desc, qtd, valor });
    atualizarTabelaOrcamento();
    fecharModalItem();
}

function removerItem(index) {
    itensOrcamento.splice(index, 1);
    atualizarTabelaOrcamento();
}

function atualizarTabelaOrcamento() {
    const lista = document.getElementById('lista-itens');
    lista.innerHTML = '';

    if (itensOrcamento.length === 0) {
        lista.innerHTML = `<p class="text-xs text-slate-500 text-center py-4 italic">Nenhum item adicionado ainda.</p>`;
        document.getElementById('total-geral').innerText = 'R$ 0,00';
        return;
    }

    let totalGeral = 0;
    itensOrcamento.forEach((item, index) => {
        let subtotal = item.qtd * item.valor;
        totalGeral += subtotal;
        lista.innerHTML += `
            <div class="bg-slate-900 border border-slate-700/50 p-2.5 rounded-xl flex justify-between items-center text-xs">
                <div>
                    <p class="font-medium text-slate-200">${item.desc}</p>
                    <p class="text-slate-400">${item.qtd}x R$ ${item.valor.toFixed(2).replace('.', ',')} = <span class="text-amber-400 font-bold">R$ ${subtotal.toFixed(2).replace('.', ',')}</span></p>
                </div>
                <button onclick="removerItem(${index})" class="text-red-400 hover:text-red-300 p-2"><i class="fa-solid fa-trash"></i></button>
            </div>
        `;
    });

    document.getElementById('total-geral').innerText = `R$ ${totalGeral.toFixed(2).replace('.', ',')}`;
}

// Permissões Android Nativas
async function solicitarPermissoesAndroid() {
    const statusDiv = document.getElementById('status-permissao');
    statusDiv.innerText = "Status: Solicitando permissões do sistema...";
    try {
        if (window.Capacitor && window.Capacitor.Plugins.Filesystem) {
            await window.Capacitor.Plugins.Filesystem.requestPermissions();
        }
        statusDiv.innerHTML = "<span class='text-emerald-400 font-bold'>Status: Permissões concedidas com sucesso pelo Android!</span>";
    } catch (e) {
        statusDiv.innerHTML = "<span class='text-amber-400 font-bold'>Status: Sistema pronto para salvar arquivos (modo padrão).</span>";
    }
}

// Salvamento e Compartilhamento (PDF / Imagem / WhatsApp / E-mail)
function gerarDocumento(tipo) {
    const nome = document.getElementById('cli-nome').value || "Cliente";
    if (itensOrcamento.length === 0) {
        alert("Adicione pelo menos um item ao orçamento.");
        return;
    }

    // Criar elemento invisível para renderização limpa
    const containerDoc = document.createElement('div');
    containerDoc.style.position = 'absolute';
    containerDoc.style.left = '-9999px';
    containerDoc.style.width = '600px';
    containerDoc.className = 'bg-white text-slate-900 p-8 font-sans';
    
    let htmlItens = '';
    let total = 0;
    itensOrcamento.forEach(i => {
        let sub = i.qtd * i.valor;
        total += sub;
        htmlItens += `<tr><td style="padding: 8px; border-bottom: 1px solid #ddd;">${i.desc}</td><td style="padding: 8px; border-bottom: 1px solid #ddd; text-align:center;">${i.qtd}</td><td style="padding: 8px; border-bottom: 1px solid #ddd; text-align:right;">R$ ${i.valor.toFixed(2)}</td><td style="padding: 8px; border-bottom: 1px solid #ddd; text-align:right;">R$ ${sub.toFixed(2)}</td></tr>`;
    });

    containerDoc.innerHTML = `
        <div style="font-family: Arial, sans-serif;">
            <h2 style="color: #d97706; margin-bottom: 5px;">GESTOR SERVIÇOS - ORÇAMENTO</h2>
            <p style="font-size: 12px; color: #555;">Data: ${document.getElementById('cli-data').value}</p>
            <hr style="border: 1px solid #d97706; margin: 15px 0;">
            <p><strong>Cliente:</strong> ${nome}</p>
            <p><strong>Telefone:</strong> ${document.getElementById('cli-fone').value}</p>
            <br>
            <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
                <thead>
                    <tr style="background: #f3f4f6;">
                        <th style="padding: 8px; text-align:left;">Descrição</th>
                        <th style="padding: 8px; text-align:center;">Qtd</th>
                        <th style="padding: 8px; text-align:right;">Unit.</th>
                        <th style="padding: 8px; text-align:right;">Total</th>
                    </tr>
                </thead>
                <tbody>${htmlItens}</tbody>
            </table>
            <br>
            <h3 style="text-align: right; color: #1e293b;">TOTAL: R$ ${total.toFixed(2)}</h3>
        </div>
    `;
    document.body.appendChild(containerDoc);

    html2canvas(containerDoc, { scale: 2 }).then(canvas => {
        document.body.removeChild(containerDoc);
        if (tipo === 'img') {
            const link = document.createElement('a');
            link.download = `Orcamento_${nome.replace(/\s+/g, '_')}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
            alert("Imagem salva com sucesso!");
        } else {
            const { jsPDF } = window.jspdf;
            const pdf = new jsPDF('p', 'mm', 'a4');
            const imgData = canvas.toDataURL('image/png');
            const imgWidth = 190;
            const pageHeight = 295;
            const imgHeight = (canvas.height * imgWidth) / canvas.width;
            pdf.addImage(imgData, 'PNG', 10, 10, imgWidth, imgHeight);
            pdf.save(`Orcamento_${nome.replace(/\s+/g, '_')}.pdf`);
            alert("PDF gerado e salvo com sucesso!");
        }
    });
}

function compartilharWhatsApp() {
    const fone = document.getElementById('cli-fone').value.replace(/\D/g, '');
    const nome = document.getElementById('cli-nome').value || "Cliente";
    let total = itensOrcamento.reduce((acc, i) => acc + (i.qtd * i.valor), 0);
    
    let texto = `Olá *${nome}*, segue o resumo do seu orçamento:\n\n`;
    itensOrcamento.forEach(i => {
        texto += `• ${i.desc} (${i.qtd}x) - R$ ${(i.qtd * i.valor).toFixed(2)}\n`;
    });
    texto += `\n*TOTAL: R$ ${total.toFixed(2)}*\n\nGerado via Gestor Serviços.`;

    const url = `https://api.whatsapp.com/send?phone=${fone}&text=${encodeURIComponent(texto)}`;
    window.open(url, '_blank');
}

function compartilharEmail() {
    const nome = document.getElementById('cli-nome').value || "Cliente";
    let total = itensOrcamento.reduce((acc, i) => acc + (i.qtd * i.valor), 0);
    let assunto = encodeURIComponent(`Orçamento de Serviços - ${nome}`);
    let corpo = encodeURIComponent(`Olá ${nome},\n\nSegue o valor total do orçamento: R$ ${total.toFixed(2)}.\n\nAtenciosamente,\nGestor Serviços.`);
    window.location.href = `mailto:?subject=${assunto}&body=${corpo}`;
}

// Configurações e IA Gemini
function salvarApiKey() {
    const key = document.getElementById('input-api-key').value.trim();
    if (!key) {
        alert("Insira uma chave válida.");
        return;
    }
    localStorage.setItem('gemini_api_key', key);
    alert("Chave salva com sucesso no dispositivo!");
}

function carregarApiKeySalva() {
    const key = localStorage.getItem('gemini_api_key');
    if (key) {
        document.getElementById('input-api-key').value = key;
    }
}

function limparChat() {
    document.getElementById('chat-mensagens').innerHTML = `
        <div class="bg-slate-800 p-3 rounded-xl max-w-[85%] border border-slate-700">
            <p class="text-xs text-slate-300">Histórico limpo. Como posso ajudar com materiais ou serviços hoje?</p>
        </div>
    `;
}

async function enviarMensagemIA() {
    const input = document.getElementById('chat-input');
    const msg = input.value.trim();
    const apiKey = localStorage.getItem('gemini_api_key');

    if (!msg) return;
    if (!apiKey) {
        alert("Por favor, configure sua chave de API do Gemini na aba de Ajustes antes de usar o chat.");
        mudarAba('config');
        return;
    }

    const chatDiv = document.getElementById('chat-mensagens');
    chatDiv.innerHTML += `
        <div class="flex justify-end">
            <div class="bg-amber-500 text-slate-900 p-3 rounded-xl max-w-[85%] text-xs font-medium">
                <p>${msg}</p>
            </div>
        </div>
    `;
    input.value = '';
    chatDiv.scrollTop = chatDiv.scrollHeight;

    // Loading
    const loadingId = 'loading-' + Date.now();
    chatDiv.innerHTML += `
        <div id="${loadingId}" class="flex justify-start">
            <div class="bg-slate-800 text-slate-400 p-3 rounded-xl text-xs italic border border-slate-700">
                Consultando IA...
            </div>
        </div>
    `;
    chatDiv.scrollTop = chatDiv.scrollHeight;

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{
                    parts: [{ text: "Você é um assistente técnico especialista em elétrica (NBR 5410), custos de materiais e precificação de mão de obra para eletricistas. Responda de forma direta e prática: " + msg }]
                }]
            })
        });

        const data = await response.json();
        document.getElementById(loadingId).remove();

        const respostaTexto = data.candidates?.[0]?.content?.parts?.[0]?.text || "Não foi possível obter resposta no momento.";
        
        chatDiv.innerHTML += `
            <div class="flex justify-start">
                <div class="bg-slate-800 text-slate-200 p-3 rounded-xl max-w-[85%] text-xs border border-slate-700 leading-relaxed">
                    ${respostaTexto.replace(/\n/g, '<br>')}
                </div>
            </div>
        `;
    } catch (error) {
        document.getElementById(loadingId).remove();
        chatDiv.innerHTML += `
            <div class="flex justify-start">
                <div class="bg-red-900/50 text-red-200 p-3 rounded-xl max-w-[85%] text-xs border border-red-700">
                    Erro ao conectar com a IA. Verifique sua conexão com a internet.
                </div>
            </div>
        `;
    }
    chatDiv.scrollTop = chatDiv.scrollHeight;
}
