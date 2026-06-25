# Laguna AI Line Balancing

A comprehensive React-based web application designed for line balancing, forecasting, and operator management.

## Features
- **Dashboards**: Dedicated dashboards for Admin and User roles.
- **Forecasting & Planning**: View forecasting data, manage planning sheets, and allocate resources efficiently.
- **Operator Management**: Drag and drop interface for employee allocation and scheduling.
- **Authentication**: Secure login, password recovery, and role-based access.

## Tech Stack
- **Framework:** React + Vite
- **Styling:** Tailwind CSS + Vanilla CSS (`App.css`, `index.css`)
- **Routing:** React Router (`react-router-dom`)

## Folder Structure
The project follows standard React conventions for maintainability and scalability:

```text
src/
├── api/                  # API configurations and network calls
├── assets/               # Static assets (images, icons, fonts)
├── components/           # Reusable UI components
│   └── shared/           # Components used across multiple pages (Headers, Footers, Sidenav)
├── context/              # React Context providers for global state (e.g., UserContext)
├── pages/                # Route-level screens (Dashboards, Login, Planning, etc.)
└── routes/               # Application routing logic
```

## Getting Started

> [!IMPORTANT]
> **Docker Integration:** This frontend application is fully integrated into the main backend ecosystem. You do **not** need to build or run this container manually. It is automatically managed by the main `docker-compose.yml` file located in the `laguna-ai-line-balancing` (backend) directory.

### Running via Docker (Recommended)

To start the entire application stack (Frontend, Backend, DB, Redis):
```bash
# From the backend root directory
cd ../laguna-ai-line-balancing
scripts\start.bat --dev
```

To stop only the frontend container while keeping the backend alive:
```bash
docker compose stop app
```
*(To start it back up: `docker compose start app`)*

---

### Local Development Server (Without Docker)

If you need to run the React app locally for development (e.g., to use Hot Module Replacement):

1. Install the dependencies:
   ```bash
   npm install
   ```

2. Run the local development server:
   ```bash
   npm run dev
   ```

### Production Build
Create an optimized production build:
```bash
npm run build
```
The built files will be located in the `dist` directory.

## Build and Version Management

This project uses a custom build script (`scripts\build.bat`) to manage versioning and building Docker images for the web application.

### Prerequisites

- Ensure you have Docker installed and configured on your system.
- Make sure you have Node.js installed to run the version extraction command.

### Basic Usage

To build the application with the current version (as specified in `package.json`):

```bash
scripts\build.bat
```

### Version Bumping

To bump the version and build:

```bash
scripts\build.bat --bump [major|minor|patch]
```

This will:

1. Increment the version in `package.json`
2. Commit the change
3. Create a new git tag
4. Build and push Docker images with the new version

### Specific Version

To build using a specific version:

```bash
scripts\build.bat --version X.Y.Z
```

### Platform-Specific Build

To build for AMD64 platform:

```bash
scripts\build.bat --amd
```

### Combining Options

You can combine options as needed. For example:

```bash
scripts\build.bat --bump minor --amd
```

This will bump the minor version and build for AMD64 platform.

### Version Tagging

- The script always builds two Docker image tags:
  1. The specific version (e.g., `laguna-ai-line-balancing:1.2.3`)
  2. The `latest` tag

### Git Integration

- When bumping versions, the script automatically commits changes to `package.json`, creates a git tag, and pushes changes to the remote repository.

### Notes

- Always run this script from the root directory of the project.
- Ensure you have the necessary permissions to push to the Docker repository and git remote.
