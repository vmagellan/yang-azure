# AI Prompt Interface Frontend

A simple React application that provides an interface for sending prompts to an AI backend and displaying the responses.

## Features

- Input field for entering prompts
- Submit button to send prompts to the backend
- Response display area
- Responsive design

## Getting Started

### Prerequisites

- Node.js (v18 or higher recommended)
- npm or yarn

### Installation

1. Install dependencies:

```bash
npm install
# or
yarn
```

### Development

To start the development server:

```bash
npm run dev
# or
yarn dev
```

This will start the development server at http://localhost:5173 (or another port if 5173 is in use).

### Building for Production

To build the app for production:

```bash
npm run build
# or
yarn build
```

The build output will be in the `dist` directory.

### Preview Production Build

To preview the production build locally:

```bash
npm run preview
# or
yarn preview
```

## Backend Integration

The app is designed to work with a backend API that will be set up later. Currently, it uses a placeholder response. When the backend is ready, update the `handleSubmit` function in `src/App.tsx` to make actual API calls to your backend endpoint.

Example backend integration code is commented out in the `handleSubmit` function:

```typescript
const response = await fetch('/api/prompt', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ prompt })
})
const data = await response.json()
setResponse(data.response)
```

## Tech Stack

- React
- TypeScript
- Vite
