# Project Tracker

This folder contains the Project Tracker page and its components for document control and project management.

## Structure

```
project-tracker/
├── ProjectTracker.tsx   # Main project tracker page
├── index.ts            # Export file for clean imports
└── README.md           # This file
```

## Features

- **Dashboard Section**: KPI cards, timeline chart, and status bar chart
- **Document Control**: Interactive spreadsheet for document management
- **Data Persistence**: Automatic localStorage integration with Zustand store
- **Sample Data Loading**: Built-in sample data for demonstration
- **Filters**: Date and status filtering capabilities
- **Save Functionality**: Manual save with toast notifications

## Dependencies

- Uses shared components from `@/components/dashboard/`
- Uses shared components from `@/components/grid/`
- Integrates with `@/stores/projectStore` for state management
- Uses `@/components/layout/Header` for navigation

## Data Management

- **Zustand Store**: Manages document state and persistence
- **localStorage**: Automatic data persistence
- **Migration Logic**: Handles data versioning and cleanup
- **Sample Data**: Provides default data when no documents exist

## Navigation

- Accessible from the main gallery page via "Project Tracker" card
- Includes "Voltar ao Menu" button to return to the main gallery
