---
title: Project Management Platform
emoji: 📊
colorFrom: blue
colorTo: purple
sdk: docker
pinned: false
---

# Project Management Platform

A comprehensive project management platform built with React and Node.js.

## Features

- Project tracking and management
- Document monitoring and status tracking
- Meeting registration and management
- File upload and management
- Real-time data visualization with charts and KPIs

## Tech Stack

- **Frontend**: React, TypeScript, Vite, Tailwind CSS
- **Backend**: Node.js, Express
- **UI Components**: Radix UI, shadcn/ui

## Getting Started

The application is containerized and ready to deploy on Hugging Face Spaces.

### Local Development

1. Install dependencies:
```bash
   cd frontend && npm install
   cd ../backend && npm install
```

2. Start the backend:
```bash
   cd backend && npm run dev
```

3. Start the frontend:
```bash
   cd frontend && npm run dev
   ```

## Deployment

This project is configured for deployment on Hugging Face Spaces using Docker. The Dockerfile builds the frontend and serves it along with the backend API.

### Persistent Storage on Hugging Face Spaces

By default, files and data stored in a Docker container on Hugging Face Spaces are ephemeral and will be lost when the Space restarts. To persist your projects and uploaded files:

1. **Enable Persistent Storage:**
   - In your Space settings, go to "Persistent Storage".
   - Select a tier (e.g., "Small" or "Medium"). This will mount a persistent volume at `/data`.

2. **Configure the Storage Path:**
   - In "Variables and secrets", add a new **Environment Variable** (not a secret):
     - `STORAGE_PATH` = `/data`

The application will then save `data.json` and all files in `/data/uploads`, ensuring they persist across restarts.

### Environment Variables

The application uses Supabase for authentication. To configure Supabase credentials for your deployment:

1. **In Hugging Face Spaces:**
   - Go to your Space settings
   - Navigate to "Variables and secrets"
   - Add the following build arguments (these are needed at build time):
     - `VITE_SUPABASE_URL` - Your Supabase project URL
     - `VITE_SUPABASE_ANON_KEY` - Your Supabase anonymous/public key

2. **Note:** If these variables are not set, the application will use fallback values from the code. However, it's recommended to set your own Supabase credentials for security.

3. **Getting your Supabase credentials:**
   - Go to your Supabase project dashboard
   - Navigate to Settings → API
   - Copy the "Project URL" for `VITE_SUPABASE_URL`
   - Copy the "anon public" key for `VITE_SUPABASE_ANON_KEY`

### Building with Docker

If building locally, you can pass the build arguments:

```bash
docker build \
  --build-arg VITE_SUPABASE_URL=your_supabase_url \
  --build-arg VITE_SUPABASE_ANON_KEY=your_supabase_key \
  -t plataforma-gestao .
```

## License

MIT
