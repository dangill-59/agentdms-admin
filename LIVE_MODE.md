# Production Mode Configuration

This document explains the configuration and deployment of the AgentDMS Admin application in **production mode**.

## Production Mode Overview

The AgentDMS Admin application now operates exclusively in production mode, connecting directly to the real backend API and database for all operations.

### Features Available in Production Mode

- ✅ **User Authentication**: Real JWT-based authentication against the backend
- ✅ **User Management**: CRUD operations on real users from the database
- ✅ **Project Management**: Real projects stored in SQLite database
- ✅ **Document Search**: Live document search using the backend API
- ✅ **Document Metadata**: Get and update real document metadata
- ✅ **Error Handling**: Proper error responses from the backend API
- ✅ **Role Management**: Complete role and permission management system
- ✅ **Real-time Updates**: Live data updates from the backend

## Getting Started

### Prerequisites

1. **Backend API**: Ensure the AgentDMS backend API is running and accessible
2. **Database**: SQLite database must be properly initialized with required tables
3. **Environment Configuration**: Proper environment variables configured

### Starting the Application

1. **Ensure the backend API is running**:
   ```bash
   cd src/AgentDmsAdmin.Api
   dotnet run
   ```

2. **Start the frontend**:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

3. **Build for production**:
   ```bash
   cd frontend
   npm run build
   ```

## API Endpoints

The application uses the following backend API endpoints:

- `POST /api/auth/login` - User authentication
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - User logout
- `GET /api/users` - List users
- `GET /api/projects` - List projects
- `POST /api/documents/search` - Search documents
- `GET /api/documents/{id}/metadata` - Get document metadata
- `PUT /api/documents/{id}/metadata` - Update document metadata
- `GET /api/roles` - List roles
- `GET /api/permissions` - List permissions

## Configuration

The application is configured through environment variables:

### Required Environment Variables

```bash
# API Configuration
VITE_API_URL=http://localhost:5267/api
VITE_WS_URL=ws://localhost:5267/progressHub

# Optional Configuration
VITE_API_TIMEOUT=30000
VITE_RETRY_ATTEMPTS=3
VITE_ENABLE_SIGNALR=true
VITE_ENABLE_REAL_TIME_UPDATES=true
```

### Frontend Configuration File

Create a `.env` file in the `frontend` directory:

```bash
# API URL for the backend
VITE_API_URL=http://localhost:5267/api

# WebSocket URL for real-time features
VITE_WS_URL=ws://localhost:5267/progressHub

# App Environment
VITE_APP_ENV=production
```

## Troubleshooting

### Connection Errors

**Issue**: Cannot connect to backend API  
**Solution**: Ensure the backend API is running on the configured URL (default: `http://localhost:5267`)

### Authentication Failures

**Issue**: Login attempts fail  
**Solution**: 
1. Verify backend authentication service is working
2. Check that user accounts exist in the database
3. Ensure JWT token configuration is correct

### "No documents found" Message

**Issue**: Document search returns no results  
**Solution**: This is expected if no documents have been uploaded. Use the document upload feature to add documents to the system.

### Build Errors

**Issue**: Frontend build fails  
**Solution**: 
1. Ensure all dependencies are installed: `npm install`
2. Check TypeScript configuration
3. Verify all environment variables are properly set

## Deployment

### Production Deployment

1. **Build the frontend**:
   ```bash
   cd frontend
   npm run build
   ```

2. **Deploy backend API**:
   ```bash
   cd src/AgentDmsAdmin.Api
   dotnet publish -c Release
   ```

3. **Configure production environment**:
   - Set production API URLs
   - Configure SSL certificates
   - Set up proper database connections
   - Configure authentication providers

### Environment Variables for Production

```bash
VITE_API_URL=https://your-production-api.com/api
VITE_WS_URL=wss://your-production-api.com/progressHub
VITE_APP_ENV=production
```

## Security Considerations

- All API communications use HTTPS in production
- JWT tokens are securely stored and validated
- User authentication is required for all operations
- Role-based access control is enforced
- Input validation and sanitization is performed on all data