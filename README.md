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

### Prerequisites
Make sure you have [Node.js](https://nodejs.org/) installed on your machine.

### Installation

1. Clone the repository and navigate into the project directory.
2. Install the dependencies:
   ```bash
   npm install
   ```

### Development Server
Run the local development server:
```bash
npm run dev
```

### Production Build
Create an optimized production build:
```bash
npm run build
```
The built files will be located in the `dist` directory.
