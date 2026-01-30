# Commits em domingos (dezembro até agora) – Android / retângulo preto

## Commit que resolveu: **14 de dezembro de 2025** (`8ee4a6c8`)

**Mensagem:** *Aplicar correções críticas para composição WebGL/video no Android*

> "Essas correções **resolvem** o problema clássico de tela preta no Android/Chrome com MindAR + A-Frame"

### O que foi feito nesse commit

1. **Remover React.StrictMode** – evita montagem dupla do A-Frame (já está assim no `main.jsx`).
2. **CSS limpo**
   - `html, body, #root`: `overflow: visible !important` (não `hidden`) na scan.
   - `body`: remover `overflow-x: hidden` (quebra composição no Android).
   - `body.scan-page-active`, `html.scan-page-active`, `#root`: `transform: none !important`.
3. **Position absolute (não fixed) no Android**
   - `a-scene`: `position: absolute`, `transform: none`.
   - `a-scene canvas`: `position: absolute`, `z-index: 1`, `transform: none`.
   - **Vídeo da câmera** (`#arVideo`, `video[id^="mindar"]`): `position: absolute`, `z-index: 0` (atrás do canvas), `transform: none`.
4. Motivo citado: *"No Android, **fixed** + WebGL + video **quebra a composição**"*.

---

## Outros domingos com mudanças relacionadas

- **28/12/2025** – Vários commits Android 12: WebGL clearColor, delay ao detectar target, canvas/transparência.
- **11/01/2026** – Merge `feature/android-ajustes`: forçar transparência do canvas AR e interceptar WebGLRenderer.
- **18/01/2026** – Interceptar `gl.clear` no Android, remover background preto do canvas, z-index vídeos AR.
- **25/01/2026** – AR planos, MindAR, clear/background transparente, remoção de manipulação canvas/WebGL.

O commit **8ee4a6c8** (14/12) é o que descreve explicitamente que **resolvia** o problema; as regras de composição (overflow visible, transform none, vídeo/canvas com `position: absolute`) foram depois alteradas ou sobrescritas em commits seguintes.

**Nota (jan 2026):** Ao reaplicar no Android o vídeo da câmera com `position: absolute` e canvas `z-index: 1`, o vídeo AR (planos) deixou de ser exibido ao detectar o target (só o áudio tocava). Foi revertido: no Android o vídeo da câmera voltou a `position: fixed` + `transform: translate(-50%, -50%)` para os planos AR ficarem visíveis; mantidos apenas `overflow: visible` e `transform: none` em `body`/`html` na scan.
