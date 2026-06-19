# Trabalho de Redes - Padrão OSI
# 🌐 Trabalho de Redes - Simulação do Modelo OSI

Este projeto é uma aplicação web interativa desenvolvida para simular de forma simplificada e visual as interações das camadas superiores do **Modelo OSI** (Camadas de Aplicação, Apresentação e Sessão). 

O sistema permite criar diferentes tipos de requisições e demonstra na prática como os dados são formatados, validados, criptografados e como a conexão é gerenciada antes de descerem pela pilha de protocolos.

---

## 🚀 Funcionalidades e Camadas Simuladas

O projeto explora 4 cenários principais de redes na **Camada de Aplicação**, aplicando regras específicas para cada um:

* **💬 Chat (WebSocket):** Geração de payload para envio de mensagens em tempo real.
* **🌐 Sites (HTTP/HTTPS):** Simulação de requisição web com validação de URL (exige `www` e `.com`).
* **📧 E-mail (SMTP/POP):** Simulação de envio de e-mail com validação de formato (exige `@` e `.com`).
* **📁 Arquivos (FTP/HTTP):** Simulação de upload de arquivos com extração dinâmica de nome e extensão.

### 🛡️ Criptografia e Segurança (Camada de Apresentação)
Para representar a **Camada de Apresentação**, foi implementada uma função de criptografia e formatação baseada na geração de um **Token JWT (JSON Web Token)** utilizando o algoritmo HS256. Antes da requisição seguir, os dados originais do payload são compactados e assinados com uma chave secreta.

### 🔌 Controle de Conexão (Camada de Sessão)
Para representar a **Camada de Sessão**, o sistema gera um identificador único de sessão (Session ID) e simula o estabelecimento da conexão definindo o seu status. Além disso, mapeia logicamente as portas (uma porta de origem efêmera aleatória e a porta de destino correta baseada no protocolo escolhido).

---

## 🛠️ Tecnologias Utilizadas

* **HTML5:** Estrutura semântica da aplicação.
* **CSS3:** Estilização com design moderno (Flexbox, paleta de cores fortes, espaçamentos amplos e tipografia com fontes do Google Fonts como Roboto e Poppins).
* **JavaScript (Vanilla):** Lógica de negócios dividida em módulos (ES6 Modules) para melhor organização.
* **jose (via CDN):** Biblioteca utilizada para criação e assinatura dos Tokens JWT.

---

## 📂 Estrutura do Projeto

A lógica principal foi dividida da seguinte forma:

* `scripts/application.js`: Atua como a "fábrica" principal. Responsável pela **Camada de Aplicação** (montagem dos dados e validações), pela **Camada de Apresentação** (geração do Token JWT) e pela **Camada de Sessão** (gerenciamento de portas e conexão).
* `scripts/OSI.js`: Orquestrador do fluxo. Monitora os eventos do usuário na interface, coleta os dados, aciona a montagem, cria os delays de processamento e salva o estado simulado em memória.
* `scripts/resultado.js`: Responsável por ler a memória do navegador (`localStorage`) e renderizar de forma visual e estruturada os resultados de cada uma das 3 camadas processadas.

---

## 💻 Como executar o projeto

Como o projeto utiliza tecnologias front-end nativas e importações via CDN, rodá-lo é muito simples:

1. Clone este repositório em sua máquina:
   ```bash
   git clone https://github.com/joaohenrique11z/redes_JH.git
   ```
2. Abra a pasta do projeto utilizando um servidor local (como a extensão **Live Server** no VS Code) por conta do uso de Módulos ES6 no JavaScript, o que pode ser bloqueado se aberto diretamente via "file://".
