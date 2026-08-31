# 🌿 Ravinto

**Nutrición consciente** — App web de seguimiento calórico que transmite bienestar y cuidado personal.

![Stack](https://img.shields.io/badge/FastAPI-009688?style=flat&logo=fastapi&logoColor=white)
![Stack](https://img.shields.io/badge/Next.js-000?style=flat&logo=next.js&logoColor=white)
![Stack](https://img.shields.io/badge/Tailwind-06B6D4?style=flat&logo=tailwindcss&logoColor=white)
![Stack](https://img.shields.io/badge/SQLite-003B57?style=flat&logo=sqlite&logoColor=white)

---

## ✨ Características

- 🔍 **Búsqueda inteligente** de alimentos (Open Food Facts — 3M+ productos)
- 📊 **Dashboard** con anillo de progreso calórico y macros
- 📱 **Responsive** — mobile-first con bottom nav, sidebar en desktop
- 🔐 **Autenticación JWT** con refresh token rotation
- 📈 **Historial** semanal/mensual con gráficos
- 🔥 **Racha** de días consecutivos registrando comidas
- ✏️ **Alimentos personalizados** — crea tus propias recetas
- 🌓 **Dark mode** preparado
- 🐳 **Docker** ready

---

## 🚀 Quick Start

### Requisitos
- Python 3.11+ 
- Node.js 18+

### Backend

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# Crear .env
cp ../.env.example .env

# Arrancar
uvicorn app.main:app --reload --port 8000
```

La API estará en http://localhost:8000 y la documentación Swagger en http://localhost:8000/docs

### Frontend

```bash
cd frontend
npm install
npm run dev
```

La app estará en http://localhost:3000

### Docker (todo junto)

```bash
docker-compose up --build
```

---

## 📁 Estructura

```
app-calories/
├── backend/              # FastAPI + SQLAlchemy
│   ├── app/
│   │   ├── auth/         # Register, login, JWT
│   │   ├── foods/        # CRUD + Open Food Facts
│   │   ├── meals/        # CRUD comidas diarias
│   │   ├── analytics/    # Estadísticas y rachas
│   │   └── common/       # Security, exceptions
│   ├── alembic/          # Migraciones DB
│   └── Dockerfile
├── frontend/             # Next.js 14 + Tailwind
│   └── src/
│       ├── app/          # Pages (App Router)
│       ├── components/   # UI design system
│       ├── hooks/        # useAuth, useMeals, useFoodSearch
│       ├── services/     # API client
│       └── stores/       # Zustand auth store
├── docker-compose.yml
└── DESIGN.md             # Documento de diseño completo
```

---

## 🔗 API Endpoints

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/auth/register` | Crear cuenta |
| POST | `/api/auth/login` | Iniciar sesión |
| POST | `/api/auth/refresh` | Renovar token |
| GET | `/api/auth/me` | Perfil del usuario |
| GET | `/api/foods/search?q=` | Buscar alimentos |
| GET | `/api/foods/barcode/{code}` | Buscar por código de barras |
| POST | `/api/foods/` | Crear alimento custom |
| POST | `/api/meals/` | Registrar comida |
| GET | `/api/meals/daily?date=` | Resumen del día |
| GET | `/api/analytics/weekly` | Resumen semanal |
| GET | `/api/analytics/streak` | Racha actual |

---

## 🎨 Design System

- **Paleta:** Verde salvia (#5BB88A) + Melocotón (#FFA44A) + Lavanda (#A78BFA)
- **Tipografías:** Plus Jakarta Sans (headings) + Inter (body) + DM Mono (números)
- **Filosofía:** Bienestar, no restricción. Mensajes positivos.

---

## 🗺️ Roadmap

### Fase 1 — MVP Pulido (actual → semana 2)

- [ ] **PWA completa** — manifest.json + Service Worker para instalación en móvil y uso offline
- [ ] **Escáner de código de barras** — Cámara del móvil con `html5-qrcode`
- [ ] **Toggle dark/light mode** — Botón en perfil (infraestructura Tailwind ya preparada)
- [ ] **Botón "Apóyame"** — Integrar Ko-fi / Buy Me a Coffee en la app
- [ ] **Deploy** — Railway o Fly.io + dominio `ravinto.app`

### Fase 2 — Modelo Freemium (semana 3-4)

- [ ] **Sistema de tiers** — Campo `plan` en User (free / premium), middleware de permisos
- [ ] **Integración Lemon Squeezy** — Checkout embebido, webhooks para activar/desactivar Premium
- [ ] **Límites del plan gratuito:**
  - Historial limitado a 7 días
  - Máximo 10 alimentos favoritos
  - Sin exportación de datos
  - Badge "Powered by Ravinto"

### Fase 3 — Features Premium (semana 5-8)

- [ ] **Historial ilimitado** — Acceso completo al histórico de comidas
- [ ] **Objetivos por macros** — Targets personalizados de proteína, carbos y grasa
- [ ] **Analíticas avanzadas** — Tendencias mensuales, promedios, proyecciones
- [ ] **Escáner de código de barras** — Feature de conveniencia premium
- [ ] **Favoritos ilimitados** — Sin tope de alimentos guardados
- [ ] **Exportar datos** — CSV/PDF del historial (cumple GDPR)
- [ ] **Planes de comidas sugeridos** — Basados en el objetivo calórico del usuario
- [ ] **Temas premium** — Paletas de colores adicionales

### Fase 4 — Escala y Calidad (semana 9+)

- [ ] **Migración a PostgreSQL** — Para producción con datos de salud
- [ ] **Tests E2E** — Playwright (Chromium, Firefox, WebKit)
- [ ] **CI/CD** — GitHub Actions (lint → test → build → deploy)
- [ ] **Multi-idioma** — i18n con `next-intl` (ES/EN)
- [ ] **Notificaciones push** — Recordatorios "¿Ya has registrado tu comida?"
- [ ] **Rate limiting** — Protección contra abuso (slowapi)
- [ ] **Audit log** — Registro de accesos para cumplimiento GDPR

---

## 💎 Modelo de Monetización

### Plan Gratuito (Free)
| Feature | Límite |
|---------|--------|
| Registro de comidas diario | ✅ Ilimitado |
| Búsqueda de alimentos | ✅ Open Food Facts |
| Dashboard con anillo calórico | ✅ |
| Historial | ⚠️ Últimos 7 días |
| Alimentos favoritos | ⚠️ Máximo 10 |
| Objetivo | ⚠️ Solo calorías |

### Plan Premium (3-5€/mes · 30-40€/año)
| Feature | Incluido |
|---------|----------|
| Todo lo de Free | ✅ |
| Historial ilimitado | ✅ |
| Objetivos por macros | ✅ |
| Analíticas avanzadas | ✅ |
| Escáner de código de barras | ✅ |
| Favoritos ilimitados | ✅ |
| Exportar datos (CSV/PDF) | ✅ |
| Planes de comidas sugeridos | ✅ |
| Temas premium | ✅ |
| Sin badge "Powered by" | ✅ |

---

## 💰 Financiación y Pagos

### Donaciones / Apoyo
| Plataforma | Comisión | Uso |
|-----------|----------|-----|
| [Ko-fi](https://ko-fi.com) | 0% | Donaciones sin comisión propia |
| [Buy Me a Coffee](https://buymeacoffee.com) | 5% | Donaciones + membresías, widget fácil |
| [GitHub Sponsors](https://github.com/sponsors) | 0% | Si el proyecto es open source |

### Suscripciones Premium
| Plataforma | Comisión | Uso |
|-----------|----------|-----|
| [Lemon Squeezy](https://lemonsqueezy.com) | 5% + 0.50€ | Suscripciones SaaS, gestiona IVA/EU automáticamente |
| [Stripe](https://stripe.com) | 1.5% + 0.25€ | Control total, más implementación manual |
| [Paddle](https://paddle.com) | 5% + 0.50€ | Merchant of Record (facturan por ti) |

**Estrategia recomendada:**
1. **Día 1:** Ko-fi / Buy Me a Coffee en el footer (donaciones desde ya)
2. **Con Premium:** Lemon Squeezy (gestiona IVA EU, checkout bonito, webhooks simples)
3. **Si open source:** GitHub Sponsors (0% comisión, visibilidad dev)

---

## 🏠 Despliegue en Homelab

Versión auto-alojada con todas las funciones premium desbloqueadas.

### Requisitos
- Docker 20+ y Docker Compose v2
- Mínimo 1GB RAM disponible
- Puerto 3000 y 8000 libres

### Instalación

```bash
# 1. Clonar el repositorio
git clone https://github.com/tu-usuario/ravinto.git
cd ravinto

# 2. Configurar la IP de tu servidor
export HOMELAB_IP=192.168.1.XX   # ← Cambia por la IP de tu server

# 3. (Opcional) Cambiar el secret key
export SECRET_KEY=$(openssl rand -hex 32)

# 4. Desplegar
docker compose -f docker-compose.homelab.yml up -d --build
```

### Acceso

| Servicio | URL |
|----------|-----|
| App (frontend) | `http://TU_IP:3000` |
| API docs (Swagger) | `http://TU_IP:8000/docs` |
| Health check | `http://TU_IP:8000/api/health` |

### Gestión

```bash
# Ver logs
docker compose -f docker-compose.homelab.yml logs -f

# Reiniciar
docker compose -f docker-compose.homelab.yml restart

# Parar
docker compose -f docker-compose.homelab.yml down

# Actualizar (sin perder datos)
git pull
docker compose -f docker-compose.homelab.yml up -d --build

# Backup de la base de datos
docker cp ravinto-api:/app/data/ravinto.db ./backup_$(date +%Y%m%d).db
```

### Funciones incluidas (todas desbloqueadas)

| Feature | Estado |
|---------|--------|
| Registro de comidas ilimitado | ✅ |
| Búsqueda Open Food Facts (3M+ productos) | ✅ |
| Escáner de código de barras (cámara) | ✅ |
| Dashboard con anillo calórico + macros | ✅ |
| Historial ilimitado (semanal/mensual) | ✅ |
| Objetivos por macros personalizados | ✅ |
| Cálculo BMR/TDEE automático | ✅ |
| Racha de días consecutivos | ✅ |
| Jardín semanal (gamificación) | ✅ |
| Exportar datos (CSV) | ✅ |
| Multi-idioma (CA/ES/EN) | ✅ |
| Dark mode | ✅ |
| PWA (instalar en móvil) | ✅ |
| Eliminar cuenta (GDPR) | ✅ |

### Configuración

Variables de entorno opcionales en `docker-compose.homelab.yml`:

| Variable | Default | Descripción |
|----------|---------|-------------|
| `HOMELAB_IP` | `localhost` | IP del servidor para acceso en red local |
| `SECRET_KEY` | Auto-generada | Clave para firmar JWT tokens |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `60` | Duración del token de acceso |
| `REFRESH_TOKEN_EXPIRE_DAYS` | `30` | Duración del refresh token |

### Notas

- Los datos se almacenan en un volumen Docker (`ravinto_data`). No se pierden al actualizar.
- El backend usa SQLite con WAL mode para lecturas concurrentes.
- CORS está abierto (`*`) para permitir acceso desde cualquier dispositivo de la red local.
- La PWA funciona desde el navegador del móvil: accede a `http://TU_IP:3000` y "Añadir a pantalla de inicio".
