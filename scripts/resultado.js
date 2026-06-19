/**
 * ARQUIVO: resultado.js
 * ---------------------------------------------------------
 * Este script entra em ação somente quando a página resultado.html é carregada.
 * Seu principal papel é acessar a memória do navegador para "resgatar"
 * todo o processo feito pelas camadas no OSI.js e injetar essas informações visualmente no HTML.
 */

const NOME_USUARIO = 'Pedro Xavier';



// Seleciona o parágrafo no cabeçalho destinado a mostrar quem está logado
const elementoUsuario = document.querySelector('.user');

if (elementoUsuario) {
  elementoUsuario.textContent = `Usuário: ${NOME_USUARIO}`;
}



// ======================================================================================
// RESGATE DE INFORMAÇÕES (STORAGE)
// O LocalStorage é como uma gaveta do navegador de longo prazo. Nós armazenamos strings nele.
// ======================================================================================
const stringPayload = localStorage.getItem('osi_payload'); // Dados estruturados da Camada 7
const tokenRecuperado = localStorage.getItem('osi_token'); // Token da Camada 6
const stringSessao = localStorage.getItem('osi_sessao');   // Dados das Portas da Camada 5



// Relacionamos as variáveis JavaScript aos blocos <pre> e <div> do HTML (aonde o texto será exibido)
const exibicaoPayload = document.querySelector('#payload-display');
const exibicaoToken = document.querySelector('#token-display');
const exibicaoSessao = document.querySelector('#sessao-display');



// Exibição da CAMADA DE APLICAÇÃO (Payload)
// Se existir o dado no LocalStorage e nós encontrarmos a caixa HTML dele na tela
if (stringPayload && exibicaoPayload) {

  // O bloco try/catch intercepta possíveis erros de formatação caso a string esteja corrompida.
  try {
    // Como salvamos uma string usando JSON.stringify, agora precisamos reviver o objeto usando JSON.parse
    const dadosPayload = JSON.parse(stringPayload);
    
    // Convertendo de volta para string com "null, 2" nós geramos espaçamentos visuais. 
    // É isso que deixa aquele formato bonito em chaves {} identadas no meio do site.
    exibicaoPayload.textContent = JSON.stringify(dadosPayload, null, 2);
  } catch (erroParse) {
    // Fallback de erro elegante caso ocorra falha ao processar o JSON (evita o programa "quebrar")
    exibicaoPayload.textContent = 'Erro interno ao ler os dados da requisição (JSON Corrompido).';
  }

} else if (exibicaoPayload) {
  // Caso o usuário tente acessar a página resultado.html diretamente pelo link, ele não terá nada no LocalStorage.
  exibicaoPayload.textContent = 'Nenhum dado original encontrado. Por favor, volte e realize uma nova requisição.';
}



// Exibição da CAMADA DE APRESENTAÇÃO (Criptografia JWT)
if (tokenRecuperado && exibicaoToken) {

  // Injetamos a longa string crua diretamente na caixa, já que ela não necessita formatação adicional
  exibicaoToken.textContent = tokenRecuperado;

} else if (exibicaoToken) {

  exibicaoToken.textContent = 'Nenhum token JWT gerado foi encontrado para esta requisição.';

}



// Exibição da CAMADA DE SESSÃO (Controle de Conexão e Portas)
if (stringSessao && exibicaoSessao) {

  try {
    // Revive o objeto com as informações de Porta Origem, Destino e Sessão ID.
    const dadosSessao = JSON.parse(stringSessao);
    // Injeta formatado bonito (pretty print) de novo no HTML
    exibicaoSessao.textContent = JSON.stringify(dadosSessao, null, 2);
  } catch (erroParse) {
    exibicaoSessao.textContent = 'Erro ao decodificar ou ler as configurações e portas da sessão.';
  }

} else if (exibicaoSessao) {

  exibicaoSessao.textContent = 'Nenhum dado referente à sessão de rede encontrado.';

}



// ======================================================================================
// HIGIENE DE DADOS
// Zera as variáveis salvas na memória do navegador. 
// Isso é um costume de segurança muito recomendado, pois evita vazamento de dados de estado 
// em execuções ou visitas posteriores.
// ======================================================================================
localStorage.removeItem('osi_payload');
localStorage.removeItem('osi_token');
localStorage.removeItem('osi_sessao');
