import time
from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={'width': 390, 'height': 844})
    page.goto('http://localhost:8080/', wait_until='networkidle')
    page.click('#btn-abrir-admin')
    page.fill('#input-admin-email', 'maxrf2025@gmail.com')
    page.fill('#input-admin-pin', 'maxrf2025')
    page.click('#btn-login-admin')
    time.sleep(0.5)
    page.click('#tab-btn-tiquetes')
    time.sleep(0.5)
    
    # Screenshot de lista móvil
    page.screenshot(path='C:/Users/Soporte/.gemini/antigravity/brain/fd6c40c4-cda7-4853-887c-ee3e5fde7080/verified_mobile_admin_tiquetes.png')
    
    # Seleccionar tiquete y ver soporte en móvil
    btn = page.query_selector('.btn-seleccionar-tkt')
    if btn:
        btn.click()
        time.sleep(0.5)
        page.check('input[name="cambio_estado_opt"][value="Pagado"]')
        page.click('#btn-ejecutar-cambio-estado')
        time.sleep(1.2)
        box = page.query_selector('#box-soporte-generado')
        if box:
            box.scroll_into_view_if_needed()
            time.sleep(0.5)
        page.screenshot(path='C:/Users/Soporte/.gemini/antigravity/brain/fd6c40c4-cda7-4853-887c-ee3e5fde7080/verified_mobile_support_preview.png')
    browser.close()
