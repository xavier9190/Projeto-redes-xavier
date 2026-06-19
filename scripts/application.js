/**
 * ARQUIVO: application.js
 * ---------------------------------------------------------
 * Este arquivo concentra as regras de negócio das camadas
 * superiores do Modelo OSI simuladas neste projeto:
 * - Camada de Aplicação (extração e validação de dados)
 * - Camada de Apresentação (geração de tokens JWT)
 * - Camada de Sessão (gerenciamento de portas lógicas)
 */

// Traz a biblioteca 'jose' por meio de CDN (skypack) para criar Token JWT.
// Essa biblioteca é essencial para criptografar os dados da Camada de Apresentação.
import * as jose from 'https://cdn.skypack.dev/jose';



// Nome principal que aparecerá na interface da aplicação
const NOME_USUARIO = 'Pedro Xavier';



// Seleciona o elemento HTML na tela onde o nome do usuário deve aparecer
const elementoUsuario = document.querySelector('.user');

// Verifica se o elemento existe na tela antes de tentar injetar o texto, evitando erros (null pointer)
if (elementoUsuario) {
  elementoUsuario.textContent = `Usuário: ${NOME_USUARIO}`;
}



// Senha confidencial utilizada para validar e assinar o Token JWT (algoritmo HS256).
// No mundo real, esta chave jamais deve ficar exposta no código fonte do front-end.
const SEGREDO_JWT = new TextEncoder().encode('segredo-osi-redes-2024');



/**
 * FUNÇÃO: processarCamadaApresentacao
 * ---------------------------------------------------------
 * Representa a Camada de Apresentação (Camada 6 do OSI).
 * Aqui, os dados originais são formatados/criptografados em um Token JWT.
 * 
 * @param {Object} dadosAplicacao - O objeto contendo todos os dados já estruturados pela camada 7.
 * @returns {String} tokenGerado - O Token JWT criptografado em formato de string.
 */
export async function processarCamadaApresentacao(dadosAplicacao) {

  // Cria um Token JWT assinado utilizando a biblioteca 'jose'.
  // O token embute as informações (payload) com segurança e garante integridade.
  const tokenGerado = await new jose.SignJWT({ ...dadosAplicacao })
    .setProtectedHeader({ alg: 'HS256' }) // Define o algoritmo de criptografia simétrica (HMAC + SHA-256)
    .setIssuedAt()                        // Carimba o horário de criação do token
    .setExpirationTime('2h')              // Define uma validade de 2 horas de duração para a segurança
    .sign(SEGREDO_JWT);                   // Assina usando nossa chave privada (SEGREDO_JWT)



  return tokenGerado;
}



/**
 * FUNÇÃO: criarDadosAplicacao
 * ---------------------------------------------------------
 * Representa a Camada de Aplicação (Camada 7 do OSI).
 * Reconhece de forma autônoma a natureza do pedido baseado no texto ou arquivo inserido,
 * realizando uma validação primária antes de descer para a camada 6.
 */
export function criarDadosAplicacao(textoEntrada, entradaArquivo, infoEmail) {

  // Armazena o exato momento em que a requisição está sendo montada (Timestamp)
  const marcaTempo = new Date().toISOString();
  let dadosRetorno = {};



  if (textoEntrada.includes('@')) {

    // --- CENÁRIO 1: CORREIO ELETRÔNICO (E-MAIL) ---
    // Condição: O texto precisa possuir o símbolo arroba ('@')
    
    // Regra de Validação: Além do '@', é obrigatório ter o sufixo '.com' para ser considerado válido.
    if (!textoEntrada.includes('.com')) {
      alert('Erro na Camada de Aplicação: O e-mail precisa conter "@" e ".com" (ex: teste@gmail.com).');
      return null; // Interrompe o fluxo caso a validação falhe
    }



    // Monta o objeto (Payload) que será transportado
    dadosRetorno = {
      tipo: 'email',
      remetente: NOME_USUARIO,
      destinatario: textoEntrada,
      assunto: infoEmail?.assunto || 'Sem assunto',
      corpo: infoEmail?.corpo || 'Sem corpo',
      protocolo: 'SMTP/POP', // Protocolos padrão para envio e recebimento de e-mails
      timestamp: marcaTempo
    };



  } else if (textoEntrada.includes('www') && textoEntrada.includes('.com')) {

    // --- CENÁRIO 2: PÁGINA WEB (HTTP) ---
    // Condição: O texto de entrada tem 'www' E '.com', indicando uma URL válida.
    
    dadosRetorno = {
      tipo: 'http_request',
      metodo: 'GET', // Define o método padrão de busca web
      hostIP: textoEntrada, // O destino da URL
      protocolo: 'HTTP/HTTPS', // Protocolos usados em acesso web
      usuario: NOME_USUARIO,
      timestamp: marcaTempo
    };



  } else if (entradaArquivo && entradaArquivo.files && entradaArquivo.files.length > 0) {

    // --- CENÁRIO 3: TRANSFERÊNCIA DE DOCUMENTO (ARQUIVO) ---
    // Condição: Identificamos que o usuário anexou um arquivo físico no campo de file.
    
    // Acessamos o primeiro arquivo que foi incluído no input
    const arquivoSelecionado = entradaArquivo.files[0];

    dadosRetorno = {
      nomeArquivo: arquivoSelecionado.name, // Coleta o nome original do arquivo
      // Identifica o formato a partir da propriedade type ou pela extensão da string do nome
      formato: arquivoSelecionado.type || arquivoSelecionado.name.split('.').pop(),
      remetente: NOME_USUARIO,
      protocolo: 'FTP/HTTP', // Protocolos relacionados a transferência e upload de arquivos
      timestamp: marcaTempo
    };



  } else if (textoEntrada.trim() !== '') {

    // --- CENÁRIO 4: BATE-PAPO (WEBSOCKET / CHAT) ---
    // Condição: O campo não está vazio e não se enquadrou em nenhum formato específico de URL ou e-mail.
    
    dadosRetorno = {
      tipo: 'chat',
      usuario: NOME_USUARIO,
      mensagem: textoEntrada,
      protocolo: 'WEBSOCKET', // Utilizado amplamente para trocas de mensagens instantâneas
      timestamp: marcaTempo
    };



  } else {

    // Caso o usuário aperte o botão de enviar sem preencher nenhuma das informações.
    alert('Por favor, insira um texto, URL, e-mail ou selecione um arquivo antes de enviar!');
    return null; // Paralisa o processo para que dados inválidos não sigam nas camadas
  }



  // Entrega o payload (Carga Útil) totalmente estruturado para o próximo passo.
  return dadosRetorno;
}



/**
 * FUNÇÃO: estabelecerCamadaSessao
 * ---------------------------------------------------------
 * Representa a Camada de Sessão (Camada 5 do OSI).
 * Define de qual "porta lógica" sairemos e qual "porta lógica" do servidor atingiremos.
 * Ela cuida da manutenção e do status de conectividade dessa requisição.
 */
export function estabelecerCamadaSessao(protocolo) {
  
  // Define a porta de destino padrão, ancorada no protocolo da Camada 7
  let portaDestino = 80; // Default para web simples
  if (protocolo === 'HTTP/HTTPS') portaDestino = 443; // Porta segura SSL/TLS web
  if (protocolo === 'SMTP/POP') portaDestino = 587;   // Porta segura para serviços SMTP modernos
  if (protocolo === 'FTP/HTTP') portaDestino = 21;    // Porta de controle padrão para FTP
  if (protocolo === 'WEBSOCKET') portaDestino = 8080; // Porta alternativa comum para WebSockets

  // Porta de origem aleatória (efêmera): varia entre 49152 e 65535, conforme padrão IANA 
  // O sistema operacional do cliente sempre escolhe uma porta temporária alta.
  const portaOrigem = Math.floor(Math.random() * (65535 - 49152 + 1) + 49152);
  
  // Gera um ID de Sessão único para rastrear este diálogo (usando criptografia ou fallback simples)
  const idSessao = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15);

  // Devolve as configurações vitais de conexão dessa Sessão
  return {
    idSessao: idSessao,
    statusConexao: 'ESTABELECIDA', // Simula um handshake completado e conexão firmada
    portaOrigem: portaOrigem,
    portaDestino: portaDestino,
    inicioSessao: new Date().toISOString()
  };
}