import { Controller, Get, Post, Body } from '@nestjs/common';
import { WhatsappService } from './whatsapp.service';

@Controller('whatsapp')
export class WhatsappController {
  constructor(private readonly whatsappService: WhatsappService) {}

  @Get('status')
  getStatus() {
    return this.whatsappService.getStatus();
  }

  @Post('start')
  async startFlow(@Body('number') number: string) {
    if (!number) return { success: false, error: "Número indefinido" };
    
    try {
      await this.whatsappService.sendInitialMessage(number);
      return { success: true };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }
}
