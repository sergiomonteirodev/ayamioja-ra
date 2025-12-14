// Script de debug profundo para entender o erro WebGL
// Este script rastreia todas as chamadas a getContext e tenta identificar a causa raiz

(function() {
  if (window._webglDebugActive) return;
  window._webglDebugActive = true;
  
  const debugLog = [];
  const MAX_LOGS = 100;
  
  // Rastrear todas as chamadas a getContext
  if (HTMLCanvasElement && HTMLCanvasElement.prototype.getContext) {
    const originalGetContext = HTMLCanvasElement.prototype.getContext;
    
    HTMLCanvasElement.prototype.getContext = function(contextType, ...args) {
      const stack = new Error().stack;
      const timestamp = Date.now();
      const canvasId = this.id || '(sem id)';
      const canvasClass = this.className || '(sem classe)';
      
      // Capturar informações do canvas
      const canvasInfo = {
        id: canvasId,
        className: canvasClass,
        width: this.width,
        height: this.height,
        parent: this.parentElement?.tagName || 'null',
        hasContext: !!(this._glContext || this._context)
      };
      
      // Capturar stack trace (apenas as primeiras 5 linhas)
      const stackLines = stack ? stack.split('\n').slice(0, 5).join('\n') : 'N/A';
      
      const logEntry = {
        timestamp,
        contextType,
        canvasInfo,
        stack: stackLines,
        args: args.length > 0 ? args : undefined
      };
      
      debugLog.push(logEntry);
      if (debugLog.length > MAX_LOGS) {
        debugLog.shift();
      }
      
      // Se for WebGL e já existe contexto, registrar como problema potencial
      if ((contextType === 'webgl' || contextType === 'webgl2' || contextType === 'experimental-webgl') && 
          (this._glContext || this._context)) {
        console.warn('🔍 DEBUG: Tentativa de criar novo contexto WebGL quando já existe um:', {
          canvas: canvasInfo,
          existingContext: !!(this._glContext || this._context),
          stack: stackLines
        });
      }
      
      try {
        const result = originalGetContext.call(this, contextType, ...args);
        
        // Se resultou em erro ou null, pode ser porque já existe contexto
        if (!result && (contextType === 'webgl' || contextType === 'webgl2' || contextType === 'experimental-webgl')) {
          console.warn('🔍 DEBUG: getContext retornou null - pode ser porque já existe contexto:', {
            canvas: canvasInfo,
            stack: stackLines
          });
        }
        
        return result;
      } catch (e) {
        console.error('🔍 DEBUG: Erro ao chamar getContext:', {
          error: e.message,
          canvas: canvasInfo,
          stack: stackLines
        });
        throw e;
      }
    };
  }
  
  // Rastrear criação de WebGLRenderer do Three.js
  if (window.THREE && window.THREE.WebGLRenderer) {
    const OriginalWebGLRenderer = window.THREE.WebGLRenderer;
    
    window.THREE.WebGLRenderer = function(...args) {
      const stack = new Error().stack;
      const stackLines = stack ? stack.split('\n').slice(0, 10).join('\n') : 'N/A';
      
      console.warn('🔍 DEBUG: Three.js WebGLRenderer sendo criado:', {
        args: args.length,
        stack: stackLines,
        timestamp: Date.now()
      });
      
      try {
        const renderer = new OriginalWebGLRenderer(...args);
        console.log('✅ DEBUG: WebGLRenderer criado com sucesso');
        return renderer;
      } catch (e) {
        console.error('❌ DEBUG: Erro ao criar WebGLRenderer:', {
          error: e.message,
          stack: stackLines
        });
        throw e;
      }
    };
    
    // Copiar propriedades estáticas
    Object.setPrototypeOf(window.THREE.WebGLRenderer, OriginalWebGLRenderer);
    Object.assign(window.THREE.WebGLRenderer, OriginalWebGLRenderer);
  }
  
  // Função para obter logs de debug
  window.getWebGLDebugLogs = function() {
    return {
      logs: debugLog,
      summary: {
        totalCalls: debugLog.length,
        webglCalls: debugLog.filter(l => l.contextType && l.contextType.includes('webgl')).length,
        uniqueCanvases: [...new Set(debugLog.map(l => l.canvasInfo.id || l.canvasInfo.className))].length
      }
    };
  };
  
  // Função para limpar logs
  window.clearWebGLDebugLogs = function() {
    debugLog.length = 0;
  };
  
  console.log('🔍 WebGL Debug ativado - use window.getWebGLDebugLogs() para ver logs');
})();

