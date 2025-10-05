import React, { useState } from 'react'
import Navigation from '../components/Navigation'

const TeamPage = () => {
  const [selectedMember, setSelectedMember] = useState(null)

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
    }
  ]

  const handleMemberClick = (member) => {
    setSelectedMember(member)
  }

  const closeModal = () => {
    setSelectedMember(null)
  }

  return (
    <div>
      <Navigation />
      
      <main className="page-content">
        <h1>Equipe</h1>
        
        <div className="team-grid">
          {teamMembers.map((member) => (
            <div 
              key={member.id}
              className="team-member"
              onClick={() => handleMemberClick(member)}
            >
              <img src={member.image} alt={member.name} />
              <h3>{member.name}</h3>
              <p>{member.role}</p>
              <p>{member.instagram}</p>
            </div>
          ))}
        </div>
      </main>

      {/* Modal */}
      {selectedMember && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={closeModal}>×</button>
            <img src={selectedMember.image} alt={selectedMember.name} />
            <h2>{selectedMember.name}</h2>
            <h3>{selectedMember.role}</h3>
            <p>{selectedMember.bio}</p>
            <p>{selectedMember.instagram}</p>
          </div>
        </div>
      )}
      
      <footer>Copyright © 2025 Aya mi o ja - Eu não tenho medo. Todos os direitos reservados</footer>
    </div>
  )
}

export default TeamPage
