# Pages Structure

This folder contains all the main pages of the management platform, organized into separate folders for better maintainability.

## Folder Structure

```
pages/
├── gallery/                    # Main gallery/landing page
│   ├── Gallery.tsx            # Gallery component
│   ├── index.ts               # Export file
│   └── README.md              # Gallery documentation
├── project-tracker/           # Project tracking and document control
│   ├── ProjectTracker.tsx     # Project tracker component
│   ├── index.ts               # Export file
│   └── README.md              # Project tracker documentation
├── document-monitor/          # Technical document monitoring
│   ├── DocumentMonitor.tsx    # Document monitor component
│   ├── components/            # Document monitor components
│   ├── index.ts               # Export file
│   └── README.md              # Document monitor documentation
├── Index.tsx                  # Main entry point (redirects to gallery)
├── NotFound.tsx               # 404 error page
└── README.md                  # This file
```

## Page Organization

### 1. **Gallery** (`/`)
- **Purpose**: Main landing page and tool selection
- **Features**: Tool cards, navigation to other pages
- **Location**: `src/pages/gallery/`

### 2. **Project Tracker** (`/project-tracker`)
- **Purpose**: Document control and project management
- **Features**: Dashboard, KPI cards, interactive spreadsheet, data persistence
- **Location**: `src/pages/project-tracker/`
- **Dependencies**: Uses shared dashboard and grid components

### 3. **Document Monitor** (`/document-monitor`)
- **Purpose**: Technical document status monitoring
- **Features**: S-curve charts, status bar charts, document status table
- **Location**: `src/pages/document-monitor/`
- **Dependencies**: Self-contained with its own components

## Benefits of This Structure

- **Modularity**: Each page is self-contained in its own folder
- **Maintainability**: Easy to find and modify specific page logic
- **Scalability**: Simple to add new pages following the same pattern
- **Clean Imports**: Each folder has an index.ts for clean import paths
- **Documentation**: Each folder has its own README for context

## Adding New Pages

To add a new page:

1. Create a new folder in `src/pages/`
2. Add the main component file
3. Create an `index.ts` file for exports
4. Add a `README.md` for documentation
5. Update `src/App.tsx` with the new route
6. Add navigation from the gallery if needed
