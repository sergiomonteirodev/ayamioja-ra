# Análise Profunda do Erro WebGL

## Problema

O erro `THREE.WebGLRenderer: A WebGL context could not be created. Reason: Canvas has an existing context of a different type` continua aparecendo no console, apesar de múltiplas tentativas de supressão.

## Causa Raiz

O problema ocorre porque:

1. **A-Frame cria um contexto WebGL primeiro**: Quando o A-Frame inicializa, ele cria um contexto WebGL no canvas do `a-scene`.

2. **Three.js tenta criar outro contexto**: O Three.js (usado internamente pelo A-Frame e pelo MindAR) tenta criar um novo contexto WebGL no mesmo canvas, mas o navegador não permite múltiplos contextos no mesmo canvas.

3. **O erro é gerado internamente pelo Three.js**: O erro é lançado dentro do construtor do `WebGLRenderer` do Three.js, antes mesmo de chamar `getContext()`.

## Por que a Supressão Não Funciona Completamente

1. **Timing**: O erro pode ser gerado antes da nossa interceptação ser aplicada.
2. **Forma de exibição**: O Three.js pode estar usando uma forma diferente de exibir o erro que não estamos capturando.
3. **Erro interno**: O erro pode estar sendo gerado dentro do código compilado/minificado do Three.js, tornando difícil interceptá-lo.

## Soluções Implementadas

### 1. Interceptação de `getContext` no `index.html`
- Intercepta `HTMLCanvasElement.prototype.getContext` antes de qualquer biblioteca carregar
- Verifica se já existe um contexto antes de tentar criar um novo
- Retorna o contexto existente em vez de criar um novo

### 2. Script de Debug (`src/utils/webgl-debug.js`)
- Rastreia todas as chamadas a `getContext`
- Rastreia criação de `WebGLRenderer` do Three.js
- Fornece logs detalhados para análise

### 3. Supressão de Erros
- Intercepta `console.error`, `console.warn`, `window.onerror` e `unhandledrejection`
- Verifica múltiplos padrões de mensagens de erro
- Suprime erros relacionados a WebGL context

## Como Usar o Debug

### Ativar Debug

1. Adicione `?debug=true` na URL, ou
2. O debug é ativado automaticamente em desenvolvimento (`import.meta.env.DEV`)

### Ver Logs de Debug

Abra o console do navegador e execute:

```javascript
// Ver todos os logs
window.getWebGLDebugLogs()

// Ver resumo
const logs = window.getWebGLDebugLogs();
console.log('Resumo:', logs.summary);
console.log('Logs completos:', logs.logs);

// Limpar logs
window.clearWebGLDebugLogs();
```

### Análise dos Logs

Os logs contêm:
- **timestamp**: Quando a chamada foi feita
- **contextType**: Tipo de contexto solicitado ('webgl', 'webgl2', etc.)
- **canvasInfo**: Informações sobre o canvas (id, classe, dimensões, parent)
- **stack**: Stack trace mostrando de onde a chamada veio
- **args**: Argumentos passados para `getContext`

### Identificar o Problema

Procure por:
1. **Múltiplas chamadas ao mesmo canvas**: Se houver várias chamadas `getContext('webgl')` no mesmo canvas, isso pode causar o erro.
2. **Chamadas de diferentes fontes**: Verifique o stack trace para ver se o Three.js está chamando `getContext` de forma diferente.
3. **Canvas sem contexto armazenado**: Se o canvas não tem `_glContext` armazenado, pode ser que o contexto esteja sendo criado mas não armazenado.

## Próximos Passos

1. **Execute o debug** e colete os logs quando o erro aparecer
2. **Analise os logs** para identificar:
   - Quantas vezes `getContext` é chamado
   - De onde as chamadas estão vindo (stack trace)
   - Se o contexto está sendo armazenado corretamente
3. **Compartilhe os logs** para análise mais profunda

## Solução Alternativa

Se o erro continuar aparecendo, podemos:

1. **Aceitar o erro como cosmético**: O erro não afeta a funcionalidade do AR. O AR funciona normalmente mesmo com o erro aparecendo.

2. **Modificar o Three.js**: Podemos criar um wrapper do Three.js que intercepta a criação do WebGLRenderer e previne o erro.

3. **Usar um canvas separado**: Podemos usar um canvas separado para o Three.js, mas isso pode causar outros problemas de renderização.

## Conclusão

O erro é causado por uma limitação do navegador: não é possível ter múltiplos contextos WebGL no mesmo canvas. O A-Frame cria o primeiro contexto, e quando o Three.js tenta criar outro, o navegador lança o erro.

Nossa interceptação tenta prevenir isso verificando se já existe um contexto antes de criar um novo, mas o erro ainda pode aparecer se:
- O Three.js verificar a existência do contexto de forma diferente
- O erro for gerado antes da nossa interceptação ser aplicada
- O Three.js usar uma forma diferente de obter o contexto

O debug nos ajudará a entender exatamente quando e onde o erro está sendo gerado, permitindo uma solução mais precisa.

