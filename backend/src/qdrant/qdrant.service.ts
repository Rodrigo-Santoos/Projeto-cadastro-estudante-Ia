import { Injectable, OnModuleInit } from '@nestjs/common';
import { QdrantClient } from '@qdrant/js-client-rest';
import * as fs from 'fs';
import * as path from 'path';

// Re-usando as configurações do ambiente simulado. (Em produção, coloque no .env)
const OPENAI_API_KEY = '********************************************'; //coloque a sua chave da openIA aqui


@Injectable()
export class QdrantService implements OnModuleInit {
  private client: QdrantClient;
  private readonly COLLECTION_NAME = 'escolas_brasil';

  constructor() {
    this.client = new QdrantClient({ url: 'http://localhost:6333' });
  }

  async onModuleInit() {
    await this.initCollection();
    await this.seedData();
  }

  // Gera o Vector numérico para um texto da Faculdade usando a OpenAI.
  private async createEmbedding(text: string): Promise<number[]> {

    //url da documentacao openIa https://developers.openai.com/api/docs/models/text-embedding-3-small

    const res = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        input: text,
        model: 'text-embedding-3-small'
      })
    });
    const data = await res.json();
    return data.data[0].embedding;
  }

  // Garante que o Container do Qdrant possui nossa Coleção para Escolas
  private async initCollection() {
    try {
      //verifica quais collections tem no Qdrant
      const collections = await this.client.getCollections();
      const exists = collections.collections.some(c => c.name === this.COLLECTION_NAME);

      if (!exists) {
        console.log('[Qdrant] Criando nova Collection: ' + this.COLLECTION_NAME);

        //criando a collection escolas_brasil (tipo um create table)
        await this.client.createCollection(this.COLLECTION_NAME, {
          vectors: {
            size: 1536, // Tamanho padrão do text-embedding-ada e small da openai
            distance: 'Cosine' // Ideal para semântica natural
          }
        });
      }
    } catch (e) {
      console.log('[Qdrant] Alerta: O servidor Qdrant não está rodando no Docker localhost:6333.');
      console.log(e.message);
    }
  }

  // Seeding: Lê nosso JSON de escolas base e insere no Banco Vetorial.
  private async seedData() {
    try {
      const info = await this.client.getCollection(this.COLLECTION_NAME);
      if ((info as any).vectors_count > 0 || (info as any).points_count > 0) return;

      console.log('[Qdrant] Iniciando injeção de escolas brasileiras em vetores...');
      const filePath = path.join(process.cwd(), 'src/qdrant/schools.mock.json');
      if (fs.existsSync(filePath)) {
        const fileData = fs.readFileSync(filePath, 'utf-8');
        const schools = JSON.parse(fileData);

        const points = await Promise.all(schools.map(async (school: any) => {
          const vector = await this.createEmbedding(school.name);
          return {
            id: school.id,
            vector: vector,
            payload: { name: school.name, state: school.state }
          };
        }));

        await this.client.upsert(this.COLLECTION_NAME, {
          wait: true,
          points: points
        });
        console.log('[Qdrant] Escolas Injetadas com Sucesso!');
      }
    } catch (e) {
      console.error("[Qdrant] SEED ERRO:", e);
    }
  }

  /**
   * Busca Inteligente Semântica.
   * Procura exatamente por escolas parecidas com o que o usuário disse (ex: "Unicamp" com "Universidade Est.").
   * Além disso, faz o filtro absoluto (Match payload) para garantir que apenas as escolas do DDD tragam.
   */
  async searchSchoolInUserState(schoolSearch: string, stateUF: string) {
    try {
      const searchVector = await this.createEmbedding(schoolSearch);
      const result = await this.client.search(this.COLLECTION_NAME, {
        vector: searchVector,
        limit: 3, // Pega os 3 mais próximos do estado
        filter: {
          must: [
            { key: "state", match: { value: stateUF } }
          ]
        }
      });

      if (result.length > 0) {
        // Devolve o nome oficial exato da Instituicao pro ChatGPT processar
        return result.map(hit => (hit.payload as any)?.name);
      }
      return null;
    } catch (e) {
      console.error("Qdrant Search Error:", e.message);
      return null;
    }
  }
}
