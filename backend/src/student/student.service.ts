import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Student } from './student.entity';

/**
 * Service de Operações de Banco de Dados.
 * Isolamos toda infraestrutura do MySQL nesta classe (padrão Repository) para que nosso `ChatService`
 * apenas "peça pra registrar" sem saber como o TypeORM funciona por trás.
 */
@Injectable()
export class StudentService {
  // Injetamos a instância principal da Entidade "Student". Esse cara carrega todas funções pré-montadas SQL.
  constructor(
    @InjectRepository(Student)
    private studentRepository: Repository<Student>,
  ) {}

  /**
   * Salvar Novo Estudante Validado
   * @param data Informações consolidadas pela inteligência que garantem nome, semestre, cpf, etc.
   * @returns Retorna a Promessa emulando o objeto do banco (com `id` recem gerados primariamente)
   */
  async create(data: Partial<Student>): Promise<Student> {
    // A função 'create' local monta a instância em memória, acionando qualquer gatilho virtual (TypeORM hooks).
    const student = this.studentRepository.create(data);
    
    // O comando assíncrono final 'save' que bate e compassa na porta do MySQL e consolida os discos
    return this.studentRepository.save(student);
  }

  /**
   * Varredura Lógica de Duplicidades
   * @param email Email a procurar na coluna `email`
   * @param cpf Formato limpo da coluna `cpf`
   * @returns O objeto estudantil antigo (bloqueando o fluxo novo) ou nulo.
   */
  async findByEmailOrCpf(email: string, cpf: string): Promise<Student | null> {
    return this.studentRepository.findOne({
      // Usando array `where: []` no TypeORM força ele a criar um espelho usando "OR" debaixo do SQL
      // exeq: `SELECT * FROM estudantes WHERE email = '..' OR cpf = '..';` 
      where: [
        { email },
        { cpf }
      ]
    });
  }

  /**
   * Listagem em Lote de Usuários
   * Não é estutural do processo primário, mas foi deixado para possíveis
   * visualizações de "Retaguarda Administrativa" ou debug do Chat.
   */
  async findAll(): Promise<Student[]> {
    // 'find' vazio traz todo mundo (*), convertendo numa array limpa de tipagem TypeScript.
    return this.studentRepository.find();
  }
}
