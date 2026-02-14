# Project Structure

This document outlines the organization and architecture of the NDIS Data Exploration application.

## Overview

A Next.js application for securely exploring Supabase database tables with password-based authentication and rate limiting.

## Directory Structure

```
ndis-data-exploration/
├── app/                          # Next.js App Router pages
│   ├── api/                      # API routes (server-side)
│   │   ├── check-connection/     # Validates connection & password
│   │   ├── list-tables/          # Fetches available tables
│   │   └── get-table-data/       # Fetches data from specific table
│   ├── setup/                    # Password entry page
│   │   └── page.tsx
│   └── page.tsx                  # Main dashboard (table explorer)
│
├── components/                   # Reusable UI components
│   ├── ErrorDisplay.tsx          # Error message display
│   ├── LoadingSpinner.tsx        # Loading indicator
│   ├── TableList.tsx             # Sidebar table selector
│   └── TableView.tsx             # Main table data display
│
├── hooks/                        # Custom React hooks
│   └── useDatabase.ts            # Database state management
│
├── lib/                          # Utility functions
│   ├── api.ts                    # API client functions
│   └── rate-limiter.ts           # Rate limiting logic
│
├── types/                        # TypeScript type definitions
│   └── database.ts               # Database-related types
│
├── .env.local                    # Environment variables (not committed)
├── .env.local.example            # Template for environment setup
└── .gitignore                    # Git ignore rules
```

## Architecture

### Authentication Flow

1. User visits root (`/`)
2. If no password in sessionStorage → redirect to `/setup`
3. User enters password on setup page
4. Password stored in sessionStorage
5. Redirect to main page
6. Main page validates password via API
7. If valid → fetch tables and display
8. If invalid → clear session and redirect to setup

### Data Flow

1. **Initial Load**
   - `page.tsx` calls `useDatabase` hook
   - Hook calls `checkConnection()` API
   - If successful, calls `fetchTables()` API
   - Tables populate in sidebar

2. **Table Selection**
   - User clicks table in sidebar
   - `selectTable()` called from hook
   - `fetchTableData()` API fetches all rows
   - Data rendered in TableView component

### Component Hierarchy

```
Home (page.tsx)
├── Header
│   └── Logout button
├── LoadingSpinner (while connecting)
├── ErrorDisplay (if connection fails)
└── Connected State
    ├── TableList (sidebar)
    │   └── Table buttons
    └── TableView (main content)
        └── Data table
```

### Custom Hook: `useDatabase`

Centralizes all database-related state management:
- Connection status
- Error handling
- Tables list
- Selected table
- Table data
- Loading states

### API Layer: `lib/api.ts`

Abstraction over fetch calls:
- `checkConnection()` - Validates password
- `fetchTables()` - Gets table list
- `fetchTableData()` - Gets table rows
- Custom `ApiError` class for error handling

### Security Features

1. **Server-Side API Routes**
   - Supabase credentials never exposed to client
   - All database queries happen server-side

2. **Rate Limiting** (`lib/rate-limiter.ts`)
   - 5 failed attempts allowed per IP
   - 15-minute block after threshold
   - Tracks by IP address

3. **Password Protection**
   - Configurable via environment variable
   - Validated on every API call
   - Stored in sessionStorage (cleared on browser close)

## Key Technologies

- **Next.js 16** - React framework with App Router
- **TypeScript** - Type safety
- **Supabase** - PostgreSQL database
- **Tailwind CSS** - Styling
- **sessionStorage** - Client-side session management

## Code Quality Practices

1. **Separation of Concerns**
   - UI components separate from logic
   - API calls abstracted into dedicated module
   - Business logic in custom hooks

2. **Type Safety**
   - All data structures typed
   - API responses typed
   - Component props typed

3. **Reusability**
   - Generic components (LoadingSpinner, ErrorDisplay)
   - Custom hooks for shared logic
   - Utility functions for common operations

4. **Error Handling**
   - Custom ApiError class
   - Graceful error messages to users
   - Proper HTTP status codes

## Environment Variables

Required in `.env.local`:

```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
APP_PASSWORD=your-secure-password
```

## Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```
