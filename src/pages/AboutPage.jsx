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
        
        
        {/* Descrição do projeto */}
        <div style={{
          fontSize: '1.1rem',
          lineHeight: '1.8',
          color: '#333',
          textAlign: 'justify',
          maxWidth: '900px',
          marginBottom: '40px'
        }}>
          <p>
            Em yorubá, &ldquo;Ayà mi o já&rdquo; significa &ldquo;Eu não tenho medo&rdquo;. Essa é a
            poderosa mensagem que guia o Projeto Oralituras Digitais em
            Multimodalidades (RA) da Literatura Ayà mi o já, uma iniciativa que
            nasce do desejo de potencializar as infâncias negras através de narrativas
            que celebram suas próprias histórias e ancestralidades. Inspirado na
            jornada de Ayo, uma menina negra da periferia do Recife que viaja na
            &ldquo;curva do tempo dos caracóis&rdquo; para se reencontrar com suas raízes
            quilombolas, o projeto é um convite para que cada criança possa, assim
            como ela, reconhecer suas potências e trilhar um caminho de
            autoidentificação.
          </p>
          <p>
            Em um mundo onde as telas digitais são onipresentes, o projeto inova ao
            unir a tradição da oralitura com a tecnologia da Realidade Aumentada
            (RA). Mais do que uma simples ferramenta, a RA surge como uma
            extensão da própria realidade e imaginação, uma forma de potencializar a
            experiência do livro físico e criar uma relação mais saudável e educativa
            com o digital. Ao apontar um celular ou tablet para as páginas marcadas,
            as(os) leitoras(es) são transportados para um universo de animações, sons
            e interações que aprofundam a narrativa, transformando a leitura em uma
            experiência multimodal e sensorial, onde a oralidade se manifesta como
            imagem, texto, som e movimento.
          </p>
          <p>
            A literatura afrorreferenciada é o pilar central desta iniciativa. O projeto se
            dedica a construir um imaginário centrado em África e na sua diáspora, em
            diálogo com a Lei Nº 10.639/2003. O objetivo é que as crianças negras
            possam se ver como autoras de suas próprias histórias, construindo suas
            subjetividades e autoestima a partir de referências de afeto e comunidade.
            É uma consulta às memórias para significar o presente com movimentos
            que nutrem o Orí.
          </p>
          <p>
            Ayà mi o Já é um projeto coletivo, idealizado pelas educadoras Jamila de
            Oliveira Marques e Keise Barbosa da Silva, que reúne uma equipe de
            artistas, pesquisadores e técnicos. A sua fonte epistemológica vem com os
            saberes ancestrais, como as periferias do Recife, Olinda e Jaboatão dos
            Guararapes, e as memórias que cruzam com o Quilombo de Cuieiras.
            Fundamentalmente, nutre-se dos conhecimentos do candomblé, dos Ibejis
            e da espiritualidade africana e afro-brasileira.
          </p>
          <p>
            Financiado pela Lei Paulo Gustavo através do edital Recife Criativo, da
            Prefeitura da Cidade do Recife, o projeto Ayà mi o Já! Eu não tenho medo
            é uma afirmação da potência das narrativas negras. É um chamado para
            que as futuras gerações cresçam cercadas de histórias que as inspirem a
            sonhar e realizar. Convidamos você a conhecer esta jornada de
            encantamento, memória e imaginação.
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
