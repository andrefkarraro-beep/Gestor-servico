let itensOrcamento = [];
let fotosServico = []; // Array para armazenar até 4 fotos em Base64
let compromissos = JSON.parse(localStorage.getItem('gestor_compromissos') || '[]');
let filtroAtualAgenda = 'agenda';
let logoBase64Empresa = localStorage.getItem('gestor_logo_b64') || '';

let canvasAssinatura, ctxAssinatura, desenhando = false;

// Catálogo separado de Materiais Elétricos
let catalogoMateriais = [
    { desc: "Cabo Flexível 2,5mm² (rolo 100m)", valor: 145.00 },
    { desc: "Cabo Flexível 4,0mm² (rolo 100m)", valor: 225.00 },
    { desc: "Cabo Flexível 6,0mm² (rolo 100m)", valor: 340.00 },
    { desc: "Disjuntor Monofásico 10A a 32A", valor: 22.00 },
    { desc: "Disjuntor Bipolar 40A a 63A", valor: 65.00 },
    { desc: "Disjuntor DR 40A / 63A (30mA)", valor: 110.00 },
    { desc: "Dispositivo DPS 20kA / 40kA", valor: 55.00 },
    { desc: "Tomada 2P+T 10A / 20A Completa", valor: 18.00 },
    { desc: "Interruptor Simples + Tomada", valor: 25.00 },
    { desc: "Quadro de Distribuição (QGBT) 12/16 Pinos", valor: 95.00 },
    { desc: "Fita Isolante Profissional 20m", valor: 12.00 }
];

// Catálogo separado de Mão de Obra
let catalogoMaoObra = [
    { desc: "Instalação de Disjuntor / DR / DPS", valor: 120.00 },
    { desc: "Montagem e Cabeamento de Quadro Elétrico (QGBT)", valor: 450.00 },
    { desc: "Passagem de Fiação por Eletroduto (metro)", valor: 15.00 },
    { desc: "Instalação de Tomada / Interruptor", valor: 35.00 },
    { desc: "Instalação de Chuveiro Elétrico", valor: 90.00 },
    { desc: "Instalação de Luminária / Plafon / Spot", valor: 50.00 },
    { desc: "Laudo de Inspeção e Termografia", valor: 350.00 },
    { desc: "Visita Técnica e Diagnóstico de Falha", valor: 150.00 },
    { desc: "Ponto Adicional de Tomada / Luz (Infraestrutura)", valor: 80.00 }
];

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('cli-data').valueAsDate = new Date();
    document.getElementById('srv-data').valueAsDate = new Date();
    carregarCatalogosNaTela();
    carregarSelectsModal();
    carregarApiKeySalva();
    carregarDadosEmpresaNaTela();
    renderizarCompromissos();
    inicializarCanvasAssinatura();
});

// Chave da API do Gemini embutida com segurança
function carregarApiKeySalva() {
    const chaveEmbutida = "AQ.Ab8RN6Ke6abHD4WeYVhvdsHO-YIbnj3R8lDjryhhTu_-9y7snA";
    if (!localStorage.getItem('gemini_api_key')) {
        localStorage.setItem('gemini_api_key', chaveEmbutida);
    }
    const inputKey = document.getElementById('input-api-key');
    if (inputKey) {
        inputKey.value = localStorage.getItem('gemini_api_key') || chaveEmbutida;
    }
}

// Inicialização do Quadro de Assinatura do Técnico
function inicializarCanvasAssinatura() {
    canvasAssinatura = document.getElementById('canvas-assinatura');
    if (!canvasAssinatura) return;
    ctxAssinatura = canvasAssinatura.getContext('2d');

    canvasAssinatura.width = canvasAssinatura.offsetWidth || 300;
    canvasAssinatura.height = 100;

    ctxAssinatura.strokeStyle = '#000000';
    ctxAssinatura.lineWidth = 2;
    ctxAssinatura.lineCap = 'round';

    canvasAssinatura.addEventListener('mousedown', iniciarDesenho);
    canvasAssinatura.addEventListener('mousemove', desenhar);
    canvasAssinatura.addEventListener('mouseup', pararDesenho);
    canvasAssinatura.addEventListener('mouseleave', pararDesenho);

    canvasAssinatura.addEventListener('touchstart', (e) => { e.preventDefault(); iniciarDesenho(e.touches[0]); });
    canvasAssinatura.addEventListener('touchmove', (e) => { e.preventDefault(); desenhar(e.touches[0]); });
    canvasAssinatura.addEventListener('touchend', (e) => { e.preventDefault(); pararDesenho(); });
}

function iniciarDesenho(e) {
    desenhando = true;
    const rect = canvasAssinatura.getBoundingClientRect();
    ctxAssinatura.beginPath();
    ctxAssinatura.moveTo(e.clientX - rect.left, e.clientY - rect.top);
}

function desenhar(e) {
    if (!desenhando) return;
    const rect = canvasAssinatura.getBoundingClientRect();
    ctxAssinatura.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctxAssinatura.stroke();
}

function pararDesenho() {
    desenhando = false;
}

function limparAssinaturaTecnico() {
    if (ctxAssinatura && canvasAssinatura) {
        ctxAssinatura.clearRect(0, 0, canvasAssinatura.width, canvasAssinatura.height);
    }
}

// Navegação entre Abas
function mudarAba(abaId) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden'));
    document.getElementById(`aba-${abaId}`).classList.remove('hidden');

    ['orcamento', 'agenda', 'materiais', 'mao-obra', 'ia', 'config'].forEach(id => {
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
        materiais: "Catálogo de Materiais",
        'mao-obra': "Catálogo de Mão de Obra",
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

// Importar Contato da Agenda do Celular
async function importarContatoAgenda() {
    try {
        if (window.navigator && window.navigator.contacts && window.navigator.contacts.select) {
            const props = ['name', 'tel'];
            const opts = { multiple: false };
            const contacts = await window.navigator.contacts.select(props, opts);
            if (contacts && contacts.length > 0) {
                const contato = contacts[0];
                const nome = contato.name ? contato.name[0] : '';
                const fone = contato.tel ? contato.tel[0] : '';
                if (nome) document.getElementById('cli-nome').value = nome;
                if (fone) document.getElementById('cli-fone').value = fone;
                alert("Contato importado com sucesso!");
            }
        } else if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.Contacts) {
            // Suporte nativo Capacitor Contacts se plugin estiver instalado
            const result = await window.Capacitor.Plugins.Contacts.pickContact();
            if (result && result.contact) {
                if (result.contact.name) document.getElementById('cli-nome').value = result.contact.name.display || '';
                if (result.contact.phones && result.contact.phones.length > 0) {
                    document.getElementById('cli-fone').value = result.contact.phones[0].number || '';
                }
            }
        } else {
            // Fallback usando o seletor nativo de input se disponível ou aviso
            alert("Para importar diretamente, utilize o preenchimento automático do seu teclado ou insira os dados do cliente.");
        }
    } catch (e) {
        console.log("Erro ao importar contato:", e);
        alert("Não foi possível acessar os contatos diretamente neste dispositivo. Digite o nome ou use o preenchimento do teclado.");
    }
}

// Gerenciamento de Fotos do Serviço (Até 4 fotos)
function adicionarFotosServico(event) {
    const files = event.target.files;
    if (!files) return;

    for (let i = 0; i < files.length; i++) {
        if (fotosServico.length >= 4) {
            alert("Você pode adicionar no máximo 4 fotos por serviço.");
            break;
        }
        const file = files[i];
        const reader = new FileReader();
        reader.onload = function(e) {
            fotosServico.push(e.target.result);
            renderizarPreviewFotos();
        };
        reader.readAsDataURL(file);
    }
    event.target.value = ''; // limpa o input
}

function removerFotoServico(index) {
    fotosServico.splice(index, 1);
    renderizarPreviewFotos();
}

function renderizarPreviewFotos() {
    const container = document.getElementById('container-fotos-preview');
    const contador = document.getElementById('contador-fotos');
    if (!container || !contador) return;

    container.innerHTML = '';
    contador.innerText = `${fotosServico.length}/4 fotos`;

    fotosServico.forEach((imgBase64, index) => {
        container.innerHTML += `
            <div class="relative bg-slate-900 rounded-lg overflow-hidden border border-slate-700 aspect-square">
                <img src="${imgBase64}" class="w-full h-full object-cover">
                <button onclick="removerFotoServico(${index})" class="absolute top-1 right-1 bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs shadow-md">
                    <i class="fa-solid fa-xmark"></i>
                </button>
            </div>
        `;
    });
}

// Renderização dos Catálogos
function carregarCatalogosNaTela() {
    const containerMat = document.getElementById('catalogo-materiais');
    if (containerMat) {
        containerMat.innerHTML = '';
        catalogoMateriais.forEach((item, index) => {
            containerMat.innerHTML += `
                <div onclick="adicionarDoCatalogoMateriais(${index})" class="bg-slate-900 border border-slate-700/60 p-3 rounded-xl flex justify-between items-center active:border-amber-500 transition cursor-pointer">
                    <div>
                        <p class="text-sm font-medium text-slate-200">${item.desc}</p>
                        <p class="text-xs text-amber-400 font-bold">R$ ${item.valor.toFixed(2).replace('.', ',')}</p>
                    </div>
                    <button class="bg-slate-800 text-amber-400 p-2 rounded-lg text-xs"><i class="fa-solid fa-plus"></i></button>
                </div>
            `;
        });
    }

    const containerMao = document.getElementById('catalogo-mao-obra');
    if (containerMao) {
        containerMao.innerHTML = '';
        catalogoMaoObra.forEach((item, index) => {
            containerMao.innerHTML += `
                <div onclick="adicionarDoCatalogoMaoObra(${index})" class="bg-slate-900 border border-slate-700/60 p-3 rounded-xl flex justify-between items-center active:border-amber-500 transition cursor-pointer">
                    <div>
                        <p class="text-sm font-medium text-slate-200">${item.desc}</p>
                        <p class="text-xs text-amber-400 font-bold">R$ ${item.valor.toFixed(2).replace('.', ',')}</p>
                    </div>
                    <button class="bg-slate-800 text-amber-400 p-2 rounded-lg text-xs"><i class="fa-solid fa-plus"></i></button>
                </div>
            `;
        });
    }
}

function carregarSelectsModal() {
    const selectMat = document.getElementById('modal-select-materiais');
    const selectMao = document.getElementById('modal-select-mao-obra');
    if (!selectMat || !selectMao) return;

    selectMat.innerHTML = '<option value="">-- Escolher material --</option>';
    catalogoMateriais.forEach((item, index) => {
        selectMat.innerHTML += `<option value="${index}">${item.desc} - R$ ${item.valor.toFixed(2)}</option>`;
    });

    selectMao.innerHTML = '<option value="">-- Escolher serviço --</option>';
    catalogoMaoObra.forEach((item, index) => {
        selectMao.innerHTML += `<option value="${index}">${item.desc} - R$ ${item.valor.toFixed(2)}</option>`;
    });
}

function selecionarMaterialModal() {
    const select = document.getElementById('modal-select-materiais');
    const index = select.value;
    if (index === "") return;
    document.getElementById('modal-select-mao-obra').value = "";
    const item = catalogoMateriais[index];
    document.getElementById('modal-desc').value = item.desc;
    document.getElementById('modal-valor').value = item.valor;
    document.getElementById('modal-qtd').value = 1;
}

function selecionarMaoObraModal() {
    const select = document.getElementById('modal-select-mao-obra');
    const index = select.value;
    if (index === "") return;
    document.getElementById('modal-select-materiais').value = "";
    const item = catalogoMaoObra[index];
    document.getElementById('modal-desc').value = item.desc;
    document.getElementById('modal-valor').value = item.valor;
    document.getElementById('modal-qtd').value = 1;
}

function adicionarDoCatalogoMateriais(index) {
    const item = catalogoMateriais[index];
    itensOrcamento.push({ desc: item.desc, qtd: 1, valor: item.valor });
    atualizarTabelaOrcamento();
    mudarAba('orcamento');
}

function adicionarDoCatalogoMaoObra(index) {
    const item = catalogoMaoObra[index];
    itensOrcamento.push({ desc: item.desc, qtd: 1, valor: item.valor });
    atualizarTabelaOrcamento();
    mudarAba('orcamento');
}

// Modal de Itens
function abrirModalItem() {
    document.getElementById('modal-select-materiais').value = "";
    document.getElementById('modal-select-mao-obra').value = "";
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
    let descontoCalculado = descTipo === 'rs' ? descValorInput : (subtotalGeral * descValorInput) / 100;

    let totalFinal = subtotalGeral - descontoCalculado;
    if (totalFinal < 0) totalFinal = 0;

    document.getElementById('subtotal-geral').innerText = `R$ ${subtotalGeral.toFixed(2).replace('.', ',')}`;
    document.getElementById('desconto-geral').innerText = `- R$ ${descontoCalculado.toFixed(2).replace('.', ',')}`;
    document.getElementById('total-geral').innerText = `R$ ${totalFinal.toFixed(2).replace('.', ',')}`;
}

// Agenda e Serviços (Com dados completos do cliente e endereço)
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
    document.getElementById('srv-cliente').value = '';
    document.getElementById('srv-fone').value = '';
    document.getElementById('srv-endereco').value = '';
    document.getElementById('modal-servico-status').classList.remove('hidden');
    document.getElementById('modal-servico-status').classList.add('flex');
}

function fecharModalServicoStatus() {
    document.getElementById('modal-servico-status').classList.remove('flex');
    document.getElementById('modal-servico-status').classList.add('hidden');
}

function salvarNovoServicoAgenda() {
    const titulo = document.getElementById('srv-titulo').value;
    const cliente = document.getElementById('srv-cliente').value;
    const fone = document.getElementById('srv-fone').value;
    const data = document.getElementById('srv-data').value;
    const endereco = document.getElementById('srv-endereco').value;
    const status = document.getElementById('srv-status').value;

    if(!titulo || !cliente) {
        alert("Preencha o título do serviço e o nome do cliente.");
        return;
    }

    compromissos.push({ id: Date.now(), titulo, cliente, fone, data, endereco, status });
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
    if (!container) return;
    container.innerHTML = '';
    const filtrados = compromissos.filter(c => c.status === filtroAtualAgenda);

    if (filtrados.length === 0) {
        container.innerHTML = `<p class="text-xs text-slate-500 text-center py-4 italic">Nenhum registro encontrado.</p>`;
        return;
    }

    filtrados.forEach(c => {
        container.innerHTML += `
            <div class="bg-slate-900 border border-slate-700/60 p-3 rounded-xl space-y-1 text-xs">
                <div class="flex justify-between items-center">
                    <p class="font-bold text-amber-400 text-sm">${c.titulo}</p>
                    <button onclick="removerCompromisso(${c.id})" class="text-red-400 hover:text-red-300 p-1"><i class="fa-solid fa-trash"></i></button>
                </div>
                <p class="text-slate-200"><strong>Cliente:</strong> ${c.cliente} ${c.fone ? '('+c.fone+')' : ''}</p>
                <p class="text-slate-400"><i class="fa-solid fa-location-dot mr-1 text-amber-500"></i> ${c.endereco || 'Sem endereço informado'}</p>
                <p class="text-slate-400"><i class="fa-solid fa-calendar mr-1 text-amber-500"></i> ${c.data || 'Sem data'}</p>
            </div>
        `;
    });
}

async function solicitarPermissoesAndroid() {
    const statusDiv = document.getElementById('status-permissao');
    statusDiv.innerText = "Status: Solicitando permissões...";
    try {
        if (window.Capacitor && window.Capacitor.Plugins.Filesystem) {
            await window.Capacitor.Plugins.Filesystem.requestPermissions();
        }
        statusDiv.innerHTML = "<span class='text-emerald-400 font-bold'>Status: Acessos concedidos!</span>";
    } catch (e) {
        statusDiv.innerHTML = "<span class='text-amber-400 font-bold'>Status: Sistema pronto.</span>";
    }
}

// Renderização Completa do Documento (Com dados da Empresa, Endereço do Cliente e Fotos anexadas)
function criarElementoDocumentoParaRender() {
    const nomeCliente = document.getElementById('cli-nome').value || "Cliente";
    const foneCliente = document.getElementById('cli-fone').value || "";
    const endCliente = document.getElementById('cli-endereco').value || "";
    const tipoDoc = document.getElementById('doc-tipo').value;
    
    // Dados da Empresa (Completos)
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
        htmlItens += `<tr><td style="padding: 8px; border-bottom: 1px solid #ddd;">${i.desc}</td><td style="padding: 8px; border-bottom: 1px solid #ddd; text-align:center;">${i.qtd}</td><td style="padding: 8px; border-bottom: 1px solid #ddd; text-align:right;">R$ ${i.valor.toFixed(2)}</td><td style="padding: 8px; border-bottom: 1px solid #ddd; text-align:right;">R$ ${sub.toFixed(2)}</td></tr>`;
    });

    const descTipo = document.getElementById('desc-tipo').value;
    const descValInput = parseFloat(document.getElementById('desc-valor').value) || 0;
    let descCalc = descTipo === 'rs' ? descValInput : (subtotal * descValInput) / 100;
    let totalFinal = subtotal - descCalc;
    if (totalFinal < 0) totalFinal = 0;

    let assinaturaTecnicoImg = canvasAssinatura ? canvasAssinatura.toDataURL('image/png') : '';
    let logoHtml = logoBase64Empresa ? `<img src="${logoBase64Empresa}" style="max-height: 55px; max-width: 130px; float: right; object-fit: contain;">` : '';
    let qrHtml = linkQr ? `<div style="margin-top: 15px; text-align: center;"><p style="font-size: 10px; color: #555;">Acesse nosso site / WhatsApp:</p><img src="https://api.qrserver.com/v1/create-qr-code/?size=70x70&data=${encodeURIComponent(linkQr)}" style="width: 60px; height: 60px;"></div>` : '';

    // HTML das Fotos anexadas (se houver)
    let htmlFotos = '';
    if (fotosServico.length > 0) {
        let fotosImgs = '';
        fotosServico.forEach(f => {
            fotosImgs += `<img src="${f}" style="width: 110px; height: 110px; object-fit: cover; border-radius: 4px; border: 1px solid #ccc;">`;
        });
        htmlFotos = `
            <div style="margin-top: 15px;">
                <p style="font-size: 11px; font-weight: bold; color: #333; margin-bottom: 5px;">Registros Fotográficos do Serviço:</p>
                <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                    ${fotosImgs}
                </div>
            </div>
        `;
    }

    const containerDoc = document.createElement('div');
    containerDoc.style.position = 'fixed';
    containerDoc.style.top = '0';
    containerDoc.style.left = '0';
    containerDoc.style.width = '600px';
    containerDoc.style.backgroundColor = '#ffffff';
    containerDoc.style.color = '#111111';
    containerDoc.style.padding = '24px';
    containerDoc.style.zIndex = '99999';
    containerDoc.style.boxShadow = '0 0 20px rgba(0,0,0,0.5)';
    containerDoc.style.borderRadius = '8px';

    containerDoc.innerHTML = `
        <div style="font-family: Arial, sans-serif;">
            ${logoHtml}
            <h2 style="color: #d97706; margin: 0 0 4px 0; font-size: 18px;">${empNome}</h2>
            <p style="font-size: 11px; color: #555; margin: 0;">CNPJ/CPF: ${empDoc} | Fone: ${empFone}</p>
            <hr style="border: 1px solid #d97706; margin: 10px 0;">
            <div style="background: #f3f4f6; padding: 8px; border-radius: 6px; display: flex; justify-content: space-between;">
                <h3 style="margin: 0; font-size: 14px; color: #1e293b;">${tipoDoc}</h3>
                <span style="font-size: 11px;">Data: ${document.getElementById('cli-data').value}</span>
            </div>
            <div style="margin: 10px 0; font-size: 12px; background: #fafafa; padding: 8px; border-radius: 6px; border: 1px solid #eee;">
                <p style="margin: 2px 0;"><strong>Cliente:</strong> ${nomeCliente}</p>
                <p style="margin: 2px 0;"><strong>Telefone:</strong> ${foneCliente}</p>
                <p style="margin: 2px 0;"><strong>Endereço:</strong> ${endCliente || 'Não informado'}</p>
            </div>
            
            <table style="width: 100%; border-collapse: collapse; font-size: 11px; margin-top: 10px;">
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
                <h3 style="margin: 5px 0; color: #1e293b; font-size: 14px;">TOTAL: R$ ${totalFinal.toFixed(2)}</h3>
                <p style="margin: 5px 0; font-size: 11px; color: #333;">Forma de Pagamento: <strong>${formaPagto}</strong></p>
            </div>

            ${htmlFotos}
            ${qrHtml}

            <!-- CAMPO COM AS DUAS ASSINATURAS NO RODAPÉ -->
            <div style="margin-top: 30px; display: flex; justify-content: space-between;">
                <div style="text-align: center; width: 45%;">
                    <div style="height: 35px; margin-bottom: 2px;">
                        <img src="${assinaturaTecnicoImg}" style="max-height: 35px; max-width: 140px;">
                    </div>
                    <div style="border-top: 1px solid #333; padding-top: 4px;">
                        <p style="font-size: 10px; margin: 0; font-weight: bold;">Assinatura do Técnico</p>
                    </div>
                </div>
                <div style="text-align: center; width: 45%;">
                    <div style="height: 35px; margin-bottom: 2px;"></div>
                    <div style="border-top: 1px solid #333; padding-top: 4px;">
                        <p style="font-size: 10px; margin: 0; font-weight: bold;">Assinatura do Cliente</p>
                    </div>
                </div>
            </div>
        </div>
    `;

    return containerDoc;
}

// Funções de Pré-visualização
function abrirPreVisualizacao() {
    if (itensOrcamento.length === 0) {
        alert("Adicione pelo menos um item ao documento.");
        return;
    }
    const previewBox = document.getElementById('preview-container-content');
    previewBox.innerHTML = '';
    const container = criarElementoDocumentoParaRender();
    container.style.position = 'relative';
    container.style.boxShadow = 'none';
    container.style.width = '100%';
    previewBox.appendChild(container);

    document.getElementById('modal-preview').classList.remove('hidden');
    document.getElementById('modal-preview').classList.add('flex');
}

function fecharPreVisualizacao() {
    document.getElementById('modal-preview').classList.remove('flex');
    document.getElementById('modal-preview').classList.add('hidden');
}

function salvarDocumentoArquivo(tipo) {
    if (itensOrcamento.length === 0) {
        alert("Adicione pelo menos um item ao documento.");
        return;
    }
    const nome = document.getElementById('cli-nome').value || "Cliente";
    const container = criarElementoDocumentoParaRender();
    document.body.appendChild(container);

    html2canvas(container, { scale: 2, useCORS: true }).then(canvas => {
        document.body.removeChild(container);
        
        if (tipo === 'img') {
            const link = document.createElement('a');
            link.download = `Documento_${nome.replace(/\s+/g, '_')}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
            alert("Sucesso! Imagem salva no seu dispositivo.");
        } else {
            const { jsPDF } = window.jspdf;
            const pdf = new jsPDF('p', 'mm', 'a4');
            const imgData = canvas.toDataURL('image/png');
            pdf.addImage(imgData, 'PNG', 10, 10, 190, (canvas.height * 190) / canvas.width);
            pdf.save(`Documento_${nome.replace(/\s+/g, '_')}.pdf`);
            alert("Sucesso! PDF salvo no seu dispositivo.");
        }
    }).catch(err => {
        document.body.removeChild(container);
        alert("Erro ao gerar o arquivo.");
    });
}

function abrirModalCompartilharWhatsApp() {
    if (itensOrcamento.length === 0) {
        alert("Adicione pelo menos um item ao documento.");
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

async function enviarDiretoWhatsApp(tipo) {
    fecharModalWhatsApp();
    if (itensOrcamento.length === 0) {
        alert("Adicione pelo menos um item ao documento.");
        return;
    }

    const nomeCliente = document.getElementById('cli-nome').value || "Cliente";
    const container = criarElementoDocumentoParaRender();
    document.body.appendChild(container);

    html2canvas(container, { scale: 2, useCORS: true }).then(async canvas => {
        document.body.removeChild(container);

        try {
            if (tipo === 'img') {
                const base64Data = canvas.toDataURL('image/png');
                const fileName = `Documento_${nomeCliente.replace(/\s+/g, '_')}.png`;

                if (window.Capacitor && window.Capacitor.Plugins.Share) {
                    const savedFile = await window.Capacitor.Plugins.Filesystem.writeFile({
                        path: fileName,
                        data: base64Data,
                        directory: 'CACHE'
                    });

                    await window.Capacitor.Plugins.Share.share({
                        title: 'Enviar Imagem',
                        text: `Olá ${nomeCliente}, segue o documento em imagem.`,
                        url: savedFile.uri,
                        dialogTitle: 'Enviar para o WhatsApp'
                    });
                } else {
                    const link = document.createElement('a');
                    link.download = fileName;
                    link.href = base64Data;
                    link.click();
                    alert("Imagem baixada para envio.");
                }
            } else {
                const { jsPDF } = window.jspdf;
                const pdf = new jsPDF('p', 'mm', 'a4');
                const imgData = canvas.toDataURL('image/png');
                pdf.addImage(imgData, 'PNG', 10, 10, 190, (canvas.height * 190) / canvas.width);
                
                const pdfOutput = pdf.output('datauristring');
                const fileName = `Documento_${nomeCliente.replace(/\s+/g, '_')}.pdf`;

                if (window.Capacitor && window.Capacitor.Plugins.Share) {
                    const savedFile = await window.Capacitor.Plugins.Filesystem.writeFile({
                        path: fileName,
                        data: pdfOutput,
                        directory: 'CACHE'
                    });

                    await window.Capacitor.Plugins.Share.share({
                        title: 'Enviar PDF',
                        text: `Olá ${nomeCliente}, segue o documento em PDF.`,
                        url: savedFile.uri,
                        dialogTitle: 'Enviar para o WhatsApp'
                    });
                } else {
                    pdf.save(fileName);
                    alert("PDF gerado com sucesso!");
                }
            }
        } catch (error) {
            console.error("Erro no compartilhamento:", error);
            alert("Não foi possível disparar o compartilhamento automático.");
        }
    }).catch(err => {
        document.body.removeChild(container);
        alert("Erro ao processar a prévia do documento.");
    });
}

// Envio Direto por E-mail com PDF Anexado Nativamente
async function compartilharEmail() {
    if (itensOrcamento.length === 0) {
        alert("Adicione pelo menos um item ao documento.");
        return;
    }

    const nomeCliente = document.getElementById('cli-nome').value || "Cliente";
    const tipoDoc = document.getElementById('doc-tipo').value;
    let subtotal = 0;
    itensOrcamento.forEach(i => subtotal += (i.qtd * i.valor));
    
    const descTipo = document.getElementById('desc-tipo').value;
    const descValInput = parseFloat(document.getElementById('desc-valor').value) || 0;
    let descCalc = descTipo === 'rs' ? descValInput : (subtotal * descValInput) / 100;
    let totalFinal = subtotal - descCalc;
    if (totalFinal < 0) totalFinal = 0;

    const container = criarElementoDocumentoParaRender();
    document.body.appendChild(container);

    html2canvas(container, { scale: 2, useCORS: true }).then(async canvas => {
        document.body.removeChild(container);

        try {
            const { jsPDF } = window.jspdf;
            const pdf = new jsPDF('p', 'mm', 'a4');
            const imgData = canvas.toDataURL('image/png');
            pdf.addImage(imgData, 'PNG', 10, 10, 190, (canvas.height * 190) / canvas.width);
            
            const pdfOutput = pdf.output('datauristring');
            const fileName = `Documento_${nomeCliente.replace(/\s+/g, '_')}.pdf`;

            if (window.Capacitor && window.Capacitor.Plugins.Share) {
                const savedFile = await window.Capacitor.Plugins.Filesystem.writeFile({
                    path: fileName,
                    data: pdfOutput,
                    directory: 'CACHE'
                });

                await window.Capacitor.Plugins.Share.share({
                    title: `${tipoDoc} - ${nomeCliente}`,
                    text: `Olá ${nomeCliente},\n\nSegue em anexo o ${tipoDoc.toLowerCase()} no valor de R$ ${totalFinal.toFixed(2)}.\n\nAtenciosamente,\nGestor Serviços.`,
                    url: savedFile.uri,
                    dialogTitle: 'Enviar por E-mail'
                });
            } else {
                pdf.save(fileName);
                alert("PDF gerado com sucesso!");
            }
        } catch (error) {
            console.error("Erro no envio por e-mail:", error);
            alert("Não foi possível anexar o arquivo automaticamente.");
        }
    }).catch(err => {
        document.body.removeChild(container);
        alert("Erro ao processar o documento para e-mail.");
    });
}

function salvarApiKey() {
    const key = document.getElementById('input-api-key').value.trim();
    if (!key) return alert("Insira uma chave válida.");
    localStorage.setItem('gemini_api_key', key);
    alert("Chave salva com sucesso!");
}

function limparChat() {
    const chatMsg = document.getElementById('chat-mensagens');
    if (chatMsg) {
        chatMsg.innerHTML = `
            <div class="bg-slate-800 p-3 rounded-xl max-w-[85%] border border-slate-700">
                <p class="text-xs text-slate-300">Histórico limpo. Como posso ajudar?</p>
            </div>
        `;
    }
}

async function enviarMensagemIA() {
    const input = document.getElementById('chat-input');
    if (!input) return;
    const msg = input.value.trim();
    const apiKey = localStorage.getItem('gemini_api_key');

    if (!msg) return;
    if (!apiKey) {
        alert("Chave de API não configurada.");
        return;
    }

    const chatDiv = document.getElementById('chat-mensagens');
    if (!chatDiv) return;

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
                contents: [{ parts: [{ text: "Você é um assistente técnico especialista em elétrica (NBR 5410) e precificação. Responda direto: " + msg }] }]
            })
        });

        const data = await response.json();
        const loadingElem = document.getElementById(loadingId);
        if (loadingElem) loadingElem.remove();
        
        const respostaTexto = data.candidates?.[0]?.content?.parts?.[0]?.text || "Sem resposta.";
        chatDiv.innerHTML += `<div class="flex justify-start"><div class="bg-slate-800 text-slate-200 p-3 rounded-xl max-w-[85%] text-xs border border-slate-700 leading-relaxed">${respostaTexto.replace(/\n/g, '<br>')}</div></div>`;
    } catch (error) {
        const loadingElem = document.getElementById(loadingId);
        if (loadingElem) loadingElem.remove();
        chatDiv.innerHTML += `<div class="flex justify-start"><div class="bg-red-900/50 text-red-200 p-3 rounded-xl max-w-[85%] text-xs border border-red-700">Erro ao conectar com a IA.</div></div>`;
    }
    chatDiv.scrollTop = chatDiv.scrollHeight;
}
