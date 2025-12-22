import { useEffect, useState } from 'react'

function Hero() {
  const [eventCountdown, setEventCountdown] = useState('')

  useEffect(() => {
    const targetTime = new Date('2026-01-09T00:00:00').getTime()

    const update = () => {
      const now = Date.now()
      const diff = targetTime - now

      if (diff > 0) {
        const days = Math.floor(diff / (1000 * 60 * 60 * 24))
        const hours = Math.floor((diff / (1000 * 60 * 60)) % 24)
        const minutes = Math.floor((diff / (1000 * 60)) % 60)
        const seconds = Math.floor((diff / 1000) % 60)

        setEventCountdown(
          `Event starts in: ${days}d ${hours.toString().padStart(2, '0')}h ${minutes.toString().padStart(2, '0')}m ${seconds.toString().padStart(2, '0')}s`
        )
      } else {
        setEventCountdown('Event has started!')
      }
    }

    update()
    const timer = setInterval(update, 1000)

    return () => clearInterval(timer)
  }, [])

  return (
    <div id="home" className="mb-6 text-center">
      <div
        className="mx-auto px-[1.4rem] py-[1.8rem] pb-8 rounded-[20px] relative overflow-hidden bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: 'linear-gradient(rgba(0, 0, 0, 0.45), rgba(0, 0, 0, 0.75)), url("/images/collge.png")',
        }}
      >
        <div className="text-center text-[1.7rem] font-semibold text-white drop-shadow-[0_0_8px_rgba(0,0,0,0.7)]">
          Purnea College of Engineering, Purnea
        </div>
        <div
          className="mt-[1.2rem] mb-[0.6rem] mx-auto text-center w-fit px-[1.6rem] py-2 bg-gradient-to-b from-[#ff3434] to-[#b70000] rounded-full shadow-[0_14px_30px_rgba(0,0,0,0.6),0_0_0_3px_rgba(255,255,255,0.15)] relative overflow-visible"
          style={{
            position: 'relative',
          }}
        >
          <div
            className="absolute top-1/2 left-[-26px] w-[42px] h-[26px] bg-gradient-to-b from-[#c40d0d] to-[#7a0202]"
            style={{
              clipPath: 'polygon(100% 0, 0 0, 80% 50%, 0 100%, 100% 100%)',
            }}
          />
          <div
            className="absolute top-1/2 right-[-26px] w-[42px] h-[26px] bg-gradient-to-b from-[#c40d0d] to-[#7a0202]"
            style={{
              clipPath: 'polygon(0 0, 100% 0, 20% 50%, 100% 100%, 0 100%)',
            }}
          />
          <div className="text-[2.2rem] font-bold tracking-[0.18em] text-white uppercase drop-shadow-[0_2px_4px_rgba(0,0,0,0.7),0_0_12px_rgba(0,0,0,0.8)] max-md:text-[1.7rem]">
            UMANG – 2026
          </div>
        </div>
        <div className="mt-1 text-center text-[1.2rem] font-bold text-[#ffe66d] drop-shadow-[0_0_8px_rgba(0,0,0,0.8)] max-md:text-base">
          Event Date: 9th Jan 2026 to 13th Jan 2026
        </div>
        <div className="mt-[0.7rem] text-center text-[1.2rem] font-semibold text-[#ff4dff] drop-shadow-[0_0_8px_rgba(0,0,0,0.8)]">
          Registration Date: 2nd Jan 2026 to 6th Jan 2026
        </div>
        {eventCountdown && (
          <div id="eventCountdown" className="mt-2 mb-0 text-center text-base font-semibold text-red-500">
            {eventCountdown}
          </div>
        )}
      </div>
      <div className="mt-[1.4rem] mx-auto max-w-[1000px] text-center px-4 py-2 rounded-full bg-gradient-to-r from-[rgba(0,0,0,0.7)] to-[rgba(0,0,0,0.3)] border border-[rgba(255,255,255,0.2)] font-bold tracking-[0.08em] uppercase text-[1.5rem]">
        MULTIPLE SPORTS • <span className="text-[#ffe66d]">TROPHIES &amp; PRIZES</span> • JOIN THE GAME
      </div>
    </div>
  )
}

export default Hero

