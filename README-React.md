# AYÀ MI O JÁ - React Version

## 🚀 Conversão para React

Este projeto foi convertido de HTML/CSS/JS vanilla para React, mantendo toda a funcionalidade do MindAR e melhorando significativamente o controle de estado.

## ✨ Principais Melhorias

### 🎯 **Controle de Estado Simplificado**
- **useState** para toggles de Libras e Audio Description
- **useEffect** para sincronização de vídeos
- **useRef** para referências diretas aos elementos de vídeo
- Estado centralizado e previsível

### 🧩 **Componentes Reutilizáveis**
- `ToggleControls`: Gerencia toggles com estado
- `MainVideo`: Controla vídeo principal com eventos
- `InterpreterVideo`: Sincroniza vídeo de Libras
- `ActionButtons`: Botões de ação com navegação
- `Navigation`: Navegação entre páginas

### 📱 **Páginas Organizadas**
- `HomePage`: Página principal com vídeo e toggles
- `ScanPage`: Scanner AR com MindAR integrado
- `AboutPage`: Página sobre o projeto
- `TeamPage`: Página da equipe com modais

## 🛠️ **Instalação e Execução**

```bash
# Instalar dependências
npm install

# Executar em modo desenvolvimento
npm run dev

# Build para produção
npm run build

# Preview do build
npm run preview
```

## 🎮 **Funcionalidades Mantidas**

### ✅ **MindAR Integration**
- Scanner multi-targets funcional
- 3 vídeos AR diferentes
- Detecção e tracking estável
- UI de loading e scanning

### ✅ **Vídeo Synchronization**
- Vídeo principal com autoplay
- Vídeo de Libras sincronizado
- Botão "Assistir Novamente"
- Controles de pause/play

### ✅ **Responsive Design**
- Layout adaptativo para iPhone 13
- Media queries mantidas
- Toggles e botões posicionados corretamente
- Logo abaixo dos toggles

### ✅ **Accessibility Features**
- Toggle de Libras funcional
- Toggle de Audio Description
- Vídeo de intérprete sincronizado
- Navegação por teclado

## 📁 **Estrutura do Projeto**

```
src/
├── components/
│   ├── Navigation.jsx          # Navegação principal
│   ├── ToggleControls.jsx      # Controles de acessibilidade
│   ├── MainVideo.jsx          # Vídeo principal com estado
│   ├── InterpreterVideo.jsx   # Vídeo de Libras sincronizado
│   └── ActionButtons.jsx      # Botões de ação
├── pages/
│   ├── HomePage.jsx           # Página principal
│   ├── ScanPage.jsx           # Scanner AR
│   ├── AboutPage.jsx          # Sobre
│   └── TeamPage.jsx           # Equipe
├── App.jsx                    # Roteamento principal
├── main.jsx                   # Entry point
└── styles.css                 # Estilos (copiado do original)

public/
├── targets/                   # Arquivos .mind do MindAR
├── assets/                    # Vídeos AR
├── *.png                      # Imagens (logo, toggles, etc.)
└── *.mp4                      # Vídeos principais
```

## 🔧 **Principais Componentes**

### **ToggleControls**
```jsx
const [librasActive, setLibrasActive] = useState(false)
const [audioActive, setAudioActive] = useState(false)

// Callbacks para notificar componente pai
useEffect(() => {
  if (onLibrasToggle) {
    onLibrasToggle(librasActive)
  }
}, [librasActive, onLibrasToggle])
```

### **MainVideo**
```jsx
const [isVideoLoaded, setIsVideoLoaded] = useState(false)
const [isVideoPlaying, setIsVideoPlaying] = useState(false)
const [loadingProgress, setLoadingProgress] = useState(0)
const [showReplay, setShowReplay] = useState(false)

// Sincronização com vídeo de Libras
const handleVideoStateChange = (state) => {
  setVideoState(state)
}
```

### **InterpreterVideo**
```jsx
// Só mostra se Libras ativo E vídeo principal tocando
if (librasActive && videoState?.isPlaying && videoState?.currentTime !== undefined) {
  setIsVisible(true)
  video.currentTime = videoState.currentTime
  video.play()
}
```

## 🎯 **Vantagens do React**

### **1. Estado Previsível**
- Toggles controlados por React state
- Sincronização automática entre componentes
- Debugging mais fácil com React DevTools

### **2. Reutilização de Componentes**
- ToggleControls usado em HomePage e ScanPage
- ActionButtons configurável
- Navigation consistente

### **3. Lifecycle Management**
- useEffect para configuração do MindAR
- Cleanup automático de event listeners
- Controle fino de quando componentes montam/desmontam

### **4. Navegação SPA**
- React Router para navegação sem reload
- Estado mantido entre páginas
- URLs limpas e navegáveis

## 🚀 **Como Usar**

1. **Página Principal**: Vídeo autoplay com toggles funcionais
2. **Scanner AR**: Navegue para `/scan` para usar o MindAR
3. **Toggles**: Ative Libras para ver intérprete sincronizado
4. **Botões**: "Escanear livro" leva para o scanner
5. **Navegação**: Links funcionais para todas as páginas

## 🔄 **Migração Completa**

- ✅ HTML → JSX components
- ✅ CSS mantido (100% compatível)
- ✅ JavaScript → React hooks
- ✅ MindAR integrado com useEffect
- ✅ Event listeners → React state
- ✅ Navegação → React Router
- ✅ Assets organizados em /public

## 📱 **Compatibilidade**

- ✅ iPhone 13 (390px)
- ✅ Android Chrome
- ✅ Desktop browsers
- ✅ MindAR Web
- ✅ A-Frame 1.4.0

---

**🎉 Projeto React funcionando com controle de estado simplificado e todas as funcionalidades originais mantidas!**
