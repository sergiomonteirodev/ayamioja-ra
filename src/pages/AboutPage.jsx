import React, { useEffect } from 'react'
import Navigation from '../components/Navigation'
import SafeImage from '../components/SafeImage'

const AboutPage = () => {
  // Aplicar cor marrom ao menu quando a página for montada
  useEffect(() => {
    const navbar = document.querySelector('.navbar')
    if (navbar) {
      navbar.style.backgroundColor = '#b36f35'
      navbar.style.color = 'white'
      
      // Ajustar cor dos links para branco
      const navLinks = navbar.querySelectorAll('.nav-link')
      navLinks.forEach(link => {
        link.style.color = 'white'
      })
      
      const navSeparators = navbar.querySelectorAll('.nav-separator')
      navSeparators.forEach(separator => {
        separator.style.color = 'white'
      })
      
      // Ajustar ícones sociais para branco no fundo marrom
      const socialIcons = navbar.querySelectorAll('.social-icon')
      socialIcons.forEach(icon => {
        icon.style.backgroundColor = 'white'
        icon.style.color = '#b36f35'
      })
    }

    // Restaurar estilos originais quando a página for desmontada
    return () => {
      const navbar = document.querySelector('.navbar')
      if (navbar) {
        navbar.style.backgroundColor = ''
        navbar.style.color = ''
        
        const navLinks = navbar.querySelectorAll('.nav-link')
        navLinks.forEach(link => {
          link.style.color = ''
        })
        
        const navSeparators = navbar.querySelectorAll('.nav-separator')
        navSeparators.forEach(separator => {
          separator.style.color = ''
        })
        
        const socialIcons = navbar.querySelectorAll('.social-icon')
        socialIcons.forEach(icon => {
          icon.style.backgroundColor = ''
          icon.style.color = ''
        })
      }
    }
  }, [])

  return (
    <div style={{
      backgroundColor: '#ffffff',
      minHeight: '100vh'
    }}>
      <Navigation />
      
      <main className="page-content" style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-start',
        padding: '120px 20px 100px 20px', // padding-top maior para não ficar coberto pelo menu
        maxWidth: '1200px',
        margin: '0 auto',
        backgroundColor: '#ffffff',
        minHeight: 'calc(100vh - 200px)' // Altura mínima considerando footer
      }}>
        
        {/* Imagem acima do título */}
       
        
        {/* Título */}
        <h1 style={{
          fontSize: '2.5rem',
          fontWeight: 'bold',
          color: '#e26a02',
          marginBottom: '30px',
          textAlign: 'center'
        }}>
          Sobre o Projeto
        </h1>
        
        
        {/* Descrição com Lorem Ipsum */}
        <div style={{
          fontSize: '1.1rem',
          lineHeight: '1.8',
          color: '#333',
          textAlign: 'justify',
          maxWidth: '900px',
          marginBottom: '40px'
        }}>
          <p>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. 
            Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. 
            Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.
          </p>
          <p>
            Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum. 
            Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, 
            eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo.
          </p>
          <p>
            Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos 
            qui ratione voluptatem sequi nesciunt. Neque porro quisquam est, qui dolorem ipsum quia dolor sit amet, consectetur, 
            adipisci velit, sed quia non numquam eius modi tempora incidunt ut labore et dolore magnam aliquam quaerat voluptatem.
          </p>
        </div>
      </main>
      
      <footer style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        width: '100%',
        backgroundColor: '#b36f35',
        padding: '15px 0',
        textAlign: 'center',
        color: 'white',
        fontSize: '14px',
        fontWeight: '500',
        boxShadow: '0 -2px 10px rgba(0, 0, 0, 0.1)',
        zIndex: 1000
      }}>
        Copyright © 2025 Aya mi o ja - Eu não tenho medo. Todos os direitos reservados
      </footer>
    </div>
  )
}

export default AboutPage
