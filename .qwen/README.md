# Gemini CLI con MCPs

Proyecto de configuración avanzada para Gemini CLI con integración de múltiples Model Context Protocol (MCP) servers para desarrollo full-stack.

## Características

- **Modelo de Alto Rendimiento**: Configurado con `gemini-2.5-pro` y ventana de contexto de 1,000,000
- **Agente especializado**: Fullstack Builder con auto-aceptación de tareas
- **Flujos de trabajo automatizados**: Pipelines para desarrollo completo y despliegue rápido
- **Integración MCP completa**: Conexión a múltiples servicios externos

## MCPs Configurados

### GitHub MCP
- Integración con GitHub Copilot CLI
- Requiere variable de entorno: `MCP_GITHUB_PAT`

### Vercel MCP
- Despliegue y gestión de aplicaciones en Vercel
- Requiere variable de entorno: `MCP_VERCEL_TOKEN`

### Supabase MCP
- Operaciones de base de datos con Supabase
- Requiere variables de entorno:
  - `MCP_SUPABASE_URL`
  - `MCP_SUPABASE_ANON_KEY`
  - `MCP_SUPABASE_SERVICE_ROLE_KEY`

### Tavily MCP
- Búsqueda web avanzada
- Requiere variable de entorno: `MCP_TAVILY_API_KEY`

### Context7 MCP
- Gestión de contexto de desarrollo
- Requiere variable de entorno: `MCP_CONTEXT7_API_KEY`

### Git MCP Server
- Operaciones de control de versiones
- Integración con Git

### FastMCP
- Framework para flujos de trabajo personalizados

### Social Media MCPs
- Integraciones de redes sociales a través de Robinson's Toolkit

### Chrome DevTools MCP
- Automatización de navegador y debugging

### Testing Suite MCP
- Integración de frameworks de pruebas (Jest, Playwright, Cypress)
- Requiere variable de entorno: `MCP_TESTSPRITE_API_KEY`

## Variables de Entorno

Crear un archivo `.env` o definir las siguientes variables de entorno:

```bash
# GitHub
export MCP_GITHUB_PAT="tu_token_aqui"

# Vercel
export MCP_VERCEL_TOKEN="tu_token_aqui"

# Supabase
export MCP_SUPABASE_URL="tu_url_aqui"
export MCP_SUPABASE_ANON_KEY="tu_anon_key_aqui"
export MCP_SUPABASE_SERVICE_ROLE_KEY="tu_service_role_key_aqui"

# Tavily
export MCP_TAVILY_API_KEY="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"

# Context7
export MCP_CONTEXT7_API_KEY="ctx7sk-afa1ea29-22d0-4943-bc5f-6bf5a9789a27"

# TestSprite
export MCP_TESTSPRITE_API_KEY="tu_token_aqui"
```

## Pipelines Disponibles

### build_full_app
Flujo completo para construir una aplicación:
- designer_agent
- frontend_dev_agent
- qa_agent
- devops_agent
- marketing_agent

### quick_fix_and_deploy
Flujo rápido para arreglos y despliegue:
- qa_agent
- devops_agent

## Instalación

1. Asegúrate de tener Node.js instalado
2. Instala las dependencias del proyecto:
```bash
npm install
```

3. Configura las variables de entorno como se indica arriba

4. Inicia Gemini CLI:
```bash
gemini
```

## Uso

Una vez iniciado Gemini CLI, tendrás acceso a todas las capacidades MCP configuradas. El agente fullstack builder se encargará de gestionar tareas de desarrollo completo.

## Contribución

Las contribuciones son bienvenidas. Por favor, abre un issue para discutir cambios o envía un pull request.

## Licencia

Este proyecto está bajo licencia MIT.