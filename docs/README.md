# Digital Menu & WhatsApp Ordering System - Syria

## Project Overview

A lightweight, Arabic-first SaaS giving Syrian restaurants a unified digital menu with tap-to-order via WhatsApp, engineered for speed on weak connections and offline resilience.

**Version:** 1.0.0-MVP

## Documentation Structure

- `features/` - Gherkin feature files defining user stories and acceptance criteria
- `docs/functional-requirements.md` - Detailed functional requirements
- `docs/non-functional-requirements.md` - Performance, security, and technical requirements
- `docs/database-schema.md` - Database design and relationships
- `docs/api-specification.md` - API endpoints and data models
- `docs/architecture.md` - System architecture and component design

## Key Features

### In Scope (MVP v1.0.0)
- Super Admin tenant management (manual)
- Restaurant control panel for menu building, theming, and QR generation
- Public-facing, fast-loading digital menu with client-side cart
- Order submission via pre-formatted WhatsApp message

### Out of Scope
- Automated billing and subscription management
- Custom domains for restaurants
- Multi-language support (English)
- In-app order fulfillment or Kitchen Display Systems (KDS)

## Technology Stack

- **Frontend:** React + TypeScript + Tailwind CSS
- **Backend:** Supabase (PostgreSQL + Auth + Storage)
- **Platform:** Lovable.dev with native Supabase integration
- **Architecture:** Progressive Web App (PWA)

## Getting Started

1. Review the Gherkin feature files in `features/`
2. Connect to Supabase for backend functionality
3. Follow the implementation phases outlined in the documentation

## User Personas

- **Restaurant Owner (P-RESTAURANT-OWNER):** Low-to-medium tech proficiency, manages business via smartphone, needs simple Arabic interface
- **Diner (P-DINER):** Medium-to-high tech proficiency, expects fast, seamless mobile experience on WhatsApp