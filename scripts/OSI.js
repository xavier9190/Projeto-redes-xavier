/**
 * ARQUIVO: OSI.js
 * ---------------------------------------------------------
 * Ponto de entrada do orquestrador OSI.
 * Agora toda a lógica de UI e protocolo está em application.js.
 * Este arquivo importa application.js para garantir que o módulo seja carregado.
 *
 * Mantido por compatibilidade e organização modular do projeto.
 */

// O application.js é o controlador principal da interface.
// Ao importar ele aqui, garantimos que todos os event listeners
// sejam registrados quando o index.html carregar este script.
import './application.js';