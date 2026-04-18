import { ChatService } from './chat.service';
export declare class ChatController {
    private readonly chatService;
    constructor(chatService: ChatService);
    handleChat(body: {
        message: string;
        data: any;
    }): Promise<{
        reply: any;
        data: any;
        completed: boolean;
    }>;
    handleUpload(file: any, dataString: string): Promise<{
        reply: any;
        data: any;
        completed: boolean;
    }>;
}
