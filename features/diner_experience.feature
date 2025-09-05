@MVP-v1 @Must
Feature: Visitor Menu: Ordering Experience
  As a Diner
  I want to scan a QR code, view a menu, and send my order via WhatsApp
  So that I can easily place my order.

  Scenario: View a menu and add an item to the cart
    Given I scan a QR code for a restaurant
    When the menu page loads
    Then I should see the restaurant's name and a list of menu items
    And the page's Largest Contentful Paint (LCP) must be under 3 seconds on a simulated 3G connection.
    When I tap the '+' button next to "فتوش"
    Then the cart summary should update to show "1 x فتوش".

  Scenario: Send a populated cart via WhatsApp
    Given I have "1 x شيش طاووق" and "2 x عصير برتقال" in my cart
    And I have selected "توصيل" (Delivery) as the order type
    When I tap the "إرسال الطلب عبر واتساب" button
    Then my device's WhatsApp application should open with a pre-formatted Arabic message
    And the message must contain all items, quantities, and the total price, ready to send.