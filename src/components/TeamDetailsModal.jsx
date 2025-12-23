import { useState, useEffect } from 'react'

function TeamDetailsModal({ isOpen, onClose, sport, loggedInUser }) {
  const [teams, setTeams] = useState([])
  const [loading, setLoading] = useState(false)
  const [expandedTeams, setExpandedTeams] = useState(new Set())
  const [error, setError] = useState(null)
  
  const isAdmin = loggedInUser?.reg_number === '00000000000'
  const isCaptain = !isAdmin && loggedInUser?.captain_in && 
    Array.isArray(loggedInUser.captain_in) && 
    loggedInUser.captain_in.includes(sport)

  useEffect(() => {
    if (isOpen && sport) {
      fetchTeamDetails()
    } else {
      // Reset state when modal closes
      setTeams([])
      setExpandedTeams(new Set())
      setError(null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, sport, isCaptain, loggedInUser])

  const fetchTeamDetails = async () => {
    if (!sport) {
      setError('Sport name is required')
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)
    try {
      // URL encode the sport name to handle special characters like ×
      const encodedSport = encodeURIComponent(sport)
      const url = `http://localhost:3001/api/teams/${encodedSport}`
      console.log('Fetching teams for sport:', sport, 'URL:', url)
      
      const response = await fetch(url)
      
      if (!response.ok) {
        // Try to get error message from response
        let errorMessage = 'Failed to fetch team details'
        try {
          const errorData = await response.json()
          errorMessage = errorData.error || errorData.details || errorMessage
          console.error('API Error:', errorData)
        } catch (e) {
          errorMessage = `HTTP ${response.status}: ${response.statusText}`
          console.error('Response parse error:', e)
        }
        setError(errorMessage)
        setLoading(false)
        return
      }

      const data = await response.json()
      console.log('Team data received:', data)

      if (data.success) {
        let teamsToShow = data.teams || []
        
        // If captain, filter to show only their team
        if (isCaptain && loggedInUser && teamsToShow.length > 0) {
          // Find the team that the captain belongs to
          const captainTeam = teamsToShow.find(team => 
            team.players.some(player => player.reg_number === loggedInUser.reg_number)
          )
          
          if (captainTeam) {
            // Show only the captain's team
            teamsToShow = [captainTeam]
            // Auto-expand the captain's team
            setExpandedTeams(new Set([captainTeam.team_name]))
          } else {
            // Captain is not in any team (shouldn't happen, but handle gracefully)
            teamsToShow = []
          }
        }
        
        setTeams(teamsToShow)
      } else {
        setError(data.error || 'Failed to fetch team details')
      }
    } catch (err) {
      console.error('Error fetching team details:', err)
      setError(`Error while fetching team details: ${err.message || 'Please check your connection and try again.'}`)
    } finally {
      setLoading(false)
    }
  }

  const toggleTeam = (teamName) => {
    const newExpanded = new Set(expandedTeams)
    if (newExpanded.has(teamName)) {
      newExpanded.delete(teamName)
    } else {
      newExpanded.add(teamName)
    }
    setExpandedTeams(newExpanded)
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 bg-[rgba(0,0,0,0.65)] flex items-center justify-center z-[200] p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <aside className="max-w-[700px] w-full bg-gradient-to-br from-[rgba(12,16,40,0.98)] to-[rgba(9,9,26,0.94)] rounded-[20px] px-[1.4rem] py-[1.6rem] pb-[1.5rem] border border-[rgba(255,255,255,0.12)] shadow-[0_22px_55px_rgba(0,0,0,0.8)] backdrop-blur-[20px] relative max-h-[90vh] overflow-y-auto">
        <button
          type="button"
          className="absolute top-[10px] right-3 bg-transparent border-none text-[#e5e7eb] text-base cursor-pointer hover:text-[#ffe66d] transition-colors"
          onClick={onClose}
        >
          ✕
        </button>

        <div className="text-[0.78rem] uppercase tracking-[0.16em] text-[#a5b4fc] mb-1 text-center">
          {isAdmin ? 'Admin Panel' : isCaptain ? 'Captain View' : 'Team Details'}
        </div>
        <div className="text-[1.25rem] font-extrabold text-center uppercase tracking-[0.14em] text-[#ffe66d] mb-[0.7rem]">
          Team Details
        </div>
        <div className="text-[0.85rem] text-center text-[#e5e7eb] mb-4">
          {sport ? sport.toUpperCase() : 'Sport'} • PCE, Purnea • Umang – 2026 Sports Fest
        </div>

        {loading && (
          <div className="text-center py-8 text-[#a5b4fc]">
            Loading team details...
          </div>
        )}

        {error && (
          <div className="text-center py-8 text-red-400">
            {error}
          </div>
        )}

        {!loading && !error && teams.length === 0 && (
          <div className="text-center py-8 text-[#a5b4fc]">
            {isCaptain 
              ? "You haven't created a team for this sport yet. Please register a team first."
              : "No teams registered for this sport yet."
            }
          </div>
        )}

        {!loading && !error && teams.length > 0 && (
          <div className="space-y-3">
            {!isCaptain && (
              <div className="text-[0.9rem] text-[#cbd5ff] mb-4 text-center">
                Total Teams: <span className="text-[#ffe66d] font-bold">{teams.length}</span>
              </div>
            )}
            {teams.map((team) => {
              const isExpanded = expandedTeams.has(team.team_name)
              // Check if this is the captain's team
              const isCaptainTeam = isCaptain && loggedInUser && 
                team.players.some(player => player.reg_number === loggedInUser.reg_number)
              return (
                <div
                  key={team.team_name}
                  className={`border rounded-[12px] overflow-hidden ${
                    isCaptainTeam 
                      ? 'border-[rgba(255,230,109,0.5)] bg-[rgba(255,230,109,0.05)]' 
                      : 'border-[rgba(148,163,184,0.3)] bg-[rgba(15,23,42,0.6)]'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => toggleTeam(team.team_name)}
                    className="w-full px-4 py-3 flex items-center justify-between hover:bg-[rgba(255,230,109,0.1)] transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-[#ffe66d] text-lg">
                        {isExpanded ? '▼' : '▶'}
                      </span>
                      <span className="text-[#e5e7eb] font-semibold text-[0.95rem]">
                        {team.team_name}
                      </span>
                      {isCaptainTeam && (
                        <span className="px-2 py-0.5 rounded text-[0.7rem] font-bold bg-[rgba(255,230,109,0.2)] text-[#ffe66d] border border-[rgba(255,230,109,0.4)]">
                          YOUR TEAM
                        </span>
                      )}
                      <span className="text-[#a5b4fc] text-[0.8rem]">
                        ({team.player_count} {team.player_count === 1 ? 'player' : 'players'})
                      </span>
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="px-4 pb-4 pt-2 border-t border-[rgba(148,163,184,0.2)]">
                      <div className="space-y-2">
                        {team.players.map((player, index) => (
                          <div
                            key={player.reg_number}
                            className="px-3 py-2 rounded-[8px] bg-[rgba(15,23,42,0.8)] border border-[rgba(148,163,184,0.15)]"
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-[#ffe66d] font-bold text-[0.85rem]">
                                    {index + 1}.
                                  </span>
                                  <span className="text-[#e5e7eb] font-semibold text-[0.9rem]">
                                    {player.full_name}
                                  </span>
                                  {player.captain_in && Array.isArray(player.captain_in) && player.captain_in.includes(sport) && (
                                    <span className="px-2 py-0.5 rounded text-[0.7rem] font-bold bg-[rgba(255,230,109,0.2)] text-[#ffe66d] border border-[rgba(255,230,109,0.4)]">
                                      CAPTAIN
                                    </span>
                                  )}
                                </div>
                                <div className="text-[#cbd5ff] text-[0.8rem] ml-6 space-y-0.5">
                                  <div>Reg. No: <span className="text-[#e5e7eb]">{player.reg_number}</span></div>
                                  <div>Department: <span className="text-[#e5e7eb]">{player.department_branch}</span></div>
                                  <div>Year: <span className="text-[#e5e7eb]">{player.year}</span></div>
                                  <div>Gender: <span className="text-[#e5e7eb]">{player.gender}</span></div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        <div className="flex justify-center mt-6">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2 rounded-full border border-[rgba(148,163,184,0.7)] text-[0.9rem] font-bold uppercase tracking-[0.1em] cursor-pointer bg-[rgba(15,23,42,0.95)] text-[#e5e7eb] transition-all duration-[0.12s] ease-in-out hover:-translate-y-0.5 hover:shadow-[0_10px_26px_rgba(15,23,42,0.9)]"
          >
            Close
          </button>
        </div>
      </aside>
    </div>
  )
}

export default TeamDetailsModal

