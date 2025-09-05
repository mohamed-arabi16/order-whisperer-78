@MVP-v1 @Must
Feature: Restaurant Panel: Menu Builder
  As a Restaurant Owner
  I want to build and manage my menu
  So that I can keep my digital menu up to date.

  Scenario: Add a new item to a menu category
    Given I am logged in as a Restaurant Owner
    And I have created a category named "المشاوي"
    When I add a new item to the "المشاوي" category with the name "شيش طاووق" and price "50000"
    And I upload a valid image for the item
    And I click "Save Item"
    Then the item "شيش طاووق" should appear under the "المشاوي" category on my menu management page.

  Scenario: Mark an item as unavailable
    Given I am on the menu management page and the item "كبة" is marked as "Available"
    When I click the availability toggle for "كبة"
    Then its status should change to "Unavailable"
    And the item "كبة" should be greyed out on the public digital menu.