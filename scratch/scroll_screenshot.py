import time
from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={'width': 1280, 'height': 900})
    page.goto('http://localhost:8080/', wait_until='networkidle')
    page.click('#btn-abrir-admin')
    page.fill('#input-admin-email', 'maxrf2025@gmail.com')
    page.fill('#input-admin-pin', 'maxrf2025')
    page.click('#btn-login-admin')
    time.sleep(0.5)
    page.click('#tab-btn-tiquetes')
    time.sleep(0.5)
    btn = page.query_selector('.btn-seleccionar-tkt')
    if btn:
        btn.click()
        time.sleep(0.5)
        page.check('input[name="cambio_estado_opt"][value="Pagado"]')
        page.click('#btn-ejecutar-cambio-estado')
        time.sleep(1.2)
        page.evaluate("document.getElementById('admin-tiquetes-box').scrollTop = 9999;")
        time.sleep(0.5)
        page.screenshot(path=r'C:\Users\Soporte\.gemini\antigravity\brain\fd6c40c4-cda7-4853-887c-ee3e5fde7080\verified_step5_scrolled_support_image.png')
        print('Scrolled screenshot taken!')
    browser.close()
