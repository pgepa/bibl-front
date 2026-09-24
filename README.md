# 🏛️ SISBIB PGE-PA — Frontend (`bibl-front`)

Interface Web moderna e responsiva para o **Sistema Integrado de Bibliotecas e Gestão de Acervo Documental (SISBIB)** da **Procuradoria Geral do Estado do Pará (PGE-PA)**.

---

## 📌 Visão Geral

Desenvolvido em **Angular** com **Tailwind CSS**, o `bibl-front` oferece uma experiência visual limpa, fluida e acessível para consulta pública de obras e gestão operacional interna por servidores e bibliotecários da PGE-PA.

### Destaques da Interface:
- **Identidade Visual Oficial:** Brasão do Estado do Pará integrado no cabeçalho/menu lateral e como favicon no navegador.
- **Catálogo com Dupla Visão:**
  - *Visão Resumida (Padrão SISBIB):* Registro de Tombo, Classificação, Título, Autor, Descritores e Status.
  - *Visão Detalhada:* Ficha catalográfica completa (Editora, Edição, Ano, Local, Idioma, Páginas, ISBN).
- **Gestão de Leitores & Servidores:** Controle de matrícula, lotação/setor e perfil de acesso.
- **Circulação & Empréstimos:** Registro ágil com atendente responsável, código identificador de transação (`TRX`) e controle de renovações.
- **Painel Analítico de Relatórios:**
  - Filtros dinâmicos por leitor, status e atalhos rápidos de período (*Hoje*, *7 dias*, *30 dias*, *Este mês* e *Todo o histórico*).
  - Bento Grid com 6 indicadores estatísticos.
  - Rankings dos servidores com mais leituras e das obras mais requisitadas.
  - Exportação oficial de relatórios em **PDF formatado** (via `pdfMake`) com cabeçalho institucional da PGE-PA e paginação oficial.
- **Autenticação JWT Integrada:** Sessão reativa com Signals, interceptor HTTP automático para Bearer Token, chip de usuário no topo e controle de visibilidade baseado em perfil (`ROLE_ADMIN`).
- **Atalho SIEB:** Acesso direto ao sistema corporativo SIEB PGE-PA na barra de navegação.

---

## 🛠️ Tecnologias Utilizadas

- **Framework:** Angular 22+ (Standalone Components, Signals, Reactive Forms)
- **Estilização:** Tailwind CSS + CSS Moderno com Design System institucional
- **Geração de Documentos:** `pdfMake`
- **Comunicação:** Angular HttpClient com Interceptor funcional
- **Gerenciador de Pacotes:** Node.js (npm)

---

## ⚙️ Pré-requisitos

1. **Node.js** (versão 20 LTS ou superior recomendada):
   ```bash
   node -v
   ```
2. **npm** (versão 10 ou superior):
   ```bash
   npm -v
   ```
3. **Backend (`bibl-back`) em execução** na porta `8080` (para consumo da API REST).

---

## 🔐 Configuração de Ambiente (`.env`)

A aplicação conta com arquivo de configuração de portas e endpoints:

```bash
cp .env.example .env
```

Parâmetros disponíveis:
- `PORT`: Porta do servidor local de desenvolvimento (padrão: `4200`).
- `HOST`: Host de escuta (padrão: `0.0.0.0`).
- `API_URL`: Endereço da API backend (padrão: `http://localhost:8080`).
- `SIEB_EXTERNAL_URL`: Endereço do portal SIEB (`http://esap.pge.pa.gov.br:5000/`).

---

## 🚀 Como Executar o Frontend

### Passo 1: Entrar na pasta do frontend
```bash
cd bibl-front
```

### Passo 2: Instalar as dependências (primeira vez)
```bash
npm install
```

### Passo 3: Iniciar o servidor de desenvolvimento
```bash
npm start
```

O comando executará o Angular Dev Server com suporte ao proxy configurado em `proxy.conf.json`, encaminhando as chamadas para a API backend (`http://localhost:8080`).

Acesse no seu navegador: **`http://localhost:4200/`**

---

## 🔑 Acesso ao Sistema (Login)

Para acessar áreas restritas de administração (como cadastro de usuários, empréstimos e relatórios), faça login em **[http://localhost:4200/login](http://localhost:4200/login)**:

- **E-mail:** `victor@gmail.com` | **Senha:** `123456`
- **E-mail alternativo:** `admin@bibl.gov.br` | **Senha:** `123456`

---

## 📦 Scripts Disponíveis

| Comando | Descrição |
|---|---|
| `npm start` | Inicia o servidor local de desenvolvimento com proxy em `http://localhost:4200/`. |
| `npm run build` | Compila os arquivos para produção na pasta `dist/bibl-front`. |
| `npm test` | Executa a suíte de testes unitários com Vitest. |
