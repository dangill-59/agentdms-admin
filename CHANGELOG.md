# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Repository-wide code style and quality tools: Prettier, EditorConfig, StyleCop
- Dependabot for dependency updates (npm and NuGet)
- GitHub Actions workflow for CI (build, lint, test for frontend and backend)
- Issue and Pull Request templates for standardizing contributions
- Security guidelines for handling secrets and dependency vulnerabilities
- This changelog file
- Magick.NET-Q16-AnyCPU 14.8.1 for safe image processing functionality
- Enhanced ImageProcessingController with actual image dimension detection and thumbnail generation

### Changed
- Documentation improvements in README (project hygiene, security, contribution)

### Fixed
- Security vulnerability in Magick.NET by upgrading to version 14.8.1 (resolves GHSA-mxvv-97wh-cfmm)