/**
 * ARQUIVO: fisica.js
 * ---------------------------------------------------------
 * Representa a Camada Física (Camada 1 do Modelo OSI).
 * Responsável pela transmissão e recepção de bits brutos pelo meio físico.
 *
 * Responsabilidades:
 * 1. Recebe o quadro da Camada de Enlace
 * 2. Recalcula o MD5 dos dados e compara com o CRC recebido
 *    → Se igual: mensagem íntegra ✅
 *    → Se diferente: mensagem corrompida ❌
 * 3. Converte todo o quadro para representação binária (0s e 1s)
 * 4. Retorna objeto com: o frame original, resultado da verificação e os bits
 */

import md5 from 'https://esm.sh/md5@2';

export function camadaFisica(quadro) {
  console.log('═══ CAMADA FÍSICA (Camada 1) ═══');

  // 1. Verifica integridade: recalcula MD5 dos mesmos dados que a Enlace usou
  const dadosStr      = JSON.stringify(quadro.dados);
  const hashCalculado = md5(dadosStr).toUpperCase();
  const integridadeOk = hashCalculado === quadro.crc;

  console.log(`[Física] CRC recebido:   ${quadro.crc}`);
  console.log(`[Física] Hash calculado: ${hashCalculado}`);
  console.log(`[Física] Integridade:    ${integridadeOk ? '✅ ÍNTEGRA' : '❌ CORROMPIDA'}`);

  // 2. Converte o quadro completo para representação binária
  const frameStr = JSON.stringify(quadro);
  const bits     = frameStr
    .split('')
    .map(char => char.charCodeAt(0).toString(2).padStart(8, '0'))
    .join(' ');

  console.log('[Física] Bits (prévia):', bits.slice(0, 120), '…');

  return {
    objeto:        quadro,         // o frame original da camada de enlace
    integridadeOk,                 // resultado da verificação CRC
    crcRecebido:   quadro.crc,     // CRC que veio da enlace
    hashCalculado,                 // hash recalculado aqui
    bits,                          // representação binária completa
  };
}
