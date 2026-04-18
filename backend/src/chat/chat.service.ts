import { Injectable } from '@nestjs/common';
import { StudentService } from '../student/student.service';
import { QdrantService } from '../qdrant/qdrant.service';
// @ts-ignore
import * as pdfParse from 'pdf-parse';

const OPENAI_API_KEY = '********************************************'; //coloque a sua chave da openIA aqui


@Injectable()
export class ChatService {
  constructor(
    private studentService: StudentService,
    private qdrantService: QdrantService
  ) { }

  private async callOpenAIFunctions(messages: any[], tools: any[]) {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages,
        tools,
        tool_choice: "auto",
        temperature: 0.1
      })
    });
    if (!response.ok) throw new Error(await response.text());
    const data = await response.json();
    return data.choices[0].message;
  }

  private async callOpenAI(messages: any[], temperature: number = 0.7) {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({ model: 'gpt-4o-mini', messages, temperature })
    });
    const data = await response.json();
    return data.choices[0].message.content;
  }

  private getUFfromPhone(phone: string): string {
    if (!phone) return 'SP';
    const ddd = phone.substring(0, 2);
    const ufMap: Record<string, string> = {
      '11': 'SP', '12': 'SP', '13': 'SP', '14': 'SP', '15': 'SP', '16': 'SP', '17': 'SP', '18': 'SP', '19': 'SP',
      '21': 'RJ', '22': 'RJ', '24': 'RJ', '27': 'ES', '28': 'ES', '31': 'MG', '32': 'MG', '33': 'MG', '34': 'MG', '35': 'MG', '37': 'MG', '38': 'MG',
      '61': 'DF', '51': 'RS', '53': 'RS', '54': 'RS', '55': 'RS'
    };
    return ufMap[ddd] || 'SP';
  }

  // --- ENGINE DE MULTIMÍDIA API (ZAP E WEB) --- //

  public async transcribeAudio(audioBuffer: Buffer, mimetype: string): Promise<string | null> {
    try {
      const ext = mimetype.includes('ogg') ? 'ogg' : 'm4a';
      const fileBlob = new Blob([audioBuffer as any], { type: mimetype });

      const formData = new FormData();
      formData.append('file', fileBlob, `audio.${ext}`);
      formData.append('model', 'whisper-1');
      formData.append('language', 'pt');

      const res = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`
        },
        body: formData as any
      });

      if (!res.ok) {
        console.error(await res.text());
        return null;
      }
      const data = await res.json();
      return data.text;
    } catch (e) {
      console.error(e);
      return null;
    }
  }

  public async processResume(pdfBuffer: Buffer, contextData: any = {}) {
    try {
      const data = await pdfParse(pdfBuffer);
      const textExtracted = data.text;

      // Passa o currículo brutal pro robo tentar completar os campos que ele achar!
      return await this.processChat(`Estou enviando meu currículo. Extraia os dados daqui: \n ${textExtracted}`, contextData);
    } catch (e) {
      return { reply: "Tive um problema ao ler as letras do seu PDF. :( Pode me falar os dados por texto?", data: contextData, completed: false };
    }
  }

  /**
   * processChat V2: Anti-Alucinação com Tools API e Busca Qdrant
   */
  async processChat(userMessage: string, contextData: any = {}) {

    if (contextData.confirmationNeeded && userMessage.toLowerCase().includes('sim')) {
      try {
        const dbData = { ...contextData };
        delete dbData.confirmationNeeded;
        delete dbData.telefone;

        if (dbData.semester) dbData.semester = parseInt(dbData.semester, 10);
        if (dbData.cpf) dbData.cpf = dbData.cpf.replace(/\D/g, '').substring(0, 14);

        const existingUser = await this.studentService.findByEmailOrCpf(dbData.email, dbData.cpf);
        if (existingUser) {
          return { reply: "E-mail ou CPF já cadastrado no banco do CIEE. Atualizei os dados antigos pra você! Quer ajustar mais algo?", data: { ...contextData }, completed: false };
        }
        await this.studentService.create(dbData);
        return { reply: "Cadastro finalizado com sucesso! Os seus dados foram selados na sua conta do CIEE. Foi um prazer e te vejo depois!", data: dbData, completed: true };
      } catch (e) {
        return { reply: "Erro ao salvar no banco. " + e.message, data: contextData, completed: false };
      }
    }

    let bypassExtraction = false;

    // Tratamento da escolha de escola
    if (contextData.pendingSchoolOptions) {
      const userChoice = parseInt(userMessage.trim(), 10);
      if (!isNaN(userChoice) && userChoice >= 1 && userChoice <= contextData.pendingSchoolOptions.length + 1) {
        if (userChoice <= contextData.pendingSchoolOptions.length) {
          // Escoha de escola encontrada no qdrant
          contextData.school = contextData.pendingSchoolOptions[userChoice - 1];
        } else {
          // Escoha NENHUMA
          contextData.skipQdrant = true;
          delete contextData.pendingSchoolOptions;
          return {
            reply: "Entendi. Pode me informar qual é o nome oficial e completo da sua instituição para registrarmos?",
            data: { ...contextData },
            completed: false
          };
        }
        delete contextData.pendingSchoolOptions;
        bypassExtraction = true;
      } else {
        return {
          reply: `Opção inválida. Por favor, digite apenas o número correspondente (1 a ${contextData.pendingSchoolOptions.length + 1}).`,
          data: { ...contextData },
          completed: false
        };
      }
    }

    const required = ['fullName', 'email', 'telefone', 'cpf', 'school', 'semester', 'birthDate'];

    // Ferramenta de injeção direta de variaveis via Inteligencia
    const schemaTool = {
      type: "function",
      function: {
        name: "save_student_data",
        description: "Salva os dados do usuário extraídos da mensagem ou currículo.",
        parameters: {
          type: "object",
          properties: {
            fullName: { type: "string", description: "Nome completo do usuário" },
            email: { type: "string", description: "E-mail de contato" },
            cpf: { type: "string", description: "CPF contendo no minimo 11 números" },
            school: { type: "string", description: "Faculdade ou escola atual" },
            semester: { type: "integer", description: "Semestre ou périodo numérico" },
            birthDate: { type: "string", description: "Data de nascimento no formato YYYY-MM-DD" },
            telefone: { type: "string", description: "Número do telefone do usuário, contendo DDD. Ex: 11999999999" }
          }
        }
      }
    };

    const sysPrompt = `Você é preenchedor de fichas avançado. O input contem mensagens em que o usuário informa seus dados de cadastro.
    Aja imediatamente extraindo a exata variável que o usuário informar (como seu Número de Telefone, Nome, Email, Escola, Data Nascimento, etc). Não crie dados fictícios.`;

    if (!bypassExtraction) {
      try {
        const msgResult = await this.callOpenAIFunctions(
          [{ role: "system", content: sysPrompt }, { role: "user", content: `Context: ${JSON.stringify(contextData)}. User says: ${userMessage}` }],
          [schemaTool]
        );

        if (msgResult.tool_calls && msgResult.tool_calls.length > 0) {
          const extractedArgs = JSON.parse(msgResult.tool_calls[0].function.arguments);

          if (extractedArgs.school && !contextData.school) {
            if (contextData.skipQdrant) {
              contextData.school = extractedArgs.school;
            } else {
              const userPhone = extractedArgs.telefone || contextData.telefone || '119999';
              const uf = this.getUFfromPhone(userPhone);

              console.log(`[Qdrant] Buscando semelhança para "${extractedArgs.school}" no estado ${uf}...`);
              const realSchools = await this.qdrantService.searchSchoolInUserState(extractedArgs.school, uf);

              if (realSchools && realSchools.length > 0) {
                contextData.pendingSchoolOptions = realSchools;
                const savedSchoolWord = extractedArgs.school;
                delete extractedArgs.school;

                const listText = realSchools.map((s: string, i: number) => `${i + 1} - ${s}`).join('\n');
                const noneOption = `${realSchools.length + 1} - Nenhuma das opções da lista`;

                return {
                  reply: `Encontrei as seguintes instituições parecidas com "${savedSchoolWord}". Qual delas é a sua?\n\n${listText}\n${noneOption}\n\n*Responda apenas com o número da opção.*`,
                  data: { ...contextData, ...extractedArgs },
                  completed: false
                };
              } else {
                delete extractedArgs.school;
                return {
                  reply: `Puxa, legal, mas não encontrei a faculdade "${extractedArgs.school}" no nosso banco oficial em ${uf}. Pode repetir o nome dela ou simplificar?`,
                  data: { ...contextData, ...extractedArgs },
                  completed: false
                };
              }
            }
          }

          Object.keys(extractedArgs).forEach(k => {
            if (extractedArgs[k]) contextData[k] = extractedArgs[k];
          });
        }
      } catch (e) {
        console.error("Function Calling Erro:", e);
      }
    }

    const data = { ...contextData };
    const missingNow = required.filter(field => !data[field]);

    // Quando Completa todos, joga a confirmacao! (Idêntico na web e whats)
    if (missingNow.length === 0) {
      data.confirmationNeeded = true;
      return {
        reply: `Tudo pronto! Veja seus dados:\n- Nome: ${data.fullName}\n- Tel: ${data.telefone}\n- E-mail: ${data.email}\n- CPF: ${data.cpf}\n- Instituição Oficial (Qdrant): ${data.school}\n- Semestre: ${data.semester}º\n- Data Nascimento: ${data.birthDate}\n\nConfirma que os dados estão corretos? Responda com *"Sim"* ou mande a correção!`,
        data,
        completed: false
      };
    }

    if (data.confirmationNeeded) delete data.confirmationNeeded;

    const fieldDict: any = {
      telefone: 'número de telefone completo (com DDD)', fullName: 'nome completo', email: 'e-mail', cpf: 'CPF', school: 'nome da faculdade', semester: 'semestre ou período', birthDate: 'data de nascimento'
    };

    const missingKey = missingNow[0];
    const nextField = fieldDict[missingKey] || missingKey;

    try {
      const ans = await this.callOpenAI([
        { role: 'system', content: 'Você é um assistente do CIEE curto e simpático.' },
        { role: 'user', content: `Baseado no que foi dito: "${userMessage}". Peça os seguintes dados em falta para prosseguir: ${nextField}.` }
      ], 0.7);

      return { reply: ans || `Poderia me informar: ${nextField}?`, data, completed: false };
    } catch (e) {
      return { reply: `Poderia me informar: ${nextField}?`, data, completed: false };
    }
  }
}
