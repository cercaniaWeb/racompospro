{
  "security": {
    "auth": {
      "selectedType": "qwen-oauth",
      "apiKey": "$OPENROUTER_API_KEY",
      "baseUrl": "https://openrouter.ai/api/v1/chat/completions"
    }
  },
  "$version": 2,
  "mcpServers": {
    "filesystem-mcp": {
      "command": "filesystem-mcp",
      "args": [],
      "env": {},
      "disabled": false,
      "autoApprove": [
        "fs.*"
      ]
    },
    "terminal-executor-mcp": {
      "command": "terminal-executor-mcp",
      "args": [],
      "env": {},
      "disabled": false,
      "autoApprove": [
        "exec"
      ]
    },
    "memory-bank-mcp": {
      "command": "memory-bank-mcp",
      "args": [],
      "env": {},
      "disabled": false,
      "autoApprove": [
        "memory.*"
      ]
    },
    "chrome-devtools-mcp": {
      "command": "chrome-devtools-mcp",
      "args": [
        "--browserUrl",
        "http://127.0.0.1:9333"
      ],
      "env": {},
      "disabled": false,
      "autoApprove": [
        "chrome.*"
      ]
    },
    "context7-mcp": {
      "command": "context7-mcp",
      "args": [
        "--transport",
        "stdio"
      ],
      "env": {},
      "disabled": false,
      "autoApprove": [
        "context7.*"
      ]
    },
    "tavily-mcp": {
      "command": "tavily-mcp",
      "args": [
        "--port",
        "9322"
      ],
      "env": {
        "TAVILY_API_KEY": "$TAVILY_API_KEY"
      },
      "disabled": false,
      "autoApprove": [
        "tavily-search",
        "tavily-extract",
        "tavily-crawl",
        "tavily-map"
      ]
    },
    "git-mcp-server": {
      "command": "git-mcp-server",
      "args": [
        "--port",
        "9320"
      ],
      "env": {},
      "disabled": false,
      "autoApprove": [
        "git.*"
      ]
    },
    "puppeteer-mcp": {
      "command": "npx @modelcontextprotocol/server-puppeteer",
      "args": [
        "--port",
        "9334"
      ],
      "env": {},
      "disabled": false,
      "autoApprove": [
        "puppeteer.*",
        "browser.*"
      ]
    },
    "supabase-mcp": {
      "command": "supabase-mcp",
      "args": [],
      "env": {
        "SUPABASE_URL": "https://tu-proyecto.supabase.co",
        "SUPABASE_ANON_KEY": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBnYmVmcXpscnZqbnN5bWlnZm12Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE1MjkyMTQsImV4cCI6MjA3NzEwNTIxNH0.t32MJ9MB6nc9_BKYHs2AnyX2YASIjSbte-XRDY5KNrk"
      },
      "disabled": false,
      "autoApprove": [
        "supabase.*"
      ]
    },
    "fastmcp-workflow": {
      "command": "fastmcp",
      "args": [
        "run",
        "/home/lr/ecoDev/mcp/workflow_desarrollo_apps.py"
      ],
      "env": {},
      "disabled": false,
      "autoApprove": [
        "workflow.*"
      ]
    },
    "fastmcp-marketing": {
      "command": "fastmcp",
      "args": [
        "run",
        "/home/lr/ecoDev/mcp/marketing_documentacion_mcp.py"
      ],
      "env": {},
      "disabled": false,
      "autoApprove": [
        "marketing.*",
        "documentacion.*"
      ]
    }
  },
  "model": {
    "name": "openai/gpt-4o"
  }
}