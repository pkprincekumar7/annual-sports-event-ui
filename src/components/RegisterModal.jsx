import { useState, useEffect } from 'react'

const SCRIPT_URL =
  'https://script.google.com/macros/s/AKfycbzc16n3UxlBROhxToMYhdS-sC6AnLX9Wk5_8ymnchwbSUUT13oigk89A6EK9J1mY5NJGA/exec'

function PlayerSection({ index, isCollapsed, onToggle }) {
  return (
    <div className={`rounded-xl border border-[rgba(148,163,184,0.6)] bg-[rgba(15,23,42,0.9)] mb-[0.7rem] ${isCollapsed ? '' : ''}`}>
      <button
        type="button"
        className="w-full text-left px-[0.8rem] py-2 bg-[rgba(15,23,42,0.9)] border-none text-[#e5e7eb] text-[0.9rem] font-semibold cursor-pointer relative"
        onClick={onToggle}
      >
        Player {index}
        <span className="float-right text-[0.8rem]">{isCollapsed ? '►' : '▼'}</span>
      </button>
      {!isCollapsed && (
        <div className="px-[0.8rem] py-[0.6rem] pb-[0.8rem] border-t border-[rgba(148,163,184,0.4)]">
          <div className="flex flex-col mb-[0.7rem]">
            <label className="text-[0.78rem] uppercase text-[#cbd5ff] mb-1 tracking-[0.06em]">Full Name *</label>
            <input
              type="text"
              name={`playerName_${index}`}
              required
              className="px-[10px] py-2 rounded-[10px] border border-[rgba(148,163,184,0.6)] bg-[rgba(15,23,42,0.9)] text-[#e2e8f0] text-[0.9rem] outline-none transition-all duration-[0.15s] ease-in-out focus:border-[#ffe66d] focus:shadow-[0_0_0_1px_rgba(255,230,109,0.55),0_0_16px_rgba(248,250,252,0.2)] focus:-translate-y-[1px]"
            />
          </div>
          <div className="flex flex-col mb-[0.7rem]">
            <label className="text-[0.78rem] uppercase text-[#cbd5ff] mb-1 tracking-[0.06em]">Roll / Reg. no. *</label>
            <input
              type="text"
              name={`playerRoll_${index}`}
              required
              className="px-[10px] py-2 rounded-[10px] border border-[rgba(148,163,184,0.6)] bg-[rgba(15,23,42,0.9)] text-[#e2e8f0] text-[0.9rem] outline-none transition-all duration-[0.15s] ease-in-out focus:border-[#ffe66d] focus:shadow-[0_0_0_1px_rgba(255,230,109,0.55),0_0_16px_rgba(248,250,252,0.2)] focus:-translate-y-[1px]"
            />
          </div>
          <div className="flex flex-col mb-[0.7rem]">
            <label className="text-[0.78rem] uppercase text-[#cbd5ff] mb-1 tracking-[0.06em]">Year *</label>
            <select
              name={`playerYear_${index}`}
              required
              className="px-[10px] py-2 rounded-[10px] border border-[rgba(148,163,184,0.6)] bg-[rgba(15,23,42,0.9)] text-[#e2e8f0] text-[0.9rem] outline-none transition-all duration-[0.15s] ease-in-out focus:border-[#ffe66d] focus:shadow-[0_0_0_1px_rgba(255,230,109,0.55),0_0_16px_rgba(248,250,252,0.2)] focus:-translate-y-[1px]"
            >
              <option value="">Select</option>
              <option>1st Year</option>
              <option>2nd Year</option>
              <option>3rd Year</option>
              <option>4th Year</option>
            </select>
          </div>
          <div className="flex flex-col mb-[0.7rem]">
            <label className="text-[0.78rem] uppercase text-[#cbd5ff] mb-1 tracking-[0.06em]">Department / Branch *</label>
            <select
              name={`playerDept_${index}`}
              required
              className="px-[10px] py-2 rounded-[10px] border border-[rgba(148,163,184,0.6)] bg-[rgba(15,23,42,0.9)] text-[#e2e8f0] text-[0.9rem] outline-none transition-all duration-[0.15s] ease-in-out focus:border-[#ffe66d] focus:shadow-[0_0_0_1px_rgba(255,230,109,0.55),0_0_16px_rgba(248,250,252,0.2)] focus:-translate-y-[1px]"
            >
              <option value="">Select</option>
              <option>CSE</option>
              <option>CSE (AI)</option>
              <option>ECE</option>
              <option>EE</option>
              <option>CE</option>
              <option>ME</option>
              <option>MTE</option>
            </select>
          </div>
          <div className="flex flex-col mb-[0.7rem]">
            <label className="text-[0.78rem] uppercase text-[#cbd5ff] mb-1 tracking-[0.06em]">Mobile number *</label>
            <input
              type="tel"
              name={`playerPhone_${index}`}
              required
              className="px-[10px] py-2 rounded-[10px] border border-[rgba(148,163,184,0.6)] bg-[rgba(15,23,42,0.9)] text-[#e2e8f0] text-[0.9rem] outline-none transition-all duration-[0.15s] ease-in-out focus:border-[#ffe66d] focus:shadow-[0_0_0_1px_rgba(255,230,109,0.55),0_0_16px_rgba(248,250,252,0.2)] focus:-translate-y-[1px]"
            />
          </div>
          <div className="flex flex-col mb-[0.7rem]">
            <label className="text-[0.78rem] uppercase text-[#cbd5ff] mb-1 tracking-[0.06em]">Email ID *</label>
            <input
              type="email"
              name={`playerEmail_${index}`}
              required
              className="px-[10px] py-2 rounded-[10px] border border-[rgba(148,163,184,0.6)] bg-[rgba(15,23,42,0.9)] text-[#e2e8f0] text-[0.9rem] outline-none transition-all duration-[0.15s] ease-in-out focus:border-[#ffe66d] focus:shadow-[0_0_0_1px_rgba(255,230,109,0.55),0_0_16px_rgba(248,250,252,0.2)] focus:-translate-y-[1px]"
            />
          </div>
        </div>
      )}
    </div>
  )
}

function RegisterModal({ isOpen, onClose, selectedSport, onStatusPopup }) {
  const [registrationCountdown, setRegistrationCountdown] = useState('')
  const [collapsedPlayers, setCollapsedPlayers] = useState({})

  const isTeam = selectedSport?.type === 'team'
  const playerCount = isTeam ? selectedSport?.players || 0 : 0
  const isCricket = selectedSport?.name?.toLowerCase() === 'cricket'

  useEffect(() => {
    if (!isOpen) return

    const targetTime = new Date('2026-01-02T00:00:00').getTime()

    const update = () => {
      const now = Date.now()
      const diff = targetTime - now

      if (diff > 0) {
        const days = Math.floor(diff / (1000 * 60 * 60 * 24))
        const hours = Math.floor((diff / (1000 * 60 * 60)) % 24)
        const minutes = Math.floor((diff / (1000 * 60)) % 60)
        const seconds = Math.floor((diff / 1000) % 60)

        setRegistrationCountdown(
          `Registration opens in: ${days}d ${hours.toString().padStart(2, '0')}h ${minutes.toString().padStart(2, '0')}m ${seconds.toString().padStart(2, '0')}s`
        )
      } else {
        setRegistrationCountdown('Registration is OPEN!')
      }
    }

    update()
    const timer = setInterval(update, 1000)

    return () => clearInterval(timer)
  }, [isOpen])

  useEffect(() => {
    if (isTeam && playerCount > 0) {
      const initialCollapsed = {}
      for (let i = 1; i <= playerCount; i++) {
        initialCollapsed[i] = true
      }
      setCollapsedPlayers(initialCollapsed)
    }
  }, [isTeam, playerCount])

  const togglePlayer = (index) => {
    setCollapsedPlayers((prev) => ({
      ...prev,
      [index]: !prev[index],
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    const formData = new FormData(e.target)
    formData.append('sports', selectedSport?.name || '')
    formData.append('eventType', selectedSport?.type || 'individual')
    formData.append('collegeName', 'Purnea College of Engineering, Purnea')

    // Collect player data
    if (isTeam) {
      for (let i = 1; i <= playerCount; i++) {
        formData.append(`playerName_${i}`, formData.get(`playerName_${i}`) || '')
        formData.append(`playerRoll_${i}`, formData.get(`playerRoll_${i}`) || '')
        formData.append(`playerYear_${i}`, formData.get(`playerYear_${i}`) || '')
        formData.append(`playerDept_${i}`, formData.get(`playerDept_${i}`) || '')
        formData.append(`playerPhone_${i}`, formData.get(`playerPhone_${i}`) || '')
        formData.append(`playerEmail_${i}`, formData.get(`playerEmail_${i}`) || '')
      }
    }

    try {
      await fetch(SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        body: formData,
      })

      const sportName = selectedSport?.name || 'UMANG – 2026'
      onStatusPopup(`✅ Your registration for ${sportName.toUpperCase()} has been saved!`, 'success', 2500)

      e.target.reset()
      setTimeout(() => {
        onClose()
      }, 2500)
    } catch (err) {
      console.error(err)
      onStatusPopup('❌ Error while submitting. Please try again.', 'error', 2500)
    }
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 bg-[rgba(0,0,0,0.65)] flex items-center justify-center z-[200] p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <aside className="max-w-[420px] w-full bg-gradient-to-br from-[rgba(12,16,40,0.98)] to-[rgba(9,9,26,0.94)] rounded-[20px] px-[1.4rem] py-[1.6rem] pb-[1.5rem] border border-[rgba(255,255,255,0.12)] shadow-[0_22px_55px_rgba(0,0,0,0.8)] backdrop-blur-[20px] relative max-h-[90vh] overflow-y-auto">
        <button
          type="button"
          className="absolute top-[10px] right-3 bg-transparent border-none text-[#e5e7eb] text-base cursor-pointer"
          onClick={onClose}
        >
          ✕
        </button>

        <div className="text-[0.78rem] uppercase tracking-[0.16em] text-[#a5b4fc] mb-1 text-center">Official Registration</div>
        <div className="text-[1.25rem] font-extrabold text-center uppercase tracking-[0.14em] text-[#ffe66d] mb-[0.7rem]">
          Student Entry Form
        </div>
        <div className="text-[0.85rem] text-center text-[#e5e7eb] mb-4">PCE, Purnea • Umang – 2026 Sports Fest</div>
        <div className="my-1 mb-4 text-center text-[0.95rem] font-semibold text-[#ffe66d]">
          Sports Name: {selectedSport?.name ? selectedSport.name.toUpperCase() : '—'}
        </div>

        {registrationCountdown && (
          <div className="my-2 mb-[0.9rem] text-center text-base font-semibold text-red-500">{registrationCountdown}</div>
        )}

        <form id="registrationForm" onSubmit={handleSubmit}>
          {isTeam && (
            <div>
              <div className="flex flex-col mb-[0.7rem]">
                <label htmlFor="teamName" className="text-[0.78rem] uppercase text-[#cbd5ff] mb-1 tracking-[0.06em]">
                  Team Name *
                </label>
                <input
                  type="text"
                  id="teamName"
                  name="teamName"
                  required
                  className="px-[10px] py-2 rounded-[10px] border border-[rgba(148,163,184,0.6)] bg-[rgba(15,23,42,0.9)] text-[#e2e8f0] text-[0.9rem] outline-none transition-all duration-[0.15s] ease-in-out focus:border-[#ffe66d] focus:shadow-[0_0_0_1px_rgba(255,230,109,0.55),0_0_16px_rgba(248,250,252,0.2)] focus:-translate-y-[1px]"
                />
              </div>

              <div className="flex flex-col mb-[0.7rem]">
                <label htmlFor="teamCategory" className="text-[0.78rem] uppercase text-[#cbd5ff] mb-1 tracking-[0.06em]">
                  Category *
                </label>
                <select
                  id="teamCategory"
                  name="teamCategory"
                  required
                  className="px-[10px] py-2 rounded-[10px] border border-[rgba(148,163,184,0.6)] bg-[rgba(15,23,42,0.9)] text-[#e2e8f0] text-[0.9rem] outline-none transition-all duration-[0.15s] ease-in-out focus:border-[#ffe66d] focus:shadow-[0_0_0_1px_rgba(255,230,109,0.55),0_0_16px_rgba(248,250,252,0.2)] focus:-translate-y-[1px]"
                >
                  <option value="">Select</option>
                  <option>Boys</option>
                  {!isCricket && <option>Girls</option>}
                </select>
              </div>
            </div>
          )}

          {!isTeam && (
            <>
              <div className="flex flex-col mb-[0.7rem]">
                <label htmlFor="name" className="text-[0.78rem] uppercase text-[#cbd5ff] mb-1 tracking-[0.06em]">
                  Full Name *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  required
                  className="px-[10px] py-2 rounded-[10px] border border-[rgba(148,163,184,0.6)] bg-[rgba(15,23,42,0.9)] text-[#e2e8f0] text-[0.9rem] outline-none transition-all duration-[0.15s] ease-in-out focus:border-[#ffe66d] focus:shadow-[0_0_0_1px_rgba(255,230,109,0.55),0_0_16px_rgba(248,250,252,0.2)] focus:-translate-y-[1px]"
                />
              </div>

              <div className="flex flex-col mb-[0.7rem]">
                <label htmlFor="category" className="text-[0.78rem] uppercase text-[#cbd5ff] mb-1 tracking-[0.06em]">
                  Category *
                </label>
                <select
                  id="category"
                  name="category"
                  required
                  className="px-[10px] py-2 rounded-[10px] border border-[rgba(148,163,184,0.6)] bg-[rgba(15,23,42,0.9)] text-[#e2e8f0] text-[0.9rem] outline-none transition-all duration-[0.15s] ease-in-out focus:border-[#ffe66d] focus:shadow-[0_0_0_1px_rgba(255,230,109,0.55),0_0_16px_rgba(248,250,252,0.2)] focus:-translate-y-[1px]"
                >
                  <option value="">Select</option>
                  <option>Boys</option>
                  {!isCricket && <option>Girls</option>}
                </select>
              </div>

              <div className="flex flex-col mb-[0.7rem]">
                <label htmlFor="roll" className="text-[0.78rem] uppercase text-[#cbd5ff] mb-1 tracking-[0.06em]">
                  Roll / Reg. no. *
                </label>
                <input
                  type="text"
                  id="roll"
                  name="roll"
                  required
                  className="px-[10px] py-2 rounded-[10px] border border-[rgba(148,163,184,0.6)] bg-[rgba(15,23,42,0.9)] text-[#e2e8f0] text-[0.9rem] outline-none transition-all duration-[0.15s] ease-in-out focus:border-[#ffe66d] focus:shadow-[0_0_0_1px_rgba(255,230,109,0.55),0_0_16px_rgba(248,250,252,0.2)] focus:-translate-y-[1px]"
                />
              </div>

              <div className="flex flex-col mb-[0.7rem]">
                <label htmlFor="year" className="text-[0.78rem] uppercase text-[#cbd5ff] mb-1 tracking-[0.06em]">
                  Year *
                </label>
                <select
                  id="year"
                  name="year"
                  required
                  className="px-[10px] py-2 rounded-[10px] border border-[rgba(148,163,184,0.6)] bg-[rgba(15,23,42,0.9)] text-[#e2e8f0] text-[0.9rem] outline-none transition-all duration-[0.15s] ease-in-out focus:border-[#ffe66d] focus:shadow-[0_0_0_1px_rgba(255,230,109,0.55),0_0_16px_rgba(248,250,252,0.2)] focus:-translate-y-[1px]"
                >
                  <option value="">Select</option>
                  <option>1st Year (2025)</option>
                  <option>2nd Year (2024)</option>
                  <option>3rd Year (2023)</option>
                  <option>4th Year (2022)</option>
                </select>
              </div>

              <div className="flex flex-col mb-[0.7rem]">
                <label htmlFor="dept" className="text-[0.78rem] uppercase text-[#cbd5ff] mb-1 tracking-[0.06em]">
                  Department / Branch *
                </label>
                <select
                  id="dept"
                  name="dept"
                  required
                  className="px-[10px] py-2 rounded-[10px] border border-[rgba(148,163,184,0.6)] bg-[rgba(15,23,42,0.9)] text-[#e2e8f0] text-[0.9rem] outline-none transition-all duration-[0.15s] ease-in-out focus:border-[#ffe66d] focus:shadow-[0_0_0_1px_rgba(255,230,109,0.55),0_0_16px_rgba(248,250,252,0.2)] focus:-translate-y-[1px]"
                >
                  <option value="">Select</option>
                  <option>CSE</option>
                  <option>CSE (AI)</option>
                  <option>ECE</option>
                  <option>EE</option>
                  <option>CE</option>
                  <option>ME</option>
                  <option>MTE</option>
                </select>
              </div>

              <div className="flex flex-col mb-[0.7rem]">
                <label htmlFor="phone" className="text-[0.78rem] uppercase text-[#cbd5ff] mb-1 tracking-[0.06em]">
                  Mobile number *
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  required
                  className="px-[10px] py-2 rounded-[10px] border border-[rgba(148,163,184,0.6)] bg-[rgba(15,23,42,0.9)] text-[#e2e8f0] text-[0.9rem] outline-none transition-all duration-[0.15s] ease-in-out focus:border-[#ffe66d] focus:shadow-[0_0_0_1px_rgba(255,230,109,0.55),0_0_16px_rgba(248,250,252,0.2)] focus:-translate-y-[1px]"
                />
              </div>

              <div className="flex flex-col mb-[0.7rem]">
                <label htmlFor="email" className="text-[0.78rem] uppercase text-[#cbd5ff] mb-1 tracking-[0.06em]">
                  Email ID *
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  required
                  className="px-[10px] py-2 rounded-[10px] border border-[rgba(148,163,184,0.6)] bg-[rgba(15,23,42,0.9)] text-[#e2e8f0] text-[0.9rem] outline-none transition-all duration-[0.15s] ease-in-out focus:border-[#ffe66d] focus:shadow-[0_0_0_1px_rgba(255,230,109,0.55),0_0_16px_rgba(248,250,252,0.2)] focus:-translate-y-[1px]"
                />
              </div>
            </>
          )}

          {isTeam && playerCount > 0 && (
            <div>
              {Array.from({ length: playerCount }, (_, i) => i + 1).map((index) => (
                <PlayerSection
                  key={index}
                  index={index}
                  isCollapsed={collapsedPlayers[index]}
                  onToggle={() => togglePlayer(index)}
                />
              ))}
            </div>
          )}

          <div className="flex flex-col mb-[0.7rem]">
            <label className="text-[0.78rem] uppercase text-[#cbd5ff] mb-1 tracking-[0.06em]">
              <input type="checkbox" id="declaration" required className="mr-2" />
              I agree to follow all rules of Umang 2026.
            </label>
          </div>

          <div className="flex gap-[0.6rem] mt-[0.8rem]">
            <button
              type="submit"
              className="flex-1 rounded-full border-none py-[9px] text-[0.9rem] font-bold uppercase tracking-[0.1em] cursor-pointer bg-gradient-to-r from-[#ffe66d] to-[#ff9f1c] text-[#111827] shadow-[0_10px_24px_rgba(250,204,21,0.6)] transition-all duration-[0.12s] ease-in-out hover:-translate-y-0.5 hover:shadow-[0_16px_36px_rgba(250,204,21,0.75)]"
            >
              Submit
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-full border border-[rgba(148,163,184,0.7)] py-[9px] text-[0.9rem] font-bold uppercase tracking-[0.1em] cursor-pointer bg-[rgba(15,23,42,0.95)] text-[#e5e7eb] transition-all duration-[0.12s] ease-in-out hover:-translate-y-0.5 hover:shadow-[0_10px_26px_rgba(15,23,42,0.9)]"
            >
              Cancel
            </button>
          </div>
        </form>
      </aside>
    </div>
  )
}

export default RegisterModal

