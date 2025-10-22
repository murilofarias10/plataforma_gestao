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

### Backend
- **Node.js** - Runtime JavaScript
- **Express.js** - Framework web
- **Multer** - Upload de arquivos
- **CORS** - Cross-origin resource sharing
- **fs-extra** - Operações de sistema de arquivos

## 📁 Estrutura do Projeto

```
plataforma_gestao/
├── src/                          # Frontend React
│   ├── components/               # Componentes reutilizáveis
│   │   ├── dashboard/           # Componentes do dashboard
│   │   ├── grid/                # Componentes da grade de dados
│   │   ├── layout/              # Layout principal
│   │   ├── project/             # Componentes de projeto
│   │   └── ui/                  # Componentes base (shadcn/ui)
│   ├── pages/                   # Páginas da aplicação
│   │   ├── document-monitor/    # Monitor de documentos
│   │   └── project-tracker/     # Rastreador de projetos
│   ├── services/                # Serviços e APIs
│   ├── stores/                  # Estado global (Zustand)
│   └── types/                   # Definições TypeScript
├── backend/                     # Backend Express.js
│   ├── server.js               # Servidor principal
│   └── uploads/                # Diretório de uploads
└── dist/                       # Build de produção
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
npm install
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
npm run dev
```
A aplicação estará disponível em `http://localhost:5173`

#### Produção

1. **Build do frontend**
```bash
npm run build
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

### Monitor de Documentos
- **Tabela de Status**: Visualização detalhada de todos os documentos
- **Filtros Avançados**: Por status, área, responsável e período
- **Gráfico S-Curve**: Visualização do progresso do projeto

### Rastreador de Projetos
- **Grade de Dados**: Interface para gerenciar documentos do projeto
- **Upload de Arquivos**: Sistema completo de upload com validação
- **Edição em Massa**: Capacidade de editar múltiplos registros
- **Filtros Dinâmicos**: Sistema de filtros para navegação eficiente

### Sistema de Upload
- **Tipos Suportados**: PDF, Excel, Word, PNG, JPEG
- **Validação**: Limite de 10MB por arquivo, máximo 5 arquivos por upload
- **Organização**: Arquivos organizados por projeto e documento
- **API RESTful**: Endpoints para upload, listagem e exclusão

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

- `GET /api/health` - Health check do servidor
- `POST /api/upload` - Upload de arquivos
- `GET /api/files/:projectId/:documentId` - Listar arquivos
- `DELETE /api/files/:projectId/:documentId/:filename` - Excluir arquivo

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

## 🎨 Interface

A aplicação utiliza o sistema de design shadcn/ui com Tailwind CSS, proporcionando:
- Interface moderna e responsiva
- Componentes acessíveis
- Tema escuro/claro
- Animações suaves
- Design system consistente

## 📝 Desenvolvimento

### Estrutura de Componentes
- **Componentes Base**: Localizados em `src/components/ui/`
- **Componentes de Página**: Organizados por funcionalidade
- **Hooks Customizados**: Para lógica reutilizável
- **Serviços**: Para comunicação com APIs

### Estado Global
- **Zustand**: Para gerenciamento de estado
- **React Query**: Para cache e sincronização de dados
- **Local Storage**: Para persistência de dados

## 🚀 Deploy

### Frontend
O build estático pode ser servido por qualquer servidor web estático (Nginx, Apache, Vercel, Netlify).

### Backend
O servidor Express.js pode ser deployado em plataformas como:
- Heroku
- Railway
- DigitalOcean
- AWS EC2

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

## 📞 Suporte

Para suporte e dúvidas, abra uma issue no repositório ou entre em contato com a equipe de desenvolvimento.