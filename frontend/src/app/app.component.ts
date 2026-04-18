import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChatComponent } from './chat/chat.component';
import { ApiService } from './services/api.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, ChatComponent, FormsModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'frontend';
  isChatOpen = false;
  
  // Whatsapp Status
  waConnected = false;
  qrCodeData: string | null = null;
  pollInterval: any;

  constructor(private apiService: ApiService) {}

  ngOnInit() {
    this.checkWhatsapp();
  }

  ngOnDestroy() {
    if (this.pollInterval) clearInterval(this.pollInterval);
  }

  openChat() {
    this.isChatOpen = true;
  }

  closeChat() {
    this.isChatOpen = false;
  }

  async checkWhatsapp() {
    const status = await this.apiService.getWhatsappStatus();
    this.waConnected = status.connected;
    this.qrCodeData = status.qrCodeData;

    // Se nao tiver conectado, tenta novamente de tempos em tempos (long polling simplificado)
    if (!this.waConnected) {
       if (!this.pollInterval) {
           this.pollInterval = setInterval(() => this.checkWhatsapp(), 2500);
       }
    } else {
       if (this.pollInterval) {
           clearInterval(this.pollInterval);
           this.pollInterval = null;
       }
    }
  }
}
