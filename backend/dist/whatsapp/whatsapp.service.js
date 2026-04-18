"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WhatsappService = void 0;
const common_1 = require("@nestjs/common");
const whatsapp_web_js_1 = require("whatsapp-web.js");
const qrcode = __importStar(require("qrcode"));
const chat_service_1 = require("../chat/chat.service");
let WhatsappService = class WhatsappService {
    chatService;
    client;
    qrCodeImage = null;
    isConnected = false;
    constructor(chatService) {
        this.chatService = chatService;
    }
    onModuleInit() {
        this.initializeWhatsApp();
    }
    initializeWhatsApp() {
        console.log('[WhatsApp] Iniciando cliente open-source...');
        this.client = new whatsapp_web_js_1.Client({
            authStrategy: new whatsapp_web_js_1.LocalAuth(),
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
        this.client.on('message', async (msg) => {
            const chat = await msg.getChat();
            if (chat.isGroup)
                return;
            const sessionId = msg.from;
            if (!global.whatsappSessions)
                global.whatsappSessions = {};
            if (!global.whatsappSessions[sessionId]) {
                global.whatsappSessions[sessionId] = {
                    telefone: sessionId.split('@')[0]
                };
            }
            const contextData = global.whatsappSessions[sessionId];
            let msgTextToProcess = msg.body;
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
                        }
                        else {
                            this.client.sendMessage(msg.from, "Ops, não consegui entender o áudio. Pode digitar?");
                            return;
                        }
                    }
                    else if (media.mimetype.includes('pdf')) {
                        console.log(`[WhatsApp] PDF Currículo recebido de ${sessionId}. Extraindo dados...`);
                        this.client.sendMessage(msg.from, "Estou lendo o seu currículo, um segundo...");
                        const buffer = Buffer.from(media.data, 'base64');
                        const response = await this.chatService.processResume(buffer, contextData);
                        global.whatsappSessions[sessionId] = response.data;
                        if (response.reply)
                            this.client.sendMessage(msg.from, response.reply);
                        return;
                    }
                }
            }
            console.log(`[WhatsApp] Processando texto final: ${msgTextToProcess}`);
            const response = await this.chatService.processChat(msgTextToProcess, contextData);
            if (response.completed) {
                delete global.whatsappSessions[sessionId];
            }
            else {
                global.whatsappSessions[sessionId] = response.data;
            }
            if (response.reply) {
                this.client.sendMessage(msg.from, response.reply);
            }
        });
        this.client.initialize();
    }
    getStatus() {
        return { connected: this.isConnected, qrCodeData: this.qrCodeImage };
    }
    async sendInitialMessage(number) {
        if (!this.isConnected)
            throw new Error("WhatsApp não está pareado.");
        let digits = number.replace(/\D/g, '');
        if (!digits.startsWith('55'))
            digits = '55' + digits;
        const numberId = await this.client.getNumberId(digits);
        if (!numberId) {
            throw new Error("Este número não parece estar registrado no WhatsApp.");
        }
        const cleanNumber = numberId._serialized;
        const startContext = { telefone: cleanNumber.split('@')[0] };
        const response = await this.chatService.processChat("Começar", startContext);
        if (!global.whatsappSessions)
            global.whatsappSessions = {};
        global.whatsappSessions[cleanNumber] = response.data;
        await this.client.sendMessage(cleanNumber, "Olá! 🌟 O CIEE agradece pela sua escolha! " + response.reply);
        return { success: true };
    }
};
exports.WhatsappService = WhatsappService;
exports.WhatsappService = WhatsappService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [chat_service_1.ChatService])
], WhatsappService);
//# sourceMappingURL=whatsapp.service.js.map