# Polaris Frontend

Polaris is a modern web application that provides a ChatGPT-like interface for managing projects and conversations. This repository contains the frontend code built with React, TypeScript, and Tailwind CSS.

## Features

- **Authentication**: User authentication with login, register, and password recovery
- **Projects Management**: Create and manage projects with multiple conversations
- **Chat Interface**: ChatGPT-like interface for conversations
- **Member Management**: Manage organization members and their access to projects
- **Profile Management**: User and company profile settings
- **Subscription Management**: Manage subscription plans and billing

## Tech Stack

- React 18
- TypeScript
- React Router v6
- Tailwind CSS v3.3
- Framer Motion
- Headless UI

## Getting Started

### Prerequisites

- Node.js 18+ and npm

### Installation

1. Clone the repository
```bash
git clone https://github.com/yourusername/polaris-fe.git
cd polaris-fe
```
2. Add .env.local file and here is its content
```bash
REACT_APP_API_BASE_URL=https://backend.polaris-ai.app/api
```

3. Install dependencies
```bash
npm install
```
if gives error, try
```bash
npm i -f
```

4. Start the development server
```bash
npm start
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Project Structure

```
src/
├── components/       # Reusable UI components
│   ├── auth/         # Authentication related components
│   ├── chat/         # Chat interface components
│   ├── common/       # Common components used across the app
│   ├── members/      # Member management components
│   ├── profile/      # Profile related components
│   ├── projects/     # Project management components
│   ├── subscription/ # Subscription related components
│   └── ui/           # Basic UI components (buttons, inputs, etc.)
├── context/          # React context providers
├── hooks/            # Custom React hooks
├── layouts/          # Page layout components
├── pages/            # Page components
├── services/         # API service functions
├── utils/            # Utility functions
├── assets/           # Static assets
└── types/            # TypeScript type definitions
```

## UX Overview

- The left sidebar is project-centric. Selecting a project reveals its conversations nested below it.
- Under each selected project, two compact actions appear:
  - Search (magnifier) to filter conversations inline
  - Start new conversation (plus) to create a blank conversation and open it
- Profile, Company Profile, Subscription and Manage Team are available from the top-right profile dropdown, not in the sidebar.
- The chat page focuses on the message thread; the old conversations toolbar inside the chat page has been removed.

## Mock Data and Integration Notes

The UI currently uses mock state for projects and conversations to demonstrate UX flows:

- `layouts/MainLayout.tsx`: projects list, conversations per project, create project modal, sidebar search/new-conversation actions
- `pages/chat/ChatInterface.tsx`: blank thread behavior for newly created conversations

Replace these with real API calls when wiring to the backend services.

## Available Scripts

- `npm start`: Starts the development server
- `npm build`: Builds the app for production
- `npm test`: Runs tests
- `npm eject`: Ejects from create-react-app

## Backend Integration

This frontend is designed to work with a separate backend API. The API endpoints are configured in the services directory.

## License

[MIT](LICENSE)