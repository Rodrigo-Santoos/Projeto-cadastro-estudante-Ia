import { Component, ElementRef, ViewChild, AfterViewChecked, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../services/api.service';

// Interface que prevê a estrutura de cada bolha de diálogo no navegador
// Mostrando confirmRequired no momento final que os dados vitais forem preenchidos
interface Message {
  text: string;
  sender: 'bot' | 'user';
  showConfirm?: boolean;
}

@Component({
  selector: 'app-chat',
  standalone: true, // Arquitetura moderna sem Modules, otimizada para SPAs escaláveis
  imports: [CommonModule, FormsModule],
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css']
})
export class ChatComponent implements AfterViewChecked {
  // Conecta diretamente ao container de conversas HTML (#chatContainer) para rolar a tela via TypeScript
  @ViewChild('chatContainer') private chatContainer!: ElementRef;

  // Utilizado primariamente caso precisemos emitir um sinal pro Header que o chat abaixou
  @Output() closeChat = new EventEmitter<void>();

  // Array reativo, onde inicializamos a primeira mensagem de recepção sem ajuda do Nodejs
  messages: Message[] = [
    { text: 'Olá 👋! Sou o assistente operacional do CIEE. Você prefere continuar o cadastro por aqui ou pelo WhatsApp?', sender: 'bot' }
  ];

  // Variáveis para controle de fluxo
  flowSelected: 'web' | 'whatsapp' | null = null;
  whatsappNumber: string = '';

  // Ligado no input bidirecional [(ngModel)] na visualização HTML
  userInput: string = '';
  // Esse dado sobe e desce, atuando como o estado cognitivo para a API saber o que ainda falta
  contextData: any = {};

  // Controle de gravação ativada (microfone vermelho)
  isRecording: boolean = false;

  // Objeto Global do tipo webkitSpeechRecognition, da biblioteca padrão dos navegadores GoogleChrome
  private recognition: any;

  // Injeção do nosso próprio serviço que conecta com o Nest!
  constructor(private api: ApiService) {
    this.setupSpeechRecognition(); // Aciona já no construtor para capturar acesso as bibliotecas nativas
  }

  // Notificar pai Angular que o chat deve abaixar
  onClose() {
    this.closeChat.emit();
  }

  // Hook angular: Ciclo rodado *sempre* que uma mudança reflete nas views, ideal para o Autoscroll
  ngAfterViewChecked() {
    this.scrollToBottom();
  }

  // Desce a barra lateral até a altura total visível (útil após grandes mensagens)
  scrollToBottom(): void {
    try {
      this.chatContainer.nativeElement.scrollTop = this.chatContainer.nativeElement.scrollHeight;
    } catch (err) { }
  }

  // Cria, comanda e tipifica o reconhecedor de microfone a eventos reativos
  setupSpeechRecognition() {
    // Busca a variável SpeechRecognition global presente em Webkits suportados
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      this.recognition = new SpeechRecognition();
      // Transcrição em formato PT-Brasil
      this.recognition.lang = 'pt-BR';
      this.recognition.interimResults = false;
      this.recognition.maxAlternatives = 1;

      // Troca nossa variável de gravação em andamento via interface
      this.recognition.onstart = () => {
        this.isRecording = true;
      };

      // Recebe de volta o string literal do que a pessoa falou quando ela finalizar o fôlego
      this.recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        // Pega ou mescla ao que foi adicionado pela barra de escrita
        this.userInput = (this.userInput + ' ' + transcript).trim();
      };

      this.recognition.onend = () => {
        this.isRecording = false;
      };

      this.recognition.onerror = (event: any) => {
        console.error('Erro na gravação de voz:', event.error);
        this.isRecording = false;
      };
    }
  }

  // Acionado pelo ícone do microfone na visualização HTML
  toggleVoice() {
    if (!this.recognition) {
      alert('Reconhecimento de voz não suportado neste navegador, ele funciona melhor no Chrome ou Edge.');
      return;
    }
    if (this.isRecording) {
      this.recognition.stop();
      this.isRecording = false;
    } else {
      // Dispara a IA visualmente para a pessoa entender o que vamos pedir e abre gravação
      this.messages.push({
        text: 'Vi que vai mandar um áudio, fale sobre essas informações pra continuar o cadastro: Nome completo, E-mail, CPF, Escola, Semestre e Data de Nascimento.',
        sender: 'bot'
      });
      this.scrollToBottom();
      this.recognition.start();
    }
  }

  // Botão automático "Sim" que preenche o dialog final caso os dados estarem conferentes
  confirmData() {
    this.userInput = 'Sim, confirmo os dados.';
    this.sendMessage();
  }

  // Escolha do Botão
  selectFlow(flow: 'web' | 'whatsapp') {
    this.flowSelected = flow;
    if (flow === 'web') {
      this.messages.push({ text: 'Continuarei por aqui.', sender: 'user' });
      this.messages.push({ text: 'Perfeito! Me dê seu Nome Completo pra começarmos.', sender: 'bot' });
      this.scrollToBottom();
    } else {
      this.messages.push({ text: 'Prefiro WhatsApp.', sender: 'user' });
      this.messages.push({ text: 'Ok, por favor digite seu número com DDD para continuarmos o cadastro por la :D (ex: 11999999999):', sender: 'bot' });
      this.scrollToBottom();
    }
  }

  // Enviar numero de WA
  async submitWhatsApp() {
    if (!this.whatsappNumber.trim()) return;
    const num = this.whatsappNumber;
    this.messages.push({ text: num, sender: 'user' });
    this.whatsappNumber = '';

    // Despacha o POST
    const res = await this.api.startWhatsappFlow(num);

    if (res.success) {
      this.messages.push({ text: 'Tudo Certo! Acabei de mandar um abraço pra você lá no WhatsApp. Dê uma olhada no celular!', sender: 'bot' });
    } else {
      this.messages.push({ text: `Ops, não consegui iniciar a conversa: ${res.error}`, sender: 'bot' });
    }
    this.scrollToBottom();
  }

  // Enviar nossa caixa de texto (Input limpo ou áudio mesclado de trás)
  async sendMessage() {
    if (!this.userInput.trim() && !this.whatsappNumber.trim()) return;

    if (this.flowSelected === 'whatsapp') {
      this.submitWhatsApp();
      return;
    }

    const messageText = this.userInput;
    // Adicionar renderização de diálogo no lado Direito (user box)
    this.messages.push({ text: messageText, sender: 'user' });
    this.userInput = '';

    // Envio para nossa camada de controle (Nest) e aguardamos o bot
    const response = await this.api.sendMessage(messageText, this.contextData);

    // Sobreescreve o conhecimento global com tudo novo que a IA adquiriu (Ex: capturou um CPF? A API embutiu no response data)
    this.contextData = response.data;

    // Insere o diálogo no lado esquerdo (bot box) com botões se apropriado
    this.messages.push({
      text: response.reply,
      sender: 'bot',
      showConfirm: response.data?.confirmationNeeded
    });

    // Se a IA salvou e sinalizou fim da etapa "completed=true", redefina pro zero
    if (response.completed) {
      this.contextData = {};
    }
  }

  // Listener para capturar escolha do Dialog System (quando usuário envia o anexo via Clips)
  async onFileSelected(event: any) {
    const file: File = event.target.files[0];
    if (file) {
      // Simulação na bolha temporária para ser responsivo
      this.messages.push({ text: `Enviando currículo: ${file.name}...`, sender: 'user' });

      // Envia os bytes (arquivo nativo) pela API com o estado atual de chat
      const response = await this.api.uploadResume(file, this.contextData);

      this.contextData = response.data;

      // Empilha a resposta analisada para o User conferir
      this.messages.push({
        text: response.reply,
        sender: 'bot',
        showConfirm: response.data?.confirmationNeeded
      });

      if (response.completed) {
        this.contextData = {};
      }
    }
  }
}
