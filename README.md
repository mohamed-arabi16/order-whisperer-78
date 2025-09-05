# Digital Menu & WhatsApp Ordering System

This project is a comprehensive digital menu and ordering system designed for restaurants. It allows restaurant owners to manage their menu, and customers to view the menu via a QR code and place orders through WhatsApp. The system also includes a super admin dashboard for managing multiple restaurant tenants.

## Key Features

- **Multi-Tenant Architecture**: Supports multiple restaurants, each with its own menu and branding.
- **Role-Based Access Control**: Differentiates between Super Admins and Restaurant Owners.
- **Menu Management**: Easy creation and management of categories and menu items.
- **Customizable Branding**: Restaurants can upload their logo and choose a primary color for their menu.
- **QR Code Generation**: Automatically generates a unique QR code for each restaurant's menu.
- **WhatsApp Ordering**: Seamlessly integrates with WhatsApp for placing orders.
- **Localization**: Supports English and Arabic, with an easily extensible translation system.
- **Responsive Design**: The public menu and dashboards are designed to work on all devices.

## Tech Stack

- **Frontend**: React, Vite, TypeScript
- **UI Framework**: shadcn-ui
- **Styling**: Tailwind CSS
- **Backend & Database**: Supabase
- **Serverless Functions**: Deno (for Supabase Edge Functions)
- **State Management**: React Context API

## Project Structure

The repository is organized into the following main directories:

- **`src/`**: Contains all the frontend source code.
  - **`components/`**: Reusable React components.
    - **`admin/`**: Components for the Super Admin dashboard.
    - **`branding/`**: Components for restaurant branding customization.
    - **`menu/`**: Components for menu management.
    - **`qr/`**: Components for QR code generation.
    - **`restaurant/`**: Components for the Restaurant Owner dashboard.
    - **`ui/`**: UI components from shadcn-ui.
  - **`hooks/`**: Custom React hooks for authentication, translation, etc.
  - **`integrations/`**: Supabase client and generated types.
  - **`pages/`**: Top-level page components for each route.
- **`supabase/`**: Supabase configuration and serverless functions.
  - **`functions/`**: Edge functions for backend logic (e.g., creating a new tenant).
  - **`migrations/`**: Database migration scripts.

## Getting Started

### Prerequisites

- Node.js and npm (or a compatible package manager)
- A Supabase account

### Setup

1.  **Clone the repository:**
    ```sh
    git clone <YOUR_GIT_URL>
    cd <YOUR_PROJECT_NAME>
    ```

2.  **Install dependencies:**
    ```sh
    npm install
    ```

3.  **Set up Supabase:**
    - Create a new project on [Supabase](https://supabase.com/).
    - Navigate to the `SQL Editor` and run the scripts from the `supabase/migrations/` directory to set up your database schema.
    - Go to `Project Settings` > `API` to find your project URL and `anon` key.

4.  **Configure environment variables:**
    - Create a `.env` file in the root of the project.
    - Add your Supabase credentials to the `.env` file:
      ```env
      VITE_SUPABASE_URL=YOUR_SUPABASE_URL
      VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
      ```
    - **Note**: The `VITE_` prefix is required for Vite to expose these variables to the frontend.

5.  **Run the development server:**
    ```sh
    npm run dev
    ```

The application should now be running on `http://localhost:5173`.

## Usage

- **Super Admin**: The first user created can be promoted to `super_admin` directly in the Supabase `profiles` table. This user can then access the super admin dashboard to create and manage new restaurant tenants.
- **Restaurant Owner**: When a new tenant is created, a restaurant owner account is also created. This user can log in to manage their menu, customize their branding, and generate a QR code for their menu.
- **Public Menu**: The public menu for each restaurant is accessible at `/menu/:slug`, where `:slug` is the unique slug generated for the restaurant.
