let itensOrcamento = [];
let fotosServico = [];

// Blindagem contra dados corrompidos no localStorage
let compromissos = [];
try {
    compromissos = JSON.parse(localStorage.getItem('gestor_compromissos') || '[]');
} catch(e) { compromissos = []; }

let clientesSalvos = [];
try {
    clientesSalvos = JSON.parse(localStorage.getItem('gestor_clientes_salvos') || '[]');
} catch(e) { clientesSalvos = []; }

let historicoServicosFeitos = [];
try {
    historicoServicosFeitos = JSON.parse(localStorage.getItem('gestor_historico_feitos') || '[]');
} catch(e) { historicoServicosFeitos = []; }

let filtroAtualAgenda = 'agenda';
let logoBase64Empresa = localStorage.getItem('gestor_logo_b64') || '';

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

document.addEventListener('DOMContentLoaded', () => {
    try {
        const cliData = document.getElementById('cli-data');
        const srvData = document.getElementById('srv-data');
        if(cliData) cliData.valueAsDate = new Date();
        if(srvData) srvData.valueAsDate = new Date();

        carregarCatalogosNaTela();
        carregarSelectsModal();
        carregarApiKeySalva();
        carregarDadosEmpresaNaTela();
        renderizarCompromissos();
        renderizarClientesCadastrados();
        carregarRelatorioServicos();
        inicializarCanvasAssinatura();
    } catch(err) {
        console.error("Erro na inicialização:", err);
    }
});

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
}

// GESTÃO DE CLIENTES SALVOS
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

    if (!nome) {
        alert("Preencha o nome do cliente.");
        return;
    }

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
                    <button onclick="usarClienteNoOrcamento('${c.nome}', '${c.fone}', '${c.endereco}')" class="bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold px-2 py-1.5 rounded-lg" title="Usar no Documento"><i class="fa-solid fa-file-arrow-up"></i></button>
                    <button onclick="removerClienteSalvo(${c.id})" class="text-red-400 hover:text-red-300 p-1.5"><i class="fa-solid fa-trash"></i></button>
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
    alert(`Cliente ${nome} selecionado para o documento!`);
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
            alert("Utilize o teclado ou digite os dados do cliente.");
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
    if (totalFinal < 0) total
