import { Module } from '@nestjs/common';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { StudentModule } from '../student/student.module';
import { QdrantModule } from '../qdrant/qdrant.module';

@Module({
  imports: [StudentModule, QdrantModule],
  controllers: [ChatController],
  providers: [ChatService],
  exports: [ChatService]
})
export class ChatModule {}
