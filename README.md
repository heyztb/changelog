# Changelog - Bun + React + TanStack Router

A modern web application for building in public and sharing updates, built with Bun, React, TanStack Router, and Tailwind CSS.

## Features

- ⚡ **Bun Runtime** - Fast JavaScript runtime and toolkit
- ⚛️ **React 19** - Latest React with modern features
- 🚦 **TanStack Router** - Type-safe, file-based routing
- 🎨 **Tailwind CSS** - Utility-first CSS framework
- 🔧 **TypeScript** - Full type safety
- 🔥 **Hot Module Reload** - Fast development experience
- 📱 **Farcaster Integration** - Mini-app ready

## Quick Start

### Install dependencies

```bash
bun install
```

### Start development server

```bash
bun dev
```

This will:
- Start the Bun server on `http://localhost:3000`
- Watch for route changes and auto-generate route tree
- Enable hot module reload

### Build for production

```bash
bun run build
```

### Run production server

```bash
bun start
```

## Project Structure

```
changelog/
├── src/
│   ├── routes/              # File-based routes
│   │   ├── __root.tsx      # Root layout (wraps all routes)
│   │   ├── index.tsx       # Home page (/)
│   │   ├── about.tsx       # About page (/about)
│   │   └── posts/
│   │       ├── index.tsx   # Posts list (/posts)
│   │       └── $postId.tsx # Post detail (/posts/:id)
│   ├── components/          # React components
│   ├── lib/                 # Utilities and helpers
│   ├── index.tsx           # React entry point
│   ├── index.ts            # Bun server
│   └── routeTree.gen.ts    # Auto-generated route tree
├── public/                  # Static assets
└── styles/                  # Global styles
```

## Routing

This project uses **TanStack Router** with file-based routing. Routes are automatically generated from files in `src/routes/`.

### Creating a New Route

1. Create a file in `src/routes/`:
   ```tsx
   // src/routes/my-page.tsx
   import { createFileRoute } from '@tanstack/react-router'
   
   export const Route = createFileRoute('/my-page')({
     component: MyPage,
   })
   
   function MyPage() {
     return <div>My Page Content</div>
   }
   ```

2. The route watcher automatically updates `routeTree.gen.ts`

3. Navigate to `/my-page` in your browser

### Documentation

- **[TanStack Router Guide](./TANSTACK_ROUTER_GUIDE.md)** - Complete routing guide with examples
- **[Quick Reference](./ROUTER_QUICK_REF.md)** - Cheat sheet for common operations

## Available Scripts

```bash
# Development
bun dev                    # Start dev server with HMR and route watching

# Routes
bun run generate-routes    # Generate route tree once
bun run watch-routes       # Watch and regenerate routes

# Production
bun run build             # Build for production
bun start                 # Start production server
```

## Key Technologies

- **Bun** - Fast JavaScript runtime, replaces Node.js and npm
- **React 19** - UI library with latest features
- **TanStack Router** - Type-safe routing with file-based routes
- **Tailwind CSS 4** - Utility-first CSS
- **TypeScript** - Type safety and better DX
- **Radix UI** - Headless UI components
- **Lucide React** - Icon library

## Bun-Specific Features

This project leverages Bun's built-in capabilities:

- **`Bun.serve()`** - Native HTTP server with WebSocket support
- **HTML imports** - Import HTML files directly in TypeScript
- **Built-in bundler** - No need for Webpack or Vite for HTML imports
- **Hot module reload** - Built-in HMR support
- **Fast installs** - Much faster than npm/yarn/pnpm

## Development Tips

1. **Route Watching**: The `bun dev` command automatically watches for route changes. If you create new route files, they'll be picked up automatically.

2. **Type Safety**: TanStack Router provides full TypeScript support. Your IDE will autocomplete route paths and params.

3. **DevTools**: In development mode, TanStack Router DevTools appear in the bottom corner to help debug routing.

4. **Hot Reload**: Changes to React components, CSS, and routes reload instantly without full page refresh.

## Environment Variables

Create a `.env` file in the root directory:

```env
PORT=3000              # Server port (optional, defaults to 3000)
NODE_ENV=development   # Environment mode
```

## Deployment

The app is configured as a Farcaster mini-app. Deploy to any platform that supports Bun:

- **Railway** - Native Bun support
- **Fly.io** - Docker with Bun
- **Your own server** - Just install Bun and run `bun start`

## Learn More

- [Bun Documentation](https://bun.sh/docs)
- [TanStack Router Documentation](https://tanstack.com/router/latest)
- [React Documentation](https://react.dev)
- [Tailwind CSS Documentation](https://tailwindcss.com)

## License

This project is open source and available under the MIT License.