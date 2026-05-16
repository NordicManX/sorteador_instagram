# 🏆 Insta-Sorteio — Sorteador de Instagram Resiliente

Plataforma de sorteios automatizados desenvolvida em **Next.js (App Router)** com integração ao **Supabase** para persistência de dados e à **StarAPI (via RapidAPI)** para raspagem de dados em tempo real. Este projeto foi arquitetado sob medida para o sorteio semanal de combos da parceria entre as marcas **Partiu Guaratuba** e **Yasai Lanches**.

O grande diferencial deste sistema é o seu **motor de busca resiliente de backend**, capaz de driblar as severas proteções contra Web Scraping do Instagram, contornar timeouts de rede e decodificar paginações camufladas da API de terceiros.

---

## 📋 Índice
1. [O "Porquê" da Arquitetura](#o-porque-da-arquitetura)
2. [Tecnologias Utilizadas](#tecnologias-utilizadas)
3. [A Jornada de Engenharia da API (Como Deciframos o Labirinto)](#a-jornada-de-engenharia-da-api-como-deciframos-o-labirinto)
4. [Estrutura Detalhada do Backend (`Route Handler`)](#estrutura-detalhada-do-backend-route-handler)
5. [Lógica de Negócio do Frontend (`Client Component`)](#logica-de-negocio-do-frontend-client-component)
6. [Persistência de Dados (Supabase Schema)](#persistencia-de-dados-supabase-schema)
7. [Variáveis de Ambiente Necessárias](#variaveis-de-ambiente-necessarias)
8. [Como Executar Localmente](#como-executar-localmente)

---

## 1. O "Porquê" da Arquitetura

Em vez de realizarmos as requisições para a API de raspagem diretamente pelo navegador do usuário (Frontend), optamos por criar um **Route Handler de Backend** (`/api/fetch-comments/route.ts`). 

### Vantagens dessa abordagem:
* **Segurança de Credenciais:** Nossas chaves privadas da RapidAPI (`X-RapidAPI-Key`) ficam totalmente ocultas e protegidas no servidor, impedindo que usuários mal-intencionados inspecionem a rede do navegador e roubem nossos créditos de API.
* **Bypass de CORS:** Evitamos erros de *Cross-Origin Resource Sharing* (CORS) que aconteceriam se o navegador tentasse bater diretamente no gateway da RapidAPI.
* **Centralização de Regras de Negócio:** Toda a filtragem de dados brutos e paginação pesada acontece no servidor de alta performance, enviando para o cliente um JSON limpo, leve e perfeitamente formatado.

---

## 2. Tecnologias Utilizadas

* **Framework:** Next.js 15+ (App Router) com compilador Turbopack para build ultrarápido.
* **Estilização:** Tailwind CSS (Dark Mode nativo com paleta Magenta/Zinc).
* **Banco de Dados (BaaS):** Supabase (PostgreSQL) para auditoria e histórico de vencedores.
* **Provedor de Scraping:** StarAPI (via RapidAPI Gateway), consumindo o motor bruto de raspagem da RocketAPI.

---

## 3. A Jornada de Engenharia da API (Como Deciframos o Labirinto)

Integrar dados do Instagram é uma das tarefas mais complexas da engenharia de software atual devido às constantes travas e mudanças da rede da Meta. Durante o desenvolvimento, superamos **quatro grandes barreiras técnicas**:

### 🧠 Descoberta 1: O Enigma da Nomenclatura da Rota
A documentação comercial da API listava o endpoint de comentários simplesmente como `/media_comments` ou `/get_media_comments`. No entanto, ambas as rotas retornavam `404 Not Found`. Ao investigarmos a fundo a aba de *Code Snippets (cURL)* gerada pelo próprio servidor do gateway, descobrimos que a rota real e literal mapeada pelo roteador era:
```http
POST [https://starapi1.p.rapidapi.com/instagram/media/get_comments](https://starapi1.p.rapidapi.com/instagram/media/get_comments)
