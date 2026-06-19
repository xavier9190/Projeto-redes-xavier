/**
 * ARQUIVO: OSI.js
 * ---------------------------------------------------------
 * Funciona como o orquestrador (Controller) da interface do usuário.
 * Ele escuta eventos da tela principal (index.html), recolhe os inputs,
 * e passa a "bola" para as funções que representam cada camada no application.js.
 */

// Importa nossas simulações de camadas OSI do arquivo principal de negócio
import { criarDadosAplicacao, processarCamadaApresentacao, estabelecerCamadaSessao } from "./application.js";



// Seleciona todos os elementos vitais do DOM (Document Object Model) da interface de requisição
const botaoRequisicao = document.querySelector('.request-btn');
const campoTexto = document.querySelector('#text-input');
const campoArquivo = document.querySelector('#arquivo');
const nomeProtocolo = document.querySelector('.protocol-name');
const formularioEmail = document.querySelector('#email-form');



// Situação primária de interface: Esconde o botão de upload de arquivo inicialmente.
// Queremos que o usuário se foque no texto, e só utilize arquivo para protocolos específicos.
if (campoArquivo) campoArquivo.style.display = 'none';



// Identificação visual autônoma da natureza da chamada embasada no que a pessoa insere no momento real
// O evento 'input' dispara a cada vez que uma tecla é apertada.
if (campoTexto) {
  campoTexto.addEventListener('input', function() {
    // Pegamos a string que está dentro do campo atualmente
    const valorDigitado = campoTexto.value;



    // Se a string contém o caractere de e-mail '@', deduzimos que é um envio SMTP.
    if (valorDigitado.includes('@')) {

      // Reconhecido como correio eletrônico: mostra o mini-formulário para preencher "Assunto" e "Corpo"
      if (formularioEmail) formularioEmail.style.display = 'block';

    } else {

      // Não é correio eletrônico: oculta o mini-formulário para não poluir a tela
      if (formularioEmail) formularioEmail.style.display = 'none';

    }
  });
}



// Ação principal de disparo da simulação do Modelo OSI
if (botaoRequisicao) {
  // Tornamos a função 'async' (assíncrona) porque a criptografia de JWT gera uma Promise que devemos aguardar (await)
  botaoRequisicao.addEventListener('click', async function(event) {
    
    // Evita o recarregamento automático da página que o botão de form costuma fazer por padrão
    event.preventDefault();



    // Extrai a mensagem principal ou a URL
    const textoExtraido = campoTexto.value;



    // Pega as áreas adicionais caso a seção de e-mail esteja exposta na tela
    // O operador '?' (Optional Chaining) evita erros caso a tag não exista no HTML
    const informacoesEmail = {
      assunto: document.querySelector('#email-assunto')?.value || '',
      corpo: document.querySelector('#email-corpo')?.value || ''
    };



    // ======================================================================================
    // 1. CAMADA DE APLICAÇÃO (Camada 7)
    // Identifica o que o usuário quer fazer, extrai a informação e estrutura o payload (Carga Útil).
    // ======================================================================================
    const dadosAplicacao = criarDadosAplicacao(textoExtraido, campoArquivo, informacoesEmail);



    // Caso devolva nulo, houve uma falha de validação primária — interrompemos o andamento (Early Return)
    if (!dadosAplicacao) {
      return; 
    }



    // Renova o rótulo central (h1) na interface exibindo que protocolo a aplicação decidiu usar
    nomeProtocolo.textContent = dadosAplicacao.protocolo;



    // Exibe registros na Ferramenta do Programador (F12) para que devs acompanhem os bastidores
    console.log("=== 1. CAMADA DE APLICAÇÃO (Informações Iniciais / Payload Original) ===");
    console.log(dadosAplicacao);



    // ======================================================================================
    // 2. CAMADA DE APRESENTAÇÃO (Camada 6)
    // Transforma os dados legíveis em um Token JWT protegido criptograficamente.
    // ======================================================================================
    const tokenDeApresentacao = await processarCamadaApresentacao(dadosAplicacao);



    // Log da string gigante JWT que mascara e embola nossos dados para envio seguro.
    console.log("=== 2. CAMADA DE APRESENTAÇÃO (Credencial JWT Criada) ===");
    console.log(tokenDeApresentacao);



    // ======================================================================================
    // 3. CAMADA DE SESSÃO (Camada 5)
    // Estabelece a conexão da nossa "máquina local" para com o servidor externo através de portas.
    // ======================================================================================
    const dadosSessao = estabelecerCamadaSessao(dadosAplicacao.protocolo);

    console.log("=== 3. CAMADA DE SESSÃO (Controle e Conexão Estabelecida) ===");
    console.log(dadosSessao);



    // ======================================================================================
    // REGISTRO DE MEMÓRIA E REDIRECIONAMENTO
    // Salvamos as peças fundamentais na memória local do navegador, chamada "localStorage".
    // Esse espaço sobrevive à recarregamentos de página, permitindo mostrar os resultados em outra tela.
    // O JSON.stringify é essencial para transformar objetos Javascript complexos em String de texto.
    // ======================================================================================
    localStorage.setItem('osi_payload', JSON.stringify(dadosAplicacao));
    localStorage.setItem('osi_token', tokenDeApresentacao);
    localStorage.setItem('osi_sessao', JSON.stringify(dadosSessao));



    // Providencia feedback visual para o usuário de que a máquina está trabalhando pesado nas camadas OSI
    botaoRequisicao.textContent = 'Processando...';
    botaoRequisicao.disabled = true; // Desabilita o clique secundário para prevenir execuções duplicadas

    // 'setTimeout' injeta um pequeno atraso de 2.5 segundos (2500 milissegundos) simulando processamento na rede
    setTimeout(() => {
      // Faz o navegador mudar de aba e migrar para a tela de visualização
      window.location.href = 'resultado.html';
    }, 2500);
  });
}