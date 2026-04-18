"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.QdrantService = void 0;
const common_1 = require("@nestjs/common");
const js_client_rest_1 = require("@qdrant/js-client-rest");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const OPENAI_API_KEY = '********************************************';
let QdrantService = class QdrantService {
    client;
    COLLECTION_NAME = 'escolas_brasil';
    constructor() {
        this.client = new js_client_rest_1.QdrantClient({ url: 'http://localhost:6333' });
    }
    async onModuleInit() {
        await this.initCollection();
        await this.seedData();
    }
    async createEmbedding(text) {
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
    async initCollection() {
        try {
            const collections = await this.client.getCollections();
            const exists = collections.collections.some(c => c.name === this.COLLECTION_NAME);
            if (!exists) {
                console.log('[Qdrant] Criando nova Collection: ' + this.COLLECTION_NAME);
                await this.client.createCollection(this.COLLECTION_NAME, {
                    vectors: {
                        size: 1536,
                        distance: 'Cosine'
                    }
                });
            }
        }
        catch (e) {
            console.log('[Qdrant] Alerta: O servidor Qdrant não está rodando no Docker localhost:6333.');
            console.log(e.message);
        }
    }
    async seedData() {
        try {
            const info = await this.client.getCollection(this.COLLECTION_NAME);
            if (info.vectors_count > 0 || info.points_count > 0)
                return;
            console.log('[Qdrant] Iniciando injeção de escolas brasileiras em vetores...');
            const filePath = path.join(process.cwd(), 'src/qdrant/schools.mock.json');
            if (fs.existsSync(filePath)) {
                const fileData = fs.readFileSync(filePath, 'utf-8');
                const schools = JSON.parse(fileData);
                const points = await Promise.all(schools.map(async (school) => {
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
        }
        catch (e) {
            console.error("[Qdrant] SEED ERRO:", e);
        }
    }
    async searchSchoolInUserState(schoolSearch, stateUF) {
        try {
            const searchVector = await this.createEmbedding(schoolSearch);
            const result = await this.client.search(this.COLLECTION_NAME, {
                vector: searchVector,
                limit: 3,
                filter: {
                    must: [
                        { key: "state", match: { value: stateUF } }
                    ]
                }
            });
            if (result.length > 0) {
                return result.map(hit => hit.payload?.name);
            }
            return null;
        }
        catch (e) {
            console.error("Qdrant Search Error:", e.message);
            return null;
        }
    }
};
exports.QdrantService = QdrantService;
exports.QdrantService = QdrantService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], QdrantService);
//# sourceMappingURL=qdrant.service.js.map