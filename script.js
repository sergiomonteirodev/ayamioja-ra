document.addEventListener('DOMContentLoaded', function() {
    // Toggle de Libras
    const librasToggle = document.getElementById('libras-toggle');
    const interpreterContainer = document.getElementById('interpreter-video');
    
    librasToggle.addEventListener('change', function() {
        if (this.checked) {
            // Mostrar intérprete
            interpreterContainer.style.display = 'block';
            setTimeout(() => {
                interpreterContainer.style.opacity = '1';
                interpreterContainer.style.transform = 'translateY(0)';
            }, 10);
        } else {
            // Esconder intérprete
            interpreterContainer.style.opacity = '0';
            interpreterContainer.style.transform = 'translateY(20px)';
            setTimeout(() => {
                interpreterContainer.style.display = 'none';
            }, 300);
        }
    });
    
    // Toggle de Áudio (audiodescrição)
    const audioToggle = document.getElementById('audio-toggle');
    let audioDescription = null;
    
    audioToggle.addEventListener('change', function() {
        if (this.checked) {
            // Ativar audiodescrição
            console.log('Audiodescrição ativada');
            // Aqui você pode adicionar o áudio de audiodescrição
            // audioDescription = new Audio('caminho-para-audiodescricao.mp3');
            // audioDescription.play();
        } else {
            // Desativar audiodescrição
            console.log('Audiodescrição desativada');
            if (audioDescription) {
                audioDescription.pause();
                audioDescription = null;
            }
        }
    });
    
    // Configurar vídeo principal
    const mainVideo = document.getElementById('main-video');
    const interpreterVideo = document.getElementById('interpreter');
    const replayButton = document.getElementById('replay-button');
    const videoLoading = document.getElementById('video-loading');
    
    let hasPlayedOnce = false;
    let isVideoLoaded = false;
    
    if (mainVideo) {
        mainVideo.volume = 0; // Começar mudo
        mainVideo.muted = true; // Garantir que está mudo inicialmente
        mainVideo.loop = false; // Desabilitar loop para controlar manualmente
        
        // Melhorar carregamento do vídeo
        mainVideo.addEventListener('loadeddata', () => {
            isVideoLoaded = true;
            console.log('Vídeo carregado com sucesso');
        });
        
        mainVideo.addEventListener('canplaythrough', () => {
            console.log('Vídeo pronto para reprodução');
            // Esconder loading e mostrar vídeo
            if (videoLoading) {
                videoLoading.style.display = 'none';
            }
            mainVideo.style.display = 'block';
            
            // Agora ativar o áudio e reproduzir
            mainVideo.muted = false;
            mainVideo.volume = 0.7;
            mainVideo.play().catch(function(error) {
                console.log('Erro ao reproduzir vídeo:', error);
            });
        });
        
        // Quando o vídeo terminar, mostrar botão de replay
        mainVideo.addEventListener('ended', () => {
            hasPlayedOnce = true;
            mainVideo.style.display = 'none';
            replayButton.style.display = 'flex';
        });
        
        // Tentar reproduzir o vídeo (ainda mudo)
        mainVideo.play().catch(function(error) {
            console.log('Autoplay bloqueado, clique para reproduzir:', error);
            // Se autoplay falhar, esconder loading e mostrar vídeo
            if (videoLoading) {
                videoLoading.style.display = 'none';
            }
            mainVideo.style.display = 'block';
            // Ativar áudio mesmo se autoplay falhar
            mainVideo.muted = false;
            mainVideo.volume = 0.7;
        });
    }
    
    // Configurar vídeo do intérprete
    if (interpreterVideo) {
        interpreterVideo.volume = 0; // Sem áudio no vídeo de libras
        interpreterVideo.muted = true; // Garantir que está mudo
        interpreterVideo.loop = false; // Desabilitar loop para sincronizar
        
        // Sincronizar com o vídeo principal
        if (mainVideo) {
            // Quando o vídeo principal tocar, o de libras também toca (em background)
            mainVideo.addEventListener('play', () => {
                interpreterVideo.currentTime = mainVideo.currentTime;
                interpreterVideo.play().catch(e => console.log('Erro ao reproduzir vídeo de libras:', e));
            });
            
            // Quando o vídeo principal pausar, o de libras também pausa
            mainVideo.addEventListener('pause', () => {
                interpreterVideo.pause();
            });
            
            // Sincronizar tempo de reprodução
            mainVideo.addEventListener('timeupdate', () => {
                if (!interpreterVideo.paused) {
                    interpreterVideo.currentTime = mainVideo.currentTime;
                }
            });
            
            // Quando o vídeo principal reiniciar, o de libras também reinicia
            mainVideo.addEventListener('seeked', () => {
                if (!interpreterVideo.paused) {
                    interpreterVideo.currentTime = mainVideo.currentTime;
                }
            });
            
            // Quando o vídeo principal terminar, o de libras também termina
            mainVideo.addEventListener('ended', () => {
                interpreterVideo.pause();
                interpreterVideo.currentTime = 0;
            });
        }
    }
    
    // Botão Assistir Novamente
    if (replayButton) {
        replayButton.addEventListener('click', () => {
            // Mostrar loading novamente
            if (videoLoading) {
                videoLoading.style.display = 'flex';
            }
            replayButton.style.display = 'none';
            mainVideo.style.display = 'none';
            
            // Reiniciar vídeos
            mainVideo.currentTime = 0;
            interpreterVideo.currentTime = 0;
            
            // Aguardar um pouco e então mostrar vídeo
            setTimeout(() => {
                if (videoLoading) {
                    videoLoading.style.display = 'none';
                }
                mainVideo.style.display = 'block';
                
                // Ativar áudio e reproduzir vídeos
                mainVideo.muted = false;
                mainVideo.volume = 0.7;
                mainVideo.play().catch(e => console.log('Erro ao reproduzir vídeo principal:', e));
                interpreterVideo.play().catch(e => console.log('Erro ao reproduzir vídeo de libras:', e));
            }, 500);
        });
    }
    
    // Botões de ação
    const btnEscanear = document.querySelector('.btn-primary');
    const btnAcessar = document.querySelector('.btn-secondary');
    
    if (btnEscanear) {
        btnEscanear.addEventListener('click', function() {
            alert('Funcionalidade "Escanear o livro" será implementada');
        });
    }
    
    if (btnAcessar) {
        btnAcessar.addEventListener('click', function() {
            alert('Funcionalidade "Acesse a história" será implementada');
        });
    }
});

