# Documentação Técnica do Frontend (Angular)

A interface do usuário do Cadastro de Estudantes é uma SPA (Single Page Application) construída em Angular 17+ utilizando arquitetura Standalone Components para reduzir a limitação de configuração de módulos (app.module.ts). O FrontEnd conversa diretamente com a API descrita no [Backend](./Backend.md) enviando JSON e Arquivos e retornando uma interface de balões de mensagens.

## Arquitetura de Componentes e Serviços

O projeto frontend inteiro é agrupado em pequenos serviços injetáveis e componentes assíncronos que mantêm a estrutura enxuta.

### 1. `ChatComponent` (`frontend/src/app/chat/chat.component.ts`)

Este é o único componente da aplicação que controla todas as visualizações (texto e o campo de input e botões de áudio e anexo) e os eventos do DOM.

#### Funcionalidades Chave:
- **Gerenciamento de Estado**: Define propriedades como `messages` e `contextData` e `isRecording`. Sempre que um balão é inserido (independente de ser Bot ou User), o Angular se carrega de atualizar na tela. O atributo vital `contextData` é usado como memória, armazenando cada dado de cadastro preenchido que repassamos para o backend a cada requisição. Sem isso o Bot não lembraria o CPF quando perguntasse o semestre.
- **Scroll Automaizado**: A vida útil `ngAfterViewChecked` sempre assegura que ao enviar mensagens o usuário role até a parte final usando o container mapeado pelo `@ViewChild('chatContainer')`.
- **Transcrição de Áudio (Web Speech API)**: Um microfone animável (lógica do botão) é exposto na função `toggleVoice()`. Quando acionado, ele começa a usar o objeto `webkitSpeechRecognition` para converter som em texto e preencher automaticamente a textbox (input) com tudo que a pessoa disse sem precisar digitar a frase (como, "Meu nome é João, e nasci em 10 de maio de 2002.").
- **Manipulação de PDF**: A ação do botão *Clip* (`onFileSelected`) mapeia todos os bytes e arquivos locais em `<input type="file">` injetando num *FormData*.

### 2. `ApiService` (`frontend/src/app/services/api.service.ts`)

O serviço abstrai as comunicações web, fornecendo duas rotinas simples e diretas.
- **`sendMessage(message, contextData)`**: Empacota o JSON local do Front e o estado da mensagem no corpo de requisições do tipo POST. Repassa o retorno para atualizar a View. 
- **`uploadResume(file, contextData)`**: Usa a estrutura `FormData` contendo um blob (arquivo anexado do computador) para encaminhar as chaves binárias para a rota de `upload` do chat. Essa abstração oculta erros de parse e conexões de rotina (incluindo falha local de backend e banco).
