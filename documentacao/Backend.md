# Documentação Técnica do Backend (NestJS)

A lógica do servidor foi estruturada utilizando a arquitetura Model-View-Controller (porém baseada em Model-Service-Controller) através do NestJS. O backend está encarregado de dois papéis cruciais: a abstração com a inteligência artificial (OpenAI) para guiar as conversas do usuário, e a persistência final no banco de relacional (TypeORM com MySQL).

## Estrutura do Módulo de Chat

A interação do usuário com o Assistente é gerenciada pelo `ChatModule`.

### 1. `ChatController` (`backend/src/chat/chat.controller.ts`)
Este controlador expõe os endpoints Rest que o Frontend consome:
- `POST /chat`: Recebe uma requisição contendo o texto (`message`) do usuário e os dados previamente coletados (`contextData`). Ele encaminha essas informações ao `ChatService`.
- `POST /chat/upload`: Responsável por receber o arquivo em PDF (utilizando a injeção via `@nestjs/platform-express` e `FileInterceptor`) com um currículo anexado, convertendo e chamando a extração via `ChatService`.

### 2. `ChatService` (`backend/src/chat/chat.service.ts`)
Responsável pelas regras de negócios e conexões de Inteligência Artificial:
- **Como a IA é utilizada (`callOpenAI()`)**: Ela faz uma chamada HTTP (via `fetch` nativo) utilizando o endpoint `v1/chat/completions`, enviando dados do modelo (`gpt-4o-mini`) contendo *prompts* elaborados (engenharia de prompts) para forçar que o Output do robô seja invariavelmente um JSON.
- **Processamento de Currículo (`processResume()`)**: Essa funcionalidade pega o arquivo recebido pelo Form-Data usando `pdf-parse`, retira o texto primário (limitado às duas primeiras páginas para economizar custos de AI) e cria um prompt de extração para que a IA busque 6 campos estritamente obrigatórios. Depois ela realiza a mesclagem com os dados (contexto) antigos para continuar preenchendo o estudante.
- **Interação Continua (`processChat()`)**: É aqui onde a mágica das conversas acontece. 
    1. A aplicação checa se o usuário enviou "Sim, confirmo os dados." Se verdadeiro, a inteligência repassa as informações validadas para o `studentService.create()`.
    2. Caso não esteja concluído, ela tenta extrair dados da fase atual (com base no histórico e lista de dados *faltantes*).
    3. Quando extraídos todos os 6 campos vitais: (fullName, email, cpf, school, semester, birthDate), altera o `confirmationNeeded: true` sugerindo a aprovação.
    4. Se restam dados, solicita proativamente o campo seguinte usando outra pequena chamada natural para a IA do ChatGPT, traduzindo as variáveis e mantendo uma linguagem acolhedora.

---

## Estrutura do Módulo de Cadastro (Estudante)

Responsável por armazenar, de fato, as informações coletadas que o LLM validou.

### 1. Entidade e Modelo (`backend/src/student/student.entity.ts`)
Utiliza os decoradores de TypeORM (ex: `@Entity()`, `@PrimaryGeneratedColumn()`, `@Column()`) para gerenciar as colunas da tabela "student", onde todos os tipos (Strings, Datetimes/Dates e Integers) são declarados.

### 2. `StudentService` (`backend/src/student/student.service.ts`)
O repositório expõe métodos simples para que o banco seja modificado sem vazar complexidade:
- **`create()`**: Recebe um objeto parcial (`Partial<Student>`) e força o salvamento pelo repositório injetado do TypeORM (`studentRepository.save`).
- **`findByEmailOrCpf()`**: Executa uma query OR onde procura registros com o mesmo e-mail *ou* CPF, garantindo que não existam duplicações na base de dados após o usuário aprovar o cadastro.
