# CLAUDE.md — Cronos Project

## Stack

- **Framework:** Next.js 15.5 (App Router)
- **UI:** React 19, TypeScript, Tailwind CSS 4
- **Backend / DB:** Firebase 12 (project: `cronos-85e21`) — Firestore + Firebase Auth
- **Forms:** React Hook Form + Zod
- **Maps:** Leaflet
- **SMS / OTP:** Twilio
- **State:** Zustand
- **Icons:** Lucide React
- **Deployment:** Vercel + GitHub
- **Domain:** cronosports.app
- **Email inbound:** Zoho
- **Email outbound:** Resend (desde `hola@cronosports.app`)

---

## Estructura de directorios

### `src/app/`

```
admin/
api/
auth/
events/[id]/
home/
map/
picks/
profile/
terms/
globals.css
layout.tsx
page.tsx
```

### `src/components/`

```
home/
ui/
AuthCard.tsx
AuthInit.tsx
BottomNav.tsx
Header.tsx
LayoutWithLead.tsx
OTPDialog.tsx
PhoneInput.tsx
QRModal.tsx
RestaurantLead.tsx
TeamsAutocomplete.tsx
TeamSelect.tsx
```

---

## Colecciones Firestore

| Colección          | Notas                                              |
|--------------------|----------------------------------------------------|
| `events`           | Con subcolección `attendees`                       |
| `users`            | Usuarios registrados vía Firebase Auth             |
| `teams`            | Equipos de las quinielas                           |
| `restaurant_leads` | Leads del portal de contacto para restaurantes     |

---

## Lo que está funcionando (no romper)

- Eventos cargados desde Firestore
- Firebase Auth con registro de usuarios
- Sistema de capacidad con QR de entrada
- Admin panel completo: CRUD de eventos + gestión de asistentes con toggle `paidQuiniela`
- Portal de contacto para restaurantes (`RestaurantLead.tsx`)
- Deployment en producción en cronosports.app

---

## Archivos / sistemas que NO tocar

- `RestaurantLead.tsx`
- `QRModal.tsx`
- `OTPDialog.tsx`
- `events/[id]/` (página de detalles del evento)
- Sistema de autenticación (Firebase Auth + OTP + `AuthCard.tsx` / `AuthInit.tsx`)
- Lógica de reservas y control de capacidad

---

## Issue pendiente

**Email de leads no llega a `rubeenpg11@gmail.com` en producción.**

- Los logs devuelven `{"ok":true,"skipped":true}`
- Causa probable: Vercel no lee `RESEND_API_KEY` ni `LEADS_EMAIL_TO` en runtime
- Verificar que ambas variables estén configuradas en el dashboard de Vercel (Settings → Environment Variables) para el entorno `Production`
- Confirmar que la ruta `api/` que gestiona el envío lee las variables sin el prefijo `NEXT_PUBLIC_`

---

## Variables de entorno requeridas en Vercel

```
RESEND_API_KEY
LEADS_EMAIL_TO

NEXT_PUBLIC_FIREBASE_API_KEY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
NEXT_PUBLIC_FIREBASE_PROJECT_ID
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
NEXT_PUBLIC_FIREBASE_APP_ID

TWILIO_ACCOUNT_SID
TWILIO_AUTH_TOKEN
TWILIO_FROM
```

---

## Próximos pasos (roadmap)

1. **Nueva Home** con Fan Zones del Mundial 2026: mapa Leaflet + lista de zonas
2. **Navbar reducido** a solo Home y Perfil (eliminar secciones intermedias)
3. **Bracket del Mundial** — solo fase eliminatoria
4. **Botones:**
   - `StarButton` para la acción de Reservar
   - `ShimmerButton` para el resto de CTAs
5. **Logo PNG cromado** en el Header (reemplazar texto/icono actual)
6. **Sección "Mi Bracket"** dentro de la pantalla de Perfil

---

## Convenciones del proyecto

- App Router de Next.js: todas las rutas viven en `src/app/`
- Componentes reutilizables en `src/components/`; los específicos de una sección dentro de su subcarpeta (ej. `home/`)
- Tailwind CSS 4: no usar clases de versiones anteriores; revisar compatibilidad si se añaden plugins
- Firebase llamado desde cliente directamente (sin capa de API intermedia salvo para operaciones sensibles como email o SMS)
- TypeScript estricto: no usar `any` salvo que sea estrictamente necesario

---

## Fan Zones — Estado actual

- Total documentos en wc2026_fanzones: 53
- Última actualización: 30 abril 2026
- Pendientes de confirmar: CDMX alcaldías restantes (9 sedes), Kansas City venue exacto, Boston fechas exactas
- Para agregar nuevos: usar admin panel → Fan Zones & Festivales → + Nuevo
