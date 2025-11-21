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
      name: "Nome do Membro 1",
      role: "Função",
      instagram: "@instagram1",
      image: "/team-member-1.jpg",
      bio: "Minibio do membro da equipe..."
    },
    {
      id: 2,
      name: "Nome do Membro 2", 
      role: "Função",
      instagram: "@instagram2",
      image: "/team-member-2.jpg",
      bio: "Minibio do membro da equipe..."
    },
    {
      id: 3,
      name: "Nome do Membro 3",
      role: "Função", 
      instagram: "@instagram3",
      image: "/team-member-3.jpg",
      bio: "Minibio do membro da equipe..."
    },
    {
      id: 4,
      name: "Nome do Membro 1",
      role: "Função",
      instagram: "@instagram1",
      image: "/team-member-1.jpg",
      bio: "Minibio do membro da equipe..."
    },
    {
      id: 5,
      name: "Nome do Membro 2", 
      role: "Função",
      instagram: "@instagram2",
      image: "/team-member-2.jpg",
      bio: "Minibio do membro da equipe..."
    },
    {
      id: 6,
      name: "Nome do Membro 3",
      role: "Função", 
      instagram: "@instagram3",
      image: "/team-member-3.jpg",
      bio: "Minibio do membro da equipe..."
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
