import React, { useState, useEffect } from 'react'
import Navigation from '../components/Navigation'
import SafeImage from '../components/SafeImage'

const TeamPage = () => {
  const [selectedMember, setSelectedMember] = useState(null)

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

  const teamMembers = [
    {
      id: 1,
      name: "Ubirajara Machado da Silva Filho (Ubira Machado)",
      role: "Fotógrafo e videomaker",
      instagram: "",
      image: "/images/equipe/ubira-machado.jpg",
      bio: "Fotógrafo, artista visual, afro periférico, baseado na vibrante comunidade de Brasília Teimosa, formado em Artes Visuais no Instituto Federal de Pernambuco/ Campus Olinda, tem sua jornada marcada por resistências e reinvenções através da arte."
    },
    {
      id: 2,
      name: "Mariana Andrade Gomes",
      role: "Revisão",
      instagram: "",
      image: "/images/equipe/mariana-andrade.jpg",
      bio: "Mariana Andrade é uma mulher negra, cis, candombleicista, filha de José Carlos e de Maria do Carmo, dra. em Literatura e Cultura (UFBA), mestra em Comunicação Social (UFPE) e graduada em Letras (licenciatura (UNICAP) e bacharelado (UFPE)). É professora, revisora e, atualmente, atua como bolsista de Difusão do Conhecimento 1A do CNPq no LabEshu-UFPE."
    },
    {
      id: 3,
      name: "Jamila de Oliveira Marques",
      role: "Escritora e Cogestão do projeto",
      instagram: "",
      image: "/images/equipe/jamila-marques.jpg",
      bio: "Tranço minhas experiências como artista da dança, escritora, pesquisadora, brincante, curadora, produtora e gestora cultural, entre outras movimentações. Bacharel em Ciências Sociais (UFRPE) e mestra em Educação (PPGECI UFRPE | Fundaj). Cogestora do Ayà mi o Já, literatura afrorreferenciada para crianças. A partir dos saberes e práticas populares, da criatividade e da coletividade, gosto de inventar mundos possíveis."
    },
    {
      id: 4,
      name: "Sérgio Monteiro (Lelo)",
      role: "Consultor, desenvolvedor em realidade aumentada (RA)",
      instagram: "",
      image: "/images/equipe/sergio-monteiro.jpg",
      bio: "Profissional de Arte Tecnologia, periférico, pesquisador e desenvolvedor de soluções digitais com foco em web, mobile, realidade aumentada, jogos e IA. Atua como consultor e articulador em projetos periféricos na construção de novas relações com o digital."
    },
    {
      id: 5,
      name: "Daniel da Silva Araújo Lima",
      role: "Assessoria de imprensa",
      instagram: "",
      image: "/images/equipe/daniel-lima.jpg",
      bio: "Jornalista nasceu em Caruaru, tem formação no Recife e continua realizando comunicação social em produções artístico-culturais. A partir das palavras, imagens e escutas, ele compartilha vivências jornalísticas com o propósito de comunicar coletivamente."
    },
    {
      id: 6,
      name: "Diego Mancha Negra",
      role: "Direção de arte, diagramação e animação",
      instagram: "",
      image: "/images/equipe/diego-mancha.jpg",
      bio: "Formado em Publicidade e propaganda (2011) e técnico em Design gráfico (2006), Diego Mancha Negra trabalhou alguns anos na área de comunicação em agências de publicidade do Recife como Diretor de Arte. Pesquisa cultura, história e arte africana e isso se tornou o diferencial do seu trabalho autoral. Ilustrador autodidata, se dedica profundamente a essa área e há cerca de 10 anos procura continuamente plataformas para sua arte."
    },
    {
      id: 7,
      name: "Túlio Filipe Seabra da Silva",
      role: "Filmmaker e fotógrafo",
      instagram: "",
      image: "/images/equipe/tulio-seabra.jpg",
      bio: "Homem negro, periférico, comunicador e educador social, artísta visual, morador do bairro do Ibura/Cohab, formado em licenciatura em Expressão Gráfica pela Universidade Federal de Pernambuco. Está como coordenador de comunicação da Organização Comunitária Ibura Mais Cultura, é microempreendedor da Negritando Prod. uma micro produtora audiovisual, fotografica e design de comunicação antirracista com experiência em coberturas de eventos e seminários do terceiro setor."
    },
    {
      id: 8,
      name: "Poliana Alves da Conceição",
      role: "Consultora em acessibilidade Comunicacional",
      instagram: "",
      image: "/images/equipe/poliana-alves.jpg",
      bio: "Eu sou Poliana Alves da Conceição, de Recife/PE, mulher negra periférica na cena cultural desde 2006. Iniciei no Movimento Tortura Nunca Mais e participei de projetos financiados pelo Funcultura e outros editais. Em 2008, tornei-me Assessora de Acessibilidade e Produtora Cultural para Pessoas com Deficiência. Idealizei o coletivo Centrae, empoderando mulheres negras, LGBTQ+ e com deficiência na acessibilidade. Desde 2004, sou intérprete de Libras em shows, Janelas em Libras para TVs, debates políticos, documentários e séries. Participei dos carnavais de 2019 e 2020 como intérprete de Libras. Desde 2009, coordeno projetos de Fotografia Participativa com Surdos - FOTOLIBRAS e Animalibras. Atuei como assessora parlamentar na câmara do Recife e na Alepe. Minha jornada é dedicada à promoção da acessibilidade e inclusão, contribuindo para o cenário cultural e político."
    },
    {
      id: 9,
      name: "Edún Àrá Sangô",
      role: "Arranjo e gravação do single \"Orin Ibeji\"",
      instagram: "",
      image: "/images/equipe/edun-ara-sango.jpg",
      bio: "Edún Àrá Sangô é um grupo musical pernambucano que transforma as tradições dos terreiros em potência sonora. Idealizado por Leonardo Salomão (in memoriam), celebra a ancestralidade e os orixás através de composições autorais e cantos em iorubá. A formação reúne os artistas: Negra Dany, Ninha Meneses, Thúlio Xambá, Madson Japa e Beto Xambá – criando um repertório que é, ao mesmo tempo, expressão de fé, identidade e resistência."
    },
    {
      id: 10,
      name: "Maria Gesis Morais dos Santos (Maria Gesis)",
      role: "Produtora",
      instagram: "",
      image: "/images/equipe/maria-gesis.jpg",
      bio: "Maria Gesis, produtora cultural, artesã, educadora, oficineira de crochê e estudante de Agroecologia pela UFRPE."
    }
  ]

  const handleMemberClick = (member) => {
    setSelectedMember(member)
  }

  const closeModal = () => {
    setSelectedMember(null)
  }

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
        {/* Título */}
        <h1 style={{
          fontSize: '2.5rem',
          fontWeight: 'bold',
          color: '#e26a02',
          marginBottom: '50px',
          textAlign: 'center'
        }}>
          Equipe
        </h1>
        
        <div className="team-grid" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '40px',
          width: '100%',
          maxWidth: '1000px',
          margin: '0 auto'
        }}>
          {teamMembers.map((member) => (
            <div 
              key={member.id}
              className="team-member"
              onClick={() => handleMemberClick(member)}
              style={{
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                background: 'white',
                padding: '30px 20px',
                borderRadius: '15px',
                boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)',
                transition: 'transform 0.3s ease, box-shadow 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-5px)'
                e.currentTarget.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.15)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.1)'
              }}
            >
              <SafeImage 
                src={member.image} 
                alt={member.name}
                style={{
                  width: '150px',
                  height: '150px',
                  borderRadius: '50%',
                  objectFit: 'cover',
                  border: '4px solid #e26a02',
                  marginBottom: '20px'
                }}
              />
              <h3 style={{
                fontSize: '1.5rem',
                fontWeight: 'bold',
                color: '#5b2c09',
                marginBottom: '10px',
                fontFamily: 'RooneySans, Arial, sans-serif'
              }}>
                {member.name}
              </h3>
              <p style={{
                fontSize: '1.1rem',
                fontWeight: '600',
                color: '#e26a02',
                marginBottom: '8px',
                fontFamily: 'RooneySans, Arial, sans-serif'
              }}>
                {member.role}
              </p>
              <p style={{
                fontSize: '1rem',
                color: '#666',
                fontFamily: 'RooneySans, Arial, sans-serif'
              }}>
                {member.instagram}
              </p>
            </div>
          ))}
        </div>
      </main>

      {/* Modal */}
      {selectedMember && (
        <div 
          className="modal-overlay" 
          onClick={closeModal}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            backdropFilter: 'blur(5px)',
            zIndex: 10000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <div 
            className="modal-content" 
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'relative',
              background: 'white',
              borderRadius: '20px',
              maxWidth: '600px',
              width: '90%',
              maxHeight: '80vh',
              padding: '40px',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
              overflow: 'auto',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center'
            }}
          >
            <button 
              className="modal-close" 
              onClick={closeModal}
              style={{
                position: 'absolute',
                top: '15px',
                right: '20px',
                background: 'none',
                border: 'none',
                fontSize: '30px',
                color: '#e26a02',
                cursor: 'pointer',
                zIndex: 10001
              }}
            >
              ×
            </button>
            <SafeImage 
              src={selectedMember.image} 
              alt={selectedMember.name}
              style={{
                width: '150px',
                height: '150px',
                borderRadius: '50%',
                objectFit: 'cover',
                border: '4px solid #e26a02',
                marginBottom: '20px'
              }}
            />
            <h2 style={{
              fontSize: '2rem',
              fontWeight: 'bold',
              color: '#5b2c09',
              marginBottom: '10px',
              fontFamily: 'RooneySans, Arial, sans-serif'
            }}>
              {selectedMember.name}
            </h2>
            <h3 style={{
              fontSize: '1.3rem',
              fontWeight: '600',
              color: '#e26a02',
              marginBottom: '20px',
              fontFamily: 'RooneySans, Arial, sans-serif'
            }}>
              {selectedMember.role}
            </h3>
            <p style={{
              fontSize: '1.1rem',
              lineHeight: '1.6',
              color: '#333',
              marginBottom: '15px',
              fontFamily: 'RooneySans, Arial, sans-serif'
            }}>
              {selectedMember.bio}
            </p>
            <p style={{
              fontSize: '1rem',
              color: '#666',
              fontFamily: 'RooneySans, Arial, sans-serif'
            }}>
              {selectedMember.instagram}
            </p>
          </div>
        </div>
      )}
      
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

export default TeamPage
