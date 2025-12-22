const sportsData = {
  team: [
    { name: 'Cricket', image: '/images/Cricket.jpg', text: 'College teams clash for the trophy.', players: 15 },
    { name: 'Volleyball', image: '/images/Vollyball.jpg', text: 'Smash, block and dominate the court.', players: 9 },
    { name: 'Badminton', image: '/images/Badminton.jpeg', text: "Men's & women's doubles and team events.", players: 5 },
    { name: 'Table Tennis', image: '/images/Tabletennis.jpeg', text: 'Fast rallies and sharp reflexes.', players: 5 },
    { name: 'Kabaddi', image: '/images/Kabbadi.png', text: 'Raid, tackle and roar with your squad.', players: 10 },
    { name: 'Relay 4×100 m', image: '/images/Relay1.o.jpg', text: 'High-speed baton relay on the track.', players: 4 },
    { name: 'Relay 4×400 m', image: '/images/Relay.jpg', text: 'Ultimate test of stamina and teamwork.', players: 4 },
  ],
  individual: [
    { name: 'Carrom', image: '/images/Carrom.jpg', text: 'Strike and pocket with precision.' },
    { name: 'Chess', image: 'https://images.unsplash.com/photo-1529699211952-734e80c4d42b?auto=format&fit=crop&w=900&q=80', text: 'Outplay your opponent on the board.' },
    { name: 'Sprint 100 m', image: '/images/Sprint1.jpg', text: 'Pure explosive speed on track.' },
    { name: 'Sprint 200 m', image: '/images/Sprint2.jpg', text: 'Power and pace around the bend.' },
    { name: 'Sprint 400 m', image: '/images/Sprint3.jpg', text: 'One full lap of endurance sprint.' },
    { name: 'Long Jump', image: '/images/Longjump.jpeg', text: 'Fly the farthest into the sand pit.' },
    { name: 'High Jump', image: '/images/Highjump.jpeg', text: 'Clear the bar and set new heights.' },
    { name: 'Javelin', image: '/images/javelin.jpeg', text: 'Throw for maximum distance.' },
    { name: 'Shot Put', image: '/images/Shotput.jpeg', text: 'Show your strength in the circle.' },
    { name: 'Discus Throw', image: '/images/Discussthrow.jpeg', text: 'Perfect spin and powerful release.' },
  ],
  cultural: [
    { name: 'Essay Writing', image: '/images/Essay Writing.jpg', text: 'Express your thoughts powerfully.' },
    { name: 'Story Writing', image: '/images/Story Writing.jpg', text: 'Craft compelling narratives.' },
    { name: 'Group Discussion', image: '/images/gd.png', text: 'Showcase leadership & ideas.' },
    { name: 'Debate', image: '/images/Debate.jpg', text: 'Argue, persuade, win.' },
    { name: 'Extempore', image: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=900&q=80', text: 'Think fast, speak boldly.' },
    { name: 'Quiz', image: '/images/Quiz.jpg', text: 'Test your knowledge.' },
    { name: 'Dumb Charades', image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=900&q=80', text: 'Act it out, guess it right.' },
    { name: 'Painting', image: '/images/painting.png', text: 'Unleash your creativity.' },
    { name: 'Singing', image: '/images/Singing.jpg', text: 'Voice your passion.' },
  ],
}

function SportCard({ sport, type, onSportClick }) {
  return (
    <div
      className="relative h-[170px] rounded-[18px] overflow-hidden shadow-[0_18px_40px_rgba(0,0,0,0.75)] cursor-pointer translate-y-0 transition-all duration-[0.25s] ease-in-out hover:-translate-y-2 hover:shadow-[0_26px_55px_rgba(0,0,0,0.9)]"
      style={{
        background: 'radial-gradient(circle at 0 0, #ffe66d 0, #7f1d1d 50%, #020617 100%)',
      }}
      onClick={() => onSportClick({ name: sport.name, type, players: sport.players })}
    >
      <div
        className="absolute inset-0 bg-cover bg-center opacity-90"
        style={{ backgroundImage: `url('${sport.image}')` }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-[rgba(0,0,0,0.9)] to-[rgba(0,0,0,0.2)] flex flex-col justify-end p-[0.9rem] px-[1.1rem] text-[#f9fafb] drop-shadow-[0_3px_12px_rgba(0,0,0,0.9)]">
        <div className="text-[1.1rem] font-extrabold text-[#ffe66d] uppercase">{sport.name}</div>
        <div className="text-[0.85rem] mt-[0.15rem]">{sport.text}</div>
      </div>
    </div>
  )
}

function SportsSection({ onSportClick, loggedInUser }) {
  // Show Team Events if:
  // - User is not logged in (show all events)
  // - OR logged in user's reg_number is "00000000000" (admin - show all)
  // - OR logged in user has non-empty captain_in array (show only sports in captain_in)
  const isAdmin = loggedInUser?.reg_number === '00000000000'
  const hasCaptainRole = loggedInUser?.captain_in && Array.isArray(loggedInUser.captain_in) && loggedInUser.captain_in.length > 0
  const showTeamEvents = !loggedInUser || isAdmin || hasCaptainRole

  // Filter team sports based on captain_in for non-admin users
  const getTeamSportsToShow = () => {
    if (!loggedInUser || isAdmin) {
      // Show all team sports for non-logged-in users or admin
      return sportsData.team
    }
    if (hasCaptainRole) {
      // Show only sports that are in captain_in array
      return sportsData.team.filter(sport => 
        loggedInUser.captain_in.includes(sport.name)
      )
    }
    return []
  }

  const teamSportsToShow = getTeamSportsToShow()

  return (
    <section id="sports" className="mt-[2.2rem]">
      {showTeamEvents && teamSportsToShow.length > 0 && (
        <>
          <h3 className="text-center mt-14 mb-[1.4rem] text-[1.4rem] tracking-[0.16em] uppercase text-[#ffe66d]">
            Team Events
          </h3>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-[1.2rem]">
            {teamSportsToShow.map((sport) => (
              <SportCard key={sport.name} sport={sport} type="team" onSportClick={onSportClick} />
            ))}
          </div>
        </>
      )}

      <h3 className="text-center mt-14 mb-[1.4rem] text-[1.4rem] tracking-[0.16em] uppercase text-[#ffe66d]">
        Individual Events
      </h3>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-[1.2rem]">
        {sportsData.individual.map((sport) => (
          <SportCard key={sport.name} sport={sport} type="individual" onSportClick={onSportClick} />
        ))}
      </div>

      <h3 className="text-center mt-14 mb-[1.4rem] text-[1.4rem] tracking-[0.16em] uppercase text-[#ffe88d]">
        Literary & Cultural Activities
      </h3>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-[1.2rem]">
        {sportsData.cultural.map((sport) => (
          <SportCard key={sport.name} sport={sport} type="individual" onSportClick={onSportClick} />
        ))}
      </div>
    </section>
  )
}

export default SportsSection

