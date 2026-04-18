import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { StudentService } from './student/student.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const studentService = app.get(StudentService);

  const testData = {
    fullName: 'Teste Silva',
    email: 'teste@example.com',
    cpf: '12345678901',
    school: 'Escola Teste',
    semester: 3,
    birthDate: '2000-01-01'
  };

  try {
    console.log('Tentando salvar:', testData);
    const result = await studentService.create(testData);
    console.log('Salvo com sucesso:', result);
  } catch (err) {
    console.error('Erro ao salvar:', err.message);
  }

  await app.close();
}
bootstrap();
