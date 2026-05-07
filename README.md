# MCP (Model Context Protocol) Tutorial

## 개요

MCP는 LLM이 외부 도구(tools), 리소스(resources), 프롬프트(prompts)에 접근할 수 있게 하는 표준 프로토콜이다.

## 구조

```
Client (Claude, Cursor 등)
    ↓ JSON-RPC over stdio
Server (이 프로젝트)
    ↓
Tools: add, read, write 등
```

## 서버 실행

```bash
node server.js
```

stdin/stdout으로 통신하는 단방향 stdio 트랜스포트를 사용한다.

## 통신 흐름 (nc 디버깅)

```bash
# 1. Initialize
echo '{"jsonrpc":"2.0","id":0,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test","version":"1.0"}}}' | node server.js

# 2. initialized notification
echo '{"jsonrpc":"2.0","method":"notifications/initialized","params":{}}' | node server.js

# 3. List tools
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}' | node server.js

# 4. Call tool
echo '{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"add","arguments":{"a":5,"b":3}}}' | node server.js
```

## MCP SDK 구조

| 클래스 | 용도 |
|--------|------|
| `McpServer` | High-level API - tool/resource/prompt 등록 |
| `Server` | Low-level - 직접 request handler 설정 |
| `StdioServerTransport` | stdin/stdout 통신 |

## tool() 메서드 시그니처

```javascript
server.tool(name, description?, inputSchema?, handler)
server.tool(name, description, inputSchema, annotations?, handler)
```

### 예시

```javascript
// 기본
server.tool("add", { a: z.number(), b: z.number() }, async ({ a, b }) => ({
  content: [{ type: "text", text: String(a + b) }]
}));

// 설명 포함
server.tool("greet", "Greet someone", { name: z.string() }, async ({ name }) => ({
  content: [{ type: "text", text: `Hello, ${name}!` }]
}));

// 출력 스키마 포함
server.tool("calculate", "Complex calculation", { x: z.number() }, { y: z.number() },
  async ({ x }) => ({ y: x * 2 }))
);
```

## Zod 스키마

MCP는 Zod v4를 사용한다.

| Zod 타입 | JSON Schema |
|----------|-------------|
| `z.string()` | `{ type: "string" }` |
| `z.number()` | `{ type: "number" }` |
| `z.boolean()` | `{ type: "boolean" }` |
| `z.array(z.string())` | `{ type: "array", items: { type: "string" } }` |
| `z.object({...})` | `{ type: "object", properties: {...} }` |
| `z.enum([...])` | `{ type: "string", enum: [...] }` |
| `z.optional()` | 속성에서 `required` 제외 |
| `z.nullable()` | `{ type: "null" }` union |

## 주요 메서드

### tools/list
```json
{"method": "tools/list"}
→ {"result": {"tools": [...]}}
```

### tools/call
```json
{"method": "tools/call", "params": {"name": "add", "arguments": {"a": 1, "b": 2}}}
→ {"result": {"content": [{"type": "text", "text": "3"}]}}
```

## Resources

```javascript
server.resource("config", "file:///config/app.json",
  async (uri) => ({ contents: [{ uri: uri.toString(), text: "{}" }] })
);
```

## Prompts

```javascript
server.prompt("summarize", "Summarize text", { text: z.string() },
  async ({ text }) => ({ messages: [{ role: "user", content: `Summarize: ${text}` }] })
);
```

## 디버깅

stderr로 출력되므로 `console.error` 사용:
```javascript
console.error(`[DEBUG] Tool called: ${name}`);
```

터미널에서 확인:
```bash
node server.js 2>&1 | grep DEBUG
```

## 파일 구조

```
mcp_tutorial/
├── server.js      # MCP 서버
├── package.json   # dependencies
└── README.md      # 이 문서
```

## 의존성

```json
{
  "@modelcontextprotocol/sdk": "^1.29.0",
  "zod": "^4.4.3"
}
```

## 참고

- [MCP Spec](https://spec.modelcontextprotocol.io)
- [TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk)
- Protocol Version: `2024-11-05`