# Functional Requirements

## FR-001: Super Admin Management
- **Requirement:** Super Admin can create and manage restaurant tenant accounts
- **Priority:** Must Have (MVP v1.0.0)
- **User Story:** As a Super Admin, I want to create restaurant accounts so that I can onboard new clients
- **Acceptance Criteria:** See `features/super_admin.feature`

## FR-002: Menu Management
- **Requirement:** Restaurant owners can build and manage their digital menus
- **Priority:** Must Have (MVP v1.0.0)
- **User Story:** As a Restaurant Owner, I want to manage my menu so that customers see current offerings
- **Acceptance Criteria:** See `features/menu_management.feature`

## FR-003: Customer Ordering Experience
- **Requirement:** Customers can view menus via QR code and place orders through WhatsApp
- **Priority:** Must Have (MVP v1.0.0)
- **User Story:** As a Diner, I want to scan QR codes and order via WhatsApp for convenience
- **Acceptance Criteria:** See `features/diner_experience.feature`

## FR-004: Multi-Tenant Data Isolation
- **Requirement:** Complete data isolation between restaurant tenants using Supabase RLS
- **Priority:** Must Have (MVP v1.0.0)
- **Technical Details:** 
  - Each restaurant's data must be completely isolated
  - Implemented via Supabase Row Level Security policies
  - No cross-tenant data access possible

## FR-005: Arabic Language Support
- **Requirement:** Full Arabic language support with RTL layout
- **Priority:** Must Have (MVP v1.0.0)
- **Technical Details:**
  - Arabic-first UI design
  - Right-to-left text direction
  - Arabic number formatting for prices
  - Arabic date/time formatting

## FR-006: QR Code Generation
- **Requirement:** Automatic QR code generation for each restaurant's menu
- **Priority:** Must Have (MVP v1.0.0)
- **Technical Details:**
  - Unique QR code per restaurant
  - Direct link to restaurant's public menu
  - Downloadable for printing/display

## FR-007: WhatsApp Integration
- **Requirement:** Pre-formatted WhatsApp messages for order submission
- **Priority:** Must Have (MVP v1.0.0)
- **Technical Details:**
  - Arabic message formatting
  - Include all cart items, quantities, and total
  - Order type selection (delivery/pickup)
  - Restaurant contact information