let itensOrcamento = [];
let fotosServico = [];
let compromissos = [];
let clientesSalvos = [];
let historicoServicosFeitos = [];
let filtroAtualAgenda = 'agenda';
let logoBase64Empresa = '';
let canvasAssinatura, ctxAssinatura, desenhando = false;

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

// Inicialização Totalmente Blindada
document.addEventListener('DOMContentLoaded', () => {
    try { compromissos = JSON.parse(localStorage.getItem('gestor_compromissos') || '[]'); } catch(e) { compromissos = []; }
    try { clientesSalvos = JSON.parse(localStorage.getItem('gestor_clientes_salvos') || '[]'); } catch(e) { clientesSalvos = []; }
    try { historicoServicosFeitos = JSON.parse(localStorage.getItem('gestor_historico_feitos') || '[]'); } catch(e) { historicoServicosFeitos = []; }
    
    logoBase64Empresa = localStorage.getItem('gestor_logo_b64') || '';

    try {
        const cliData = document.getElementById('cli-data');
        const srvData = document.getElementById('srv-data');
        const hoje = new Date().toISOString().split('T')[0];
        if(cliData) cliData.value = hoje;
        if(srvData) srvData.value = hoje;
    } catch(e) {}

    try { carregarCatalogosNaTela(); } catch(e) {}
    try { carregarSelectsModal(); } catch(e) {}
    try { carregarApiKeySalva(); } catch(e) {}
    try { carregarDadosEmpresaNaTela(); } catch(e) {}
    try { renderizarCompromissos(); } catch(e) {}
    try { renderizarClientesCadastrados(); } catch(e) {}
    try { carregarRelatorioServicos(); } catch(e) {}
    try { inicializarCanvasAssinatura(); } catch(e) {}

    try {
        mudarAba('menu');
    } catch(e) {
        const abaMenu = document.getElementById('aba-menu');
        if(abaMenu) abaMenu.classList.remove('hidden');
    }
});

function carregarApiKeySalva() {
    const chaveEmbutida = "AQ.Ab8RN6Ke6abHD4WeYVhvdsHO-YIbnj3R8lDjryhhTu_-9y7snA";
    if (!localStorage.getItem('gemini_api_key')) {
        localStorage.setItem('gemini_api_key', chaveEmbutida);
    }
    const inputKey = document.getElementById('input-api-key');
    if (inputKey) inputKey.value = localStorage.getItem('gemini_api_key') || chaveEmbutida;
}

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
function pararDesenho() { desenhando = false; }
function limparAssinaturaTecnico() {
    if (ctxAssinatura && canvasAssinatura) {
        ctxAssinatura.clearRect(0, 0, canvasAssinatura.width, canvasAssinatura.height);
    }
}

// Navegação entre Abas
function mudarAba(abaId) {
    try {
        document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden'));
        const abaAlvo = document.getElementById(`aba-${abaId}`);
        if (abaAlvo) abaAlvo.classList.remove('hidden');

        ['menu', 'orcamento', 'clientes', 'agenda', 'materiais', 'mao-obra', 'relatorio', 'config'].forEach(id => {
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
            menu: "Menu Principal",
            orcamento: "Painel de Documentos",
            clientes: "Clientes Salvos",
            agenda: "Agenda & Serviços",
            materiais: "Catálogo de Materiais",
            'mao-obra': "Catálogo de Mão de Obra",
            relatorio: "Serviços Executados",
            config: "Empresa & Ajustes"
        };
        const subHeader = document.getElementById('header-subtitle');
        if (subHeader) subHeader.innerText = titles[abaId] || "Gestor Serviços";
        
        if (abaId === 'clientes') renderizarClientesCadastrados();
        if (abaId === 'relatorio') carregarRelatorioServicos();
    } catch(e) {
        console.error("Erro na navegação:", e);
    }
}

// GESTÃO DE CLIENTES
function abrirModalNovoCliente() {
    document.getElementById('cad-cli-nome').value = '';
    document.getElementById('cad-cli-fone').value = '';
    document.getElementById('cad-cli-endereco').value = '';
    document.getElementById('modal-cliente').classList.remove('hidden');
    document.getElementById('modal-cliente').classList.add('flex');
}

function fecharModalNovoCliente() {
    document.getElementById('modal-cliente').classList.remove('flex');
    document.getElementById('modal-cliente').classList.add('hidden');
}

function salvarClienteCadastrado() {
    const nome = document.getElementById('cad-cli-nome').value.trim();
    const fone = document.getElementById('cad-cli-fone').value.trim();
    const endereco = document.getElementById('cad-cli-endereco').value.trim();

    if (!nome) return alert("Preencha o nome do cliente.");

    clientesSalvos.push({ id: Date.now(), nome, fone, endereco });
    localStorage.setItem('gestor_clientes_salvos', JSON.stringify(clientesSalvos));
    fecharModalNovoCliente();
    renderizarClientesCadastrados();
    alert("Cliente salvo com sucesso!");
}

function removerClienteSalvo(id) {
    if (confirm("Deseja realmente excluir este cliente?")) {
        clientesSalvos = clientesSalvos.filter(c => c.id !== id);
        localStorage.setItem('gestor_clientes_salvos', JSON.stringify(clientesSalvos));
        renderizarClientesCadastrados();
    }
}

function renderizarClientesCadastrados() {
    const container = document.getElementById('lista-clientes-cadastrados');
    if (!container) return;
    container.innerHTML = '';

    if (clientesSalvos.length === 0) {
        container.innerHTML = `<p class="text-xs text-slate-500 text-center py-4 italic">Nenhum cliente salvo ainda.</p>`;
        return;
    }

    clientesSalvos.forEach(c => {
        container.innerHTML += `
            <div class="bg-slate-900 border border-slate-700/60 p-3 rounded-xl flex justify-between items-center text-xs">
                <div>
                    <p class="font-bold text-amber-400 text-sm">${c.nome}</p>
                    <p class="text-slate-300"><i class="fa-solid fa-phone mr-1"></i> ${c.fone || 'Sem fone'}</p>
                    <p class="text-slate-400"><i class="fa-solid fa-location-dot mr-1"></i> ${c.endereco || 'Sem endereço'}</p>
                </div>
                <div class="flex space-x-2">
                    <button onclick="usarClienteNoOrcamento('${c.nome}', '${c.fone}', '${c.endereco}')" class="bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold px-2.5 py-1.5 rounded-lg"><i class="fa-solid fa-file-arrow-up"></i></button>
                    <button onclick="removerClienteSalvo(${c.id})" class="text-red-400 p-1.5"><i class="fa-solid fa-trash"></i></button>
                </div>
            </div>
        `;
    });
}

function usarClienteNoOrcamento(nome, fone, endereco) {
    document.getElementById('cli-nome').value = nome;
    document.getElementById('cli-fone').value = fone;
    document.getElementById('cli-endereco').value = endereco;
    mudarAba('orcamento');
}

function abrirModalSelecionarClienteSalvo() {
    const container = document.getElementById('lista-modal-clientes-salvos');
    if (!container) return;
    container.innerHTML = '';

    if (clientesSalvos.length === 0) {
        container.innerHTML = `<p class="text-xs text-slate-400 text-center py-3 italic">Nenhum cliente cadastrado.</p>`;
    } else {
        clientesSalvos.forEach(c => {
            container.innerHTML += `
                <div onclick="selecionarClienteModal('${c.nome}', '${c.fone}', '${c.endereco}')" class="bg-slate-900 border border-slate-700 p-2.5 rounded-xl cursor-pointer hover:border-amber-500 transition text-xs">
                    <p class="font-bold text-amber-400">${c.nome}</p>
                    <p class="text-slate-300">${c.fone || ''} - ${c.endereco || ''}</p>
                </div>
            `;
        });
    }
    document.getElementById('modal-selecionar-cliente').classList.remove('hidden');
    document.getElementById('modal-selecionar-cliente').classList.add('flex');
}

function fecharModalSelecionarClienteSalvo() {
    document.getElementById('modal-selecionar-cliente').classList.remove('flex');
    document.getElementById('modal-selecionar-cliente').classList.add('hidden');
}

function selecionarClienteModal(nome, fone, endereco) {
    document.getElementById('cli-nome').value = nome;
    document.getElementById('cli-fone').value = fone;
    document.getElementById('cli-endereco').value = endereco;
    fecharModalSelecionarClienteSalvo();
}

// Configurações Empresa e Logo
function carregarLogoEmpresa(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            logoBase64Empresa = e.target.result;
            localStorage.setItem('gestor_logo_b64', logoBase64Empresa);
            alert("Logotipo carregado!");
        };
        reader.readAsDataURL(file);
    }
}

function salvarDadosEmpresa() {
    localStorage.setItem('emp_nome', document.getElementById('emp-nome').value);
    localStorage.setItem('emp_doc', document.getElementById('emp-doc').value);
    localStorage.setItem('emp_fone', document.getElementById('emp-fone').value);
    localStorage.setItem('emp_link_qr', document.getElementById('emp-link-qr').value);
    alert("Dados salvos!");
}

function carregarDadosEmpresaNaTela() {
    if(localStorage.getItem('emp_nome')) document.getElementById('emp-nome').value = localStorage.getItem('emp_nome');
    if(localStorage.getItem('emp_doc')) document.getElementById('emp-doc').value = localStorage.getItem('emp_doc');
    if(localStorage.getItem('emp_fone')) document.getElementById('emp-fone').value = localStorage.getItem('emp_fone');
    if(localStorage.getItem('emp_link_qr')) document.getElementById('emp-link-qr').value = localStorage.getItem('emp_link_qr');
}

async function importarContatoAgenda() {
    try {
        if (window.navigator && window.navigator.contacts && window.navigator.contacts.select) {
            const contacts = await window.navigator.contacts.select(['name', 'tel'], { multiple: false });
            if (contacts && contacts.length > 0) {
                if (contacts[0].name) document.getElementById('cli-nome').value = contacts[0].name[0];
                if (contacts[0].tel) document.getElementById('cli-fone').value = contacts[0].tel[0];
                alert("Contato importado!");
            }
        } else {
            alert("Digite os dados do cliente manualmente.");
        }
    } catch (e) { alert("Insira os dados manualmente."); }
}

function adicionarFotosServico(event) {
    const files = event.target.files;
    if (!files) return;
    for (let i = 0; i < files.length; i++) {
        if (fotosServico.length >= 4) {
            alert("Máximo de 4 fotos.");
            break;
        }
        const reader = new FileReader();
        reader.onload = function(e) {
            fotosServico.push(e.target.result);
            renderizarPreviewFotos();
        };
        reader.readAsDataURL(files[i]);
    }
    event.target.value = '';
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
                <button onclick="removerFotoServico(${index})" class="absolute top-1 right-1 bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"><i class="fa-solid fa-xmark"></i></button>
            </div>
        `;
    });
}

function carregarCatalogosNaTela() {
    const containerMat = document.getElementById('catalogo-materiais');
    if (containerMat) {
        containerMat.innerHTML = '';
        catalogoMateriais.forEach((item, index) => {
            containerMat.innerHTML += `
                <div onclick="adicionarDoCatalogoMateriais(${index})" class="bg-slate-900 border border-slate-700/60 p-3 rounded-xl flex justify-between items-center active:border-amber-500 transition cursor-pointer">
                    <div><p class="text-sm font-medium text-slate-200">${item.desc}</p><p class="text-xs text-amber-400 font-bold">R$ ${item.valor.toFixed(2).replace('.', ',')}</p></div>
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
                    <div><p class="text-sm font-medium text-slate-200">${item.desc}</p><p class="text-xs text-amber-400 font-bold">R$ ${item.valor.toFixed(2).replace('.', ',')}</p></div>
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
    catalogoMateriais.forEach((item, index) => { selectMat.innerHTML += `<option value="${index}">${item.desc} - R$ ${item.valor.toFixed(2)}</option>`; });
    selectMao.innerHTML = '<option value="">-- Escolher serviço --</option>';
    catalogoMaoObra.forEach((item, index) => { selectMao.innerHTML += `<option value="${index}">${item.desc} - R$ ${item.valor.toFixed(2)}</option>`; });
}

function selecionarMaterialModal() {
    const index = document.getElementById('modal-select-materiais').value;
    if (index === "") return;
    document.getElementById('modal-select-mao-obra').value = "";
    document.getElementById('modal-desc').value = catalogoMateriais[index].desc;
    document.getElementById('modal-valor').value = catalogoMateriais[index].valor;
    document.getElementById('modal-qtd').value = 1;
}

function selecionarMaoObraModal() {
    const index = document.getElementById('modal-select-mao-obra').value;
    if (index === "") return;
    document.getElementById('modal-select-materiais').value = "";
    document.getElementById('modal-desc').value = catalogoMaoObra[index].desc;
    document.getElementById('modal-valor').value = catalogoMaoObra[index].valor;
    document.getElementById('modal-qtd').value = 1;
}

function adicionarDoCatalogoMateriais(index) {
    itensOrcamento.push({ desc: catalogoMateriais[index].desc, qtd: 1, valor: catalogoMateriais[index].valor });
    atualizarTabelaOrcamento();
    mudarAba('orcamento');
}

function adicionarDoCatalogoMaoObra(index) {
    itensOrcamento.push({ desc: catalogoMaoObra[index].desc, qtd: 1, valor: catalogoMaoObra[index].valor });
    atualizarTabelaOrcamento();
    mudarAba('orcamento');
}

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
    if (!desc || valor <= 0) return alert('Preencha descrição e valor.');
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
    if(!lista) return;
    lista.innerHTML = '';
    if (itensOrcamento.length === 0) {
        lista.innerHTML = `<p class="text-xs text-slate-500 text-center py-4 italic">Nenhum item adicionado.</p>`;
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
                <div><p class="font-medium text-slate-200">${item.desc}</p><p class="text-slate-400">${item.qtd}x R$ ${item.valor.toFixed(2)} = <span class="text-amber-400 font-bold">R$ ${sub.toFixed(2)}</span></p></div>
                <button onclick="removerItem(${index})" class="text-red-400 p-2"><i class="fa-solid fa-trash"></i></button>
            </div>
        `;
    });
    const descTipo = document.getElementById('desc-tipo').value;
    const descValorInput = parseFloat(document.getElementById('desc-valor').value) || 0;
    let descontoCalculado = descTipo === 'rs' ? descValorInput : (subtotalGeral * descValorInput) / 100;
    let totalFinal = subtotalGeral - descontoCalculado;
    if (totalFinal < 0) totalFinal = 0;

    document.getElementById('subtotal-geral').innerText = `R$ ${subtotalGeral.toFixed(2)}`;
    document.getElementById('desconto-geral').innerText = `- R$ ${descontoCalculado.toFixed(2)}`;
    document.getElementById('total-geral').innerText = `R$ ${totalFinal.toFixed(2)}`;
}

// Agenda
function mudarFiltroAgenda(filtro) {
    filtroAtualAgenda = filtro;
    ['agenda', 'espera', 'executados'].forEach(f => {
        const btn = document.getElementById(`filtro-btn-${f}`);
        if(btn) btn.className = f === filtro ? "flex-1 py-2 rounded-md bg-amber-500 text-slate-900 transition font-bold" : "flex-1 py-2 rounded-md text-slate-400 transition";
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

    if (!titulo || !cliente) return alert("Preencha título e cliente.");

    const novoServico = { id: Date.now(), titulo, cliente, fone, data, endereco, status };
    compromissos.push(novoServico);
    localStorage.setItem('gestor_compromissos', JSON.stringify(compromissos));
    if (status === 'executados') registrarNoRelatorio(novoServico);

    fecharModalServicoStatus();
    renderizarCompromissos();
}

function registrarNoRelatorio(servico) {
    let valorEstimado = 150.00;
    historicoServicosFeitos.push({
        id: servico.id,
        titulo: servico.titulo,
        cliente: servico.cliente,
        data: servico.data,
        valor: valorEstimado,
        itens: [...itensOrcamento]
    });
    localStorage.setItem('gestor_historico_feitos', JSON.stringify(historicoServicosFeitos));
}

function carregarRelatorioServicos() {
    const container = document.getElementById('lista-relatorio-servicos');
    const totalGeralEl = document.getElementById('faturamento-total-geral');
    if (!container) return;
    container.innerHTML = '';
    let somaTotal = 0;

    if (historicoServicosFeitos.length === 0) {
        container.innerHTML = `<p class="text-xs text-slate-500 text-center py-4 italic">Nenhum serviço contabilizado.</p>`;
        if(totalGeralEl) totalGeralEl.innerText = 'R$ 0,00';
        return;
    }

    historicoServicosFeitos.forEach((servico, index) => {
        let subServico = servico.valor || 0;
        if (servico.itens && servico.itens.length > 0) {
            subServico = servico.itens.reduce((acc, i) => acc + (i.qtd * i.valor), 0);
        }
        somaTotal += subServico;
        container.innerHTML += `
            <div class="bg-slate-900 border border-slate-700/60 p-3 rounded-xl space-y-1 text-xs">
                <div class="flex justify-between items-center"><p class="font-bold text-emerald-400 text-sm">${servico.titulo}</p><button onclick="removerServicoRelatorio(${index})" class="text-red-400 p-1"><i class="fa-solid fa-trash"></i></button></div>
                <p class="text-slate-200"><strong>Cliente:</strong> ${servico.cliente} | ${servico.data || ''}</p>
                <p class="text-amber-400 font-bold text-right">R$ ${subServico.toFixed(2)}</p>
            </div>
        `;
    });
    if(totalGeralEl) totalGeralEl.innerText = `R$ ${somaTotal.toFixed(2)}`;
}

function removerServicoRelatorio(index) {
    historicoServicosFeitos.splice(index, 1);
    localStorage.setItem('gestor_historico_feitos', JSON.stringify(historicoServicosFeitos));
    carregarRelatorioServicos();
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
        container.innerHTML = `<p class="text-xs text-slate-500 text-center py-4 italic">Nenhum registro.</p>`;
        return;
    }
    filtrados.forEach(c => {
        container.innerHTML += `
            <div class="bg-slate-900 border border-slate-700/60 p-3 rounded-xl space-y-1 text-xs">
                <div class="flex justify-between items-center"><p class="font-bold text-amber-400 text-sm">${c.titulo}</p><button onclick="removerCompromisso(${c.id})" class="text-red-400 p-1"><i class="fa-solid fa-trash"></i></button></div>
                <p class="text-slate-200"><strong>Cliente:</strong> ${c.cliente} (${c.fone || ''})</p>
                <p class="text-slate-400">${c.endereco || ''} - ${c.data || ''}</p>
            </div>
        `;
    });
}

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

function abrirPreVisualizacao() {
    if (itensOrcamento.length === 0) return alert("Adicione itens.");
    const previewBox = document.getElementById('preview-container-content');
    previewBox.innerHTML = '';
    const container = criarElementoDocumentoParaRender();
    container.style.position = 'relative';
    container.style.top = '0';
    container.style.left = '0';
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
    if (typeof itensOrcamento !== 'undefined' && itensOrcamento.length === 0) return alert("Adicione itens ao documento.");
    const nome = document.getElementById('cli-nome') ? document.getElementById('cli-nome').value || "Cliente" : "Cliente";
    const container = criarElementoDocumentoParaRender();
    document.body.appendChild(container);

    html2canvas(container, { scale: 2, useCORS: true, logging: false }).then(canvas => {
        document.body.removeChild(container);
        
        if (tipo === 'img') {
            const link = document.createElement('a');
            link.download = `Documento_${nome.replace(/\s+/g, '_')}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
            alert("Imagem salva com sucesso!");
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
            alert("PDF gerado e salvo com sucesso!");
        }
    }).catch(error => {
        if (container.parentNode) document.body.removeChild(container);
        console.error("Erro ao gerar arquivo:", error);
        alert("Ocorreu um erro ao gerar o arquivo.");
    });
}

function abrirModalCompartilharWhatsApp() {
    if (typeof itensOrcamento !== 'undefined' && itensOrcamento.length === 0) return alert("Adicione itens ao documento.");
    document.getElementById('modal-whatsapp').classList.remove('hidden');
    document.getElementById('modal-whatsapp').classList.add('flex');
}

function fecharModalWhatsApp() {
    document.getElementById('modal-whatsapp').classList.remove('flex');
    document.getElementById('modal-whatsapp').classList.add('hidden');
}

function enviarWhatsAppTexto() {
    fecharModalWhatsApp();
    const fone = document.getElementById('cli-fone') ? document.getElementById('cli-fone').value.replace(/\D/g, '') : '';
    const nome = document.getElementById('cli-nome') ? document.getElementById('cli-nome').value || "Cliente" : "Cliente";
    let subtotal = itensOrcamento.reduce((acc, i) => acc + (i.qtd * i.valor), 0);
    
    let texto = `Olá *${nome}*, segue o resumo do seu atendimento:\n\n`;
    itensOrcamento.forEach(i => { 
        texto += `• ${i.desc} (${i.qtd}x) - R$ ${(i.qtd * i.valor).toFixed(2)}\n`; 
    });
    texto += `\n*TOTAL: R$ ${subtotal.toFixed(2)}*`;
    
    const url = fone ? `https://api.whatsapp.com/send?phone=${fone}&text=${encodeURIComponent(texto)}` : `https://api.whatsapp.com/send?text=${encodeURIComponent(texto)}`;
    window.open(url, '_blank');
}

// RESTAURADO: COMPARTILHAMENTO DIRETO NATIVO PARA O WHATSAPP
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
                const file = new File([blob], `Documento_${nome.replace(/\s+/g, '_')}.png`, { type: 'image/png' });
                
                if (navigator.canShare && navigator.canShare({ files: [file] })) {
                    try {
                        await navigator.share({
                            files: [file],
                            title: 'Documento de Serviço',
                            text: `Olá ${nome}, segue a imagem do serviço realizado.`
                        });
                        return;
                    } catch (err) {
                        console.log("Compartilhamento nativo cancelado.");
                        return;
                    }
                }
                
                const link = document.createElement('a');
                link.download = `Documento_${nome.replace(/\s+/g, '_')}.png`;
                link.href = canvas.toDataURL('image/png');
                link.click();
                alert("Arquivo gerado e baixado no aparelho!");
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

            const pdfOutput = pdf.output('blob');
            const file = new File([pdfOutput], `Documento_${nome.replace(/\s+/g, '_')}.pdf`, { type: 'application/pdf' });

            if (navigator.canShare && navigator.canShare({ files: [file] })) {
                try {
                    await navigator.share({
                        files: [file],
                        title: 'Orçamento / Nota de Serviço',
                        text: `Olá ${nome}, segue o documento em PDF referente ao atendimento.`
                    });
                    return;
                } catch (err) {
                    console.log("Compartilhamento nativo cancelado.");
                    return;
                }
            }

            pdf.save(`Documento_${nome.replace(/\s+/g, '_')}.pdf`);
            alert("PDF gerado e baixado no aparelho!");
        }
    } catch (error) {
        if (container.parentNode) document.body.removeChild(container);
        console.error("Erro no envio direto:", error);
        alert("Ocorreu um erro ao processar o arquivo para envio.");
    }
}

function compartilharEmail() {
    if (typeof itensOrcamento !== 'undefined' && itensOrcamento.length === 0) return alert("Adicione itens ao documento.");
    const nome = document.getElementById('cli-nome') ? document.getElementById('cli-nome').value || "Cliente" : "Cliente";
    let subtotal = itensOrcamento.reduce((acc, i) => acc + (i.qtd * i.valor), 0);
    
    const assunto = encodeURIComponent(`Documento de Serviço - ${nome}`);
    const corpo = encodeURIComponent(`Olá ${nome},\n\nSegue o resumo do orçamento/serviço realizado.\nValor Total: R$ ${subtotal.toFixed(2)}.\n\nAtenciosamente.`);
    
    window.location.href = `mailto:?subject=${assunto}&body=${corpo}`;
}

function salvarApiKey() {
    const key = document.getElementById('input-api-key') ? document.getElementById('input-api-key').value.trim() : '';
    if (!key) return alert("Insira uma chave.");
    localStorage.setItem('gemini_api_key', key);
    alert("Chave salva!");
}
