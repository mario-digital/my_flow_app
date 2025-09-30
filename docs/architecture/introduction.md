# Introduction

This document outlines the complete fullstack architecture for My Flow, including backend systems, frontend implementation, and their integration. It serves as the single source of truth for AI-driven development, ensuring consistency across the entire technology stack.

This unified approach combines what would traditionally be separate backend and frontend architecture documents, streamlining the development process for modern fullstack applications where these concerns are increasingly intertwined.

## Starter Template or Existing Project

**N/A - Greenfield Project**

This is a greenfield project architected from scratch with specific architectural decisions:

- **Server Component First Approach:** Next.js 15 App Router with React Server Components (RSC) as the default pattern
- **Client Components for State Only:** Client-side components reserved specifically for state management and interactivity requiring browser APIs
- **CSS Design Tokens:** CSS custom properties (variables) as the foundation for all styling, integrated with Tailwind CSS
- **Strategic State Management:** Minimal client-side state with server state handled by TanStack Query; local UI state via React Context only where necessary

## Change Log

| Date | Version | Description | Author |
|------|---------|-------------|--------|
| 2025-09-30 | 1.0 | Initial Architecture Document | Winston (Architect) |
