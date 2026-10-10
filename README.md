# Inmogest: CRM inmobiliario

Inmogest es un CRM para agencias inmobiliarias. Funciona en local con Next.js 16 y SQLite, sin servicios externos obligatorios.

## Puesta en marcha

```bash
pnpm install
pnpm reset        # crea data/inmogest.db con datos de demostración (borra los datos existentes)
pnpm dev          # http://localhost:3000
```

Producción:

```bash
pnpm build
INSECURE_COOKIES=1 pnpm start   # INSECURE_COOKIES=1 solo si se sirve por HTTP sin TLS
```

Usuarios de demostración. La contraseña de ambos es `REDACTED_DEMO_PASSWORD`:

- `admin@inmogest.local`: administrador.
- `laura@inmogest.local`: agente.

## Módulos

| Sección | Qué hace |
|---|---|
| Vista general | Llamadas, reuniones, visitas y firmas del día, tareas, mini calendario, gráfico de captaciones por agente e ingresos estimados y facturados. Filtros por agente y fechas, e informe en CSV o PDF. |
| Propiedades | Listado y cuadrícula con filtros avanzados, ficha con pestañas (fotos, mapa, portales, cruces, visitas y actividad), alta y edición con mapa y geolocalización, generador de descripciones, cambio de estado, duplicado, ficha imprimible y mapa general. |
| Captaciones | Tablero kanban por etapas (arrastrar y soltar), ratio de éxito, valoración rápida y conversión en propiedad. |
| Propiedades compartidas | Bolsa de colaboración con reparto de honorarios y solicitud de colaboración al agente. |
| Portales inmobiliarios | Activación por portal, matriz de publicación inmueble × portal y URL de exportación XML con token (Kyero v3 o genérico). |
| Clientes | Fichas con demanda (operación, presupuesto, zonas, tipos y extras) y cruces automáticos con puntuación. También vista de demandas, agenda, mensajes, visitas y facturas por cliente. |
| Mensajes | Bandeja de consultas que llegan de la web, portales y equipo, con respuestas rápidas y notas internas. Permite crear un cliente desde un mensaje. |
| Calendario y tareas | Vistas de mes, semana, día y agenda, con arrastrar para reprogramar, recordatorios en el navegador y exportación ICS (Google Calendar u Outlook). |
| Facturas | Series con numeración automática, borradores, emisión, cobro, anulación, rectificativas, impresión en PDF y exportación CSV. |
| Tasador | Valoración por comparables (mediana de €/m²) con informe imprimible. |
| Partes de visita | Hoja de visita con firma digital en pantalla e impresión. |
| Agentes | Usuarios, roles (administrador o agente), permisos y estadísticas por agente. |
| Página web | Web pública en `/web` con portada, buscador, mapa, ficha con galería, favoritos, simulador de hipoteca, formulario de contacto (llega a Mensajes y crea el cliente), empresa y contacto. Los colores, el logo y los textos se configuran desde el CRM. |

## Notas

- Las fotos se guardan en `data/uploads` y se sirven desde `/files/...`.
- Para usar IA en las descripciones hay que definir `ANTHROPIC_API_KEY` (ver `.env.example`). Sin ella se usa una plantilla.
- La publicación real en Idealista, Fotocasa y otros portales requiere un acuerdo con cada portal. Hay que facilitarles la URL XML que aparece en *Portales inmobiliarios*.
