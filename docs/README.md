# 📚 Documentación del Proyecto - Racom POS

Este documento es tu índice principal para toda la documentación del sistema.

---

## 🗂️ Estructura de Documentación

### 📁 `/docs` - Guías de Configuración

1. **[CHATBOT_SETUP.md](file:///home/lr/work/Proyectos/recoom-pos/docs/CHATBOT_SETUP.md)**
   - Configuración completa del Chatbot IA
   - Integración de Gemini, DeepSeek y OpenAI
   - Configuración de API keys
   - Ejemplos de uso

2. **[SMART_REORDER_SETUP.md](file:///home/lr/work/Proyectos/recoom-pos/docs/SMART_REORDER_SETUP.md)**
   - Implementación del Smart Reordering
   - Deploy de Edge Functions
   - Configuración de Gemini API
   - Testing y troubleshooting

3. **[CRON_SETUP.md](file:///home/lr/work/Proyectos/recoom-pos/docs/CRON_SETUP.md)**
   - Configuración de análisis automático diario
   - Opciones: pg_cron, GitHub Actions, Vercel Cron
   - Monitoreo y verificación
   - Scripts SQL para cron jobs

---

### 📁 `/supabase/migrations` - Base de Datos

**Migraciones Principales:**

1. `20251125_create_transfers_tables.sql` - Transferencias entre tiendas
2. `20251125_create_categories_table.sql` - Categorías de productos
3. `20251125_create_supplier_visits_table.sql` - Visitas de proveedores
4. `20251125_create_reorder_suggestions.sql` - Sugerencias de reorden IA
5. `20251125_create_sales_analysis_function.sql` - Análisis de ventas
6. `20251125_schedule_smart_reorder.sql` - Programación de análisis automático

**Cómo aplicarlas:**
```bash
cd /home/lr/work/Proyectos/recoom-pos
supabase db push
```

---

### 📁 `/supabase/functions` - Edge Functions

1. **[chatbot-query/](file:///home/lr/work/Proyectos/recoom-pos/supabase/functions/chatbot-query/index.ts)**
   - Convierte lenguaje natural a SQL
   - Multi-proveedor: Gemini → DeepSeek → OpenAI
   - Deploy: `supabase functions deploy chatbot-query`

2. **[smart-reorder-analyzer/](file:///home/lr/work/Proyectos/recoom-pos/supabase/functions/smart-reorder-analyzer/index.ts)**
   - Análisis IA de inventario
   - Predicciones de agotamiento
   - Deploy: `supabase functions deploy smart-reorder-analyzer`

---

### 📁 `/src/lib` - Utilidades Centralizadas

1. **[routes.ts](file:///home/lr/work/Proyectos/recoom-pos/src/lib/routes.ts)**
   - Rutas centralizadas de la aplicación
   - Type-safe routing
   - Uso: `import { ROUTES } from '@/lib/routes'`

2. **[/pdf](file:///home/lr/work/Proyectos/recoom-pos/src/lib/pdf/)**
   - `generateChatbotReport.ts` - PDF de reportes del chatbot
   - `generatePurchaseOrder.ts` - Órdenes de compra

---

### 📁 `/src/hooks` - React Hooks

1. **[useChatbot.ts](file:///home/lr/work/Proyectos/recoom-pos/src/hooks/useChatbot.ts)**
   - Hook para el chatbot IA
   - Consultas y exportación a PDF

2. **[useSmartReorder.ts](file:///home/lr/work/Proyectos/recoom-pos/src/hooks/useSmartReorder.ts)**
   - Hook para Smart Reordering
   - Gestión de sugerencias de reabastecimiento

3. **[useSupplierVisitNotifications.ts](file:///home/lr/work/Proyectos/recoom-pos/src/hooks/useSupplierVisitNotifications.ts)**
   - Notificaciones de visitas de proveedores

---

### 📁 `/src/components` - Componentes UI

**Organismos:**
- [ChatbotModal.tsx](file:///home/lr/work/Proyectos/recoom-pos/src/components/organisms/ChatbotModal.tsx) - Modal del chatbot
- [AgendarModal.tsx](file:///home/lr/work/Proyectos/recoom-pos/src/components/organisms/AgendarModal.tsx) - Agendar visitas
- [Sidebar.tsx](file:///home/lr/work/Proyectos/recoom-pos/src/components/organisms/Sidebar.tsx) - Navegación

**Widgets:**
- [SmartReorderWidget.tsx](file:///home/lr/work/Proyectos/recoom-pos/src/components/widgets/SmartReorderWidget.tsx) - Widget de reabastecimiento

---

## 🚀 Guías Rápidas

### Desplegar Edge Functions
```bash
# Chatbot
supabase functions deploy chatbot-query

# Smart Reordering
supabase functions deploy smart-reorder-analyzer
```

### Configurar API Keys
```bash
# Gemini (Gratis)
supabase secrets set GEMINI_API_KEY=AIza...

# DeepSeek (Opcional)
supabase secrets set DEEPSEEK_API_KEY=sk-...

# OpenAI (Opcional)
supabase secrets set OPENAI_API_KEY=sk-...
```

### Ver Logs
```bash
# Chatbot
supabase functions logs chatbot-query --follow

# Smart Reordering
supabase functions logs smart-reorder-analyzer --follow
```

---

## 📊 Features Implementados

### ✅ Chatbot IA Multi-Proveedor
- Consultas en lenguaje natural
- Exportación a PDF
- 3 proveedores con fallback automático
- **Ubicación**: `/reports` en el dashboard

### ✅ Smart Reordering con IA
- Predicciones de agotamiento
- Sugerencias automáticas de reabastecimiento
- Análisis diario programable
- **Ubicación**: Dashboard principal

### ✅ Sistema de Rutas Centralizadas
- Type-safe routing
- Fácil refactoring
- Production-ready

### ✅ Gestión de Categorías
- CRUD completo
- Integración con Supabase

### ✅ Agendamiento de Visitas
- Notificaciones automáticas
- Recordatorios configurables

---

## 🛠️ Comandos Útiles

```bash
# Desarrollo
npm run dev

# Build
npm run build

# Migraciones
supabase db push

# Ver tablas
supabase db diff

# Resetear base de datos local
supabase db reset

# Ver logs de Edge Functions
supabase functions logs <function-name> --follow
```

---

## 💰 Costos

| Servicio | Costo Mensual |
|----------|---------------|
| Supabase Free Tier | $0 |
| Gemini API | $0 (Gratis) |
| DeepSeek (opcional) | ~$0.10-0.50 |
| Edge Functions | $0 (incluido) |
| **TOTAL** | **~$0** |

---

## 📞 Soporte y Referencias

### Documentación Externa
- [Supabase Docs](https://supabase.com/docs)
- [Gemini API](https://ai.google.dev/docs)
- [DeepSeek API](https://platform.deepseek.com/docs)
- [Next.js Docs](https://nextjs.org/docs)

### Archivos de Referencia Internos
- **Task List**: `.gemini/antigravity/brain/.../task.md`
- **Walkthrough**: `.gemini/antigravity/brain/.../walkthrough.md`
- **Implementation Plans**: `.gemini/antigravity/brain/.../implementation_plan.md`

---

## 🔄 Actualizaciones Recientes

**Última actualización**: 25 Nov 2024

### Cambios Principales
1. ✅ Smart Reordering implementado
2. ✅ Chatbot con Gemini integrado
3. ✅ Sistema de rutas centralizadas
4. ✅ Dashboard mejorado con fetch de Supabase
5. ✅ Notificaciones de proveedores

---

## 📝 Notas Importantes

> [!IMPORTANT]
> Todas las migraciones deben ejecutarse antes de usar las nuevas features.

> [!TIP]
> Usa Gemini API (gratis) para minimizar costos.

> [!WARNING]
> El service_role_key nunca debe exponerse en el frontend.

---

**Mantenido por**: AI Assistant  
**Proyecto**: Racom POS  
**Versión**: 1.0.0
