import { Controller, Post, Body, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ChatService } from './chat.service';

/**
 * ChatController
 * Mapeia as URLs baseadas no conceito '/chat'.
 * Serve como um "porteiro" para receber as conexões web da página local Angular que criamos.
 */
@Controller('chat')
export class ChatController {
  // O NestJS (através do Inversor de Dependência) garante que a classe ChatService
  // seja injetada aqui e possamos utilizá-la em todo o Controller.
  constructor(private readonly chatService: ChatService) {}

  /**
   * Função engatilhada sempre que o Frontend (Angular) disparar um POST para "http://localhost:3000/chat"
   * Usado para quando o usuário envia puro texto/áudio transcrito.
   * 
   * @Body body - Extrai variáveis do pacote Body mandado do front.
   */
  @Post()
  async handleChat(@Body() body: { message: string; data: any }) {
    // Encaminha a mensagem direta para a camada logica que se comunica o ChatGPT
    return this.chatService.processChat(body.message, body.data);
  }

  /**
   * Função para Rota de Upload de PDF "http://localhost:3000/chat/upload"
   * O FileInterceptor() é um intermediador importado da biblioteca 'multer' que pega
   * do FormData especificamente a chave escrita 'file' convertendo-a para os dados cruzeis.
   */
  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async handleUpload(@UploadedFile() file: any, @Body('data') dataString: string) {
    let contextData = {};
    if (dataString) {
      // Como o FormData usado no front-end não transita objetos aninhados originais JSON,
      // e sim uma "string JSON", nós fazemos o parse aqui de volta para um Objeto javascript.
      try { contextData = JSON.parse(dataString); } catch(e) {}
    }
    
    // Se a pessoa clicou no botão anexar no Angular mas nenhum arquivo de fato subiu
    if (!file) return { reply: "Arquivo não encontrado.", data: contextData, completed: false };
    
    // Entrega o buffer do PDF extraído do Multer e nossos dados existentes para a IA processar.
    return this.chatService.processResume(file.buffer, contextData);
  }
}
