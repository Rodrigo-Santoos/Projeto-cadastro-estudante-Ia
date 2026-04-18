import { OnModuleInit } from '@nestjs/common';
export declare class QdrantService implements OnModuleInit {
    private client;
    private readonly COLLECTION_NAME;
    constructor();
    onModuleInit(): Promise<void>;
    private createEmbedding;
    private initCollection;
    private seedData;
    searchSchoolInUserState(schoolSearch: string, stateUF: string): Promise<any[] | null>;
}
