# Configuración de Análisis Automático Diario

## Opción 1: Supabase Dashboard (Más Fácil) ✅

### Paso 1: Habilitar pg_cron
1. Ve a tu proyecto en Supabase Dashboard
2. Ve a **Database** > **Extensions**
3. Busca `pg_cron` y habilítalo

### Paso 2: Configurar Variables de Configuración
En el SQL Editor, ejecuta:

```sql
-- Configurar URL de Supabase
ALTER DATABASE postgres SET app.supabase_url TO 'https://gdkpwsgcqwvsxghvoqmu.supabase.co';

-- Configurar Service Role Key (obtén esto de Project Settings > API)
ALTER DATABASE postgres SET app.service_role_key TO 'tu_service_role_key_aqui';
```

### Paso 3: Ejecutar el Script de Cron
Ejecuta el archivo: `supabase/migrations/20251125_schedule_smart_reorder.sql`

O copia este código en el SQL Editor:

```sql
-- Schedule daily analysis at 2 AM
SELECT cron.schedule(
    'daily-smart-reorder-analysis',
    '0 2 * * *',
    $$
    SELECT net.http_post(
        url := current_setting('app.supabase_url') || '/functions/v1/smart-reorder-analyzer',
        headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ' || current_setting('app.service_role_key')
        ),
        body := '{}'::jsonb
    );
    $$
);
```

### Paso 4: Verificar que está Programado

```sql
SELECT * FROM cron.job WHERE jobname = 'daily-smart-reorder-analysis';
```

Deberías ver algo como:
```
jobid | schedule  | jobname                      | active
------+-----------+------------------------------+--------
1     | 0 2 * * * | daily-smart-reorder-analysis | true
```

---

## Opción 2: GitHub Actions (Alternativa Simple)

Si prefieres no usar pg_cron, puedes usar GitHub Actions:

### Crear Archivo `.github/workflows/smart-reorder.yml`

```yaml
name: Daily Smart Reorder Analysis

on:
  schedule:
    # Runs at 2 AM UTC daily
    - cron: '0 2 * * *'
  # Allow manual trigger
  workflow_dispatch:

jobs:
  trigger-analysis:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger Smart Reorder Analysis
        run: |
          curl -X POST \
            "https://gdkpwsgcqwvsxghvoqmu.supabase.co/functions/v1/smart-reorder-analyzer" \
            -H "Authorization: Bearer ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}" \
            -H "Content-Type: application/json" \
            -d '{}'
        env:
          SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}
```

### Configurar Secret en GitHub:
1. Ve a tu repositorio > Settings > Secrets and variables > Actions
2. Add secret: `SUPABASE_SERVICE_ROLE_KEY` = tu service role key

---

## Opción 3: Vercel Cron (Si usas Vercel)

Crea `api/cron/smart-reorder.ts`:

```typescript
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Verificar que es una petición de Vercel Cron
  const authHeader = req.headers.authorization;
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/smart-reorder-analyzer`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      }
    );

    const data = await response.json();
    return res.status(200).json({ success: true, data });
  } catch (error) {
    console.error('Smart reorder failed:', error);
    return res.status(500).json({ error: 'Failed to trigger analysis' });
  }
}
```

Luego en `vercel.json`:

```json
{
  "crons": [{
    "path": "/api/cron/smart-reorder",
    "schedule": "0 2 * * *"
  }]
}
```

---

## Programaciones Recomendadas

```
# Diario a las 2 AM
0 2 * * *

# Cada 12 horas
0 */12 * * *

# Cada 6 horas
0 */6 * * *

# Solo de lunes a viernes a las 2 AM
0 2 * * 1-5

# Dos veces al día (2 AM y 2 PM)
0 2,14 * * *
```

---

## Verificación y Monitoreo

### Ver Logs del Cron Job (pg_cron)

```sql
SELECT * FROM cron.job_run_details 
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'daily-smart-reorder-analysis')
ORDER BY start_time DESC
LIMIT 10;
```

### Ver Sugerencias Generadas

```sql
SELECT 
    DATE(analysis_date) as analysis_day,
    COUNT(*) as suggestions_created,
    SUM(CASE WHEN priority = 'urgent' THEN 1 ELSE 0 END) as urgent,
    SUM(CASE WHEN priority = 'high' THEN 1 ELSE 0 END) as high
FROM reorder_suggestions
WHERE created_at >= NOW() - INTERVAL '7 days'
GROUP BY DATE(analysis_date)
ORDER BY analysis_day DESC;
```

### Probar Manualmente

```bash
# Con curl
curl -X POST \
  "https://gdkpwsgcqwvsxghvoqmu.supabase.co/functions/v1/smart-reorder-analyzer" \
  -H "Authorization: Bearer TU_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json"
```

---

## Troubleshooting

### Job no se ejecuta

1. Verifica que pg_cron esté habilitado:
   ```sql
   SELECT * FROM pg_extension WHERE extname = 'pg_cron';
   ```

2. Verifica que las variables estén configuradas:
   ```sql
   SELECT current_setting('app.supabase_url');
   SELECT current_setting('app.service_role_key');
   ```

3. Checa logs de cron:
   ```sql
   SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 5;
   ```

### Service Role Key

Obtén tu Service Role Key:
1. Supabase Dashboard
2. Project Settings > API
3. Copia "service_role" key (NO la anon key)

⚠️ **IMPORTANTE**: Nunca expongas el service_role_key en el frontend!

---

## Recomendación Final

**Para producción**: Usa **Opción 1 (pg_cron)** - es nativo de Supabase, no requiere infraestructura externa.

**Para desarrollo/testing**: Usa el botón "Analizar" en el dashboard para ejecutar análisis manuales.

---

¿Listo! Con esto tu sistema analizará el inventario automáticamente cada día a las 2 AM y generará sugerencias de reabastecimiento. 🎉
