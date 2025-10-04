// Função para detectar quando a página é carregada novamente
function handlePageLoad() {
    // Pequeno delay para garantir que o DOM está pronto
    setTimeout(() => {
        const mainVideo = document.getElementById('main-video');
        if (mainVideo && mainVideo.readyState >= 3) {
            console.log('Página recarregada, reiniciando vídeo...');
            // Forçar recarregamento do vídeo
            mainVideo.load();
        }
    }, 100);
}

// Detectar quando a página é carregada (incluindo quando volta de outra página)
window.addEventListener('pageshow', handlePageLoad);
window.addEventListener('focus', handlePageLoad);

document.addEventListener('DOMContentLoaded', function() {
    // Toggle de Libras
    const librasToggle = document.getElementById('libras-toggle');
    const interpreterContainer = document.getElementById('interpreter-video');
    
    // Verificar se os elementos existem antes de adicionar event listeners
    if (librasToggle && interpreterContainer) {
        librasToggle.addEventListener('change', function() {
        if (this.checked) {
            // Mostrar intérprete
            interpreterContainer.style.display = 'block';
            setTimeout(() => {
                interpreterContainer.style.opacity = '1';
                interpreterContainer.style.transform = 'translateY(0)';
            }, 10);
            
            // Iniciar vídeo de libras automaticamente se o vídeo principal estiver tocando
            if (mainVideo && !mainVideo.paused) {
                interpreterVideo.currentTime = mainVideo.currentTime;
                interpreterVideo.play().catch(e => console.log('Erro ao reproduzir vídeo de libras:', e));
            }
        } else {
            // Esconder intérprete
            interpreterContainer.style.opacity = '0';
            interpreterContainer.style.transform = 'translateY(20px)';
            setTimeout(() => {
                interpreterContainer.style.display = 'none';
            }, 300);
        }
        });
    }
    
    // Toggle de Áudio (audiodescrição)
    const audioToggle = document.getElementById('audio-toggle');
    let audioDescription = null;
    
    if (audioToggle) {
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
    }
    
    // Configurar vídeo principal
    const mainVideo = document.getElementById('main-video');
    const interpreterVideo = document.getElementById('interpreter');
    const replayButton = document.getElementById('replay-button');
    const videoLoading = document.getElementById('video-loading');
    const progressFill = document.getElementById('progress-fill');
    const loadingPercentage = document.getElementById('loading-percentage');
    const interpreterPausedMessage = document.getElementById('interpreter-paused-message');
    
    let hasPlayedOnce = false;
    let isVideoLoaded = false;
    
    if (mainVideo) {
        mainVideo.volume = 0; // Começar mudo
        mainVideo.muted = true; // Garantir que está mudo inicialmente
        mainVideo.loop = false; // Desabilitar loop para controlar manualmente
        
        // Função para atualizar progresso
        function updateProgress(percent) {
            if (progressFill && loadingPercentage) {
                progressFill.style.width = percent + '%';
                loadingPercentage.textContent = Math.round(percent) + '%';
            }
        }
        
        // Função para reiniciar o carregamento do vídeo
        function resetVideoLoading() {
            // Resetar estados
            isVideoLoaded = false;
            hasPlayedOnce = false;
            
            // Mostrar loading
            if (videoLoading) {
                videoLoading.style.display = 'flex';
            }
            mainVideo.style.display = 'none';
            if (replayButton) {
                replayButton.style.display = 'none';
            }
            
            // Resetar progresso
            updateProgress(0);
            
            // Forçar recarregamento do vídeo
            mainVideo.load();
        }
        
        // Eventos de carregamento do vídeo
        mainVideo.addEventListener('loadstart', () => {
            updateProgress(0);
        });
        
        mainVideo.addEventListener('progress', () => {
            if (mainVideo.buffered.length > 0) {
                const bufferedEnd = mainVideo.buffered.end(mainVideo.buffered.length - 1);
                const duration = mainVideo.duration;
                if (duration > 0) {
                    const percent = (bufferedEnd / duration) * 100;
                    updateProgress(percent);
                }
            }
        });
        
        mainVideo.addEventListener('loadeddata', () => {
            isVideoLoaded = true;
            updateProgress(50);
            console.log('Vídeo carregado com sucesso');
        });
        
        mainVideo.addEventListener('canplay', () => {
            updateProgress(75);
            console.log('Vídeo pode começar a reproduzir');
        });
        
        mainVideo.addEventListener('canplaythrough', () => {
            updateProgress(100);
            console.log('Vídeo pronto para reprodução');
            
            // Pequeno delay para mostrar 100%
            setTimeout(() => {
                // Esconder loading e mostrar vídeo
                if (videoLoading) {
                    videoLoading.style.display = 'none';
                }
                mainVideo.style.display = 'block';
                
                // Agora ativar o áudio
                mainVideo.muted = false;
                mainVideo.volume = 0.7;
            }, 500);
        });
        
        // Quando o vídeo terminar, mostrar botão de replay
        mainVideo.addEventListener('ended', () => {
            hasPlayedOnce = true;
            mainVideo.style.display = 'none';
            if (replayButton) {
                replayButton.style.display = 'flex';
                replayButton.style.pointerEvents = 'auto';
                replayButton.style.zIndex = '10';
            }
        });
        
        // Verificar se o vídeo já está carregado (quando volta de outra página)
        if (mainVideo.readyState >= 3) { // HAVE_FUTURE_DATA ou superior
            console.log('Vídeo já carregado, reiniciando processo...');
            resetVideoLoading();
        } else {
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
    }
    
    // Configurar vídeo do intérprete
    if (interpreterVideo && mainVideo) {
        interpreterVideo.volume = 0; // Sem áudio no vídeo de libras
        interpreterVideo.muted = true; // Garantir que está mudo
        interpreterVideo.loop = false; // Desabilitar loop para sincronizar
        
        // Sincronizar com o vídeo principal
        if (mainVideo) {
        // Quando o vídeo principal tocar, o de libras também toca (em background)
        mainVideo.addEventListener('play', () => {
            interpreterVideo.currentTime = mainVideo.currentTime;
            // Só reproduzir vídeo de libras se o toggle estiver ativo
            if (librasToggle && librasToggle.checked) {
                interpreterVideo.play().catch(e => console.log('Erro ao reproduzir vídeo de libras:', e));
            }
            // Esconder mensagem no vídeo de libras
            if (interpreterPausedMessage) {
                interpreterPausedMessage.style.display = 'none';
            }
        });
            
            // Quando o vídeo principal pausar, o de libras também pausa
            mainVideo.addEventListener('pause', () => {
                interpreterVideo.pause();
                // Mostrar mensagem no vídeo de libras
                if (interpreterPausedMessage) {
                    interpreterPausedMessage.style.display = 'flex';
                }
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
                // Mostrar mensagem no vídeo de libras
                if (interpreterPausedMessage) {
                    interpreterPausedMessage.style.display = 'flex';
                }
            });
        }
    }
    
    // Botão Assistir Novamente
    if (replayButton) {
        const handleReplay = () => {
            // Mostrar loading novamente e resetar progresso
            if (videoLoading) {
                videoLoading.style.display = 'flex';
            }
            if (progressFill && loadingPercentage) {
                progressFill.style.width = '0%';
                loadingPercentage.textContent = '0%';
            }
            replayButton.style.display = 'none';
            mainVideo.style.display = 'none';
            
            // Reiniciar vídeos
            mainVideo.currentTime = 0;
            if (interpreterVideo) {
                interpreterVideo.currentTime = 0;
            }
            
            // Aguardar um pouco e então mostrar vídeo
            setTimeout(() => {
                if (videoLoading) {
                    videoLoading.style.display = 'none';
                }
                mainVideo.style.display = 'block';
                
                // Esconder mensagem no vídeo de libras
                if (interpreterPausedMessage) {
                    interpreterPausedMessage.style.display = 'none';
                }
                
                // Ativar áudio e reproduzir vídeos
                mainVideo.muted = false;
                mainVideo.volume = 0.7;
                mainVideo.play().catch(e => console.log('Erro ao reproduzir vídeo principal:', e));
                // Só reproduzir vídeo de libras se o toggle estiver ativo
                if (librasToggle && librasToggle.checked && interpreterVideo) {
                    interpreterVideo.play().catch(e => console.log('Erro ao reproduzir vídeo de libras:', e));
                }
            }, 500);
        };
        
        // Adicionar eventos para desktop e mobile
        replayButton.addEventListener('click', handleReplay);
        replayButton.addEventListener('touchstart', (e) => {
            e.preventDefault();
            handleReplay();
        }, { passive: false });
    }
    
    // Botões de ação (apenas na página principal)
    const btnEscanear = document.querySelector('.btn-primary');
    const btnAcessar = document.querySelector('.btn-secondary');
    
    if (btnEscanear) {
        btnEscanear.addEventListener('click', function() {
            // Redirecionar para o scanner AR
            window.location.href = 'scan-ra/index.html';
        });
    }
    
    if (btnAcessar) {
        btnAcessar.addEventListener('click', function() {
            alert('Funcionalidade "Acesse a história" será implementada');
        });
    }
    
    // Modal da Equipe (apenas na página equipe.html)
    const teamMembers = document.querySelectorAll('.team-member');
    const modal = document.getElementById('member-modal');
    const modalClose = document.querySelector('.modal-close');
    const modalOverlay = document.querySelector('.modal-overlay');
    
    // Dados dos membros da equipe
    const memberData = {
        maria: {
            name: 'Maria Silva',
            role: 'Diretora Criativa',
            instagram: '@maria_silva',
            bio: 'Maria é uma visionária criativa com mais de 10 anos de experiência em storytelling e design. Ela lidera nossa equipe na criação de narrativas envolventes que conectam crianças à diversidade cultural brasileira. Sua paixão pela educação inclusiva e tecnologia a impulsiona a desenvolver soluções inovadoras que fazem a diferença na vida de milhares de famílias.'
        },
        mae: {
            name: 'Mãe de ayo',
            role: 'Desenvolvedora AR',
            instagram: '@mae_tech',
            bio: 'Especialista em Realidade Aumentada, nossa desenvolvedora AR transforma histórias em experiências interativas mágicas. Com formação em Engenharia de Software e especialização em tecnologias emergentes, ela cria os elementos AR que fazem os personagens ganharem vida nas páginas dos livros. Sua dedicação à acessibilidade digital garante que todas as crianças possam desfrutar das experiências AR.'
        },
        avo: {
            name: 'Avó de ayo',
            role: 'Designer UX/UI',
            instagram: '@avo_design',
            bio: 'Com uma sensibilidade única para o design centrado no usuário, nossa designer UX/UI cria interfaces intuitivas e acessíveis. Ela combina sua experiência em design gráfico com conhecimento profundo em acessibilidade, garantindo que cada elemento visual seja pensado para incluir todas as crianças, independentemente de suas necessidades especiais. Sua criatividade transforma conceitos complexos em experiências simples e encantadoras.'
        },
        ayo: {
            name: 'Ayo',
            role: 'Especialista em Lembrar Memórias',
            instagram: '@ayo_memorias',
            bio: 'Ayo é o coração e a alma do nosso projeto. Como protagonista da história, ele representa a criança que todos nós fomos um dia - curiosa, corajosa e cheia de sonhos. Sua jornada de descoberta da própria identidade e herança cultural inspira crianças de todo o Brasil a abraçarem suas origens com orgulho. Através de suas aventuras, Ayo ensina que não há medo que não possa ser superado com amor, família e tradição.'
        }
    };
    
    // Função para abrir modal
    function openModal(memberId) {
        const member = memberData[memberId];
        if (!member) return;
        
        document.getElementById('modal-photo').src = 'simbolo-RA.png';
        document.getElementById('modal-name').textContent = member.name;
        document.getElementById('modal-role').textContent = member.role;
        document.getElementById('modal-instagram').textContent = member.instagram;
        document.getElementById('modal-bio').textContent = member.bio;
        
        modal.classList.add('active');
        document.body.classList.add('modal-open');
    }
    
    // Função para fechar modal
    function closeModal() {
        modal.classList.remove('active');
        document.body.classList.remove('modal-open');
    }
    
    // Event listeners (apenas se os elementos existirem)
    if (teamMembers.length > 0 && modal && modalClose && modalOverlay) {
        teamMembers.forEach(member => {
            member.addEventListener('click', () => {
                const memberId = member.getAttribute('data-member');
                openModal(memberId);
            });
        });
        
        modalClose.addEventListener('click', closeModal);
        modalOverlay.addEventListener('click', closeModal);
        
        // Fechar modal com ESC
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && modal.classList.contains('active')) {
                closeModal();
            }
        });
    }
});

