# Correções Android – retângulo preto (uma de cada vez)

**Estado atual:** O código da `ScanPage` e do `main.css` já tem as 6 correções aplicadas.

Para testar **uma correção de cada vez**: reverta os arquivos para o commit anterior (ex.: `git restore src/pages/ScanPage.jsx src/styles/main.css`), aplique **só a Correção 1** abaixo, teste no Android; depois aplique **só a Correção 2**, teste; e assim por diante.

Aplique **uma correção**, teste no Android e depois passe para a próxima.

---

## Correção 1: `position: fixed` → `position: absolute`

**Objetivo:** Evitar novo stacking context que quebra vídeo + WebGL no Chrome Android.

**1.1 – ScanPage.jsx – container `.scan-page`**

Trocar o `style` do `<div className="scan-page">`:

```jsx
// DE:
position: 'fixed',
top: 0,
left: 0,
width: '100vw',
height: '100vh',
pointerEvents: 'none',

// PARA:
position: 'absolute',
inset: 0,
width: '100%',
height: '100%',
// (remover pointerEvents: 'none')
```

**1.2 – ScanPage.jsx – overlays**

- Toggles (div do ToggleControls): `position: 'fixed'` → `position: 'absolute'`
- Botão voltar (`.back-button-overlay`): `position: 'fixed'` → `position: 'absolute'`
- Overlay de permissão (câmera): `position: 'fixed'` + `width: 100vw` `height: 100vh` → `position: 'absolute'` + `top: 0, left: 0, right: 0, bottom: 0` + `width: '100%'` `height: '100%'`
- `.ar-scanning-overlay`: `position: 'fixed'` → `position: 'absolute'`

**1.3 – main.css**

- `.scan-page`: `position: fixed` → `position: absolute`, `inset: 0`, `width: 100%`, `height: 100%`, `overflow: visible`
- `.scan-page .toggle-controls`: `position: fixed` → `position: absolute`
- `.back-button-overlay`: `position: fixed` → `position: absolute`
- `.ui-loading`: `position: fixed` → `position: absolute`
- `.ar-scanning-overlay`: `position: fixed` → `position: absolute`

Testar no Android após aplicar só a Correção 1.

---

## Correção 2: Remover RAF infinito

**Objetivo:** Não mexer no canvas a cada frame; isso quebra a composição no Android.

**ScanPage.jsx – em `handleArReady`:**

Apagar por completo o bloco:

```js
// RAF contínuo: transparência a cada frame (evita preto por cima do vídeo)
let rafContinuousId
const loopContinuous = () => {
  applyTransparent()
  rafContinuousId = requestAnimationFrame(loopContinuous)
}
rafContinuousId = requestAnimationFrame(loopContinuous)
rafIdRef.current = rafContinuousId
```

E no `return` do `useEffect`, remover:

```js
if (rafIdRef.current) {
  cancelAnimationFrame(rafIdRef.current)
  rafIdRef.current = null
}
```

Testar no Android após aplicar só a Correção 2.

---

## Correção 3: Não forçar `setClearColor` / renderer repetidamente

**Objetivo:** Deixar o A-Frame/MindAR controlarem o renderer; não chamar `setClearColor` em intervalos nem em RAF.

**ScanPage.jsx:**

1. Remover a função `forceAndroidCanvasTransparent` (inteira).
2. Em `handleSceneLoaded`, remover o bloco que chama `forceAndroidCanvasTransparent` (vários `setTimeout` e `requestAnimationFrame`).
3. Em `handleArReady`, remover tudo que chama `applyTransparent` ou `forceAndroidCanvasTransparent`:  
   - o `setInterval(applyTransparent, 100)` e o `setTimeout` que o limpa;  
   - o `loopAggressive` e o RAF associado;  
   - o `transparencyIntervalRef.current = setInterval(...)`.
4. No cleanup do `useEffect`, remover o `clearInterval(transparencyIntervalRef.current)`.
5. Remover os refs `rafIdRef` e `transparencyIntervalRef` se não forem mais usados.

Manter no `<a-scene>` apenas: `renderer="... alpha: true; ..."` e `background="transparent: true; ..."`.

Testar no Android após aplicar só a Correção 3.

---

## Correção 4: Remover scanner de “elementos pretos”

**Objetivo:** Não alterar estilos de div/canvas/section dinamicamente; isso atrapalha a composição no Android.

**ScanPage.jsx:**

1. Remover a função `forceFullscreenBlackElementsTransparent` (inteira).
2. Remover todas as chamadas a `forceFullscreenBlackElementsTransparent` (por exemplo dentro do `setInterval` em `handleArReady`).

Testar no Android após aplicar só a Correção 4.

---

## Correção 5: Remover `pointerEvents: 'none'` do root

**Objetivo:** Evitar efeitos na layerização do vídeo nativo + WebGL no Android.

**ScanPage.jsx – container `.scan-page`:**

No `style` do `<div className="scan-page">`, remover a linha:

```js
pointerEvents: 'none',
```

Manter `pointerEvents: 'auto'` apenas nos overlays que precisam de clique (toggles, botão voltar, botão de permissão, etc.).

Testar no Android após aplicar só a Correção 5.

---

## Correção 6: Não reconfigurar AR por state (opcional)

**Objetivo:** A cena AR monta uma vez; estados do React só controlam UI, não o pipeline de render.

- Garantir que o `useEffect` que regista `handleSceneLoaded` e `handleArReady` **não** mexe no canvas/renderer após o init.
- Se esse effect tiver dependências como `[cameraPermissionGranted, isArReady]`, evitar que, ao mudar, ele recrie timers/RAF ou manipule o renderer.  
  O ideal é: listeners na cena uma vez; estados só para UI (ex.: `setIsArReady`, `setActiveTargetIndex`).

Testar no Android após aplicar a Correção 6.

---

## Ordem sugerida

1. Correção 1 (position absolute)  
2. Correção 2 (remover RAF)  
3. Correção 3 (não forçar setClearColor)  
4. Correção 4 (remover scanner de pretos)  
5. Correção 5 (remover pointer-events do root)  
6. Correção 6 (não reconfigurar AR por state)

Depois de cada uma: build, testar no Chrome Android e só então passar para a próxima.
