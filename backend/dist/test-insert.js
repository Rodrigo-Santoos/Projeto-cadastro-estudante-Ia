"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const student_service_1 = require("./student/student.service");
async function bootstrap() {
    const app = await core_1.NestFactory.createApplicationContext(app_module_1.AppModule);
    const studentService = app.get(student_service_1.StudentService);
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
    }
    catch (err) {
        console.error('Erro ao salvar:', err.message);
    }
    await app.close();
}
bootstrap();
//# sourceMappingURL=test-insert.js.map