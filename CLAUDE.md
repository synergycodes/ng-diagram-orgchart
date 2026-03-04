# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Angular 21 organizational chart application built with ng-diagram. Uses standalone components (no NgModules), Angular signals, and the new control flow syntax (`@for`, `@if`, etc.).

## Commands

- **Dev server**: `ng serve` (http://localhost:4200, auto-reloads)
- **Build**: `ng build`
- **Test**: `ng test` (Vitest runner)
- **Format**: `npx prettier --write <file>`
- **Scaffold**: `ng generate component <name>` (also: directive, pipe, service)

## Architecture

- **Standalone components** — no NgModule, everything uses standalone API
- **Functional providers** — app config uses `provideRouter()`, `provideBrowserGlobalErrorListeners()`
- **Signals** — prefer Angular signals over RxJS subjects for component state
- **Component prefix**: `app`
- **Source root**: `src/`, single app in `src/app/`
- **Static assets**: `public/`
- **Build output**: `dist/ng-diagram-orgchart/`

## Code Style

- **Prettier** configured: 100 char width, single quotes, angular HTML parser
- **Strict TypeScript**: strict mode, strictTemplates, strictInjectionParameters, noImplicitReturns, noImplicitOverride
- **Indent**: 2 spaces

## ng-diagram Docs

An MCP server for ng-diagram documentation is configured. Use `search_docs`, `search_symbols`, `get_doc`, and `get_symbol` tools to look up ng-diagram APIs and guides.
