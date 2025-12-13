# Como Capturar Eventos no Chrome via Celular

## Método 1: Chrome Remote Debugging (Recomendado)

### No Celular (Android):

1. **Habilitar Depuração USB:**
   - Vá em **Configurações** > **Sobre o telefone**
   - Toque 7 vezes em **Número da versão** (para habilitar opções de desenvolvedor)
   - Volte para **Configurações** > **Opções do desenvolvedor**
   - Ative **Depuração USB**

2. **Conectar ao Computador:**
   - Conecte o celular ao computador via cabo USB
   - No celular, aparecerá uma mensagem pedindo permissão - aceite

### No Computador:

1. **Abrir Chrome DevTools:**
   - Abra o Chrome no computador
   - Digite na barra de endereços: `chrome://inspect`
   - Ou vá em: **Menu** (3 pontos) > **Mais ferramentas** > **Ferramentas do desenvolvedor remoto**

2. **Conectar ao Dispositivo:**
   - Você verá seu dispositivo listado
   - Clique em **inspect** ao lado do dispositivo
   - Uma nova janela do DevTools abrirá

3. **Ver Logs:**
   - Vá na aba **Console** para ver todos os `console.log()`
   - Vá na aba **Network** para ver requisições
   - Vá na aba **Elements** para inspecionar o DOM

## Método 2: Chrome DevTools via WiFi (Sem Cabo)

### No Celular e Computador (mesma rede WiFi):

1. **No Computador:**
   - Abra o Chrome
   - Vá em `chrome://inspect`
   - Marque **Discover network targets**
   - Anote o endereço IP que aparece (ex: `192.168.1.100:9222`)

2. **No Celular:**
   - Abra o Chrome
   - Vá em `chrome://inspect`
   - Digite o endereço IP do computador
   - Conecte

## Método 3: Eruda (Console Mobile - Mais Fácil)

Adicione o Eruda ao projeto para ter um console diretamente na tela do celular:

```html
<!-- Adicione antes do fechamento do </body> -->
<script src="https://cdn.jsdelivr.net/npm/eruda"></script>
<script>eruda.init();</script>
```

Ou via npm:
```bash
npm install eruda
```

E no código:
```javascript
if (process.env.NODE_ENV === 'development') {
  import('eruda').then(eruda => eruda.default.init())
}
```

## Método 4: Logs via Alert (Temporário para Debug)

Para ver logs rapidamente sem DevTools:

```javascript
// Substitua console.log por:
alert('Mensagem: ' + JSON.stringify(dados))

// Ou crie uma função helper:
window.debugLog = (msg, data) => {
  console.log(msg, data)
  // Descomente para ver no celular:
  // alert(msg + ': ' + JSON.stringify(data))
}
```

## Dicas:

1. **Filtros no Console:**
   - Use `console.error()` para erros (aparecem em vermelho)
   - Use `console.warn()` para avisos (aparecem em amarelo)
   - Use `console.log()` para informações gerais

2. **Preservar Logs:**
   - No DevTools, marque **Preserve log** para não perder logs ao navegar

3. **Screenshot:**
   - No DevTools mobile, use `Ctrl+Shift+P` (ou `Cmd+Shift+P` no Mac)
   - Digite "screenshot" para capturar a tela

4. **Network Throttling:**
   - No DevTools, aba Network
   - Use throttling para simular conexão lenta

## Comandos Úteis no Console:

```javascript
// Ver todos os elementos com background preto
document.querySelectorAll('*').forEach(el => {
  const bg = window.getComputedStyle(el).backgroundColor
  if (bg.includes('rgb(0, 0, 0)') || bg === '#000000') {
    console.log('Elemento preto:', el, bg)
  }
})

// Ver z-index de todos os elementos
document.querySelectorAll('*').forEach(el => {
  const z = window.getComputedStyle(el).zIndex
  if (z !== 'auto' && parseInt(z) > 0) {
    console.log('Z-index:', z, el)
  }
})

// Ver canvas WebGL
const canvas = document.querySelector('a-scene canvas')
if (canvas) {
  const gl = canvas.getContext('webgl') || canvas.getContext('webgl2')
  console.log('Canvas:', canvas)
  console.log('WebGL:', gl)
  console.log('Clear color:', gl.getParameter(gl.COLOR_CLEAR_VALUE))
}
```

