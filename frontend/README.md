# AgentDMS Admin Frontend

A React + TypeScript frontend application built with Vite for the AgentDMS Admin system.

## Features

- **React 19** with **TypeScript** for type-safe development
- **Vite** for fast development and optimized builds
- **React Router v6** for client-side routing
- **Tailwind CSS** for modern styling
- **JWT Authentication** with protected routes
- **Axios** for API communication with automatic token handling
- **Responsive design** with mobile-first approach

## Project Structure

```
frontend/
├── src/
│   ├── auth/                   # Authentication context and components
│   │   ├── AuthContext.tsx     # JWT authentication context
│   │   └── ProtectedRoute.tsx  # Route protection component
│   ├── components/             # Reusable UI components
│   │   ├── Header.tsx          # Application header
│   │   └── ProjectCard.tsx     # Project display component
│   ├── pages/                  # Page components
│   │   ├── Login.tsx           # Login page
│   │   ├── Dashboard.tsx       # Main dashboard
│   │   └── NotFound.tsx        # 404 error page
│   ├── services/               # API service layer
│   │   ├── api.ts              # Base Axios configuration
│   │   ├── auth.ts             # Authentication services
│   │   └── projects.ts         # Project-related services
│   ├── types/                  # TypeScript type definitions
│   │   ├── auth.ts             # Authentication types
│   │   └── api.ts              # API response types
│   ├── hooks/                  # Custom React hooks
│   ├── utils/                  # Utility functions
│   ├── App.tsx                 # Main application component
│   └── main.tsx                # Application entry point
├── public/                     # Static assets
├── .env.example                # Environment variables template
└── package.json                # Dependencies and scripts
```

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Backend API running on `http://localhost:5267`

### Installation

1. **Navigate to the frontend directory**
   ```bash
   cd frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` to match your backend configuration:
   ```env
   VITE_API_URL=http://localhost:5267/api
   VITE_APP_ENV=development
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```
   
   The application will be available at `http://localhost:5173`

### Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally
- `npm run lint` - Run ESLint for code quality

## Authentication

The application uses JWT-based authentication with the following features:

### Demo Credentials
```
Email: admin@agentdms.com
Password: admin123
```

### Authentication Flow
1. **Login**: User enters credentials on `/login`
2. **Token Storage**: JWT token stored in localStorage
3. **Protected Routes**: Automatic redirect to login if not authenticated
4. **Auto-logout**: Invalid/expired tokens trigger automatic logout
5. **Token Injection**: All API requests include Bearer token

### Protected Routes
- `/dashboard` - Main application dashboard
- All routes except `/login` require authentication

## API Integration

### Base Configuration
The frontend communicates with the backend API using Axios with:
- Automatic JWT token injection
- Request/response interceptors
- Error handling for authentication failures
- Configurable base URL via environment variables

### Mock Data
Currently includes mock data for development:
- Sample projects for dashboard display
- Mock authentication responses
- Example API service patterns

### Real API Integration
To connect with the actual backend:
1. Ensure backend is running on configured port
2. Update service files to remove mock data
3. Implement actual API endpoints in backend

## Styling

Uses **Tailwind CSS** for styling with:
- Modern utility-first approach
- Responsive design patterns
- Consistent color scheme
- Accessibility-focused components

### Color Scheme
- Primary: Blue (`blue-600`, `blue-700`)
- Success: Green (`green-500`)
- Warning: Yellow (`yellow-500`)
- Error: Red (`red-600`)
- Neutral: Gray scale

## Development Guidelines

### Code Organization
- **Components**: Reusable UI components in `/src/components`
- **Pages**: Route-level components in `/src/pages`
- **Services**: API and business logic in `/src/services`
- **Types**: TypeScript definitions in `/src/types`
- **Hooks**: Custom React hooks in `/src/hooks`

### TypeScript Best Practices
- Use type-only imports for type definitions
- Define interfaces for all data structures
- Leverage TypeScript strict mode
- Provide type annotations for props and state

### Component Patterns
- Functional components with hooks
- Props interfaces for all components
- Error boundaries for error handling
- Loading states for async operations

## Deployment

### Production Build
```bash
npm run build
```

Creates optimized build in `/dist` directory with:
- Minified and compressed assets
- Tree-shaken JavaScript bundles
- Optimized CSS with Tailwind purging
- Source maps for debugging

### Environment Configuration
Configure environment variables for different environments:
- `VITE_API_URL` - Backend API base URL
- `VITE_APP_ENV` - Application environment

### Deployment Options
- **Static Hosting**: Netlify, Vercel, GitHub Pages
- **CDN**: CloudFront, CloudFlare
- **Server**: Nginx, Apache for custom hosting

## Contributing

1. Follow existing code structure and naming conventions
2. Use TypeScript for all new code
3. Add type definitions for API responses
4. Test authentication flows thoroughly
5. Ensure responsive design on all components
6. Update this README for new features

## Troubleshooting

### Common Issues

**Build Errors**
- Ensure all TypeScript types are properly imported
- Check for missing dependencies

**Authentication Issues**
- Verify backend API is running
- Check CORS configuration on backend
- Validate environment variables

**Styling Issues**
- Ensure Tailwind CSS is properly configured
- Check PostCSS configuration
- Verify class names are correct

### Getting Help
- Check browser console for errors
- Verify network requests in developer tools
- Ensure backend API endpoints are accessible
- Check environment variable configuration
