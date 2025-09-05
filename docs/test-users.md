# Test Users

This document provides credentials for the test users and instructions on how to set them up.

## Test User Credentials

- **Super Admin**:
  - **Email**: `admin@test.com`
  - **Password**: `password`

- **Restaurant Owner**:
  - **Email**: `owner@test.com`
  - **Password**: `password`

## Setup Instructions

The test users are not created automatically by the migrations. You need to create them manually in the Supabase dashboard.

1.  Go to the **Authentication** page in your Supabase dashboard.
2.  Click on **Add user** and create the two users with the credentials listed above.
3.  After creating the users, get their UUIDs from the users list.
4.  Open the migration file `supabase/migrations/20250905155052_dc26aa19-7c0f-4c48-8360-9c5b2363aa45.sql`.
5.  Replace the placeholder UUIDs with the real UUIDs of the users you just created.
    -   Replace `'00000000-0000-0000-0000-000000000001'` with the super admin's UUID.
    -   Replace `'00000000-0000-0000-0000-000000000002'` with the restaurant owner's UUID.
6.  Run the migrations to seed the database with the test data. This will link the profiles to the auth users and create a test restaurant for the owner.
