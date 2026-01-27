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

  const baseImg = `${import.meta.env.BASE_URL || ''}images/equipe`

  const teamMembers = [
    {
      id: 1,
      name: "Keise Barbosa",
      role: "Escritora e Cogestão do Projeto",
      instagram: "@keise.b.silva",
      instagramUrl: "https://www.instagram.com/keise.b.silva",
      image: `${baseImg}/keise.jpg`,
      bio: "Mulher Negra, periférica, professora, escritora, Mestra em Educação, Culturas e Identidades (UFRPE/Fundaj), e Co gestora do projeto Ayàmi Ò Já Literatura Afro Referenciada para Crianças."
    },
    {
      id: 2,
      name: "Jamila de Oliveira Marques",
      role: "Escritora e Cogestão do Projeto",
      instagram: "@jamilaomarques",
      instagramUrl: "https://www.instagram.com/jamilaomarques",
      image: `${baseImg}/jamila.jpg`,
      bio: "Traço minhas experiências como artista da dança, escritora, pesquisadora, brincante, curadora, produtora e gestora cultural, entre outras movimentações. Bacharel em Ciências Sociais (UFRPE) e mestra em Educação (PPGECI UFRPE | Fundaj). Co Gestora do Ayà mi o Já, literatura afro referenciada para crianças. A partir dos saberes e práticas populares, da criatividade e da coletividade, gosto de inventar mundos possíveis."
    },
    {
      id: 3,
      name: "Letícia Carvalho Ferreira",
      role: "Capa, Ilustração e Animação",
      instagram: "@leticafe",
      instagramUrl: "https://www.instagram.com/leticafe",
      image: `${baseImg}/leticia.jpg`,
      bio: "Letícia Carvalho é ilustradora, designer e produtora cultural, formada em Artes Visuais (Licenciatura) pela UFPE. Criada na periferia de Jaboatão dos Guararapes (PE), constrói imagens que celebram a negritude, a infância e as narrativas afetivas. Com seus desenhos cria universos que transformam as perspectivas sobre as belezas do mundo."
    },
    {
      id: 4,
      name: "Mariana Andrade Gomes",
      role: "Revisão textual",
      instagram: "@mariana_contra_um",
      instagramUrl: "https://www.instagram.com/mariana_contra_um",
      image: `${baseImg}/mariana.jpg`,
      bio: "Mariana Andrade é uma mulher negra, cis, candombleicista, filha de José Carlos e de Maria do Carmo, dra. em Literatura e Cultura (UFBA), mestra em Comunicação Social (UFPE) e graduada em Letras (licenciatura (UNICAP) e bacharelado (UFPE)). É professora, revisora e, atualmente, atua como bolsista de Difusão do Conhecimento 1A do CNPq no LabEshu-UFPE."
    },
    {
      id: 5,
      name: "Diego Mancha Negra",
      role: "Diagramação, Animação e Direção artística",
      instagram: "@diegomanchanegra",
      instagramUrl: "https://www.instagram.com/diegomanchanegra",
      image: `${baseImg}/diego.jpg`,
      bio: "Formado em Publicidade e propaganda (2011) e técnico em Design gráfico (2006), Diego Mancha Negra trabalhou alguns anos na área de comunicação em agências de publicidade do Recife como Diretor de Arte. Pesquisa cultura, história e arte africana e isso se tornou o diferencial do seu trabalho autoral. Ilustrador autodidata, se dedica profundamente a essa área e há cerca de 10 anos procura continuamente plataformas para sua arte."
    },
    {
      id: 6,
      name: "CENTRAE",
      role: "Acessibilidade",
      instagram: "@centraeac",
      instagramUrl: "https://www.instagram.com/centraeac",
      image: `${baseImg}/centrae.jpg`,
      bio: "A CENTRAE Acessibilidade desenvolve serviços de acessibilidade comunicacional (audiodescrição, tradução em libras, locação de equipamentos de tradução e impressão em braille) e oferece coordenação em eventos, cursos de acessibilidade e inclusão cultural, Libras - educacional, empresarial e publicitária. Também é produtora Cultural de projetos para e com pessoas com deficiência. Vem empoderando outras mulheres negras e periféricas, LGBT e com deficiência a atuarem no mercado da acessibilidade."
    },
    {
      id: 7,
      name: "Sérgio Monteiro (Lelo)",
      role: "Desenvolvedor e Consultor em Realidade Aumentada (RA)",
      instagram: null,
      instagramUrl: null,
      image: `${baseImg}/sergio.jpg`,
      bio: "Profissional de Arte Tecnologia, periférico, pesquisador e desenvolvedor de soluções digitais com foco em web, mobile, realidade aumentada, jogos e IA. Atua como consultor e articulador em projetos periféricos na construção de novas relações com o digital."
    },
    {
      id: 8,
      name: "Iyá Marisqueira, Magu, Ronaldo, Omi e toda comunidade",
      role: "Quilombo de Cuieiras",
      instagram: null,
      instagramUrl: null,
      image: `${baseImg}/quilombo-cuieiras.jpg`,
      bio: "Comunidade do Quilombo de Cuieiras, guardiã de saberes ancestrais e memórias que atravessam o projeto Ayà mi o Já."
    },
    {
      id: 8,
      name: "Edún Àrá Sangô",
      role: "Canção Orìn Ibejì",
      instagram: "@edunarasango",
      instagramUrl: "https://www.instagram.com/edunarasango",
      image: `${baseImg}/edunara.jpg`,
      bio: "Edún Àrá Sangô é um grupo musical pernambucano que transforma as tradições dos terreiros em potência sonora. Idealizado por Leonardo Salomão (in memoriam), celebra a ancestralidade e os orixás através de composições autorais e cantos em iorubá. A formação reúne os artistas: Negra Dany, Ninha Meneses, Thúlio Xambá, Madson Japa e Beto Xambá – criando um repertório que é, ao mesmo tempo, expressão de fé, identidade e resistência."
    },
    {
      id: 9,
      name: "Joaninha Dias",
      role: "Leitura e Contação de História",
      instagram: "@joaninhadias",
      instagramUrl: "https://www.instagram.com/joaninhadiass",
      image: `${baseImg}/joaninha.jpg`,
      bio: "Joaninha Dias: Negra mulher, 42 anos, Candomblecista e Juremeira, poeta, professora, escritora, faladeira de histórias ancestrais e batuqueira."
    },
    {
      id: 10,
      name: "Túlio Filipe Seabra da Silva",
      role: "Fotografia e vídeo maker",
      instagram: "@tulioseabra",
      instagramUrl: "https://www.instagram.com/tuliooseabra",
      image: `${baseImg}/tulio.jpg`,
      bio: "Homem negro, periférico, comunicador e educador social, artista visual, morador do bairro do Ibura/Cohab, formado em licenciatura em Expressão Gráfica pela Universidade Federal de Pernambuco. Coordenador de comunicação da Organização Comunitária Ibura Mais Cultura, microempreendedor da Negritando Prod., micro produtora audiovisual, fotográfica e design de comunicação antirracista."
    },
    {
      id: 11,
      name: "Ubirajara Machado da Silva Filho (Ubira Machado)",
      role: "Fotografia e vídeo maker",
      instagram: "@ubirafotografia",
      instagramUrl: "https://www.instagram.com/ubirafotografia",
      image: `${baseImg}/ubira.jpg`,
      bio: "Fotógrafo, artista visual, afro periférico, baseado na vibrante comunidade de Brasília Teimosa, formado em Artes Visuais no Instituto Federal de Pernambuco/Campus Olinda, tem sua jornada marcada por resistências e reinvenções através da arte."
    },
    {
      id: 12,
      name: "Rebecka Santos",
      role: "Social media",
      instagram: "@rebsantoss",
      instagramUrl: "https://www.instagram.com/rebsantoss",
      image: `${baseImg}/rebeca.jpg`,
      bio: "Jornalista (UNICAP), pós graduanda em Comunicação Estratégica e Gestão de Marcas (UFBA), Técnica em Comunicação Visual (ETEPAM), e defensora do direito humano à comunicação. Atua, sobretudo, com gestão de comunicação, Educomunicação e mídia Advocacy em organizações sociais de Pernambuco desde 2018."
    },
    {
      id: 13,
      name: "Daniel da Silva Araújo Lima",
      role: "Assessoria de Imprensa",
      instagram: "@daniel_sal94",
      instagramUrl: "https://www.instagram.com/daniel_sal94",
      image: `${baseImg}/daniel.jpg`,
      bio: "Jornalista, nasceu em Caruaru, tem formação no Recife e continua realizando comunicação social em produções artístico-culturais. A partir das palavras, imagens e escutas, ele compartilha vivências jornalísticas com o propósito de comunicar coletivamente."
    },
    {
      id: 14,
      name: "Maria Gesis Morais dos Santos (Maria Gesis)",
      role: "Produção",
      instagram: "@sgesis",
      instagramUrl: "https://www.instagram.com/sgesis",
      image: `${baseImg}/geises.jpg`,
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
              {member.instagramUrl ? (
                <a
                  href={member.instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    fontSize: '1rem',
                    color: '#e26a02',
                    fontFamily: 'RooneySans, Arial, sans-serif',
                    textDecoration: 'none'
                  }}
                >
                  {member.instagram}
                </a>
              ) : (
                member.instagram && (
                  <p style={{
                    fontSize: '1rem',
                    color: '#666',
                    fontFamily: 'RooneySans, Arial, sans-serif'
                  }}>
                    {member.instagram}
                  </p>
                )
              )}
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
            {selectedMember.instagramUrl ? (
              <a
                href={selectedMember.instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  fontSize: '1rem',
                  color: '#e26a02',
                  fontFamily: 'RooneySans, Arial, sans-serif',
                  textDecoration: 'none'
                }}
              >
                {selectedMember.instagram}
              </a>
            ) : (
              selectedMember.instagram && (
                <p style={{
                  fontSize: '1rem',
                  color: '#666',
                  fontFamily: 'RooneySans, Arial, sans-serif'
                }}>
                  {selectedMember.instagram}
                </p>
              )
            )}
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
