import { useState, useEffect, useRef } from 'react'
import { fetchWithAuth } from './utils/api'
import Navbar from './components/Navbar'
import Hero from './components/Hero'
import SportsSection from './components/SportsSection'
import RegisterModal from './components/RegisterModal'
import LoginModal from './components/LoginModal'
import AddCaptainModal from './components/AddCaptainModal'
import RemoveCaptainModal from './components/RemoveCaptainModal'
import TeamDetailsModal from './components/TeamDetailsModal'
import ParticipantDetailsModal from './components/ParticipantDetailsModal'
import PlayerListModal from './components/PlayerListModal'
import AboutSection from './components/AboutSection'
import Footer from './components/Footer'
import StatusPopup from './components/StatusPopup'

function App() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false)
  const [isAddCaptainModalOpen, setIsAddCaptainModalOpen] = useState(false)
  const [isRemoveCaptainModalOpen, setIsRemoveCaptainModalOpen] = useState(false)
  const [isTeamDetailsModalOpen, setIsTeamDetailsModalOpen] = useState(false)
  const [isParticipantDetailsModalOpen, setIsParticipantDetailsModalOpen] = useState(false)
  const [isPlayerListModalOpen, setIsPlayerListModalOpen] = useState(false)
  const [selectedSport, setSelectedSport] = useState(null)
  const [statusPopup, setStatusPopup] = useState({ show: false, message: '', type: 'success' })
  const loginSuccessRef = useRef(false) // Track if login was successful to preserve selectedSport
  
  // Load logged-in user and token from localStorage on mount
  const [loggedInUser, setLoggedInUser] = useState(() => {
    const storedUser = localStorage.getItem('loggedInUser')
    return storedUser ? JSON.parse(storedUser) : null
  })
  const [authToken, setAuthToken] = useState(() => {
    return localStorage.getItem('authToken') || null
  })

  // Save logged-in user and token to localStorage whenever they change
  useEffect(() => {
    if (loggedInUser) {
      localStorage.setItem('loggedInUser', JSON.stringify(loggedInUser))
    } else {
      localStorage.removeItem('loggedInUser')
      localStorage.removeItem('authToken')
      setAuthToken(null)
    }
  }, [loggedInUser])

  const handleSportClick = (sport) => {
    // If admin is logged in and it's a team event, open team details modal
    if (loggedInUser?.reg_number === 'admin' && sport.type === 'team') {
      setSelectedSport(sport)
      setIsTeamDetailsModalOpen(true)
      return
    }
    // If admin is logged in and it's not a team event, show participant details
    if (loggedInUser?.reg_number === 'admin' && sport.type === 'individual') {
      setSelectedSport(sport)
      setIsParticipantDetailsModalOpen(true)
      return
    }
    
    // Check if user is a captain for this sport
    const isCaptainForSport = loggedInUser?.captain_in && 
      Array.isArray(loggedInUser.captain_in) && 
      loggedInUser.captain_in.includes(sport.name)
    
    // Check if user is enrolled in this team event (has team_name in participated_in)
    const isEnrolledInTeamEvent = loggedInUser?.participated_in && 
      Array.isArray(loggedInUser.participated_in) &&
      loggedInUser.participated_in.some(p => 
        p.sport === sport.name && p.team_name
      )
    
    // If user is enrolled in this team event (as participant, regardless of captain status for other sports)
    // Show team details first - this handles both captains enrolled as participants and regular participants
    if (sport.type === 'team' && isEnrolledInTeamEvent) {
      setSelectedSport(sport)
      setIsTeamDetailsModalOpen(true)
      return
    }
    
    // If captain clicks on their team event sport (but not enrolled yet)
    if (isCaptainForSport && sport.type === 'team') {
      // Captain hasn't created a team yet - show registration form
      setSelectedSport(sport)
      setIsModalOpen(true)
      return
    }
    
    // If user is not logged in, open login modal and store the selected sport
    if (!loggedInUser) {
      setSelectedSport(sport)
      setIsLoginModalOpen(true)
      return
    }
    
    // For individual/cultural events, check if user has already participated
    // Skip this check for admin users
    const isAdmin = loggedInUser?.reg_number === 'admin'
    if (sport.type === 'individual' && !isAdmin) {
      const hasParticipated = loggedInUser?.participated_in && 
        Array.isArray(loggedInUser.participated_in) &&
        loggedInUser.participated_in.some(p => p.sport === sport.name)
      
      if (hasParticipated) {
        // User has already participated - show message
        showStatusPopup('You have already participated.', 'error', 3000)
        return
      }
    }
    
    // If user is logged in, open registration modal
    setSelectedSport(sport)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedSport(null)
  }

  const handleCloseLoginModal = () => {
    setIsLoginModalOpen(false)
    // Clear selected sport if user closes login modal without logging in
    // (selectedSport will be preserved if login is successful)
    if (!loginSuccessRef.current) {
      setSelectedSport(null)
    }
    loginSuccessRef.current = false // Reset the flag
  }

  const handleLoginSuccess = (player, token) => {
    // Store player data in memory (excluding password)
    setLoggedInUser(player)
    // Store JWT token
    if (token) {
      setAuthToken(token)
      localStorage.setItem('authToken', token)
    }
    // Set flag to indicate login was successful
    loginSuccessRef.current = true
    // If there was a selected sport before login, open registration modal after login
    if (selectedSport) {
      setIsLoginModalOpen(false)
      setTimeout(() => {
        setIsModalOpen(true)
      }, 100)
    }
  }

  const handleUserUpdate = (updatedPlayer) => {
    // Update logged-in user data (e.g., after participation update)
    setLoggedInUser(updatedPlayer)
  }

  const handleLogout = () => {
    // Clear logged-in user data and token from memory and localStorage
    setLoggedInUser(null)
    setAuthToken(null)
    localStorage.removeItem('loggedInUser')
    localStorage.removeItem('authToken')
    showStatusPopup('✅ Logged out successfully!', 'success', 2000)
  }

  const showStatusPopup = (message, type = 'success', duration = 2500) => {
    setStatusPopup({ show: true, message, type })
    setTimeout(() => {
      setStatusPopup({ show: false, message: '', type: 'success' })
    }, duration)
  }

  const handleExportExcel = async () => {
    try {
      const response = await fetchWithAuth('http://localhost:3001/api/export-excel')
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        showStatusPopup(
          `❌ ${errorData.error || 'Failed to export Excel file. Please try again.'}`,
          'error',
          3000
        )
        return
      }

      // Get the blob from response
      const blob = await response.blob()
      
      // Create download link
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      
      // Get filename from Content-Disposition header or use default
      const contentDisposition = response.headers.get('Content-Disposition')
      let filename = 'Players_Report.xlsx'
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/)
        if (filenameMatch) {
          filename = filenameMatch[1]
        }
      }
      
      link.setAttribute('download', filename)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
      
      showStatusPopup('✅ Excel file downloaded successfully!', 'success', 2500)
    } catch (err) {
      console.error('Error exporting Excel:', err)
      showStatusPopup('❌ Error exporting Excel file. Please try again.', 'error', 3000)
    }
  }

  return (
    <>
      <Navbar />
      <main id="top" className="max-w-[1300px] mx-auto px-4 py-6 pb-10 grid grid-cols-[minmax(0,1.6fr)] gap-10 max-md:grid-cols-1">
        <section>
          <Hero 
            onRegisterClick={() => setIsModalOpen(true)} 
            onLoginClick={() => setIsLoginModalOpen(true)}
            onLogout={handleLogout}
            onAddCaptainClick={() => setIsAddCaptainModalOpen(true)}
            onRemoveCaptainClick={() => setIsRemoveCaptainModalOpen(true)}
            onListPlayersClick={() => setIsPlayerListModalOpen(true)}
            onExportExcel={handleExportExcel}
            loggedInUser={loggedInUser}
          />
          <SportsSection onSportClick={handleSportClick} loggedInUser={loggedInUser} />
        </section>
      </main>
      <RegisterModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        selectedSport={selectedSport}
        onStatusPopup={showStatusPopup}
        loggedInUser={loggedInUser}
        onUserUpdate={handleUserUpdate}
      />
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={handleCloseLoginModal}
        onLoginSuccess={handleLoginSuccess}
        onStatusPopup={showStatusPopup}
      />
      <AddCaptainModal
        isOpen={isAddCaptainModalOpen}
        onClose={() => setIsAddCaptainModalOpen(false)}
        onStatusPopup={showStatusPopup}
      />
      <RemoveCaptainModal
        isOpen={isRemoveCaptainModalOpen}
        onClose={() => setIsRemoveCaptainModalOpen(false)}
        onStatusPopup={showStatusPopup}
      />
      <TeamDetailsModal
        isOpen={isTeamDetailsModalOpen}
        onClose={() => {
          setIsTeamDetailsModalOpen(false)
          setSelectedSport(null)
        }}
        sport={selectedSport?.name}
        loggedInUser={loggedInUser}
        onStatusPopup={showStatusPopup}
      />
      <ParticipantDetailsModal
        isOpen={isParticipantDetailsModalOpen}
        onClose={() => {
          setIsParticipantDetailsModalOpen(false)
          setSelectedSport(null)
        }}
        sport={selectedSport?.name}
        loggedInUser={loggedInUser}
        onStatusPopup={showStatusPopup}
      />
      <PlayerListModal
        isOpen={isPlayerListModalOpen}
        onClose={() => setIsPlayerListModalOpen(false)}
        onStatusPopup={showStatusPopup}
      />
      <AboutSection />
      <Footer />
      <StatusPopup popup={statusPopup} />
    </>
  )
}

export default App

