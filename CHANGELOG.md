# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- GitHub issue templates for feature requests
- Pull request template with comprehensive checklist
- Security best practices documentation
- Project hygiene guidelines
- Standardized contribution workflow

### Changed
- Enhanced README.md with security and contribution guidelines

### Deprecated

### Removed

### Fixed

### Security

## [1.0.0] - Initial Release

### Added
- .NET 8 backend with Entity Framework Core and SQLite
- React 19 + TypeScript frontend with Vite
- JWT-based authentication system
- Project and document management functionality
- Custom fields support for documents
- Document page management
- Responsive UI with Tailwind CSS
- Protected routes and authentication context
- Mock data for development
- Entity Framework migrations
- Data seeding utilities
- API service layer with Axios
- Cross-platform SQLite database support

### Features
- **Backend**
  - ASP.NET Core Web API
  - Entity Framework Core with SQLite
  - Project, Document, CustomField, DocumentFieldValue, and DocumentPage entities
  - Database migrations and seeding
  - Audit fields on base entities

- **Frontend**
  - React 19 with TypeScript
  - Vite for development and build tooling
  - React Router v6 for client-side routing
  - Tailwind CSS for styling
  - JWT authentication with protected routes
  - Axios HTTP client with interceptors
  - Authentication context and components
  - Dashboard and login pages
  - Responsive design patterns

### Technical Details
- **Database**: SQLite for simplified development and deployment
- **Authentication**: JWT tokens with localStorage persistence
- **API Communication**: Axios with automatic token injection
- **Build Tools**: Vite for fast development and optimized builds
- **Styling**: Tailwind CSS utility-first framework
- **Type Safety**: TypeScript strict mode throughout