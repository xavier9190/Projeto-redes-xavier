/**
 * ARQUIVO: apresentacao.js
 * ---------------------------------------------------------
 * Representa a Camada de Apresentação (Camada 6 do Modelo OSI).
 * Responsável por tradução, criptografia e formatação dos dados.
 *
 * Etapas:
 * 1. Criptografa os dados com AES-GCM 256-bit (Web Crypto API nativa)
 * 2. Resolve DNS do domínio via Google DNS API (requisição HTTP real)
 * 3. Gera Token JWT (HS256) contendo os dados encriptados
 * 4. Chama as camadas inferiores em sequência (5 → 4 → 3 → 2 → 1)
 * 5. Salva tudo no localStorage e redireciona para resultado.html
 */

import { SignJWT, decodeJwt } from 'https://cdn.jsdelivr.net/npm/jose@6/+esm';
import { camadaSessao }     from './sessao.js';
import { camadaTransporte } from './transporte.js';
import { camadaRede }       from './camada_rede.js';
import { camadaEnlace }     from './enlace.js';
import { camadaFisica }     from './fisica.js';

// Segredo JWT — usado para assinar o token com HMAC-SHA256
const SECRET = new TextEncoder().encode('segredo-osi-redes-pedro-xavier-2024');

// =====================
// AES-GCM — Gera ou recupera chave do localStorage
// =====================
async function obterChaveAES() {
  const salva = localStorage.getItem('osi-aes-gcm-key');

  if (salva) {
    // Reimporta a chave salva em formato JWK
    const jwk = JSON.parse(salva);
    return await crypto.subtle.importKey(
      'jwk', jwk,
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt']
    );
  }

  // Gera nova chave AES-GCM 256-bit
  const chave = await crypto.subtle.generateKey(
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );

  // Exporta e persiste no localStorage
  const jwk = await crypto.subtle.exportKey('jwk', chave);
  localStorage.setItem('osi-aes-gcm-key', JSON.stringify(jwk));
  console.log('[AES-GCM] Nova chave gerada e salva no localStorage.');

  return chave;
}

// =====================
// AES-GCM — Encripta dados com a Web Crypto API nativa do browser
// =====================
async function encriptarAESGCM(dados) {
  const chave  = await obterChaveAES();
  const iv     = crypto.getRandomValues(new Uint8Array(12)); // IV aleatório de 96 bits
  const texto  = new TextEncoder().encode(JSON.stringify(dados));

  const cifrado = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    chave,
    texto
  );

  // Converte para Base64 para armazenamento/transmissão
  const ivB64     = btoa(String.fromCharCode(...iv));
  const dadosB64  = btoa(String.fromCharCode(...new Uint8Array(cifrado)));

  return {
    algoritmo: 'AES-GCM-256',
    iv:        ivB64,
    payload:   dadosB64,
    tamanho:   cifrado.byteLength,
  };
}

// =====================
// DNS Google — resolve o domínio do destinatário (requisição HTTP real)
// =====================
async function resolverDNS(dadosLimpos) {
  // Extrai o domínio conforme o tipo de dado
  let dominio = null;

  if (dadosLimpos.destinatario?.includes('@')) {
    dominio = dadosLimpos.destinatario.split('@')[1];
  } else if (dadosLimpos.host) {
    dominio = dadosLimpos.host
      .replace(/^https?:\/\//, '')
      .replace(/^www\./, '')
      .split('/')[0];
  } else if (dadosLimpos.hostIP) {
    dominio = dadosLimpos.hostIP
      .replace(/^https?:\/\//, '')
      .replace(/^www\./, '')
      .split('/')[0];
  }

  if (!dominio) return null;

  try {
    const res  = await fetch(`https://dns.google/resolve?name=${dominio}&type=A`);
    const json = await res.json();
    const ip   = json.Answer?.[0]?.data ?? null;
    console.log(`[DNS Google] ${dominio} → ${ip}`);
    return { dominio, ip, status: json.Status };
  } catch (e) {
    console.warn('[DNS Google] Falha:', e.message);
    return { dominio, ip: null, status: 'erro' };
  }
}

// =====================
// JWT — assina com HS256, contendo o payload AES-GCM no corpo
// =====================
async function gerarTokenJWT(dadosEncriptados, protocolo) {
  const jwtPayload = {
    sessionId: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    protocolo,
    dados:     dadosEncriptados, // payload contém o blob AES-GCM
  };

  const token = await new SignJWT(jwtPayload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('2h')
    .sign(SECRET);

  return token;
}

// =====================
// CAMADA DE APRESENTAÇÃO — orquestra a dupla criptografia
// =====================
export async function camadaApresentacao(dadosLimpos) {
  console.log('═══ CAMADA DE APRESENTAÇÃO (Camada 6) ═══');

  // 1. Encripta os dados com AES-GCM 256-bit (Web Crypto nativa do browser)
  const dadosEncriptados = await encriptarAESGCM(dadosLimpos);
  console.log('[Apresentação] AES-GCM:', dadosEncriptados);

  // 2. Gera o token JWT com os dados encriptados no payload
  const token = await gerarTokenJWT(dadosEncriptados, dadosLimpos.protocolo);
  console.log('[Apresentação] JWT:', token);

  // 3. Decodifica o payload para inspeção nos logs
  const payload = decodeJwt(token);
  console.log('[Apresentação] Payload JWT:', payload);

  // 4. Resolve DNS via Google DNS (requisição HTTP real ao servidor de nomes)
  const dns = await resolverDNS(dadosLimpos);
  console.log('[Apresentação] DNS:', dns);

  // ══ CAMADA DE SESSÃO (5) — recebe payload JWT ══
  const sessao = camadaSessao(payload, dns);

  // ══ CAMADA DE TRANSPORTE (4) — estrutura TCP ══
  const transporte = camadaTransporte(sessao, dadosLimpos.protocolo);

  // ══ CAMADA DE REDE (3) — roteamento Dijkstra ══
  const rede = camadaRede(transporte, dns);

  // ══ CAMADA DE ENLACE (2) — Frame Ethernet ══
  const quadro = camadaEnlace(transporte);

  // ══ CAMADA FÍSICA (1) — Transmissão de bits ══
  const fisica = camadaFisica(quadro);

  // Salva tudo para a página de resultado
  localStorage.setItem('dadosCriptografados', JSON.stringify({
    token,
    payload,
    dadosEncriptados,
    dns,
    sessao,
    transporte,
    rede,
    quadro,
    fisica,
    // Dados originais da Camada 7 para exibição
    dadosAplicacao: dadosLimpos,
  }));

  window.location.href = 'resultado.html';
}
