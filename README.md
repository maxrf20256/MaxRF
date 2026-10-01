# 🍀 Dinámica MaxRF — Plataforma Web de Rifa Digital

Sistema web completo y moderno para la venta, reserva y administración en tiempo real de rifas digitales, con talonario interactivo, emisión de tiquetes digitales oficiales y sincronización automática con **Google Sheets** y **Google Drive**.

---

## 🚀 Características Principales

- **🎰 Talonario Digital Interactivo:**
  - Números del `00` al `99` con selección visual fluida.
  - Código de colores de alto contraste:
    - ⚪ **Disponible:** Blanco con bordes interactivos.
    - ⏳ **Reservado / Pendiente:** Fondo ámbar cálido con reloj de arena `⏳`.
    - 🔴 **Pagado / Vendido:** Fondo rojo coral con sello de verificación `✓` y tachado.
  - Dock flotante con resumen dinámico de números elegidos, total a pagar y botón de confirmación.

- **🎟️ Emisión y Gestión de Tiquetes Oficiales:**
  - Generación automática de comprobantes gráficos oficiales en formato PNG con Canvas 2D.
  - Código único de tiquete (ej. `MAXRF-123456`).
  - Descarga directa en el dispositivo del usuario.
  - Envío automático de copia por correo electrónico vía Gmail (`maxrf2025@gmail.com`).
  - Almacenamiento automático en la carpeta oficial de Google Drive (`Talonario / Tiquetes Emitidos MaxRF`).

- **🔐 Panel de Control y Administración:**
  - Acceso seguro mediante correo autorizado y PIN (`maxrf2025@gmail.com`).
  - **Pestaña Configuración:**
    - Ajuste en vivo del título del premio, descripción, insignia y llamado a la acción.
    - Configuración del número mínimo y máximo de boletas por participante.
    - Precio por número y fecha del sorteo.
    - Selección de lotería oficial (ej. Chontico Día / Chontico Noche).
    - Métodos de pago y cuenta Nequi.
  - **Pestaña Consultar / Gestionar Tiquetes:**
    - Búsqueda en vivo por código de tiquete, teléfono o nombre de participante.
    - Filtros por estado: Todos, Pendientes, Pagados y Rechazados.
    - Cambio de estado en 1 clic de `Pendiente` a `Pagado y Confirmado`.
    - Generación inmediata de nuevo soporte oficial de pago y actualización en Google Sheets y Drive.
    - Botón para enviar comprobante y confirmación directa por WhatsApp.

- **☁️ Backend Serverless en Google Cloud:**
  - Backend programado en Google Apps Script (`Code.gs`).
  - Base de datos en tiempo real en Google Sheets (`Rifa Digital - Base de Datos` en carpeta `Talonario`).
  - Cero costos de infraestructura o servidores dedicados.

- **📱 Multi-Dispositivo y Anti-Caché:**
  - Adaptabilidad total a móviles, tablets y PC (Responsive Design con Tailwind CSS).
  - Cabeceras anti-caché y versionado de scripts (`?v=2.3`) para garantizar que cualquier cliente vea siempre los números actualizados al instante.
  - Re-sincronización automática al reactivar la pantalla del teléfono o cambiar de pestaña.

---

## 📂 Estructura del Proyecto

```text
Proyecto Web MaxRF/
├── index.html                   # Interfaz de usuario principal
├── 404.html                     # Redirección para GitHub Pages
├── .nojekyll                    # Desactiva Jekyll en GitHub Pages
├── .gitignore                   # Exclusión de archivos temporales
├── README.md                    # Documentación del proyecto
│
├── css/
│   └── styles.css               # Estilos personalizados, animaciones y temas
│
├── js/
│   ├── config.js                # Parámetros del sitio y URL de la API
│   ├── api.js                   # Cliente HTTP para Google Apps Script
│   ├── app.js                   # Lógica central, eventos, Canvas 2D y DOM
│   ├── logo-data.js             # Assets vectoriales del logo
│   └── html2canvas.min.js       # Librería de captura gráfica
│
├── img/
│   ├── Foto Web0.png            # Portada / Banner principal
│   ├── Foto Web1.png            # Imagen de fondo con transparencia
│   ├── premio.png               # Imagen oficial del premio
│   ├── logo_thumb.png           # Miniatura del logo oficial
│   └── favicon.png              # Icono del navegador
│
└── google-apps-script/
    └── Code.gs                  # Código fuente del backend para Google Sheets y Drive
```

---

## 🌐 Publicación en GitHub Pages

Para publicar este proyecto gratuitamente con GitHub Pages:

1. Crea un nuevo repositorio en tu cuenta de [GitHub](https://github.com/new) (ejemplo: `dinamica-maxrf`).
2. Sube todos los archivos del proyecto a la rama principal (`main`).
3. En GitHub, entra a tu repositorio y ve a **Settings** (Configuración) ➔ pestaña **Pages** (en el menú izquierdo).
4. En **Build and deployment**:
   - **Source:** Selecciona `Deploy from a branch`.
   - **Branch:** Selecciona `main` y la carpeta `/ (root)`.
   - Haz clic en **Save** (Guardar).
5. En 1-2 minutos tu web estará publicada en una URL del tipo:
   `https://tu-usuario.github.io/dinamica-maxrf/`

---

## ⚙️ Conexión con Google Sheets y Google Drive

1. Abre tu hoja de cálculo **Rifa Digital - Base de Datos** en Google Drive (dentro de tu carpeta `Talonario`).
2. Ve al menú superior **Extensiones** ➔ **Apps Script**.
3. Copia todo el contenido de [`google-apps-script/Code.gs`](./google-apps-script/Code.gs) y pégalo en el editor de Apps Script.
4. Guarda (`Ctrl + S`).
5. Haz clic en **Implementar** ➔ **Administrar implementaciones** ➔ icono del lápiz ✏️ ➔ selecciona **"Nueva versión"** y haz clic en **Implementar**.
6. Copia la URL de la aplicación web que te entrega Google y asegúrate de que esté configurada en [`js/config.js`](./js/config.js) en la variable `API_URL`.

---

## 🛠️ Tecnologías Utilizadas

- **Frontend:** HTML5, CSS3, JavaScript (ES6+), [Tailwind CSS](https://tailwindcss.com/)
- **Iconografía:** [Font Awesome 6](https://fontawesome.com/)
- **Tipografías:** Outfit & Plus Jakarta Sans (Google Fonts)
- **Efectos:** Canvas Confetti, HTML5 Canvas 2D
- **Backend:** Google Apps Script (V8 Engine)
- **Bases de Datos & Archivos:** Google Sheets API, Google Drive API, Gmail API
- **Hosting:** GitHub Pages

---

© 2026 **Dinámica MaxRF** • Todos los derechos reservados.
