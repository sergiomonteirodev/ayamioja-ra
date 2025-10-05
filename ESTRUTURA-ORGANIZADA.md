# 📁 Estrutura Organizada - AYÀ MI O JÁ React

## 🗂️ **Organização Completa dos Assets**

### **📦 Pasta `public/` - Assets Estáticos**

```
public/
├── images/                    # Todas as imagens
│   ├── ad.png                # Ícone Audio Description
│   ├── equipe.png            # Imagem da página equipe
│   ├── libras.png            # Ícone Libras
│   ├── logo_ayamioja.png     # Logo principal
│   ├── simbolo-RA.png        # Símbolo RA
│   ├── sobre_o_projeto.png   # Imagem sobre
│   ├── tarjeta_instrucoes.png # Instruções
│   └── voltar_botao.png      # Botão voltar
├── videos/                   # Todos os vídeos
│   ├── anim_ayo.mp4         # Vídeo principal
│   ├── anim_ayo_origi.mp4   # Backup do vídeo
│   ├── libras_anim_ayo_2.mp4 # Vídeo Libras 2
│   └── libras_anim_ayo.mp4   # Vídeo Libras principal
├── fonts/                    # Fontes customizadas
│   └── rooneysans/          # Família de fontes RooneySans
│       ├── RooneySansRegular.OTF
│       ├── RooneySansItalic.OTF
│       ├── RooneySansLight.OTF
│       ├── RooneySansLightIt.OTF
│       ├── RooneySansMedium.OTF
│       ├── RooneySansMediumIt.otf
│       ├── RooneySansBold.OTF
│       ├── RooneySansBoldIt.OTF
│       └── RooneySansHeavy.OTF
└── ar-assets/               # Assets específicos do AR
    ├── targets/             # Arquivos .mind do MindAR
    │   ├── targets(13).mind
    │   ├── targets-10.mind
    │   └── outros...
    └── assets/              # Vídeos específicos do AR
        ├── ayo_teste.mp4
        ├── anim_2.mp4
        └── outros...
```

### **🧩 Pasta `src/` - Código React**

```
src/
├── components/              # Componentes reutilizáveis
│   ├── Navigation.jsx       # Navegação principal
│   ├── ToggleControls.jsx   # Controles de acessibilidade
│   ├── MainVideo.jsx        # Vídeo principal com estado
│   ├── InterpreterVideo.jsx # Vídeo Libras sincronizado
│   └── ActionButtons.jsx    # Botões de ação
├── pages/                   # Páginas da aplicação
│   ├── HomePage.jsx         # Página principal
│   ├── ScanPage.jsx         # Scanner AR
│   ├── AboutPage.jsx        # Sobre o projeto
│   └── TeamPage.jsx         # Página da equipe
├── styles/                  # Estilos organizados
│   └── main.css            # CSS principal
├── App.jsx                  # Roteamento principal
└── main.jsx                 # Entry point React
```

### **💾 Pasta `backup-original/` - Backup Seguro**

```
backup-original/
├── index.html              # HTML original
├── script.js               # JavaScript original
├── styles.css              # CSS original
├── scan-ra/                # Pasta scanner original
│   ├── index.html
│   ├── assets/
│   └── targets/
└── *.png, *.mp4           # Assets originais
```

---

## 🔗 **Referências Atualizadas**

### **🖼️ Imagens**
```jsx
// ANTES
<img src="/libras.png" alt="Libras" />

// DEPOIS
<img src="/images/libras.png" alt="Libras" />
```

### **🎥 Vídeos**
```jsx
// ANTES
<source src="/anim_ayo.mp4" type="video/mp4" />

// DEPOIS
<source src="/videos/anim_ayo.mp4" type="video/mp4" />
```

### **📁 Assets AR**
```jsx
// ANTES
mindar-image="imageTargetSrc: ./targets/targets(13).mind"

// DEPOIS
mindar-image="imageTargetSrc: ./ar-assets/targets/targets(13).mind"
```

### **🔤 Fontes**
```css
/* ANTES */
src: url('rooneysans/RooneySansRegular.OTF')

/* DEPOIS */
src: url('/fonts/rooneysans/RooneySansRegular.OTF')
```

---

## ✅ **Vantagens da Organização**

### **1. Separação Clara** 🗂️
- **Imagens**: Todas em `/images/`
- **Vídeos**: Todos em `/videos/`
- **Fontes**: Todas em `/fonts/`
- **AR Assets**: Específicos em `/ar-assets/`

### **2. Manutenção Facilitada** 🔧
- Fácil localização de assets
- Referências consistentes
- Estrutura previsível

### **3. Performance Otimizada** ⚡
- Assets organizados por tipo
- Carregamento eficiente
- Cache otimizado

### **4. Backup Seguro** 💾
- Arquivos originais preservados
- Possibilidade de rollback
- Histórico completo

---

## 🚀 **Como Usar**

### **Desenvolvimento**
```bash
npm run dev
```

### **Build para Produção**
```bash
npm run build
```

### **Estrutura Limpa**
- ✅ Raiz organizada
- ✅ Assets categorizados
- ✅ Backup seguro
- ✅ Referências atualizadas

---

**🎉 Projeto React com estrutura completamente organizada e profissional!**
