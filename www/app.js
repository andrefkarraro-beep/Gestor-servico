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

// INICIALIZAÇÃO ULTRA-SEGURA (Impossível travar a tela preta)
window.onload = function() {
    try {
        compromissos = JSON.parse(localStorage.getItem('gestor_compromissos') || '[]');
        clientesSalvos = JSON.parse(localStorage.getItem('gestor_clientes_salvos') || '[]');
        historicoServicosFeitos = JSON.parse(localStorage.getItem('gestor_historico_feitos') || '[]');
        logoBase64Empresa = localStorage.getItem('gestor_logo_b64') || '';
    } catch(e) {
        console.error("Erro ao carregar dados locais", e);
    }

    // Configura data de hoje se existir os campos
    try {
        const hoje = new Date().toISOString().split('T')[0];
        const cliData = document.getElementById('cli-data');
        const srvData = document.getElementById('srv-data');
        if(cliData) cliData.value = hoje;
        if(srvData) srvData.value = hoje;
    } catch(e) {}

    // Executa as funções de tela com segurança isolada
    try { carregarCatalogosNaTela(); } catch(e) {}
    try { carregarSelectsModal(); } catch(e) {}
    try { carregarApiKeySalva(); } catch(e) {}
    try { carregarDadosEmpresaNaTela(); } catch(e) {}
    try { renderizarCompromissos(); } catch(e) {}
    try { renderizarClientesCadastrados(); } catch(e) {}
    try { carregarRelatorioServicos(); } catch(e) {}
    try { inicializarCanvasAssinatura(); } catch(e) {}

    // Garante que o menu principal apareça na hora
    mudarAba('menu');
};
