import { Injectable, OnModuleInit } from '@nestjs/common';
import { Client, LocalAuth, MessageMedia } from 'whatsapp-web.js';
import * as qrcode from 'qrcode';
import { ChatService } from '../chat/chat.service';

/**
 * WhatsAppService
 * Escuta, baixa e converte multímidias do WhatsApp disparando pro ChatService
 */
@Injectable()
export class WhatsappService implements OnModuleInit {
  private client: Client;
  private qrCodeImage: string | null = null;
  private isConnected = false;

  constructor(private chatService: ChatService) {}

  onModuleInit() {
    this.initializeWhatsApp();
  }

  private initializeWhatsApp() {
    console.log('[WhatsApp] Iniciando cliente open-source...');
    this.client = new Client({
      authStrategy: new LocalAuth(),
      puppeteer: {
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      }
    });

    this.client.on('qr', async (qr) => {
      console.log('[WhatsApp] Novo código QR Gerado!');
      this.qrCodeImage = await qrcode.toDataURL(qr);
      this.isConnected = false;
    });

    this.client.on('ready', () => {
      console.log('[WhatsApp] O Cliente foi Conectado!');
      this.qrCodeImage = null; 
      this.isConnected = true;
    });

    this.client.on('message', async msg => {
      const chat = await msg.getChat();
      if (chat.isGroup) return;

      const sessionId = msg.from;
      if (!(global as any).whatsappSessions) (global as any).whatsappSessions = {};
      
      // FIX DO LOOP: Precisamos garantir que sempre q iniciar a memoria as escondidas, 
      // o whatsappPhone ja esteja setado. O sessionID vem no formato 551199999999@c.us
      if (!(global as any).whatsappSessions[sessionId]) {
         (global as any).whatsappSessions[sessionId] = { 
            telefone: sessionId.split('@')[0]
         };
      }
      const contextData = (global as any).whatsappSessions[sessionId];

      let msgTextToProcess = msg.body;

      // === PROCESSO DE MÍDIAS (Áudios Zap e PDF) ===
      if (msg.hasMedia) {
        const media = await msg.downloadMedia();
        if (media) {
           if (media.mimetype.includes('audio')) {
             console.log(`[WhatsApp] Áudio capturado de ${sessionId}. Enviando pra OpenAI Whisper...`);
             this.client.sendMessage(msg.from, "Estou ouvindo seu áudio, um segundo...");
             const buffer = Buffer.from(media.data, 'base64');
             const transcribedText = await this.chatService.transcribeAudio(buffer, media.mimetype);
             if (transcribedText) {
                msgTextToProcess = transcribedText;
                console.log(`[WhatsApp] Transcrição concluída: "${msgTextToProcess}"`);
             } else {
                this.client.sendMessage(msg.from, "Ops, não consegui entender o áudio. Pode digitar?");
                return;
             }
           } 
           else if (media.mimetype.includes('pdf')) {
             console.log(`[WhatsApp] PDF Currículo recebido de ${sessionId}. Extraindo dados...`);
             this.client.sendMessage(msg.from, "Estou lendo o seu currículo, um segundo...");
             const buffer = Buffer.from(media.data, 'base64');
             // Aciona a pipe especial de Currículos
             const response = await this.chatService.processResume(buffer, contextData);
             
             (global as any).whatsappSessions[sessionId] = response.data;
             if (response.reply) this.client.sendMessage(msg.from, response.reply);
             return; // Como processResume joga direto no loop, interrompemos o resto
           }
        }
      }

      console.log(`[WhatsApp] Processando texto final: ${msgTextToProcess}`);
      const response = await this.chatService.processChat(msgTextToProcess, contextData);

      if (response.completed) {
        delete (global as any).whatsappSessions[sessionId];
      } else {
        (global as any).whatsappSessions[sessionId] = response.data;
      }

      if (response.reply) {
        this.client.sendMessage(msg.from, response.reply);
      }
    });

    this.client.initialize();
  }

  public getStatus() {
    return { connected: this.isConnected, qrCodeData: this.qrCodeImage };
  }

  public async sendInitialMessage(number: string) {
      if (!this.isConnected) throw new Error("WhatsApp não está pareado.");
      
      let digits = number.replace(/\D/g, '');
      if (!digits.startsWith('55')) digits = '55' + digits;

      const numberId = await this.client.getNumberId(digits);
      if (!numberId) {
         throw new Error("Este número não parece estar registrado no WhatsApp.");
      }

      const cleanNumber = numberId._serialized; 

      // FIX: Injetar telefone fixo
      const startContext = { telefone: cleanNumber.split('@')[0] };
      const response = await this.chatService.processChat("Começar", startContext);
      
      if (!(global as any).whatsappSessions) (global as any).whatsappSessions = {};
      (global as any).whatsappSessions[cleanNumber] = response.data;

      await this.client.sendMessage(cleanNumber, "Olá! 🌟 O CIEE agradece pela sua escolha! " + response.reply);
      return { success: true };
  }
}
