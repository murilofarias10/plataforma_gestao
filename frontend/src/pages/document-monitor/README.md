# Document Monitor Dashboard

This folder contains the Document Monitor dashboard page and its components.

## Structure

```
document-monitor/
├── DocumentMonitor.tsx          # Main dashboard page
├── index.ts                     # Export file for clean imports
├── README.md                    # This file
└── components/
    ├── KpiCards.tsx            # Top KPI indicators (Emitidos, Aprovados)
    ├── FiltersBar.tsx          # Date and discipline filters + Generate Report button
    ├── SCurveChart.tsx         # S-Curve progress chart
    ├── StatusBarChart.tsx      # Bar chart for document status counts
    └── DocumentStatusTable.tsx # Table with document status breakdown
```

## Features

- **KPI Cards**: Shows percentage of issued and approved documents
- **Filters**: Date range and discipline filtering with report generation
- **S-Curve Chart**: Compares planned vs actual progress over time
- **Status Bar Chart**: Visualizes document counts by emission status
- **Status Table**: Detailed breakdown of document statuses with expandable rows

## Navigation

- Accessible from the main gallery page via "Monitor de Documentos" card
- Includes "Voltar ao Menu" button to return to the main gallery
