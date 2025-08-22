# Live Mode Configuration

This document explains how to switch between **Demo Mode** and **Live Mode** in the AgentDMS Admin application.

## Mode Overview

### Demo Mode
- Uses mock/sample data for testing and demonstrations
- Does not require a live backend API
- Shows sample documents, users, and projects
- Perfect for showcasing features without real data

### Live Mode 
- Connects to the real backend API and database
- Shows actual data from the SQLite database
- Requires the backend API to be running
- Used for production and real testing scenarios

## Switching Between Modes

The mode is controlled by the `VITE_ENABLE_DEMO_MODE` environment variable in the frontend.

### To Enable Live Mode (Default)

1. Edit `frontend/.env`:
   ```bash
   # Enable live testing mode (disable demo mode)
   VITE_ENABLE_DEMO_MODE=false
   ```

2. Ensure the backend API is running:
   ```bash
   cd src/AgentDmsAdmin.Api
   dotnet run
   ```

3. Start the frontend:
   ```bash
   cd frontend
   npm run dev
   ```

### To Enable Demo Mode

1. Edit `frontend/.env`:
   ```bash
   # Enable demo mode for testing
   VITE_ENABLE_DEMO_MODE=true
   ```

2. Restart the frontend (backend is optional for demo mode)

## Features Supported in Live Mode

- ✅ **User Authentication**: Real JWT-based authentication against the backend
- ✅ **User Management**: CRUD operations on real users from the database
- ✅ **Project Management**: Real projects stored in SQLite database
- ✅ **Document Search**: Live document search using the backend API
- ✅ **Document Metadata**: Get and update real document metadata
- ✅ **Error Handling**: Proper error responses from the backend API

## Features Available in Demo Mode

- ✅ **Sample Users**: Pre-defined demo users for testing UI
- ✅ **Sample Projects**: Mock project data
- ✅ **Sample Documents**: Mock document search results with realistic data
- ✅ **Full UI Testing**: Test all UI components without backend dependency

## Login Credentials

### Live Mode
- **Email**: admin@agentdms.com  
- **Password**: admin123
- **Note**: This authenticates against the real backend database

### Demo Mode
- **Email**: admin@agentdms.com
- **Password**: admin123  
- **Note**: This uses mock authentication (any credentials work)

## API Endpoints Used in Live Mode

- `POST /api/auth/login` - User authentication
- `GET /api/users` - List users
- `GET /api/projects` - List projects  
- `POST /api/documents/search` - Search documents
- `GET /api/documents/{id}/metadata` - Get document metadata
- `PUT /api/documents/{id}/metadata` - Update document metadata

## Configuration Details

The application automatically detects the mode based on the environment variable and:

- **Live Mode**: Makes real API calls, throws errors on failures
- **Demo Mode**: Falls back to mock data when API calls fail
- **Mixed Mode**: If `VITE_ENABLE_DEMO_MODE=false` but backend is unavailable, errors are thrown (no fallback)

## Troubleshooting

### "No documents found" in Live Mode
This is expected behavior if no documents have been uploaded yet. The message indicates the live API is working correctly.

### Connection errors in Live Mode
Ensure the backend API is running on `http://localhost:5267` and accessible.

### Demo mode not working
Verify the `VITE_ENABLE_DEMO_MODE=true` setting and restart the frontend development server.