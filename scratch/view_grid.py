from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={'width': 1280, 'height': 900})
    page.goto('http://localhost:8080/', wait_until='networkidle')
    talonario = page.query_selector('#talonario-grid')
    if talonario:
        talonario.scroll_into_view_if_needed()
        page.screenshot(path='C:/Users/Soporte/.gemini/antigravity/brain/fd6c40c4-cda7-4853-887c-ee3e5fde7080/verified_talonario_grid_view.png')
    browser.close()
