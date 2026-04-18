# Cadastro Inteligente de Estudantes com IA 🎓🤖

Sistema de cadastro de estudantes via chatbot com Inteligência Artificial, desenvolvido para substituir formulários extensos, reduzir fricção no processo de onboarding e melhorar a experiência do usuário.

---

## 🚀 Problema Resolvido

Processos tradicionais de cadastro costumam ser:

- Longos e cansativos  
- Pouco intuitivos  
- Propensos a abandono no meio do fluxo  
- Suscetíveis a erros de preenchimento  
- Dependentes de validações manuais  

---

## 💡 Solução Proposta

Um chatbot inteligente conduz o estudante durante todo o processo de cadastro, coletando informações de forma natural e progressiva.

Durante a conversa, a IA:

- Solicita dados passo a passo  
- Valida CPF, e-mail e telefone  
- Corrige inconsistências  
- Reduz atrito no preenchimento  
- Finaliza o cadastro automaticamente no banco de dados  

---

## ✨ Principais Funcionalidades

- Cadastro conversacional via chat  
- Coleta progressiva de dados  
- Validação automática de informações  
- Persistência em banco MySQL  
- Painel administrativo  
- Histórico de conversas  
- Retomada de cadastro interrompido  
- Integração com IA generativa  
- Busca vetorial com Qdrant  

---

## 🛠️ Tecnologias Utilizadas

### Backend

- Node.js  
- NestJS  
- TypeScript  
- MySQL  
- OpenAI API  
- Qdrant Vector Database  

### Frontend

- Angular 17+  
- TypeScript  
- HTML5  
- CSS3  

### Infraestrutura

- Docker  
- Git  

---

## 🧱 Arquitetura da Solução

```text
Frontend Angular
      ↓
API NestJS
      ↓
IA Generativa + Qdrant
      ↓
MySQL
```
## 📷 Screenshots

Adicionar imagens em `/docs`

Sugestões:

- Tela inicial do chatbot  
- Fluxo de cadastro  
- Painel administrativo  
- Banco populado  
- Dashboard de métricas  

---
## 🔑 Configuração da Chave da OpenAI

Para utilizar os recursos de Inteligência Artificial deste projeto, é necessário gerar sua própria chave de API da OpenAI.

### Como criar sua chave:

1. Acesse o portal oficial da OpenAI:  
https://platform.openai.com/api-keys

2. Faça login na sua conta.

3. Clique em **Create new secret key**.

4. Copie a chave gerada.

5. no codigo subistitua pela sua chave nessa variavel
```env
OPENAI_API_KEY=****************
```
---


# ▶️ Como Executar o Projeto

## Pré-requisitos

Instale os seguintes itens na máquina:

- Node.js (versão LTS recomendada)  
- Git  
- Google Chrome  
- Docker Desktop  
- MySQL Server / Workbench  

---

## Banco de Dados

Crie manualmente o schema:

```sql
ciee_cadastro
```

---

## Subindo o Qdrant (Docker)

```bash
docker run -p 6333:6333 -v qdrant_storage:/qdrant/storage -d qdrant/qdrant
```

---

## Rodando o Backend

Entre na pasta `backend`:

```bash
npm install
npm run start:dev
```

---

## Rodando o Frontend

Entre na pasta `frontend`:

```bash
npm install -g @angular/cli
npm install
ng serve
```

---

## Acesso

Abra no navegador:

```text
http://localhost:4200
```

---

## ⚠️ Observações Importantes

### WhatsApp não abriu?

Será necessário gerar novo QR Code e reconectar.

### Microfone bloqueado?

Permita acesso no navegador.

### Qdrant não conectou?

Verifique se o Docker Desktop está ativo.

---

## 📌 Objetivo do Projeto

Este projeto foi criado como protótipo de inovação para modernizar o processo de matrícula e cadastro estudantil, utilizando IA conversacional para aumentar eficiência operacional e melhorar a experiência do estudante.

---

## 👨‍💻 Autor

**Rodrigo Oliveira**
