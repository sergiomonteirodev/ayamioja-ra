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
    if (mainVideo) {
        mainVideo.volume = 0.7; // Volume inicial
        
        // Tentar reproduzir o vídeo
        mainVideo.play().catch(function(error) {
            console.log('Autoplay bloqueado, clique para reproduzir:', error);
        });
    }
    
    // Configurar vídeo do intérprete
    const interpreterVideo = document.getElementById('interpreter');
    if (interpreterVideo) {
        interpreterVideo.volume = 0.5;
        
        // Sincronizar com o vídeo principal
        if (mainVideo) {
            mainVideo.addEventListener('play', () => {
                if (librasToggle.checked) {
                    interpreterVideo.play();
                }
            });
            
            mainVideo.addEventListener('pause', () => {
                interpreterVideo.pause();
            });
        }
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

