import { Repository } from 'typeorm';
import { Student } from './student.entity';
export declare class StudentService {
    private studentRepository;
    constructor(studentRepository: Repository<Student>);
    create(data: Partial<Student>): Promise<Student>;
    findByEmailOrCpf(email: string, cpf: string): Promise<Student | null>;
    findAll(): Promise<Student[]>;
}
