import { useState } from 'react'
import Navbar from './components/Navbar'
import Hero from './components/Hero'
import SportsSection from './components/SportsSection'
import RegisterModal from './components/RegisterModal'
import AboutSection from './components/AboutSection'
import Footer from './components/Footer'
import StatusPopup from './components/StatusPopup'

function App() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedSport, setSelectedSport] = useState(null)
  const [statusPopup, setStatusPopup] = useState({ show: false, message: '', type: 'success' })

  const handleSportClick = (sport) => {
    setSelectedSport(sport)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedSport(null)
  }

  const showStatusPopup = (message, type = 'success', duration = 2500) => {
    setStatusPopup({ show: true, message, type })
    setTimeout(() => {
      setStatusPopup({ show: false, message: '', type: 'success' })
    }, duration)
  }

  return (
    <>
      <Navbar />
      <main id="top" className="max-w-[1300px] mx-auto px-4 py-6 pb-10 grid grid-cols-[minmax(0,1.6fr)] gap-10 max-md:grid-cols-1">
        <section>
          <Hero />
          <SportsSection onSportClick={handleSportClick} />
        </section>
      </main>
      <RegisterModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        selectedSport={selectedSport}
        onStatusPopup={showStatusPopup}
      />
      <AboutSection />
      <Footer />
      <StatusPopup popup={statusPopup} />
    </>
  )
}

export default App

