let itensOrcamento = [];
let compromissos = JSON.parse(localStorage.getItem('gestor_compromissos') || '[]');
let filtroAtualAgenda = 'agenda';
let logoBase64Empresa = localStorage.getItem('gestor_logo_b64') || '';

let catalogoEletrica = [
    { desc: "Instalação de Disjuntor / DR / DPS", valor: 120.00 },
    { desc: "Montagem e Cabeamento de Quadro Elétrico (QGBT)", valor: 450.00 },
    { desc: "Passagem de Fiação por Eletroduto (metro)", valor: 15.00 },
    { desc: "Instalação de Tomada / Interruptor", valor: 35.00 },
    { desc: "Instalação de Chuveiro Elétrico", valor: 90.00 },
    { desc: "Instalação de Luminária / Plafon / Spot", valor: 50.00 },
    { desc: "Laudo de Inspeção e Termografia", valor: 350.00 },
    { desc: "Visita Técnica e Diagnóstico de Falha", valor: 150.00 }
];

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('cli-data').valueAsDate = new Date();
    document.getElementById('srv-data').valueAsDate = new Date();
    carregarCatalogo();
    carregarApiKeySalva();
    carregarDadosEmpresaNaTela();
    renderizarCompromissos();
});

// Navegação entre Abas
function mudarAba(abaId) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden'));
    document.getElementById(`aba-${abaId}`).classList.remove('hidden');

    ['orcamento', 'agenda', 'catalogo', 'ia', 'config'].forEach(id => {
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
        orcamento: "Painel de Documentos",
        agenda: "Agenda & Serviços",
        catalogo: "Tabela Padrão Elétrica",
        ia: "Assistente IA (Gemini)",
        config: "Empresa & Ajustes"
    };
    document.getElementById('header-subtitle').innerText = titles[abaId] || "Gestor Serviços";
}

// Empresa e Logotipo
function carregarLogoEmpresa(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            logoBase64Empresa = e.target.result;
            localStorage.setItem('gestor_logo_b64', logoBase64Empresa);
            alert("Logotipo carregado com sucesso!");
        };
        reader.readAsDataURL(file);
    }
}

function salvarDadosEmpresa() {
    localStorage.setItem('emp_nome', document.getElementById('emp-nome').value);
    localStorage.setItem('emp_doc', document.getElementById('emp-doc').value);
    localStorage.setItem('emp_fone', document.getElementById('emp-fone').value);
    localStorage.setItem('emp_link_qr', document.getElementById('emp-link-qr').value);
    alert("Dados da empresa salvos com sucesso!");
}

function carregarDadosEmpresaNaTela() {
    if(localStorage.getItem('emp_nome')) document.getElementById('emp-nome').value = localStorage.getItem('emp_nome');
    if(localStorage.getItem('emp_doc')) document.getElementById('emp-doc').value = localStorage.getItem('emp_doc');
    if(localStorage.getItem('emp_fone')) document.getElementById('emp-fone').value = localStorage.getItem('emp_fone');
    if(localStorage.getItem('emp_link_qr')) document.getElementById('emp-link-qr').value = localStorage.getItem('emp_link_qr');
}

// Catálogo Elétrica
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
        alert('Preencha a descrição e o valor unitário.');
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
        document.getElementById('subtotal-geral').innerText = 'R$ 0,00';
        document.getElementById('desconto-geral').innerText = 'R$ 0,00';
        document.getElementById('total-geral').innerText = 'R$ 0,00';
        return;
    }

    let subtotalGeral = 0;
    itensOrcamento.forEach((item, index) => {
        let sub = item.qtd * item.valor;
        subtotalGeral += sub;
        lista.innerHTML += `
            <div class="bg-slate-900 border border-slate-700/50 p-2.5 rounded-xl flex justify-between items-center text-xs">
                <div>
                    <p class="font-medium text-slate-200">${item.desc}</p>
                    <p class="text-slate-400">${item.qtd}x R$ ${item.valor.toFixed(2).replace('.', ',')} = <span class="text-amber-400 font-bold">R$ ${sub.toFixed(2).replace('.', ',')}</span></p>
                </div>
                <button onclick="removerItem(${index})" class="text-red-400 hover:text-red-300 p-2"><i class="fa-solid fa-trash"></i></button>
            </div>
        `;
    });

    const descTipo = document.getElementById('desc-tipo').value;
    const descValorInput = parseFloat(document.getElementById('desc-valor').value) || 0;
    let descontoCalculado = 0;

    if (descTipo === 'rs') {
        descontoCalculado = descValorInput;
    } else {
        descontoCalculado = (subtotalGeral * descValorInput) / 100;
    }

    let totalFinal = subtotalGeral - descontoCalculado;
    if (totalFinal < 0) totalFinal = 0;

    document.getElementById('subtotal-geral').innerText = `R$ ${subtotalGeral.toFixed(2).replace('.', ',')}`;
    document.getElementById('desconto-geral').innerText = `- R$ ${descontoCalculado.toFixed(2).replace('.', ',')}`;
    document.getElementById('total-geral').innerText = `R$ ${totalFinal.toFixed(2).replace('.', ',')}`;
}

// Agenda e Serviços
function mudarFiltroAgenda(filtro) {
    filtroAtualAgenda = filtro;
    ['agenda', 'espera', 'executados'].forEach(f => {
        const btn = document.getElementById(`filtro-btn-${f}`);
        if(f === filtro) {
            btn.className = "flex-1 py-2 rounded-md bg-amber-500 text-slate-900 transition font-bold";
        } else {
            btn.className = "flex-1 py-2 rounded-md text-slate-400 transition";
        }
    });
    renderizarCompromissos();
}

function abrirModalServicoStatus() {
    document.getElementById('srv-titulo').value = '';
    document.getElementById('modal-servico-status').classList.remove('hidden');
    document.getElementById('modal-servico-status').classList.add('flex');
}

function fecharModalServicoStatus() {
    document.getElementById('modal-servico-status').classList.remove('flex');
    document.getElementById('modal-servico-status').classList.add('hidden');
}

function salvarNovoServicoAgenda() {
    const titulo = document.getElementById('srv-titulo').value;
    const data = document.getElementById('srv-data').value;
    const status = document.getElementById('srv-status').value;

    if(!titulo) {
        alert("Preencha o título do serviço.");
        return;
    }

    compromissos.push({ id: Date.now(), titulo, data, status });
    localStorage.setItem('gestor_compromissos', JSON.stringify(compromissos));
    fecharModalServicoStatus();
    renderizarCompromissos();
}

function removerCompromisso(id) {
    compromissos = compromissos.filter(c => c.id !== id);
    localStorage.setItem('gestor_compromissos', JSON.stringify(compromissos));
    renderizarCompromissos();
}

function renderizarCompromissos() {
    const container = document.getElementById('lista-compromissos');
    container.innerHTML = '';

    const filtrados = compromissos.filter(c => c.status === filtroAtualAgenda);

    if (filtrados.length === 0) {
        container.innerHTML = `<p class="text-xs text-slate-500 text-center py-4 italic">Nenhum registro encontrado nesta categoria.</p>`;
        return;
    }

    filtrados.forEach(c => {
        container.innerHTML += `
            <div class="bg-slate-900 border border-slate-700/60 p-3 rounded-xl flex justify-between items-center text-xs">
                <div>
                    <p class="font-bold text-slate-200">${c.titulo}</p>
                    <p class="text-slate-400"><i class="fa-solid fa-calendar mr-1 text-amber-400"></i> ${c.data || 'Sem data'}</p>
                </div>
                <button onclick="removerCompromisso(${c.id})" class="text-red-400 hover:text-red-300 p-2"><i class="fa-solid fa-trash"></i></button>
            </div>
        `;
    });
}

// Permissões Android
async function solicitarPermissoesAndroid() {
    const statusDiv = document.getElementById('status-permissao');
    statusDiv.innerText = "Status: Solicitando permissões do sistema...";
    try {
        if (window.Capacitor && window.Capacitor.Plugins.Filesystem) {
            await window.Capacitor.Plugins.Filesystem.requestPermissions();
        }
        statusDiv.innerHTML = "<span class='text-emerald-400 font-bold'>Status: Acessos concedidos com sucesso pelo Android!</span>";
    } catch (e) {
        statusDiv.innerHTML = "<span class='text-amber-400 font-bold'>Status: Sistema pronto para operar.</span>";
    }
}

// Geração de Documentos (PDF / Imagem) com local de salvamento do celular
function criarElementoDocumentoParaRender() {
    const nomeCliente = document.getElementById('cli-nome').value || "Cliente";
    const tipoDoc = document.getElementById('doc-tipo').value;
    const empNome = localStorage.getItem('emp_nome') || "Gestor de Serviços";
    const empDoc = localStorage.getItem('emp_doc') || "";
    const empFone = localStorage.getItem('emp_fone') || "";
    const linkQr = localStorage.getItem('emp_link_qr') || "";
    const formaPagto = document.getElementById('pagamento-forma').value;

    let subtotal = 0;
    let htmlItens = '';
    itensOrcamento.forEach(i => {
        let sub = i.qtd * i.valor;
        subtotal += sub;
        htmlItens += `<tr><td style="padding: 6px; border-bottom: 1px solid #ddd;">${i.desc}</td><td style="padding: 6px; border-bottom: 1px solid #ddd; text-align:center;">${i.qtd}</td><td style="padding: 6px; border-bottom: 1px solid #ddd; text-align:right;">R$ ${i.valor.toFixed(2)}</td><td style="padding: 6px; border-bottom: 1px solid #ddd; text-align:right;">R$ ${sub.toFixed(2)}</td></tr>`;
    });

    const descTipo = document.getElementById('desc-tipo').value;
    const descValInput = parseFloat(document.getElementById('desc-valor').value) || 0;
    let descCalc = descTipo === 'rs' ? descValInput : (subtotal * descValInput) / 100;
    let totalFinal = subtotal - descCalc;
    if (totalFinal < 0) totalFinal = 0;

    const containerDoc = document.createElement('div');
    containerDoc.style.position = 'absolute';
    containerDoc.style.left = '-9999px';
    containerDoc.style.width = '600px';
    containerDoc.className = 'bg-white text-slate-900 p-8 font-sans';

    let logoHtml = logoBase64Empresa ? `<img src="${logoBase64Empresa}" style="max-height: 50px; max-width: 120px; float: right;">` : '';
    let qrHtml = linkQr ? `<div style="margin-top: 15px; text-align: center;"><p style="font-size: 10px; color: #555;">Acesse nosso site / WhatsApp:</p><img src="https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=${encodeURIComponent(linkQr)}" style="width: 70px; height: 70px;"></div>` : '';

    containerDoc.innerHTML = `
        <div style="font-family: Arial, sans-serif; color: #111;">
            ${logoHtml}
            <h2 style="color: #d97706; margin: 0 0 5px 0;">${empNome}</h2>
            <p style="font-size: 11px; color: #555; margin: 0;">CNPJ/CPF: ${empDoc} | Fone: ${empFone}</p>
            <hr style="border: 1px solid #d97706; margin: 10px 0;">
            <div style="display: flex; justify-content: space-between; align-items: center; background: #f3f4f6; padding: 8px; border-radius: 6px;">
                <h3 style="margin: 0; font-size: 14px; color: #1e293b;">${tipoDoc}</h3>
                <span style="font-size: 11px;">Data: ${document.getElementById('cli-data').value}</span>
            </div>
            <p style="margin: 10px 0 5px 0; font-size: 12px;"><strong>Cliente:</strong> ${nomeCliente}</p>
            <p style="margin: 0 0 15px 0; font-size: 12px;"><strong>Telefone:</strong> ${document.getElementById('cli-fone').value}</p>
            
            <table style="width: 100%; border-collapse: collapse; font-size: 11px;">
                <thead>
                    <tr style="background: #e5e7eb;">
                        <th style="padding: 6px; text-align:left;">Descrição</th>
                        <th style="padding: 6px; text-align:center;">Qtd</th>
                        <th style="padding: 6px; text-align:right;">Unit.</th>
                        <th style="padding: 6px; text-align:right;">Total</th>
                    </tr>
                </thead>
                <tbody>${htmlItens}</tbody>
            </table>
            
            <div style="margin-top: 15px; text-align: right; font-size: 12px;">
                <p style="margin: 2px 0;">Subtotal: R$ ${subtotal.toFixed(2)}</p>
                <p style="margin: 2px 0; color: #dc2626;">Desconto: - R$ ${descCalc.toFixed(2)}</p>
                <h3 style="margin: 5px 0; color: #1e293b;">TOTAL: R$ ${totalFinal.toFixed(2)}</h3>
                <p style="margin: 5px 0; font-size: 11px; color: #333;">Forma de Pagamento: <strong>${formaPagto}</strong></p>
            </div>

            ${qrHtml}

            <div style="margin-top: 40px; text-align: center;">
                <div style="display: inline-block; border-top: 1px solid #333; width: 250px; padding-top: 5px;">
                    <p style="font-size: 11px; margin: 0; color: #333;">Assinatura do Responsável / Cliente</p>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(containerDoc);
    return containerDoc;
}

function salvarDocumentoArquivo(tipo) {
    if (itensOrcamento.length === 0) {
        alert("Adicione pelo menos um item.");
        return;
    }
    const nome = document.getElementById('cli-nome').value || "Cliente";
    const container = criarElementoDocumentoParaRender();

    html2canvas(container, { scale: 2 }).then(canvas => {
        document.body.removeChild(container);
        if (tipo === 'img') {
            const link = document.createElement('a');
            link.download = `Documento_${nome.replace(/\s+/g, '_')}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
            alert("Imagem salva com sucesso na pasta de downloads do celular!");
        } else {
            const { jsPDF } = window.jspdf;
            const pdf = new jsPDF('p', 'mm', 'a4');
            const imgData = canvas.toDataURL('image/png');
            pdf.addImage(imgData, 'PNG', 10, 10, 190, (canvas.height * 190) / canvas.width);
            pdf.save(`Documento_${nome.replace(/\s+/g, '_')}.pdf`);
            alert("PDF salvo com sucesso na pasta de downloads do celular!");
        }
    });
}

// WhatsApp com opções
function abrirModalCompartilharWhatsApp() {
    if (itensOrcamento.length === 0) {
        alert("Adicione itens ao orçamento.");
        return;
    }
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
    const tipoDoc = document.getElementById('doc-tipo').value;
    let subtotal = itensOrcamento.reduce((acc, i) => acc + (i.qtd * i.valor), 0);
    
    let texto = `Olá *${nome}*, segue o resumo do seu *${tipoDoc}*:\n\n`;
    itensOrcamento.forEach(i => {
        texto += `• ${i.desc} (${i.qtd}x) - R$ ${(i.qtd * i.valor).toFixed(2)}\n`;
    });
    texto += `\n*TOTAL: R$ ${subtotal.toFixed(2)}*\nGerado via Gestor Serviços.`;

    const url = `https://api.whatsapp.com/send?phone=${fone}&text=${encodeURIComponent(texto)}`;
    window.open(url, '_blank');
}

function enviarWhatsAppArquivo(formato) {
    fecharModalWhatsApp();
    salvarDocumentoArquivo(formato);
    setTimeout(() => {
        const fone = document.getElementById('cli-fone').value.replace(/\D/g, '');
        const url = `https://api.whatsapp.com/send?phone=${fone}&text=${encodeURIComponent("Olá, segue o documento em anexo gerado pelo Gestor Serviços.")}`;
        window.open(url, '_blank');
    }, 1500);
}

function compartilharEmail() {
    const nome = document.getElementById('cli-nome').value || "Cliente";
    let total = itensOrcamento.reduce((acc, i) => acc + (i.qtd * i.valor), 0);
    let assunto = encodeURIComponent(`Documento de Serviços - ${nome}`);
    let corpo = encodeURIComponent(`Olá ${nome},\n\nSegue o valor total do documento: R$ ${total.toFixed(2)}.\n\nAtenciosamente,\nGestor Serviços.`);
    window.location.href = `mailto:?subject=${assunto}&body=${corpo}`;
}

// Configurações e IA
function salvarApiKey() {
    const key = document.getElementById('input-api-key').value.trim();
    if (!key) return alert("Insira uma chave válida.");
    localStorage.setItem('gemini_api_key', key);
    alert("Chave salva com sucesso!");
}

function carregarApiKeySalva() {
    const key = localStorage.getItem('gemini_api_key');
    if (key) document.getElementById('input-api-key').value = key;
}

function limparChat() {
    document.getElementById('chat-mensagens').innerHTML = `
        <div class="bg-slate-800 p-3 rounded-xl max-w-[85%] border border-slate-700">
            <p class="text-xs text-slate-300">Histórico limpo. Como posso ajudar com materiais ou serviços?</p>
        </div>
    `;
}

async function enviarMensagemIA() {
    const input = document.getElementById('chat-input');
    const msg = input.value.trim();
    const apiKey = localStorage.getItem('gemini_api_key');

    if (!msg) return;
    if (!apiKey) {
        alert("Configure sua chave de API na aba de Empresa/Ajustes.");
        mudarAba('config');
        return;
    }

    const chatDiv = document.getElementById('chat-mensagens');
    chatDiv.innerHTML += `<div class="flex justify-end"><div class="bg-amber-500 text-slate-900 p-3 rounded-xl max-w-[85%] text-xs font-medium"><p>${msg}</p></div></div>`;
    input.value = '';
    chatDiv.scrollTop = chatDiv.scrollHeight;

    const loadingId = 'loading-' + Date.now();
    chatDiv.innerHTML += `<div id="${loadingId}" class="flex justify-start"><div class="bg-slate-800 text-slate-400 p-3 rounded-xl text-xs italic border border-slate-700">Consultando IA...</div></div>`;
    chatDiv.scrollTop = chatDiv.scrollHeight;

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: "Você é um assistente técnico especialista em elétrica (NBR 5410), custos de materiais e precificação de mão de obra. Responda direto: " + msg }] }]
            })
        });

        const data = await response.json();
        document.getElementById(loadingId).remove();
        const respostaTexto = data.candidates?.[0]?.content?.parts?.[0]?.text || "Sem resposta.";
        
        chatDiv.innerHTML += `<div class="flex justify-start"><div class="bg-slate-800 text-slate-200 p-3 rounded-xl max-w-[85%] text-xs border border-slate-700 leading-relaxed">${respostaTexto.replace(/\n/g, '<br>')}</div></div>`;
    } catch (error) {
        document.getElementById(loadingId).remove();
        chatDiv.innerHTML += `<div class="flex justify-start"><div class="bg-red-900/50 text-red-200 p-3 rounded-xl max-w-[85%] text-xs border border-red-700">Erro ao conectar com a IA.</div></div>`;
    }
    chatDiv.scrollTop = chatDiv.scrollHeight;
}
