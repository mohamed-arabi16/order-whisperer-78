@MVP-v1 @Must
Feature: Super Admin: Tenant Management
  As a Super Admin
  I want to create and manage restaurant accounts
  So that I can onboard new clients onto the platform.

  Scenario: Successfully create a new tenant account
    Given I am logged in as a Super Admin
    When I navigate to the 'Create Restaurant' page
    And I fill in the restaurant name as "Damascus Gate"
    And I manually assign the subscription plan "Basic"
    And I click "Create"
    Then a new tenant account for "Damascus Gate" should exist in the system
    And its data must be isolated via Supabase RLS.