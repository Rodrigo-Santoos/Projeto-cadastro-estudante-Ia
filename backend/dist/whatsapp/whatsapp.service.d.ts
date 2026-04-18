import { OnModuleInit } from '@nestjs/common';
import { ChatService } from '../chat/chat.service';
export declare class WhatsappService implements OnModuleInit {
    private chatService;
    private client;
    private qrCodeImage;
    private isConnected;
    constructor(chatService: ChatService);
    onModuleInit(): void;
    private initializeWhatsApp;
    getStatus(): {
        connected: boolean;
        qrCodeData: string | null;
    };
    sendInitialMessage(number: string): Promise<{
        success: boolean;
    }>;
}
