import { Injectable } from '@angular/core';

@Injectable({
  // 'providedIn: root' significa que este serviço é um Singleton.
  // Haverá apenas uma instância rodando durante toda a vida da aplicação,
  // permitindo que os dados não se percam quando mudamos de tela.
  providedIn: 'root'
})
export class ApiService {
  // Endereço local onde nosso backend NestJS está rodando.
  private apiUrl = 'http://localhost:3000';

  /**
   * Envia a mensagem digitada/falada pelo usuário ao backend REST.
   * @param message A string da mensagem do usuário final
   * @param contextData Objeto de contexto (dados atuais que o LLM já sabe sobre nós)
   */
  async sendMessage(message: string, contextData: any) {
    try {
      // Faz uma comunicação via API (POST local) passando o contexto + mensagem em formato JSON
      const response = await fetch(`${this.apiUrl}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, data: contextData })
      });
      // Devolve para o Component a resposta transformada em Objeto JS Nativo
      return await response.json();
    } catch (e) {
      console.error(e);
      // Fallback em caso de falha severa na conexão API <-> Client
      return { reply: 'Erro ao conectar ao servidor NestJS. Verifique se o servidor backend e MySQL continuam rodando.', data: contextData, completed: false };
    }
  }

  /**
   * Envia um arquivo PDF para o backend
   * @param file Arquivo capturado puro pelo input do usuário
   * @param contextData Objeto de contexto antigo (para mesclarmos aos dados extraídos no Backend)
   */
  async uploadResume(file: File, contextData: any) {
    try {
      // Cria um encapsulador "FormData" adequado para transitar arquivos binários por POST
      const formData = new FormData();
      formData.append('file', file);
      // Os dados de contexto devem ser serializados como string pois FormData só transita text/binary
      formData.append('data', JSON.stringify(contextData));

      // Post direto na rota espelhada de UPLOAD que intercepta e converte com o Multer do NestJS
      const response = await fetch(`${this.apiUrl}/chat/upload`, {
        method: 'POST',
        body: formData
      });
      return await response.json();
    } catch (e) {
      console.error(e);
      // Retorno resiliente para manter a aplicação de pé caso haja problema de upload
      return { reply: 'Erro ao enviar o currículo ao servidor.', data: contextData, completed: false };
    }
  }

  async getWhatsappStatus() {
    try {
      const response = await fetch(`${this.apiUrl}/whatsapp/status`);
      return await response.json();
    } catch (e) {
       return { connected: false, qrCodeData: null };
    }
  }

  async startWhatsappFlow(number: string) {
    try {
      const response = await fetch(`${this.apiUrl}/whatsapp/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ number })
      });
      return await response.json();
    } catch (e) {
      return { success: false, error: "Servidor fora do ar." };
    }
  }
}
