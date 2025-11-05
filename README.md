# Plataforma de Gestão de Projetos

Uma plataforma completa de gestão de projetos com funcionalidades de upload de arquivos, monitoramento de documentos e acompanhamento de KPIs.

## 🚀 Tecnologias Utilizadas

### Frontend
- **Vite** - Build tool e dev server
- **React 18** - Biblioteca de interface
- **TypeScript** - Tipagem estática
- **Tailwind CSS** - Framework CSS
- **shadcn/ui** - Componentes de interface (baseado em Radix UI)
- **Radix UI** - Componentes primitivos acessíveis
- **React Router** - Roteamento
- **Zustand** - Gerenciamento de estado
- **React Hook Form** - Formulários
- **Zod** - Validação de schemas
- **Recharts** - Gráficos e visualizações
- **TanStack Query** - Cache e sincronização de dados
- **jsPDF** - Geração de PDFs
- **html2canvas** - Captura de telas para PDFs
- **JSZip** - Criação de arquivos ZIP
- **UUID** - Geração de identificadores únicos
- **date-fns** - Manipulação de datas
- **Lucide React** - Biblioteca de ícones
- **Sonner** - Sistema de notificações toast
- **next-themes** - Gerenciamento de temas (claro/escuro)

### Backend
- **Node.js** - Runtime JavaScript
- **Express.js** - Framework web
- **Multer** - Upload de arquivos
- **CORS** - Cross-origin resource sharing
- **fs-extra** - Operações de sistema de arquivos
- **Nodemon** - Auto-reload em desenvolvimento

## 📁 Estrutura do Projeto

```
plataforma_gestao/
├── frontend/                     # Frontend React
│   ├── src/                     # Código fonte
│   │   ├── components/         # Componentes reutilizáveis
│   │   │   ├── dashboard/      # Componentes do dashboard
│   │   │   ├── grid/           # Componentes da grade de dados
│   │   │   ├── layout/         # Layout principal (Sidebar, MainLayout)
│   │   │   ├── project/        # Componentes de projeto (ProjectSelector, MeetingRegistrationSection)
│   │   │   └── ui/             # Componentes base (shadcn/ui + ReportGenerationDialog)
│   │   ├── pages/              # Páginas da aplicação
│   │   │   ├── document-monitor/ # Monitor de documentos
│   │   │   └── project-tracker/  # Rastreador de projetos
│   │   ├── services/           # Serviços e APIs
│   │   ├── stores/             # Estado global (Zustand)
│   │   ├── lib/                # Utilitários (changeTracking, utils)
│   │   ├── hooks/              # Hooks customizados
│   │   └── types/              # Definições TypeScript
│   ├── public/                 # Arquivos estáticos públicos
│   ├── dist/                   # Build de produção (gitignored)
│   ├── index.html              # HTML principal
│   ├── package.json            # Dependências do frontend
│   └── vite.config.ts          # Configuração do Vite
└── backend/                     # Backend Express.js
    ├── server.js               # Servidor principal
    ├── data.json               # Armazenamento de dados (gitignored)
    ├── uploads/                # Diretório de uploads (gitignored)
    │   └── {projectId}/{documentId}/{filename}
    └── package.json            # Dependências do backend
```

## 🛠️ Instalação e Configuração

### Pré-requisitos
- Node.js (versão 16 ou superior)
- npm ou yarn

### Instalação

1. **Clone o repositório**
```bash
git clone <YOUR_GIT_URL>
cd plataforma_gestao
```

2. **Instale as dependências do frontend**
```bash
cd frontend
npm install
cd ..
```

3. **Instale as dependências do backend**
```bash
cd backend
npm install
cd ..
```

### Execução

#### Desenvolvimento

1. **Inicie o backend** (Terminal 1)
```bash
cd backend
npm run dev
```
O servidor estará rodando em `http://localhost:3001`

2. **Inicie o frontend** (Terminal 2)
```bash
cd frontend
npm run dev
```
A aplicação estará disponível em `http://localhost:8080`

#### Produção

1. **Build do frontend**
```bash
cd frontend
npm run build
cd ..
```

2. **Inicie o backend**
```bash
cd backend
npm start
```

## 📋 Funcionalidades

### Dashboard Principal
- **KPIs**: Visualização de métricas de projeto (A iniciar, Em andamento, Finalizado)
- **Gráficos**: Timeline de criação e finalização de documentos
- **Distribuição de Status**: Gráfico de barras com status dos documentos
- **Visualizações Interativas**: Gráficos interativos com Recharts

### Monitor de Documentos
- **Tabela de Status**: Visualização detalhada de todos os documentos
- **Filtros Avançados**: Por status, área, responsável e período
- **Gráfico S-Curve**: Visualização do progresso do projeto
- **Métricas de Documentos**: KPIs de documentos emitidos e aprovados

### Rastreador de Projetos
- **Grade de Dados**: Interface para gerenciar documentos do projeto
- **Upload de Arquivos**: Sistema completo de upload com validação
- **Edição em Massa**: Capacidade de editar múltiplos registros
- **Filtros Dinâmicos**: Sistema de filtros para navegação eficiente
- **Gerenciamento de Projetos**: Criação, edição e exclusão de projetos
- **Seletor de Projetos**: Interface para alternar entre múltiplos projetos
- **Persistência de Dados**: Armazenamento automático em localStorage e JSON
- **Documentos Numerados**: Sistema de numeração sequencial para itens de documento
- **Documentos Ocultos**: Funcionalidade para marcar documentos como "limpos" (isCleared)
- **Rastreamento de Mudanças**: Sistema completo de auditoria e histórico de alterações
- **Gestão de Participantes**: Sistema de tags para participantes em documentos

### Sistema de Upload
- **Tipos Suportados**: PDF, Excel, Word, PNG, JPEG
- **Validação**: Limite de 10MB por arquivo, máximo 5 arquivos por upload
- **Organização**: Arquivos organizados por projeto e documento
- **API RESTful**: Endpoints para upload, listagem e exclusão
- **Upload Múltiplo**: Suporte para múltiplos arquivos simultâneos
- **Download de Arquivos**: Sistema de download integrado

### Sistema de Reuniões
- **Registro de Reuniões**: Sistema completo para registrar reuniões de projeto
- **Metadados de Reunião**: Data, número da ata, detalhes e participantes
- **Itens Relacionados**: Vinculação de documentos discutidos em reuniões
- **Navegação Rápida**: Links para navegar diretamente aos itens discutidos
- **Histórico de Reuniões**: Lista expansível de todas as reuniões registradas
- **Integração com Documentos**: Mudanças podem ser vinculadas a reuniões específicas

### Rastreamento de Mudanças e Auditoria
- **Histórico Completo**: Todas as alterações em documentos são rastreadas
- **Rastreamento por Campo**: Mudanças granulares por campo individual
- **Contexto de Reunião**: Mudanças podem ser vinculadas a reuniões específicas
- **Timestamps**: Registro completo de quando cada mudança ocorreu
- **Modo de Edição**: Distinção entre edições rápidas e mudanças em reuniões
- **Formatação de Mudanças**: Visualização clara do histórico de alterações

### Geração de Relatórios
- **Relatórios PDF**: Geração de relatórios completos em PDF
- **Captura de Telas**: Screenshots automáticos de gráficos e tabelas
- **Relatórios ZIP**: Pacotes completos com PDF e anexos
- **Inclusão de Anexos**: Todos os arquivos do projeto incluídos (com filtros aplicados)
- **Visualizações Profissionais**: Layout formatado com logos e tabelas
- **Relatórios Abrangentes**: Inclui dados do Project Tracker e Monitor de Documentos
- **Barra de Progresso**: Feedback visual durante a geração de relatórios
- **Filtros Aplicados**: Relatórios respeitam filtros ativos no momento da geração

## 🔧 Scripts Disponíveis

### Frontend
- `npm run dev` - Servidor de desenvolvimento
- `npm run build` - Build de produção
- `npm run build:dev` - Build de desenvolvimento
- `npm run lint` - Verificação de código
- `npm run preview` - Preview do build

### Backend
- `npm start` - Inicia o servidor
- `npm run dev` - Servidor com nodemon (desenvolvimento)

## 🌐 API Endpoints

### Backend (Porta 3001)

#### Health Check
- `GET /api/health` - Health check do servidor

#### Projetos
- `GET /api/projects` - Listar todos os projetos
- `POST /api/projects` - Criar novo projeto
- `PUT /api/projects/:id` - Atualizar projeto existente
- `DELETE /api/projects/:id` - Excluir projeto

#### Documentos
- `GET /api/projects/:projectId/documents` - Listar documentos de um projeto
- `POST /api/projects/:projectId/documents` - Criar novo documento
- `PUT /api/documents/:id` - Atualizar documento existente
- `DELETE /api/documents/:id` - Excluir documento

#### Arquivos
- `POST /api/upload` - Upload de arquivos (multipart/form-data)
  - Body: `files` (array), `projectId`, `documentId`
  - Response: Array de metadados dos arquivos enviados
- `GET /api/files/:projectId/:documentId` - Listar arquivos de um documento
- `DELETE /api/files/:projectId/:documentId/:filename` - Excluir arquivo
- `GET /uploads/:projectId/:documentId/:filename` - Download de arquivo

## 📊 Tipos de Dados

### Project
```typescript
interface Project {
  id: string;
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
  meetings?: MeetingMetadata[]; // Reuniões do projeto
}
```

### ProjectDocument
```typescript
interface ProjectDocument {
  id: string;
  projectId: string;
  numeroItem: number; // Número sequencial do item
  dataInicio: string; // dd/mm/yyyy
  dataFim: string; // dd/mm/yyyy
  documento: string;
  detalhe: string;
  revisao: string; // R0, R1, etc.
  responsavel: string;
  status: "A iniciar" | "Em andamento" | "Finalizado" | "Info";
  area: string;
  createdAt: Date;
  updatedAt: Date;
  isCleared?: boolean; // Quando true, documento é ignorado pelos dashboards
  attachments?: ProjectAttachment[];
  participants?: string[]; // Array de participantes (tags)
  history?: DocumentChange[]; // Trilha de auditoria
  meetings?: MeetingMetadata[]; // Reuniões relacionadas ao documento
}
```

### ProjectAttachment
```typescript
interface ProjectAttachment {
  id: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  uploadedAt: Date;
  filePath: string; // Caminho dentro da estrutura de pastas
}
```

### MeetingMetadata
```typescript
interface MeetingMetadata {
  id: string;
  data: string; // dd-mm-yyyy format
  numeroAta: string;
  detalhes?: string; // Detalhes/notas da reunião
  participants: string[]; // Array de nomes de participantes
  relatedItems?: number[]; // Array de números de itens discutidos
  createdAt: string;
}
```

### DocumentChange
```typescript
interface DocumentChange {
  id: string;
  timestamp: string;
  meetingId?: string; // Referência à reunião se mudança ocorreu durante reunião
  meetingData?: string; // Data da reunião em dd-mm-yyyy format
  meetingNumber?: string; // Número da ata
  isQuickEdit?: boolean; // true se editado diretamente sem contexto de reunião
  changes: FieldChange[]; // Array de mudanças por campo
  modifiedBy?: string; // Quem fez a mudança (opcional para futura autenticação)
}
```

### FieldChange
```typescript
interface FieldChange {
  field: string; // Nome do campo alterado
  oldValue: string | number | null;
  newValue: string | number | null;
}
```

## 💾 Persistência de Dados

### Backend
- **Arquivo JSON**: `backend/data.json` - Armazena projetos e documentos
- **Uploads**: `backend/uploads/` - Diretório para arquivos enviados
- **Estrutura**: `uploads/{projectId}/{documentId}/{filename}`

### Frontend
- **localStorage**: Armazenamento local do navegador
- **Zustand**: Gerenciamento de estado com persistência automática
- **Migração de Dados**: Sistema de versionamento e migração automática

## 🎨 Interface e Navegação

A aplicação utiliza o sistema de design shadcn/ui com Tailwind CSS, proporcionando:
- **Sidebar Colapsável**: Navegação lateral que pode ser expandida/recolhida
- **Seletor de Projetos**: Interface integrada na sidebar para alternar projetos
- **Navegação Intuitiva**: Links diretos para Project Tracker e Monitor de Documentos
- **Geração de Relatórios**: Botão dedicado na sidebar para gerar relatórios completos
- Interface moderna e responsiva
- Componentes acessíveis (baseados em Radix UI)
- Tema escuro/claro (suporte completo via next-themes)
- Animações suaves
- Design system consistente
- Notificações toast (Sonner) para feedback do usuário

## 📝 Desenvolvimento

### Estrutura de Componentes
- **Componentes Base**: Localizados em `frontend/src/components/ui/` (shadcn/ui)
- **Componentes de Página**: Organizados por funcionalidade em `frontend/src/pages/`
- **Componentes Compartilhados**: `frontend/src/components/dashboard/`, `frontend/src/components/grid/`
- **Hooks Customizados**: Para lógica reutilizável em `frontend/src/hooks/`
- **Serviços**: Para comunicação com APIs em `frontend/src/services/`

### Estado Global
- **Zustand**: Para gerenciamento de estado em `frontend/src/stores/`
- **React Query**: Para cache e sincronização de dados
- **Local Storage**: Para persistência de dados local
- **Store Persist**: Sincronização automática com localStorage

### Serviços Principais
- **fileManager**: Gerenciamento de upload e download de arquivos
- **pdfReportGenerator**: Geração de relatórios PDF completos
- **zipReportGenerator**: Criação de pacotes ZIP com relatórios e anexos filtrados

### Utilitários Principais
- **changeTracking**: Sistema de rastreamento de mudanças e auditoria
  - `generateFieldChanges()`: Compara dois documentos e gera mudanças por campo
  - `createChangeLogEntry()`: Cria entrada de log de mudanças
  - `formatFieldChange()`: Formata mudanças para exibição
  - `formatTimestamp()`: Formata timestamps para exibição
  - `debounce()`: Utilitário de debounce para autosave
- **utils**: Funções utilitárias gerais (cn para classes CSS, etc.)

## 🚀 Deploy

### Frontend
O build estático pode ser servido por qualquer servidor web estático:
- **Vercel**: Deploy automático do frontend
- **Netlify**: Deploy com integração Git
- **Nginx/Apache**: Servidores web tradicionais
- **Cloudflare Pages**: CDN global para o frontend

### Backend
O servidor Express.js pode ser deployado em plataformas como:
- **Railway**: Deploy automático com banco de dados
- **Heroku**: Plataforma tradicional com add-ons
- **DigitalOcean**: VPS com controle total
- **AWS EC2**: Instância EC2 com Elastic Beanstalk
- **Render**: Deploy simples e rápido

### Variáveis de Ambiente
Crie um arquivo `.env` no backend com:
```env
PORT=3001
NODE_ENV=production
```

### Observações de Produção
- Configure CORS para domínios específicos
- Use banco de dados real (PostgreSQL, MongoDB) em vez de JSON
- Configure armazenamento de arquivos em cloud (S3, GCS)
- Implemente autenticação e autorização
- Configure logs e monitoramento
- Use HTTPS para todas as comunicações

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

## 🔍 Troubleshooting

### Problemas Comuns

#### Backend não inicia
- Verifique se a porta 3001 está disponível
- Confirme que as dependências foram instaladas (`npm install` no diretório backend)
- Verifique se há erros no console do terminal

#### Upload de arquivos falha
- Verifique o tamanho do arquivo (máximo 10MB)
- Confirme que o tipo de arquivo é suportado (PDF, Excel, Word, PNG, JPEG)
- Verifique se o backend está rodando na porta 3001
- Certifique-se de que a pasta `backend/uploads/` existe e tem permissões de escrita

#### Dados não persistem
- Verifique o console do navegador para erros de localStorage
- Certifique-se de que o navegador permite cookies e armazenamento local
- Limpe o cache e localStorage se necessário (F12 > Application > Clear storage)

#### Gráficos não aparecem
- Verifique se há dados disponíveis no projeto
- Confirme que os filtros estão configurados corretamente
- Verifique o console do navegador para erros de renderização

#### Relatórios PDF/ZIP não geram
- Verifique se há arquivos anexados ao projeto
- Confirme que o navegador permite downloads automáticos
- Verifique o console do navegador para erros de JavaScript
- Certifique-se de que um projeto está selecionado antes de gerar relatório

#### Reuniões não são salvas
- Verifique se um projeto está selecionado
- Confirme que a data e número da ata foram preenchidos
- Verifique o console do navegador para erros

#### Histórico de mudanças não aparece
- Certifique-se de que os documentos foram editados após a implementação do sistema de rastreamento
- Verifique se há mudanças nos campos rastreados (não todos os campos são rastreados)

### Logs e Debug

Para debug mais detalhado:
- Backend: Verifique os logs no terminal onde o servidor está rodando
- Frontend: Abra o DevTools (F12) e verifique Console e Network tabs
- Dados: Use a aba Application no DevTools para inspecionar localStorage

## 📞 Suporte

Para suporte e dúvidas, abra uma issue no repositório ou entre em contato com a equipe de desenvolvimento.