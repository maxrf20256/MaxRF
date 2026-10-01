import os
import re
import time
from playwright.sync_api import sync_playwright

ARTIFACT_DIR = r"C:\Users\Soporte\.gemini\antigravity\brain\fd6c40c4-cda7-4853-887c-ee3e5fde7080"

def test_ticket_management():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport={"width": 1280, "height": 900})
        
        print("1. Cargando http://localhost:8080/ ...")
        page.goto("http://localhost:8080/", wait_until="networkidle")
        time.sleep(1)
        
        # 2. Elegir números y participar
        print("2. Seleccionando 2 números disponibles...")
        page.wait_for_selector(".ticket-num.disponible", timeout=10000)
        
        num_btns = page.query_selector_all(".ticket-num.disponible")
        nums_to_select = []
        for btn in num_btns[:2]:
            n_txt = btn.inner_text().strip()
            nums_to_select.append(n_txt)
            btn.click()
            print(f"   Click en número disponible {n_txt}")
        
        time.sleep(0.5)
        # Click en participar
        btn_dock = page.query_selector("#btn-dock-participar")
        if btn_dock and btn_dock.is_visible():
            btn_dock.click()
            print("   Click en btn-dock-participar")
        
        page.wait_for_selector("#modal-participar", state="visible")
        print("   Modal participar visible.")
        
        # Llenar formulario
        page.fill('input[name="nombre"]', "Pepito Perez")
        page.fill('input[name="telefono"]', "3188178457")
        page.fill('input[name="correo"]', "pepito@test.com")
        page.select_option('select[name="metodo_pago"]', value="Pendiente")
        page.fill('input[name="referencia_pago"]', "Pendiente")
        
        # Desactivar enviar correo para evitar intentos reales de red en el test
        check_mail = page.query_selector("#check-enviar-correo")
        if check_mail and check_mail.is_checked():
            check_mail.uncheck()
        
        print("3. Enviando reserva con referencia 'Pendiente'...")
        page.click("#btn-enviar")
        
        # Esperar modal de éxito
        page.wait_for_selector("#modal-exito", state="visible", timeout=10000)
        print("   ¡Modal de éxito abierto!")
        
        ticket_code_el = page.query_selector("#ticket-codigo")
        ticket_code_raw = ticket_code_el.inner_text() if ticket_code_el else ""
        print(f"   Código en tiquete: {ticket_code_raw}")
        
        # Extraer código como MAXRF-XXXXXX
        match = re.search(r"MAXRF-[A-Z0-9]+", ticket_code_raw)
        ticket_code = match.group(0) if match else "MAXRF-TKT"
        print(f"   Código identificado: {ticket_code}")
        
        # Screenshot de la emisión del tiquete
        page.screenshot(path=os.path.join(ARTIFACT_DIR, "verified_step1_ticket_issued.png"))
        
        # Cerrar modal de éxito
        page.click("#btn-cerrar-exito")
        time.sleep(0.5)
        
        # 4. Abrir Panel Admin
        print("4. Abriendo Panel Admin...")
        page.click("#btn-abrir-admin")
        page.wait_for_selector("#modal-admin", state="visible")
        
        # Login
        page.fill("#input-admin-email", "maxrf2025@gmail.com")
        page.fill("#input-admin-pin", "maxrf2025")
        page.click("#btn-login-admin")
        time.sleep(1)
        
        print("5. Verificando pestañas del Admin...")
        page.wait_for_selector("#admin-nav-bar", state="visible")
        page.screenshot(path=os.path.join(ARTIFACT_DIR, "verified_step2_admin_logged_tabs.png"))
        
        # Cambiar a la pestaña de Consultar Tiquetes
        print("6. Cambiando a pestaña 'Consultar / Gestionar Tiquetes'...")
        page.click("#tab-btn-tiquetes")
        time.sleep(0.5)
        page.wait_for_selector("#admin-tiquetes-box", state="visible")
        
        # Screenshot de la lista de tiquetes
        page.screenshot(path=os.path.join(ARTIFACT_DIR, "verified_step3_ticket_list_pending.png"))
        
        # 7. Buscar por código de tiquete o nombre
        print(f"7. Buscando tiquete {ticket_code}...")
        page.fill("#admin-search-tiquete", ticket_code)
        time.sleep(0.5)
        
        # Click en "Gestionar / Soporte"
        print("8. Abriendo detalle de gestión del tiquete...")
        page.click(f'button[data-ticket="{ticket_code}"]')
        time.sleep(0.5)
        
        page.wait_for_selector("#admin-tiquete-detalle", state="visible")
        page.screenshot(path=os.path.join(ARTIFACT_DIR, "verified_step4_ticket_detail_view.png"))
        
        # 8. Cambiar estado a "Pagado y Confirmado"
        print("9. Cambiando estado a 'Pagado y Confirmado'...")
        page.check('input[name="cambio_estado_opt"][value="Pagado"]')
        page.fill("#input-ref-actualizada", "PAGADO NEQUI APROBADO REF #99824")
        
        # Click en generar nuevo soporte
        print("10. Generando nuevo soporte oficial de pago...")
        page.click("#btn-ejecutar-cambio-estado")
        
        # Esperar que aparezca el box del soporte generado
        page.wait_for_selector("#box-soporte-generado", state="visible", timeout=10000)
        time.sleep(1)
        
        # Scroll al soporte generado
        box_sop = page.query_selector("#box-soporte-generado")
        if box_sop:
            box_sop.scroll_into_view_if_needed()
            time.sleep(0.5)
        
        # Screenshot del soporte generado
        page.screenshot(path=os.path.join(ARTIFACT_DIR, "verified_step5_updated_support_receipt.png"))
        print("   ¡Soporte oficial generado exitosamente!")
        
        det_badge = page.query_selector("#det-ticket-estado-badge")
        badge_txt = det_badge.inner_text() if det_badge else 'N/A'
        print(f"   Badge detalle: {badge_txt.encode('ascii', 'ignore').decode('ascii')}")
        
        # Verificar botones de descarga y WhatsApp
        btn_dl = page.query_selector("#btn-descargar-soporte")
        btn_wa = page.query_selector("#btn-whatsapp-soporte")
        print(f"   Botón descargar href presente: {bool(btn_dl and btn_dl.get_attribute('href'))}")
        print(f"   Botón WhatsApp href presente: {bool(btn_wa and btn_wa.get_attribute('href'))}")
        
        # 9. Cerrar modal admin y verificar estado en el talonario
        print("11. Cerrando Panel Admin para verificar talonario...")
        page.click("#btn-cerrar-admin")
        time.sleep(0.5)
        
        # Verificar que los números elegidos aparezcan vendidos en el talonario
        for num_str in nums_to_select:
            el = page.query_selector(f'button[data-numero="{num_str}"]')
            cls = el.get_attribute("class") if el else ""
            print(f"   Número {num_str} clases: {cls}")
            assert "vendido" in cls or "bg-rose-50" in cls or "text-rose" in cls, f"Número {num_str} no tiene clase de vendido"
            
        page.screenshot(path=os.path.join(ARTIFACT_DIR, "verified_step6_talonario_updated_sold.png"))
        print("12. ¡Todas las verificaciones pasaron exitosamente!")
        
        browser.close()

if __name__ == "__main__":
    test_ticket_management()
