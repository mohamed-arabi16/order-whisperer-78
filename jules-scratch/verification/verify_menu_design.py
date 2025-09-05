from playwright.sync_api import sync_playwright, expect

def run(playwright):
    browser = playwright.chromium.launch()
    page = browser.new_page()
    page.goto("http://localhost:8080/menu/test-restaurant")

    # Wait for the categories heading to be visible in either English or Arabic
    categories_heading_en = page.get_by_role("heading", name="Categories")
    categories_heading_ar = page.get_by_role("heading", name="الفئات")

    # Wait for either of the headings to be visible
    expect(categories_heading_en.or_(categories_heading_ar)).to_be_visible()

    page.screenshot(path="jules-scratch/verification/verification.png")
    browser.close()

with sync_playwright() as playwright:
    run(playwright)
