import { StudentService } from '../student/student.service';
import { QdrantService } from '../qdrant/qdrant.service';
export declare class ChatService {
    private studentService;
    private qdrantService;
    constructor(studentService: StudentService, qdrantService: QdrantService);
    private callOpenAIFunctions;
    private callOpenAI;
    private getUFfromPhone;
    transcribeAudio(audioBuffer: Buffer, mimetype: string): Promise<string | null>;
    processResume(pdfBuffer: Buffer, contextData?: any): Promise<{
        reply: any;
        data: any;
        completed: boolean;
    }>;
    processChat(userMessage: string, contextData?: any): Promise<{
        reply: any;
        data: any;
        completed: boolean;
    }>;
}
