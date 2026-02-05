# AI Coding Agent Instructions

## Project Overview
**Gymi** is a Next.js 16 web application built with React 19, TypeScript, and Tailwind CSS v4. It uses the App Router for file-based routing and is configured for strict TypeScript checking. The project is in early development (v0.1.0) with minimal feature implementation.

## Architecture & Key Patterns

### Next.js App Router Structure
- **Route definitions**: Routes are defined by directory structure under `app/`
- **Layout system**: `app/layout.tsx` is the root layout; create nested layouts in subdirectories for route-specific layouts
- **Metadata**: Use `Metadata` type from `next` for page titles and descriptions (see [app/layout.tsx](app/layout.tsx#L1))
- **Dynamic routes**: Create `[param]` directories; use `params` prop in components

### Styling Approach
- **Tailwind CSS v4**: Primary styling framework via `@tailwindcss/postcss` plugin
- **Global styles**: [app/globals.css](app/globals.css) is imported in root layout
- **Dark mode**: Configured with `dark:` prefix (see usage in [app/page.tsx](app/page.tsx#L5))
- **Font optimization**: Using `next/font/google` for custom fonts (Geist Sans/Mono in [app/layout.tsx](app/layout.tsx#L5))

### TypeScript Configuration
- **Strict mode enabled**: All TS features like `noEmit`, `strict`, and `esModuleInterop` are enforced
- **Path alias**: `@/*` maps to root directory for imports (defined in [tsconfig.json](tsconfig.json#L20))
- **Module resolution**: Using `bundler` strategy for proper monorepo and ESM support

## Development Workflow

### Build & Run Commands
- **Development**: `npm run dev` → starts Next.js dev server on localhost:3000
- **Build**: `npm run build` → creates optimized production build
- **Production**: `npm run start` → runs production server
- **Linting**: `npm run lint` → runs ESLint with Next.js config

### Linting & Code Quality
- **ESLint integration**: Uses `eslint-config-next` with TypeScript support via `eslint-config-next/typescript`
- **Web Vitals**: CWV checks enabled via `eslint-config-next/core-web-vitals`
- **Ignored directories**: `.next`, `out`, `build`, `next-env.d.ts` are auto-ignored
- **Rules**: Enforce Core Web Vitals and Next.js best practices (no manual rule config needed)

## Code Conventions & Patterns

### Component Structure
- **Server Components by default**: React 19 in App Router defaults to Server Components; add `'use client'` directive for interactive components
- **Styling**: Use Tailwind classes directly in JSX (e.g., `className="flex items-center gap-4"`)
- **Image optimization**: Use `next/image` component with `width`, `height`, and `priority` props for LCP optimization

### Imports & Organization
- **Absolute imports**: Use `@/` alias for all internal imports (e.g., `import { Component } from '@/components/ui'`)
- **Next.js APIs**: Import from `next`, `next/font`, `next/image`, etc. as needed
- **Module resolution**: Bundler strategy supports ESM + CommonJS interop

### File Naming
- **Route files**: Use standard Next.js conventions (`page.tsx`, `layout.tsx`, `route.ts`)
- **Component files**: Follow React conventions (PascalCase for components, lowercase for utilities)
- **TypeScript**: All files should use `.ts` or `.tsx` extensions

## Critical Developer Knowledge

### File Organization
- Routes are defined by `app/` directory structure
- Root layout in [app/layout.tsx](app/layout.tsx) wraps all pages
- Currently minimal structure; expand with feature directories as needed

### Dependencies & Versions
- **Next.js 16.1.6**: Latest App Router with React 19 support
- **React 19.2.3**: Latest with improved hooks and performance
- **TypeScript 5**: Strict checking for type safety
- **Tailwind CSS 4**: Latest with PostCSS plugin (v4 is ESM-only, different from v3)

### Environment & Configuration
- **next.config.ts**: Basic config file; add plugins and feature flags here
- **postcss.config.mjs**: Minimal Tailwind integration (v4 requires PostCSS plugin)
- **No environment variables**: Not yet configured; add `.env.local` if needed

## Common Tasks

### Adding a New Page
1. Create `app/feature/page.tsx` with default export component
2. Import `Metadata` from `next` to add page title if needed
3. Use Tailwind classes for styling
4. Link from other pages using `<Link>` from `next/link`

### Creating a Reusable Component
1. Create file in subdirectory (e.g., `app/components/Button.tsx`)
2. Use relative path imports or `@/` alias
3. For interactivity, add `'use client'` at the top
4. Export as default or named export

### Debugging
- Dev server hot-reloads on file changes
- Check console in browser DevTools for runtime errors
- TypeScript compiler provides build-time error feedback
- ESLint runs on save in IDE (if configured)

## Avoiding Common Mistakes
- **Don't forget `'use client'`** when using hooks, event handlers, or state management
- **Don't hardcode styles** → use Tailwind utilities consistently
- **Don't use `<img>`** → always use `next/image` for optimization
- **Don't ignore TypeScript errors** → strict mode will catch issues early
- **Dark mode classes**: Use `dark:` prefix for dark theme support (already in layout)
