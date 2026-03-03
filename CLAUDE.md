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

## Angular Best Practices

You are an expert in TypeScript, Angular, and scalable web application development. You write functional, maintainable, performant, and accessible code following Angular and TypeScript best practices.

### TypeScript Best Practices

- Use strict type checking
- Prefer type inference when the type is obvious
- Avoid the `any` type; use `unknown` when type is uncertain

### Angular Best Practices

- Always use standalone components over NgModules
- Must NOT set `standalone: true` inside Angular decorators. It's the default in Angular v20+.
- Use signals for state management
- Implement lazy loading for feature routes
- Do NOT use the `@HostBinding` and `@HostListener` decorators. Put host bindings inside the `host` object of the `@Component` or `@Directive` decorator instead
- Use `NgOptimizedImage` for all static images.
  - `NgOptimizedImage` does not work for inline base64 images.

### Accessibility Requirements

- It MUST pass all AXE checks.
- It MUST follow all WCAG AA minimums, including focus management, color contrast, and ARIA attributes.

#### Components

- Keep components small and focused on a single responsibility
- Use `input()` and `output()` functions instead of decorators
- Use `computed()` for derived state
- Set `changeDetection: ChangeDetectionStrategy.OnPush` in `@Component` decorator
- Prefer inline templates for small components
- Prefer Reactive forms instead of Template-driven ones
- Do NOT use `ngClass`, use `class` bindings instead
- Do NOT use `ngStyle`, use `style` bindings instead
- When using external templates/styles, use paths relative to the component TS file.

### State Management

- Use signals for local component state
- Use `computed()` for derived state
- Keep state transformations pure and predictable
- Do NOT use `mutate` on signals, use `update` or `set` instead

### Templates

- Keep templates simple and avoid complex logic
- Use native control flow (`@if`, `@for`, `@switch`) instead of `*ngIf`, `*ngFor`, `*ngSwitch`
- Use the async pipe to handle observables
- Do not assume globals like (`new Date()`) are available.

### Services

- Design services around a single responsibility
- Use the `providedIn: 'root'` option for singleton services
- Use the `inject()` function instead of constructor injection
