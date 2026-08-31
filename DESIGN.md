# 🌿 Ravinto — Documento de Diseño

> App web de seguimiento nutricional consciente.
> "Nutrir tu cuerpo es un acto de amor propio."

---

## 📋 Resumen Ejecutivo

**Ravinto** es una web app responsive (desktop, tablet, móvil) para el seguimiento calórico diario. Se diferencia de otras soluciones por su enfoque en el **bienestar** (no la restricción), un diseño **premium** que transmite tranquilidad, y un sistema **híbrido inteligente** para registrar alimentos sin fricción.

---

## 🏷️ Nombres Propuestos

| # | Nombre | Significado | Por qué funciona |
|---|--------|-------------|-----------------|
| 1 | **Ravinto** ⭐ | "Nourish" (nutrir) + "vita" (vida) | Suena premium, internacional, único y registrable. Transmite nutrición vital. |
| 2 | **Serēn** | Del latín "serenus" (sereno) | Transmite calma. El acento lo hace memorable y diferente. |
| 3 | **Calmi** | "Calorías" + "calm" (calma) | Contar calorías sin estrés. Directo y amigable. |
| 4 | **Nūra** | "Nutrición" + "aura" | Suave, minimalista, evoca luz interior. |
| 5 | **Vittalē** | "Vital" + sufijo italiano | Evoca vitalidad mediterránea y buena alimentación. |
| 6 | **Alma Nutri** | Esencia + nutrición | Cálido, cercano, en español. Nutrición del alma y cuerpo. |
| 7 | **Verdana Well** | "Verde" + "wellness" | Directo sobre su propósito. Naturaleza + bienestar. |

**Recomendación:** **Ravinto** — único, registrable como dominio, funciona en cualquier idioma.

---

## 🎯 Decisión Clave: Cómo Registrar Alimentos

### Recomendación: Sistema Híbrido Inteligente

Tras analizar las opciones, la mejor solución combina **3 métodos complementarios**:

| Método | Uso principal | Precisión | Coste |
|--------|--------------|-----------|-------|
| 🔍 **Búsqueda inteligente** | Buscar por nombre con autocompletado | 95%+ | $0 (Open Food Facts API) |
| 📷 **Escáner de código de barras** | Escanear productos envasados | 99% | $0 (librería JS + Open Food Facts) |
| ✏️ **Entrada manual** | Recetas caseras, alimentos no catalogados | Depende del usuario | $0 |

**¿Por qué NO foto/OCR?**
- Coste alto (~$1.50/1000 imágenes con Google Vision)
- Precisión baja (60-75%) con etiquetas variadas o platos caseros
- Complejidad de ML sin retorno claro para MVP
- Se puede añadir como feature premium en el futuro

### Flujo de usuario:
1. Escribe nombre → autocompletado instantáneo desde caché local + Open Food Facts
2. ¿Producto envasado? → Escanea código de barras en 1 segundo
3. ¿No lo encuentra? → Creación manual con nombre + calorías/100g
4. Acceso rápido a **favoritos** y **recientes** (1 tap)

---

## 🏗️ Arquitectura del Sistema

```
┌─────────────────────────────────────────────────────────────┐
│                    USUARIO (PWA Responsive)                   │
│            Next.js 14 + Tailwind CSS + Zustand               │
└──────────────────────────┬──────────────────────────────────┘
                           │ HTTPS / JWT Bearer
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                     FastAPI Backend                           │
│   ┌──────────┐  ┌──────────┐  ┌────────┐  ┌────────────┐  │
│   │  Auth    │  │  Meals   │  │ Foods  │  │ Analytics  │  │
│   │  Router  │  │  Router  │  │ Router │  │ Router     │  │
│   └────┬─────┘  └────┬─────┘  └───┬────┘  └─────┬──────┘  │
│        └──────────────┴────────────┴─────────────┘          │
│                        SQLAlchemy ORM                         │
└──────────────────────────┬──────────────────────────────────┘
                           │
            ┌──────────────┴──────────────┐
            │  SQLite (dev) / PostgreSQL   │
            └──────────────┬──────────────┘
                           │
            ┌──────────────┴──────────────┐
            │   Open Food Facts API        │
            │   (3M+ productos, gratuita)  │
            └─────────────────────────────┘
```

---

## 💻 Stack Tecnológico

### Backend
| Tecnología | Versión | Justificación |
|-----------|---------|---------------|
| Python | 3.12 | Tipado moderno, async nativo |
| FastAPI | 0.115+ | Alto rendimiento, OpenAPI automático |
| SQLAlchemy | 2.0 | ORM con soporte SQLite → PostgreSQL transparente |
| Alembic | 1.13 | Migraciones versionadas |
| Pydantic | v2 | Validación ultrarrápida |
| python-jose + passlib | - | JWT + bcrypt hashing |
| httpx | - | Cliente HTTP async para APIs externas |

### Frontend
| Tecnología | Versión | Justificación |
|-----------|---------|---------------|
| Next.js | 14 | SSR, App Router, PWA nativa, standalone Docker |
| React | 18 | Ecosistema maduro |
| TypeScript | 5.5 | Tipado estricto |
| Tailwind CSS | 3.4 | Diseño premium rápido, responsive nativo |
| Zustand | - | Estado local ligero |
| Recharts | - | Gráficos de progreso elegantes |
| Lucide Icons | - | Iconografía minimalista |
| next-pwa | - | Service Worker y manifest automáticos |

### Infraestructura
| Tecnología | Uso |
|-----------|-----|
| Docker + Compose | Entorno reproducible |
| SQLite (dev) | Sin setup, migración transparente |
| PostgreSQL (prod) | Escalabilidad y seguridad |
| GitHub Actions | CI/CD pipeline |

---

## 🗄️ Modelo de Datos

```sql
-- Usuarios
CREATE TABLE users (
    id              UUID PRIMARY KEY,
    email           TEXT UNIQUE NOT NULL,
    hashed_password TEXT NOT NULL,
    full_name       TEXT NOT NULL,
    daily_goal_kcal INTEGER DEFAULT 2000,
    is_active       BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Alimentos (caché local + alimentos custom del usuario)
CREATE TABLE food_items (
    id               UUID PRIMARY KEY,
    barcode          TEXT UNIQUE,
    name             TEXT NOT NULL,
    brand            TEXT,
    kcal_per_100g    REAL NOT NULL,
    protein_per_100g REAL DEFAULT 0,
    carbs_per_100g   REAL DEFAULT 0,
    fat_per_100g     REAL DEFAULT 0,
    source           TEXT DEFAULT 'open_food_facts',  -- 'manual' | 'open_food_facts'
    created_by       UUID REFERENCES users(id),
    created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Comidas del día (agrupación)
CREATE TABLE meals (
    id        UUID PRIMARY KEY,
    user_id   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    meal_type TEXT NOT NULL CHECK(meal_type IN ('breakfast','lunch','dinner','snack')),
    date      DATE NOT NULL DEFAULT CURRENT_DATE,
    notes     TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Items individuales de cada comida
CREATE TABLE meal_items (
    id             UUID PRIMARY KEY,
    meal_id        UUID NOT NULL REFERENCES meals(id) ON DELETE CASCADE,
    food_item_id   UUID NOT NULL REFERENCES food_items(id),
    quantity_grams REAL NOT NULL,
    kcal_total     REAL NOT NULL,  -- pre-calculado
    created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Favoritos
CREATE TABLE user_favorites (
    user_id      UUID REFERENCES users(id) ON DELETE CASCADE,
    food_item_id UUID REFERENCES food_items(id),
    created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, food_item_id)
);

-- Índices
CREATE INDEX idx_meals_user_date ON meals(user_id, date);
CREATE INDEX idx_meal_items_meal ON meal_items(meal_id);
CREATE INDEX idx_food_items_name ON food_items(name);
CREATE INDEX idx_food_items_barcode ON food_items(barcode);
```

---

## 🔐 Seguridad

### Autenticación
- **Contraseñas:** Argon2id (preferido) o bcrypt cost 12+
- **Access token:** JWT RS256, expiración 15 minutos
- **Refresh token:** JWT separado, 7 días, rotación en cada uso
- **Almacenamiento:** Refresh en httpOnly Secure cookie, Access en memoria JS
- **Rate limiting:** 5 intentos/min en login, 3 registros/hora

### Protecciones OWASP Top 10
| Amenaza | Mitigación |
|---------|-----------|
| Broken Access Control | Validación de ownership en cada endpoint (no IDOR) |
| Cryptographic Failures | SQLCipher para cifrado at-rest, TLS 1.3 en tránsito |
| Injection | SQLAlchemy ORM exclusivo, Pydantic validation, bleach sanitization |
| Insecure Design | Rate limiting, account lockout, CAPTCHA progresivo |
| Security Misconfiguration | Container non-root, CORS restrictivo, no debug en prod |
| Vulnerable Components | pip-audit, npm audit, Dependabot en CI |
| Auth Failures | JWT con expiración corta, refresh rotation, blacklist |
| Data Integrity | CSP headers, SRI en scripts, Service Worker seguro |
| Logging Failures | Audit log para accesos a datos de salud |
| SSRF | Whitelist de dominios externos |

### Headers HTTP de Seguridad
```
Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Referrer-Policy: strict-origin-when-cross-origin
Content-Security-Policy: default-src 'self'; img-src 'self' data:; connect-src 'self' https://api.ravinto.com
Permissions-Policy: camera=(self), microphone=(), geolocation=()
```

### GDPR (datos de salud)
- Consentimiento explícito para datos de nutrición
- Endpoint `DELETE /api/users/me` (borrado total)
- Endpoint `GET /api/users/me/export` (portabilidad)
- UUIDs en vez de IDs secuenciales
- Logs sin PII

---

## 🎨 Diseño UI/UX

### Filosofía
- **Bienestar, no restricción** — "Has nutrido tu cuerpo" en vez de "Te faltan X calorías"
- **Premium y minimalista** — Inspirado en Calm/Headspace pero aplicado a nutrición
- **Mobile-first** — Bottom navigation en móvil, sidebar en desktop

### Paleta de Colores

#### Light Mode
| Función | Color | Hex |
|---------|-------|-----|
| Primario (verde salvia) | Principal | `#5BB88A` |
| Secundario (melocotón) | Acento cálido | `#FFA44A` |
| Terciario (lavanda) | Premium | `#A78BFA` |
| Background | Base cálida | `#FAFAF8` |
| Texto principal | - | `#1A1918` |
| Bordes | - | `#E8E6E1` |

#### Dark Mode
| Función | Color | Hex |
|---------|-------|-----|
| Background | Verde profundo (NO negro) | `#1A1F1C` |
| Surface | Elevación sutil | `#242A26` |
| Bordes | - | `#3D4A42` |
| Texto principal | - | `#F0F7F4` |

### Tipografía (Google Fonts)
- **Headings:** Plus Jakarta Sans (600, 700)
- **Body:** Inter (400, 500)
- **Números/KPI:** DM Mono (calorías, gramos)

### Componentes Clave
- **Anillo de progreso animado** — Centro del dashboard, muestra kcal consumidas vs objetivo
- **Cards con bordes redondeados** (12-16px) — Comidas del día por categoría
- **Bottom sheet** — Modal para añadir comidas en móvil
- **Micro-animaciones** — Scale en botones, slide-up en modales, count-up en números
- **Bottom Navigation** (móvil) con backdrop blur

### Pantallas
1. **Login/Registro** — Card centrada, fondo con gradiente sutil, onboarding conversacional
2. **Dashboard** — Saludo contextual, anillo de calorías, cards por comida, racha motivacional
3. **Añadir Comida** — Buscador + tabs (Buscar/Recientes/Favoritos/Manual) + escáner
4. **Historial** — Gráfico semanal/mensual, lista expandible, indicadores de color
5. **Perfil** — Objetivos, medidas, preferencias, toggle dark mode

---

## ✅ Plan de Testing

### Niveles
| Nivel | Herramienta | Cobertura objetivo |
|-------|------------|-------------------|
| Unit (backend) | pytest + pytest-asyncio | ≥80% |
| Unit (frontend) | Jest + React Testing Library | ≥75% |
| Integration | httpx TestClient | Todos los endpoints |
| E2E | Playwright (Chromium, Firefox, WebKit) | Flujos críticos |
| Accesibilidad | axe-core + Lighthouse | WCAG 2.1 AA |
| Performance | Locust + Lighthouse CI | LCP <2.5s, p95 <200ms |
| Security | bandit + gitleaks + npm audit | 0 vulnerabilidades críticas |

### Casos Críticos
- Registro → Login → Añadir comida → Ver resumen (happy path)
- Token expirado → refresh automático → sin pérdida de datos
- Brute force → rate limit activo (429)
- Offline → banner informativo + datos en caché visibles
- SQLite concurrencia → WAL mode + timeout + retry

### CI/CD Pipeline
```
push/PR → lint → unit tests → integration tests → build Docker →
→ e2e tests → security scan → deploy staging → smoke test
```

---

## 📁 Estructura del Proyecto

```
app-calories/
├── docker-compose.yml
├── .env.example
├── .gitignore
├── README.md
├── DESIGN.md                    ← Este documento
│
├── backend/
│   ├── Dockerfile
│   ├── requirements.txt
│   ├── alembic.ini
│   ├── alembic/versions/
│   └── app/
│       ├── main.py              # FastAPI app
│       ├── config.py            # Settings (Pydantic)
│       ├── database.py          # Engine + Session
│       ├── auth/                # register, login, refresh, dependencies
│       ├── meals/               # CRUD comidas
│       ├── foods/               # Búsqueda, favoritos, Open Food Facts
│       ├── analytics/           # Estadísticas diarias/semanales
│       └── common/              # Exceptions, security utils
│
├── frontend/
│   ├── Dockerfile
│   ├── package.json
│   ├── tailwind.config.ts
│   ├── next.config.js
│   └── src/
│       ├── app/                 # Next.js App Router pages
│       ├── components/
│       │   ├── ui/              # Design system (Button, Card, Input, Modal)
│       │   ├── layout/          # Header, Sidebar, BottomNav
│       │   ├── meals/           # MealCard, AddMealForm
│       │   ├── foods/           # FoodSearch, BarcodeScanner
│       │   └── charts/          # CalorieRing, WeeklyChart
│       ├── hooks/               # useAuth, useMeals, useFoodSearch
│       ├── services/            # API client, auth service
│       ├── stores/              # Zustand stores
│       └── styles/              # globals.css + Tailwind
│
└── nginx/
    └── default.conf
```

---

## 🚀 Comandos para Arrancar

```bash
# Desarrollo (sin Docker)
cd backend && pip install -r requirements.txt && uvicorn app.main:app --reload
cd frontend && npm install && npm run dev

# Desarrollo con Docker
docker-compose up --build

# Producción
docker-compose -f docker-compose.prod.yml up -d
```

---

## 📊 Checklist Pre-Producción

### Funcional
- [ ] Registro y login funcionan correctamente
- [ ] Búsqueda de alimentos retorna resultados de Open Food Facts
- [ ] Escáner de código de barras funciona en móvil
- [ ] Dashboard muestra resumen calórico del día
- [ ] Historial semanal/mensual con gráficos
- [ ] PWA instalable en móvil

### Calidad
- [ ] Tests: coverage backend ≥80%, frontend ≥75%
- [ ] Lighthouse ≥90 (Performance + Accessibility)
- [ ] 0 violaciones WCAG 2.1 AA
- [ ] Responsive probado en 5+ viewports

### Seguridad
- [ ] Argon2id/bcrypt para passwords
- [ ] JWT con expiración corta + refresh rotation
- [ ] Rate limiting activo
- [ ] CORS restrictivo
- [ ] Headers de seguridad configurados
- [ ] 0 secrets en código (gitleaks clean)
- [ ] Container non-root
- [ ] GDPR: export + delete funcionales

---

## 🎯 Próximos Pasos

1. **Inicializar proyecto** — Crear estructura de carpetas y configuración base
2. **Backend: Auth** — Endpoints de registro, login, refresh
3. **Backend: Meals + Foods** — CRUD y conexión con Open Food Facts
4. **Frontend: Design System** — Componentes base con Tailwind
5. **Frontend: Páginas** — Dashboard, Login, AddMeal, History
6. **Integración** — Conectar frontend con API
7. **PWA** — Service Worker + manifest
8. **Testing** — Unit + E2E + Security
9. **Docker** — Contenedores para deploy
10. **Deploy** — Staging y producción

---

*Documento generado el 7 de agosto de 2026*
*Agentes involucrados: Senior Architect, UI Designer, Fullstack Dev, QA Agent, Security Pentester*
