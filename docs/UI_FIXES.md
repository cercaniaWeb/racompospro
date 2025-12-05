# Fixes Aplicados - Errores UI

## ✅ Problemas Solucionados

### 1. Widget de Smart Reordering Parpadeando ⚡
**Problema**: El widget se recargaba constantemente causando parpadeo  
**Causa**: Loop infinito en `useSmartReorder` - dependency cycle  
**Solución**: Modificado el `useEffect` para depender solo de `storeId`

**Archivo**: `src/hooks/useSmartReorder.ts`
```typescript
// ✅ Corregido
useEffect(() => {
  if (storeId) {
    refreshSuggestions();
  }
}, [storeId]); // Solo storeId, no refreshSuggestions
```

---

## ⚠️ Problemas Pendientes (Requieren Atención)

### 2. Error 406 - user_stores Query ❌

**Error en Consola**:
```
Failed to load resource: the server responded with a status of 406 ()
user_stores?select=store_id%2Cstores%28id%2Cname%29
```

**Causa**: El query tiene sintaxis incorrecta para relaciones anidadas  
**Solución Requerida**: Arreglar el query en `useStoreContext.ts`

**Query Incorrecto**:
```typescript
.select('store_id, stores(id, name)')  // ❌ Falla
```

**Query Correcto** (a implementar):
```typescript
.select('store_id, stores!inner(id, name)')  // ✅
// O mejor aún:
.select(`
  store_id,
  stores:store_id (
    id,
    name
  )
`)
```

---

### 3. Error 400 - user_profiles Query ❌

**Error**:
```
user_profiles?select=id%2Cname%2Cemail%2Crole%2Cstatus&status=eq.active&store_id=eq.xxx
Failed: 400
```

**Causa**: La columna `store_id` no existe en `user_profiles`  
**Solución**: Verificar el esquema de la tabla y ajustar el query

---

### 4. Botón "Limpiar" en Notificaciones No Funciona 🔘

**Problema**: El botón clearAll no está conectado al store  
**Archivo Afectado**: Componente de notificaciones (necesita identificación)

**Solución** (a implementar):
```typescript
import { useNotifications } from '@/store/notificationStore';

const { clearAll } = useNotifications();

// En el botón:
<button onClick={clearAll}>Limpiar Todo</button>
```

---

### 5. Inputs Desplegables - Fondo Blanco, Letras Blancas 🎨

**Problema**: Contraste incorrecto en selectores  
**Causa**: Faltan estilos específicos para `<select>` en modo oscuro

**Solución Temporal** (agregar a los selects afectados):
```typescript
className="
  bg-gray-700        // Fondo oscuro
  text-white         // Texto blanco
  border-gray-600    // Borde gris
  focus:ring-blue-500
  focus:border-blue-500
"
```

**Solución Permanente** (global CSS):
```css
/* En globals.css o tailwind.config */
select {
  @apply bg-gray-700 text-white border-gray-600;
}

select option {
  @apply bg-gray-800 text-white;
}
```

---

### 6. TransferManager Se Refresca Cada Segundo 🔄

**Problema**: Actualizaciones constantes en el componente  
**Causa**: `useLiveQuery` de Dexie observa cambios en tiempo real

**Nota**: Esto es comportamiento esperado de Dexie's live queries  
Si es problemático, se puede optimizar con:
- Throttling de actualizaciones
- Memo de componentes
- Deshabilitar live queries y usar refresh manual

---

## 🔧 Archivos a Revisar/Modificar

1. **`src/hooks/useStoreContext.ts`** - Fix query 406
2. **`src/hooks/useEmployees.ts`** - Fix query 400  
3. **`src/components/organisms/NotificationPanel.tsx`** - Fix clearAll button
4. **`globals.css`** o componentes con `<select>` - Fix styling
5. **`src/features/transfers/TransferManager.tsx`** - Optimizar (opcional)

---

## 📋 Próximos Pasos

### Prioridad Alta
- [ ] Arreglar queries de Supabase (406, 400 errors)
- [ ] Conectar botón clearAll en notificaciones
- [ ] Fix estilos de dropdowns globalmente

### Prioridad Media  
- [ ] Aplicar migraciones de Smart Reordering
- [ ] Optimizar TransferManager si sigue siendo problema

### Prioridad Baja
- [ ] Fix manifest icon warning (no afecta funcionalidad)

---

## ⚡ Comandos Útiles

```bash
# Ver errores en tiempo real
npm run dev

# Verificar esquema de base de datos
supabase db diff

# Ver logs de Supabase
# (En Dashboard > Logs)
```

---

**Última actualización**: 25 Nov 2024
**Estado**: Parpadeo de Smart Reorder SOLUCIONADO ✅
**Pendientes**: Queries, estilos, botón clear
