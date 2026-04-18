import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

@Entity('ciee_cadastro')
export class Student {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'nome_completo', length: 255 })
  fullName: string;

  @Column({ name: 'email', length: 150, unique: true })
  email: string;

  @Column({ name: 'cpf', length: 14, unique: true })
  cpf: string;

  @Column({ name: 'escola', length: 255 })
  school: string;

  @Column({ name: 'semestre', type: 'int' })
  semester: number;

  @Column({ name: 'data_nascimento', type: 'date' })
  birthDate: string;

  @Column({ name: 'telefone', length: 20, nullable: true })
  whatsappPhone: string;

  @CreateDateColumn({ name: 'criado_em' })
  createdAt: Date;
}
