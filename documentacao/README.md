# Documentação do Projeto CIEE - Cadastro de Estudantes Inteligente

Este projeto é um sistema inteligente de coleta de dados de estudantes para o CIEE. O objetivo principal do projeto é permitir que os usuários façam seu cadastro a partir de uma conversa com um assistente virtual ou simplesmente enviando um currículo (PDF), facilitando a extração dos dados pessoais através de Inteligência Artificial usando a API da OpenAI.

## Arquitetura do Sistema
O sistema é dividido em duas partes principais:
1. **Frontend (Angular)**: Responsável pela interface do usuário. Contém a lógica de chat, integração com reconhecimento de voz no navegador (Speech-to-Text) e disparo de requisições à API.
2. **Backend (NestJS + MySQL)**: Responsável por gerenciar os dados. Faz chamadas à API da OpenAI para extração de entidades (usando *GPT-4o-mini*), gerencia o processamento de PDFs (com *pdf-parse*) e realiza persistência de dados utilizando *TypeORM* com o banco de dados MySQL.

## Bibliotecas Principais

### Frontend (`/frontend`)
- **Angular (@angular/core, @angular/common)**: Framework base da aplicação, na versão standalone (sem módulos globais adicionais obrigatórios).
- **TypeScript**: Linguagem tipada principal de todo o projeto.
- **Web Speech API**: API nativa dos navegadores (como Chrome/Edge) usada para conversão de áudio para texto em tempo real (para acessibilidade no chat).

### Backend (`/backend`)
- **NestJS (@nestjs/common, @nestjs/core)**: Framework server-side escalável focado em arquitetura modular baseada em injeção de dependência técnica.
- **TypeORM (@nestjs/typeorm, typeorm)**: ORM poderoso do TypeScript, utilizado para modelar as entidades e se comunicar com o banco de dados relacional (MySQL).
- **MySQL (mysql2)**: Driver do banco de dados relacional usado pela aplicação.
- **pdf-parse**: Biblioteca utilizada para extrair em formato de texto o conteúdo de currículos enviados pelo usuário em formato `.pdf`.
- **OpenAI (via fetch nativo do Node.js)**: Utilizado para comunicação com a IA na interpretação de texto natural.

---

## Como Rodar o Projeto

Para rodar este projeto localmente, você precisará de:
- **Node.js** (v18 ou superior).
- **MySQL Server** (um banco chamado `student_bot` rodando na porta 3306 com usuário `root` e senha em branco para o ambiente de testes).

### Passo a Passo

1. Suba o banco de dados MySQL:
   Certifique-se de que o seu MySQL esteja rodando. Você deve ter algo rodando localmente (ex: XAMPP, MySQL Workbench, ou Docker) na porta típica `3306`. O backend cuidará de criar e alinhar as tabelas, pois está utilizando a funcionalidade `synchronize: true` do TypeORM.

2. Inicie o Backend:
   Abra um terminal na pasta `backend`:
   ```bash
   cd backend
   npm install
   npm run start
   ```
   *O backend deve iniciar em `http://localhost:3000`.*

3. Inicie o Frontend:
   Abra um terminal distinto na pasta `frontend`:
   ```bash
   cd frontend
   npm install
   npm start
   ```
   *O frontend deve iniciar em `http://localhost:4200`.*

Acesse no navegador: `http://localhost:4200` e o chat já estará visível para interação!

> Para detalhes específicos de estrutura e fluxos lógicos, consulte a [Documentação do Backend](./Backend.md) e a [Documentação do Frontend](./Frontend.md) nesta mesma pasta.
