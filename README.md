# Plataforma de Gestão de Projetos

Uma plataforma completa de gestão de projetos com funcionalidades de upload de arquivos, monitoramento de documentos e acompanhamento de KPIs.

## 🚀 Tecnologias Utilizadas

### Frontend
- **Vite** - Build tool e dev server
- **React 18** - Biblioteca de interface
- **TypeScript** - Tipagem estática
- **Tailwind CSS** - Framework CSS
- **shadcn/ui** - Componentes de interface
- **React Router** - Roteamento
- **Zustand** - Gerenciamento de estado
- **React Hook Form** - Formulários
- **Recharts** - Gráficos e visualizações
- **TanStack Query** - Cache e sincronização de dados
- **jsPDF** - Geração de PDFs
- **html2canvas** - Captura de telas para PDFs
- **JSZip** - Criação de arquivos ZIP

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
│   │   │   ├── layout/         # Layout principal
│   │   │   ├── project/        # Componentes de projeto
│   │   │   └── ui/             # Componentes base (shadcn/ui)
│   │   ├── pages/              # Páginas da aplicação
│   │   │   ├── document-monitor/ # Monitor de documentos
│   │   │   └── project-tracker/  # Rastreador de projetos
│   │   ├── services/           # Serviços e APIs
│   │   ├── stores/             # Estado global (Zustand)
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
- **Persistência de Dados**: Armazenamento automático em localStorage e JSON

### Sistema de Upload
- **Tipos Suportados**: PDF, Excel, Word, PNG, JPEG
- **Validação**: Limite de 10MB por arquivo, máximo 5 arquivos por upload
- **Organização**: Arquivos organizados por projeto e documento
- **API RESTful**: Endpoints para upload, listagem e exclusão
- **Upload Múltiplo**: Suporte para múltiplos arquivos simultâneos
- **Download de Arquivos**: Sistema de download integrado

### Geração de Relatórios
- **Relatórios PDF**: Geração de relatórios completos em PDF
- **Captura de Telas**: Screenshots automáticos de gráficos e tabelas
- **Relatórios ZIP**: Pacotes completos com PDF e anexos
- **Inclusão de Anexos**: Todos os arquivos do projeto incluídos
- **Visualizações Profissionais**: Layout formatado com logos e tabelas

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
}
```

### ProjectDocument
```typescript
interface ProjectDocument {
  id: string;
  projectId: string;
  dataInicio: string;
  dataFim: string;
  documento: string;
  detalhe: string;
  revisao: string;
  responsavel: string;
  status: "A iniciar" | "Em andamento" | "Finalizado";
  area: string;
  participantes: string;
  attachments?: ProjectAttachment[];
}
```

### ProjectAttachment
```typescript
interface ProjectAttachment {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
  uploadedAt: Date;
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

## 🎨 Interface

A aplicação utiliza o sistema de design shadcn/ui com Tailwind CSS, proporcionando:
- Interface moderna e responsiva
- Componentes acessíveis
- Tema escuro/claro
- Animações suaves
- Design system consistente

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
- **zipReportGenerator**: Criação de pacotes ZIP com relatórios e anexos

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

### Logs e Debug

Para debug mais detalhado:
- Backend: Verifique os logs no terminal onde o servidor está rodando
- Frontend: Abra o DevTools (F12) e verifique Console e Network tabs
- Dados: Use a aba Application no DevTools para inspecionar localStorage

## 📞 Suporte

Para suporte e dúvidas, abra uma issue no repositório ou entre em contato com a equipe de desenvolvimento.