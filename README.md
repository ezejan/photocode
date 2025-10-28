# PhotoCode

PWA construida con Next.js 14 + TypeScript para identificar códigos de producto (SKU) a partir de fotografías de cajas con rotulado en coreano. El flujo realiza captura/compresión de la imagen, ejecuta OCR en Google Cloud Vision y compara el texto detectado contra un catálogo maestro cargado en memoria.

## Requisitos previos

- Node.js >= 18
- pnpm >= 8
- Una cuenta de Google Cloud con Vision API habilitada
- Credenciales de servicio (JSON) con permisos para Vision API

## Configuración inicial

1. Clona el repositorio y entra en la carpeta del proyecto.
2. Copia las variables de entorno: `cp .env.example .env.local`.
3. Edita `.env.local` y define las rutas/IDs necesarios:
   - `GOOGLE_APPLICATION_CREDENTIALS`: ruta absoluta al JSON de la service account.
   - `GCP_PROJECT_ID`: ID de tu proyecto en Google Cloud.
   - `VISION_API_KEY` (opcional si usas el cliente oficial con service account).
4. Asegúrate de que el archivo JSON de la service account sea accesible por la aplicación.
5. Instala dependencias: `pnpm install`.

## Scripts disponibles

- `pnpm dev`: inicia el entorno de desarrollo con recarga en caliente.
- `pnpm build`: genera el build de producción.
- `pnpm start`: sirve el build de producción.
- `pnpm lint`: ejecuta ESLint con la configuración de Next.
- `pnpm typecheck`: verifica los tipos de TypeScript sin emitir archivos.
- `pnpm test`: ejecuta las pruebas unitarias de `matchSku` con Vitest.

## Uso en desarrollo

1. Ejecuta `pnpm dev`.
2. Abre `http://localhost:3000` y permite el acceso a la cámara.
3. Captura o carga una foto, presiona "Escanear" y revisa el código sugerido.

## Despliegue

1. Ejecuta `pnpm build` para generar el artefacto de producción.
2. Despliega el contenido siguiendo la guía oficial de Next.js (Vercel, contenedores o servidor propio con `pnpm start`).
3. Asegúrate de configurar las variables de entorno en el entorno de despliegue y de exponer las credenciales de Vision API.

## Datos maestros

El catálogo inicial vive en `data/sku_master.json`. Para actualizarlo:

1. Edita el archivo agregando/actualizando registros con el mismo esquema (`code`, `brand_line`, `flavor`, `units_per_box`, `shelf_life`).
2. Mantén los nombres coherentes para favorecer el matching por tokens.
3. Reinicia el servidor para que el índice en memoria se regenere.

## Roadmap

- Integrar embeddings multilingües para mejorar el matching semántico.
- Persistir auditorías y catálogo maestro en Postgres o Firestore.
- Añadir modo offline completo con sincronización diferida.

## Seguridad y privacidad

Las imágenes se usan exclusivamente durante el request para ejecutar OCR y matching. No se almacenan en disco ni se comparten con terceros fuera del proveedor de OCR configurado. Este comportamiento puede cambiar en futuras versiones cuando se habilite la persistencia configurable.
