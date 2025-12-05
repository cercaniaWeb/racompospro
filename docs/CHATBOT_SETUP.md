# Configuración del Chatbot IA (Multi-Proveedor)

El chatbot soporta **3 proveedores de IA** con fallback automático:
1. **Gemini** (Google) - GRATIS con límites generosos
2. **DeepSeek** - Ultra económico ($0.0001/1K tokens)
3. **OpenAI** - Fallback (si los otros no están disponibles)

## Orden de Prioridad

El chatbot intenta en este orden:
1. Gemini (si tiene API key) → 2. DeepSeek (si tiene API key) → 3. OpenAI (si tiene API key)

Puedes configurar uno, dos o los tres. Se recomienda al menos Gemini (gratis) + DeepSeek (barato).

---

## Pasos de Instalación

### 1. Instalar Dependencias
```bash
cd /home/lr/work/Proyectos/recoom-pos
npm install jspdf jspdf-autotable
```

### 2. Configurar Variables de Entorno

Crear o editar `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://gdkpwsgcqwvsxghvoqmu.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key_aqui
```

### 3. Obtener API Keys

#### Opción A: Gemini (Recomendado - GRATIS) 🎁

1. Visita https://makersuite.google.com/app/apikey
2. Click en "Get API Key" o "Create API Key"
3. Copia la key (empieza con `AI...`)
4. **Límite gratis**: 60 requests/minuto, completamente gratis!

#### Opción B: DeepSeek (Ultra Económico) 💰

1. Visita https://platform.deepseek.com/api_keys
2. Crea una cuenta
3. Crea una nueva API key (recibes $5 gratis)
4. Copia la key (empieza con `sk-`)

#### Opción C: OpenAI (Fallback)

1. Visita https://platform.openai.com/api-keys
2. Crea una nueva API key
3. Copia la key (empieza con `sk-`)

### 4. Configurar Secrets en Supabase

Configura los secrets para los proveedores que quieras usar:

```bash
# Gemini (Recomendado - Gratis)
supabase secrets set GEMINI_API_KEY=AIza... --project-ref gdkpwsgcqwvsxghvoqmu

# DeepSeek (Opcional - Muy barato)
supabase secrets set DEEPSEEK_API_KEY=sk-... --project-ref gdkpwsgcqwvsxghvoqmu

# OpenAI (Opcional - Fallback)
supabase secrets set OPENAI_API_KEY=sk-... --project-ref gdkpwsgcqwvsxghvoqmu
```

O desde Supabase Dashboard:
1. Ve a Project Settings > Edge Functions
2. Add Secrets según necesites:
   - `GEMINI_API_KEY` = `AIza...`
   - `DEEPSEEK_API_KEY` = `sk-...`
   - `OPENAI_API_KEY` = `sk-...`

### 5. Deploy Edge Function

```bash
supabase functions deploy chatbot-query --project-ref gdkpwsgcqwvsxghvoqmu
```

---

## Comparación de Proveedores

| Proveedor | Costo por 1K tokens | Límite Gratis | Velocidad | SQL Quality |
|-----------|---------------------|---------------|-----------|-------------|
| **Gemini** | **GRATIS** | 60 req/min | ⚡⚡⚡ Rápido | ⭐⭐⭐⭐ Excelente |
| DeepSeek | $0.0001 | $5 inicial | ⚡⚡⚡ Rápido | ⭐⭐⭐⭐ Excelente |
| OpenAI | $0.002 | - | ⚡⚡ Medio | ⭐⭐⭐⭐⭐ Superior |

### Costos Estimados (1000 consultas/mes)

- **Solo Gemini**: **$0** (GRATIS!)
- **Gemini + DeepSeek**: **$0-0.50** (casi nada)
- **Solo OpenAI**: **$2-5**

---

## Configuraciones Recomendadas

### Para Comenzar (GRATIS) 🎁
```bash
# Solo Gemini
supabase secrets set GEMINI_API_KEY=AIza...
```

### Producción Confiable 💎
```bash
# Gemini + DeepSeek (fallback económico)
supabase secrets set GEMINI_API_KEY=AIza...
supabase secrets set DEEPSEEK_API_KEY=sk-...
```

### Máxima Confiabilidad 🚀
```bash
# Los 3 proveedores
supabase secrets set GEMINI_API_KEY=AIza...
supabase secrets set DEEPSEEK_API_KEY=sk-...
supabase secrets set OPENAI_API_KEY=sk-...
```

---

## Testing

```bash
curl -i --location --request POST 'https://gdkpwsgcqwvsxghvoqmu.supabase.co/functions/v1/chatbot-query' \
  --header 'Authorization: Bearer TU_ANON_KEY' \
  --header 'Content-Type': 'application/json' \
  --data '{"query":"muéstrame los productos"}'
```

### Consultas de Prueba

1. "Muéstrame todos los productos"
2. "¿Cuáles son las ventas del último mes?"
3. "Top 10 productos más vendidos"
4. "Lista de todas las tiendas"

---

## Troubleshooting

### No AI providers configured
- Configura al menos una API key (Gemini recomendado)
- Redeploy la función después de configurar

### All AI providers failed
- Verifica que las API keys sean válidas
- Revisa los límites de uso de cada proveedor
- Checa los logs: `supabase functions logs chatbot-query`

### Gemini quota exceeded
- El sistema automáticamente cambiará a DeepSeek o OpenAI
- O espera 1 minuto para que se resetee el límite

---

## Ventajas del Sistema Multi-Proveedor

✅ **Redundancia**: Si un proveedor falla, usa otro automáticamente  
✅ **Costo Óptimo**: Usa el más barato primero  
✅ **Sin Downtime**: Siempre hay un fallback  
✅ **Flexibilidad**: Configura solo los que necesites  

---

## Límites y Consideraciones

- **Timeout total**: 60 segundos máximo
- **Gemini**: 60 requests/minuto (gratis)
- **DeepSeek**: Según créditos
- **OpenAI**: Según plan
- **Seguridad**: Solo SELECT queries

---

## Registro Rápido

### Gemini (5 minutos - GRATIS)
1. https://makersuite.google.com/app/apikey
2. Login con Google
3. Create API Key
4. ¡Listo! Gratis para siempre

### DeepSeek (5 minutos - $5 gratis)
1. https://platform.deepseek.com
2. Crear cuenta
3. $5 USD de regalo
4. ~50,000 consultas con el crédito inicial

### OpenAI (10 minutos - De pago)
1. https://platform.openai.com
2. Agregar método de pago
3. $5 inicial recomendado

## Pasos de Instalación

### 1. Instalar Dependencias
```bash
cd /home/lr/work/Proyectos/recoom-pos
npm install jspdf jspdf-autotable
```

### 2. Configurar Variables de Entorno

Crear o editar `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://gdkpwsgcqwvsxghvoqmu.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key_aqui
```

### 3. Obtener DeepSeek API Key

1. Visita https://platform.deepseek.com/api_keys
2. Crea una cuenta (si no la tienes)
3. Crea una nueva API key
4. Copia la key (empieza con `sk-`)

### 4. Configurar Secrets en Supabase

```bash
# Desde la terminal
supabase login

# Configurar el secret
supabase secrets set DEEPSEEK_API_KEY=sk-tu-api-key-aqui --project-ref gdkpwsgcqwvsxghvoqmu
```

O desde Supabase Dashboard:
1. Ve a Project Settings > Edge Functions
2. Add Secret: `DEEPSEEK_API_KEY` = `sk-tu-key`

### 5. Deploy Edge Function

```bash
supabase functions deploy chatbot-query --project-ref gdkpwsgcqwvsxghvoqmu
```

### 6. Verificar Deployment

Prueba el endpoint:
```bash
curl -i --location --request POST 'https://gdkpwsgcqwvsxghvoqmu.supabase.co/functions/v1/chatbot-query' \
  --header 'Authorization: Bearer TU_ANON_KEY' \
  --header 'Content-Type: application/json' \
  --data '{"query":"muéstrame los productos"}'
```

## Troubleshooting

### Error: DeepSeek API key not configured
- Verifica que el secret esté configurado en Supabase
- Redeploy la función después de configurar el secret

### Error: Failed to process query
- Verifica que tengas créditos en tu cuenta de DeepSeek
- Revisa los logs: `supabase functions logs chatbot-query`

### No results
- Verifica que las tablas tengan datos
- Revisa el SQL generado en la respuesta del chatbot

## Testing

### Consultas de Prueba

1. "Muéstrame todos los productos"
2. "¿Cuáles son las ventas del último mes?"
3. "Top 10 productos más vendidos"
4. "Lista de todas las tiendas"

## Límites y Consideraciones

- **Timeout**: 60 segundos máximo por consulta
- **Costo**: ~$0.0001 USD por 1000 tokens (100x más barato que GPT-3.5)
- **Rate Limits**: Según tu plan de DeepSeek
- **Seguridad**: Solo queries SELECT permitidas

## Costos Estimados (DeepSeek)

- Query simple: ~500 tokens = **$0.00005** (casi gratis!)
- Query compleja: ~1500 tokens = **$0.00015**
- 1000 consultas/mes: **~$0.10-0.50 USD**

**Ventajas de DeepSeek**:
- 💰 100x más económico que OpenAI
- 🚀 Velocidad similar
- 🎯 Excelente para SQL y código
- 💳 Sin necesidad de suscripción

**Precio Comparativo**:
- OpenAI GPT-3.5: $0.002/1K tokens
- **DeepSeek**: $0.0001/1K tokens

## Registro en DeepSeek

1. Ve a https://platform.deepseek.com
2. Crea una cuenta (gratis)
3. Recibe $5 USD de crédito inicial
4. Genera tu API key
5. ¡Listo! Con $5 puedes hacer ~50,000 consultas
