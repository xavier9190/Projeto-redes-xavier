/**
 * ARQUIVO: sessao.js
 * ---------------------------------------------------------
 * Representa a Camada de Sessão (Camada 5 do Modelo OSI).
 * Responsável por abrir, manter e encerrar sessões de comunicação.
 *
 * Recebe o payload da Camada 6 (Apresentação) e cria um objeto de sessão
 * com um identificador único (UUID), timestamp de início e o resultado do DNS.
 */

export function camadaSessao(payload, dns = null) {
  // sessionId gerado pela cripto nativa do browser (UUID v4)
  const sessao = {
    sessionId:    crypto.randomUUID(),
    inicioSessao: new Date().toISOString(),
    statusConexao: 'ESTABELECIDA',
    dns,          // resultado do DNS Google (pode ser null)
    dados:        payload,
  };

  console.log('═══ CAMADA DE SESSÃO (Camada 5) ═══', sessao);
  return sessao;
}
