import { Module } from '@nestjs/common';
import { WhatsappService } from './whatsapp.service';
import { WhatsappController } from './whatsapp.controller';
import { ChatModule } from '../chat/chat.module';

@Module({
  imports: [ChatModule], // Importa para podermos usar o ChatService
  controllers: [WhatsappController],
  providers: [WhatsappService],
})
export class WhatsappModule {}
