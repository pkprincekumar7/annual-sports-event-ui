import express from 'express'
import cors from 'cors'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import XLSX from 'xlsx'
import jwt from 'jsonwebtoken'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const PORT = 3001

// JWT Secret (in production, use environment variable)
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production'
const JWT_EXPIRES_IN = '24h' // Token expires in 24 hours

// Disable ETag generation (Express default)
app.set('etag', false)

// Middleware
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Disable caching for all API responses
app.use('/api', (req, res, next) => {
  // Remove conditional request headers that cause 304 responses
  delete req.headers['if-modified-since']
  delete req.headers['if-none-match']
  delete req.headers['if-match']
  delete req.headers['if-unmodified-since']
  
  // Remove any existing ETag or Last-Modified headers from response
  res.removeHeader('ETag')
  res.removeHeader('Last-Modified')
  
  // Set no-cache headers to prevent 304 responses
  res.set({
    'Cache-Control': 'no-store, no-cache, must-revalidate, private',
    'Pragma': 'no-cache',
    'Expires': '0'
  })
  
  next()
})

// JWT Authentication Middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1] // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ 
      success: false, 
      error: 'Access token required. Please login first.' 
    })
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ 
        success: false, 
        error: 'Invalid or expired token. Please login again.' 
      })
    }
    req.user = decoded // Attach user info to request
    next()
  })
}

// Admin-only Middleware (must be used after authenticateToken)
const requireAdmin = (req, res, next) => {
  if (req.user.reg_number !== 'admin') {
    return res.status(403).json({ 
      success: false, 
      error: 'Admin access required' 
    })
  }
  next()
}

// Ensure json_store directory exists
const jsonStorePath = path.join(__dirname, 'public', 'json_store')
const playersJsonPath = path.join(jsonStorePath, 'players.json')

if (!fs.existsSync(jsonStorePath)) {
  fs.mkdirSync(jsonStorePath, { recursive: true })
}

// Initialize players.json if it doesn't exist
if (!fs.existsSync(playersJsonPath)) {
  fs.writeFileSync(playersJsonPath, JSON.stringify([], null, 2))
}

// API endpoint to get all players (requires authentication)
app.get('/api/players', authenticateToken, (req, res) => {
  try {
    let players = []
    if (fs.existsSync(playersJsonPath)) {
      const fileContent = fs.readFileSync(playersJsonPath, 'utf8')
      players = JSON.parse(fileContent)
    }
    res.json({ success: true, players })
  } catch (error) {
    console.error('Error reading players data:', error)
    res.status(500).json({ 
      success: false, 
      error: 'Failed to read players data',
      details: error.message 
    })
  }
})

// API endpoint to get team sports (for captain assignment - admin only)
app.get('/api/sports', authenticateToken, requireAdmin, (req, res) => {
  try {
    // Only Team Events can have captains
    const teamSports = [
      'Cricket',
      'Volleyball',
      'Badminton',
      'Table Tennis',
      'Kabaddi',
      'Relay 4×100 m',
      'Relay 4×400 m',
    ]
    res.json({ success: true, sports: teamSports })
  } catch (error) {
    console.error('Error getting sports list:', error)
    res.status(500).json({ 
      success: false, 
      error: 'Failed to get sports list',
      details: error.message 
    })
  }
})

// API endpoint to add captain (Admin only)
app.post('/api/add-captain', authenticateToken, requireAdmin, (req, res) => {
  try {
    let { reg_number, sport } = req.body

    // Trim fields
    reg_number = reg_number?.trim()
    sport = sport?.trim()

    // Validate required fields
    if (!reg_number || !sport) {
      return res.status(400).json({ 
        success: false, 
        error: 'Registration number and sport are required' 
      })
    }

    // Validate sport is a team sport
    const teamSports = [
      'Cricket',
      'Volleyball',
      'Badminton',
      'Table Tennis',
      'Kabaddi',
      'Relay 4×100 m',
      'Relay 4×400 m',
    ]
    if (!teamSports.includes(sport)) {
      return res.status(400).json({ 
        success: false, 
        error: `Invalid sport. Only team sports can have captains: ${teamSports.join(', ')}` 
      })
    }

    // Read existing data
    let players = []
    if (fs.existsSync(playersJsonPath)) {
      const fileContent = fs.readFileSync(playersJsonPath, 'utf8')
      players = JSON.parse(fileContent)
    }

    // Find player
    const playerIndex = players.findIndex(p => p.reg_number === reg_number)
    if (playerIndex === -1) {
      return res.status(404).json({ 
        success: false, 
        error: 'Player not found' 
      })
    }

    // Initialize captain_in array if it doesn't exist
    if (!players[playerIndex].captain_in) {
      players[playerIndex].captain_in = []
    }

    // Check if already a captain for this sport (uniqueness check)
    if (players[playerIndex].captain_in.includes(sport)) {
      return res.status(400).json({ 
        success: false, 
        error: `Player is already a captain for ${sport}` 
      })
    }

    // Check for duplicate elements in captain_in array
    const captainInSet = new Set(players[playerIndex].captain_in)
    if (captainInSet.size !== players[playerIndex].captain_in.length) {
      return res.status(400).json({ 
        success: false, 
        error: 'captain_in array contains duplicate entries. Please fix the data first.' 
      })
    }

    // Check maximum limit: captain_in array can have maximum 10 unique entries
    const currentCaptainCount = players[playerIndex].captain_in.length
    if (currentCaptainCount >= 10) {
      return res.status(400).json({ 
        success: false, 
        error: 'Maximum 10 captain roles allowed. Please remove a captain assignment first.' 
      })
    }

    // Initialize participated_in array if it doesn't exist
    if (!players[playerIndex].participated_in) {
      players[playerIndex].participated_in = []
    }

    // Check for duplicate sport entries in participated_in array (uniqueness check)
    const sportSet = new Set(players[playerIndex].participated_in.map(p => p.sport))
    if (sportSet.size !== players[playerIndex].participated_in.length) {
      return res.status(400).json({ 
        success: false, 
        error: 'participated_in array contains duplicate sport entries. Please fix the data first.' 
      })
    }

    // Check maximum limit: participated_in array can have maximum 10 unique entries (based on sport name)
    const currentParticipationsCount = players[playerIndex].participated_in.length
    if (currentParticipationsCount >= 10) {
      return res.status(400).json({ 
        success: false, 
        error: 'Maximum 10 participations allowed (based on unique sport names). Please remove a participation first.' 
      })
    }

    // Count non-team participations (entries without team_name)
    const nonTeamParticipations = players[playerIndex].participated_in.filter(
      p => !p.team_name
    ).length

    // Count team participations where sport IS in captain_in array (these count towards captain limit)
    const captainTeamParticipations = players[playerIndex].participated_in.filter(
      p => p.team_name && 
      players[playerIndex].captain_in && 
      Array.isArray(players[playerIndex].captain_in) && 
      players[playerIndex].captain_in.includes(p.sport)
    ).length

    // Check: (captain_in length + non-team participated_in) should not exceed 10
    if (currentCaptainCount + nonTeamParticipations >= 10) {
      return res.status(400).json({ 
        success: false, 
        error: `Cannot add captain role. Total (captain roles + non-team participations) cannot exceed 10. Current: ${currentCaptainCount} captain role(s) + ${nonTeamParticipations} non-team participation(s) = ${currentCaptainCount + nonTeamParticipations}.` 
      })
    }

    // Check: team participations (for captain sports) should not exceed captain_in length
    // After adding this new captain role, max team participations for captain sports = currentCaptainCount + 1
    if (captainTeamParticipations >= currentCaptainCount + 1) {
      return res.status(400).json({ 
        success: false, 
        error: `Cannot add captain role. Maximum team participations allowed for sports in captain_in array is ${currentCaptainCount + 1} (equal to captain roles). Current team participations for captain sports: ${captainTeamParticipations}.` 
      })
    }

    // Check if player is already a participant in a team for this sport
    // If they are, the team already has a captain (teams cannot be created/updated without exactly one captain)
    // So we should prevent adding this player as captain if they're not already the captain
    const existingTeamParticipation = players[playerIndex].participated_in.find(
      p => p.sport === sport && p.team_name
    )

    if (existingTeamParticipation) {
      // Player is already in a team for this sport
      // Check if they're already the captain for this sport
      const isAlreadyCaptain = players[playerIndex].captain_in && 
                               Array.isArray(players[playerIndex].captain_in) && 
                               players[playerIndex].captain_in.includes(sport)
      
      if (!isAlreadyCaptain) {
        // Player is in a team but not the captain, which means the team already has a captain
        // We cannot add this player as captain because a team can only have one captain
        return res.status(400).json({ 
          success: false, 
          error: `Cannot add captain role. Player is already in team "${existingTeamParticipation.team_name}" for ${sport}, which already has a captain. A team can only have one captain.` 
        })
      }
      // If they're already the captain, the duplicate check on line 130 will catch it
    }

    // Add sport to captain_in array
    players[playerIndex].captain_in.push(sport)

    // Write back to file
    fs.writeFileSync(playersJsonPath, JSON.stringify(players, null, 2))

    // Return player data (excluding password for security)
    const { password: _, ...playerData } = players[playerIndex]

    res.json({ 
      success: true, 
      message: `Captain added successfully for ${sport}`,
      player: playerData
    })
  } catch (error) {
    console.error('Error adding captain:', error)
    res.status(500).json({ 
      success: false, 
      error: 'Failed to add captain',
      details: error.message 
    })
  }
})

// API endpoint to remove captain
app.delete('/api/remove-captain', authenticateToken, requireAdmin, (req, res) => {
  try {
    let { reg_number, sport } = req.body

    // Trim fields
    reg_number = reg_number?.trim()
    sport = sport?.trim()

    // Validate required fields
    if (!reg_number || !sport) {
      return res.status(400).json({ 
        success: false, 
        error: 'Registration number and sport are required' 
      })
    }

    // Validate sport is a team sport
    const teamSports = [
      'Cricket',
      'Volleyball',
      'Badminton',
      'Table Tennis',
      'Kabaddi',
      'Relay 4×100 m',
      'Relay 4×400 m',
    ]
    if (!teamSports.includes(sport)) {
      return res.status(400).json({ 
        success: false, 
        error: `Invalid sport. Only team sports can have captains: ${teamSports.join(', ')}` 
      })
    }

    // Read existing data
    let players = []
    if (fs.existsSync(playersJsonPath)) {
      const fileContent = fs.readFileSync(playersJsonPath, 'utf8')
      players = JSON.parse(fileContent)
    }

    // Find player
    const playerIndex = players.findIndex(p => p.reg_number === reg_number)
    if (playerIndex === -1) {
      return res.status(404).json({ 
        success: false, 
        error: 'Player not found' 
      })
    }

    // Initialize captain_in array if it doesn't exist
    if (!players[playerIndex].captain_in) {
      players[playerIndex].captain_in = []
    }

    // Check if player is a captain for this sport
    if (!players[playerIndex].captain_in.includes(sport)) {
      return res.status(400).json({ 
        success: false, 
        error: `Player is not a captain for ${sport}` 
      })
    }

    // Check if player has created a team for this sport
    if (players[playerIndex].participated_in && Array.isArray(players[playerIndex].participated_in)) {
      const teamParticipation = players[playerIndex].participated_in.find(
        p => p.sport === sport && p.team_name
      )
      
      if (teamParticipation) {
        return res.status(400).json({ 
          success: false, 
          error: `Cannot remove captain role. Player has already created a team (${teamParticipation.team_name}) for ${sport}. Please delete the team first.` 
        })
      }
    }

    // Remove sport from captain_in array
    players[playerIndex].captain_in = players[playerIndex].captain_in.filter(
      s => s !== sport
    )

    // Write back to file
    fs.writeFileSync(playersJsonPath, JSON.stringify(players, null, 2))

    // Return player data (excluding password for security)
    const { password: _, ...playerData } = players[playerIndex]

    res.json({ 
      success: true, 
      message: `Captain role removed successfully for ${sport}`,
      player: playerData
    })
  } catch (error) {
    console.error('Error removing captain:', error)
    res.status(500).json({ 
      success: false, 
      error: 'Failed to remove captain',
      details: error.message 
    })
  }
})

// API endpoint to get captains by sport
app.get('/api/captains-by-sport', authenticateToken, requireAdmin, (req, res) => {
  try {
    // Read existing data
    let players = []
    if (fs.existsSync(playersJsonPath)) {
      const fileContent = fs.readFileSync(playersJsonPath, 'utf8')
      players = JSON.parse(fileContent)
    }

    // Filter out admin user
    const nonAdminPlayers = players.filter(p => p.reg_number !== 'admin')

    // Group captains by sport
    const captainsBySport = {}

    // Define team sports
    const teamSports = [
      'Cricket',
      'Volleyball',
      'Badminton',
      'Table Tennis',
      'Kabaddi',
      'Relay 4×100 m',
      'Relay 4×400 m',
    ]

    // Initialize all team sports
    teamSports.forEach(sport => {
      captainsBySport[sport] = []
    })

    // Find all captains
    nonAdminPlayers.forEach(player => {
      if (player.captain_in && Array.isArray(player.captain_in)) {
        player.captain_in.forEach(sport => {
          if (teamSports.includes(sport)) {
            if (!captainsBySport[sport]) {
              captainsBySport[sport] = []
            }
            const { password: _, ...playerData } = player
            captainsBySport[sport].push(playerData)
          }
        })
      }
    })

    res.json({ 
      success: true, 
      captainsBySport 
    })
  } catch (error) {
    console.error('Error fetching captains by sport:', error)
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch captains by sport',
      details: error.message 
    })
  }
})

// API endpoint to validate participations before team registration
app.post('/api/validate-participations', authenticateToken, (req, res) => {
  try {
    let { reg_numbers, sport } = req.body

    // Trim fields
    sport = sport?.trim()
    if (Array.isArray(reg_numbers)) {
      reg_numbers = reg_numbers.map(rn => rn?.trim()).filter(rn => rn)
    }

    // Validate required fields
    if (!reg_numbers || !Array.isArray(reg_numbers) || reg_numbers.length === 0 || !sport) {
      return res.status(400).json({ 
        success: false, 
        error: 'Registration numbers array and sport are required' 
      })
    }

    // Read existing data
    let players = []
    if (fs.existsSync(playersJsonPath)) {
      const fileContent = fs.readFileSync(playersJsonPath, 'utf8')
      players = JSON.parse(fileContent)
    }

    const errors = []

    // Validate each player
    for (const reg_number of reg_numbers) {
      const player = players.find(p => p.reg_number === reg_number)
      if (!player) {
        errors.push(`Player with reg_number ${reg_number} not found`)
        continue
      }

      // Initialize participated_in array if it doesn't exist
      if (!player.participated_in) {
        player.participated_in = []
      }

      // Check if already participated in this sport (for team events, player can only be in one team per sport)
      const existingParticipation = player.participated_in.find(p => p.sport === sport)
      if (existingParticipation) {
        if (existingParticipation.team_name) {
          // Check if this player is a captain for this sport
          const isCaptain = player.captain_in && Array.isArray(player.captain_in) && player.captain_in.includes(sport)
          if (isCaptain) {
            errors.push(`${player.full_name} (${reg_number}) is a captain and has already created a team (${existingParticipation.team_name}) for ${sport}. A captain cannot create multiple teams for the same sport.`)
          } else {
            errors.push(`${player.full_name} (${reg_number}) is already in a team (${existingParticipation.team_name}) for ${sport}. A player can only belong to one team per sport.`)
          }
        } else {
          errors.push(`${player.full_name} (${reg_number}) is already registered for ${sport}`)
        }
        continue
      }

      // Check for duplicate sport entries in participated_in array (uniqueness check)
      const sportSet = new Set(player.participated_in.map(p => p.sport))
      if (sportSet.size !== player.participated_in.length) {
        errors.push(`${player.full_name} (${reg_number}) has duplicate sport entries in participated_in array. Please fix the data first.`)
        continue
      }

      // Check maximum limit: participated_in array can have maximum 10 unique entries (based on sport name)
      const currentParticipationsCount = player.participated_in.length
      if (currentParticipationsCount >= 10) {
        errors.push(`${player.full_name} (${reg_number}) has reached maximum 10 participations (based on unique sport names). Please remove a participation first.`)
        continue
      }

      // Count non-team participations (entries without team_name)
      const nonTeamParticipations = player.participated_in.filter(
        p => !p.team_name
      ).length

      // Count team participations where sport IS in captain_in array (these count towards captain limit)
      const captainTeamParticipations = player.participated_in.filter(
        p => p.team_name && 
        player.captain_in && 
        Array.isArray(player.captain_in) && 
        player.captain_in.includes(p.sport)
      ).length

      // Get captain count
      const captainCount = player.captain_in && Array.isArray(player.captain_in) 
        ? player.captain_in.length 
        : 0
      
      // Check if this is a team event (has team_name in the request context)
      // For team events: check if sport is in captain_in array
      const isCaptainForSport = player.captain_in && 
        Array.isArray(player.captain_in) && 
        player.captain_in.includes(sport)
      
      if (isCaptainForSport) {
        // This is a team event where the player IS a captain for this sport
        // Check: team participations (for captain sports) should not exceed captain_in length
        if (captainTeamParticipations >= captainCount) {
          errors.push(`${player.full_name} (${reg_number}) has reached maximum team participations for captain sports (${captainCount}). Maximum team participations allowed for sports in captain_in array is equal to captain roles (${captainCount}).`)
          continue
        }
      } else {
        // This could be either:
        // 1. A team event where the player is NOT a captain (allowed, no limit check)
        // 2. A non-team event
        // For non-team events: check (captain_in length + non-team participated_in) should not exceed 10
        // Note: We can't distinguish here, so we'll check non-team limit in update-participation endpoint
        // For team events with non-captain: no limit check needed
      }
    }

    // Check for multiple captains in the same request
    // Note: This is a preliminary check. The actual team validation happens in update-team-participation
    const captainsInRequest = reg_numbers
      .map(rn => players.find(s => s.reg_number === rn))
      .filter(s => s && s.captain_in && Array.isArray(s.captain_in) && s.captain_in.includes(sport))

    if (captainsInRequest.length > 1) {
      const captainNames = captainsInRequest.map(s => `${s.full_name} (${s.reg_number})`)
      errors.push(`Multiple captains found in the same team registration: ${captainNames.join(', ')}. A team can only have exactly one captain for ${sport}.`)
    }

    // Validate that exactly one captain is in the team
    if (captainsInRequest.length === 0) {
      errors.push(`Team must have exactly one captain for ${sport}. At least one player in the team must be assigned as captain for this sport.`)
    } else if (captainsInRequest.length !== 1) {
      errors.push(`Team must have exactly one captain for ${sport}. Found ${captainsInRequest.length} captains.`)
    }

    // Validate that the logged-in user (from JWT token) is the captain for this sport
    // Only the captain assigned to a sport can create teams for that sport
    const loggedInUserRegNumber = req.user?.reg_number
    if (loggedInUserRegNumber) {
      const loggedInUserInRequest = players.find(p => p.reg_number === loggedInUserRegNumber)
      if (!loggedInUserInRequest) {
        errors.push(`You must be included in the team to create it.`)
      } else {
        const isLoggedInUserCaptain = loggedInUserInRequest.captain_in && 
          Array.isArray(loggedInUserInRequest.captain_in) && 
          loggedInUserInRequest.captain_in.includes(sport)
        
        if (!isLoggedInUserCaptain) {
          errors.push(`You can only create teams for sports where you are assigned as captain. You are not assigned as captain for ${sport}.`)
        }
      }
    }

    if (errors.length > 0) {
      return res.status(400).json({ 
        success: false, 
        error: errors.join('; ')
      })
    }

    res.json({ 
      success: true, 
      message: 'All players can participate'
    })
  } catch (error) {
    console.error('Error validating participations:', error)
    res.status(500).json({ 
      success: false, 
      error: 'Failed to validate participations',
      details: error.message 
    })
  }
})

// API endpoint to update participated_in field for team events
app.post('/api/update-team-participation', authenticateToken, (req, res) => {
  try {
    let { reg_numbers, sport, team_name } = req.body

    // Trim fields
    sport = sport?.trim()
    team_name = team_name?.trim()

    // Validate required fields
    if (!reg_numbers || !Array.isArray(reg_numbers) || reg_numbers.length === 0 || !sport || !team_name) {
      return res.status(400).json({ 
        success: false, 
        error: 'Registration numbers array, sport, and team name are required' 
      })
    }

    // Trim and validate team name
    if (team_name.length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Team name cannot be empty' 
      })
    }

    // Trim reg_numbers array
    reg_numbers = reg_numbers.map(rn => rn?.trim()).filter(rn => rn)

    // Check for duplicate players in the team
    const regNumberSet = new Set()
    const duplicates = []
    for (const reg_number of reg_numbers) {
      if (regNumberSet.has(reg_number)) {
        duplicates.push(reg_number)
      } else {
        regNumberSet.add(reg_number)
      }
    }
    if (duplicates.length > 0) {
      return res.status(400).json({ 
        success: false, 
        error: `Duplicate players found in team: ${duplicates.join(', ')}. Each player can only be selected once.` 
      })
    }

    // Read existing data
    let players = []
    if (fs.existsSync(playersJsonPath)) {
      const fileContent = fs.readFileSync(playersJsonPath, 'utf8')
      players = JSON.parse(fileContent)
    }

    // Validate all players exist and have same gender and year
    const playerData = []
    const errors = []

    for (const reg_number of reg_numbers) {
      const player = players.find(p => p.reg_number === reg_number)
      if (!player) {
        errors.push(`Player with reg_number ${reg_number} not found`)
        continue
      }
      playerData.push(player)
    }

    if (errors.length > 0) {
      return res.status(400).json({ 
        success: false, 
        error: errors.join('; ')
      })
    }

    // Check that all players have the same gender
    if (playerData.length > 0) {
      const firstGender = playerData[0].gender
      const genderMismatches = playerData
        .filter(p => p.gender !== firstGender)
        .map(p => `${p.full_name} (${p.reg_number})`)
      
      if (genderMismatches.length > 0) {
        return res.status(400).json({ 
          success: false, 
          error: `Gender mismatch: ${genderMismatches.join(', ')} must have the same gender (${firstGender}) as other team members.` 
        })
      }

      // Check that all players have the same year
      const firstYear = playerData[0].year
      const yearMismatches = playerData
        .filter(p => p.year !== firstYear)
        .map(p => `${p.full_name} (${p.reg_number})`)
      
      if (yearMismatches.length > 0) {
        return res.status(400).json({ 
          success: false, 
          error: `Year mismatch: ${yearMismatches.join(', ')} must be in the same year (${firstYear}) as other team members.` 
        })
      }
    }

    // Check for multiple captains in the same team
    // A team can only have exactly one captain for a specific sport
    const captainsInTeam = playerData.filter(p => 
      p.captain_in && 
      Array.isArray(p.captain_in) && 
      p.captain_in.includes(sport)
    )

    if (captainsInTeam.length > 1) {
      const captainNames = captainsInTeam.map(p => `${p.full_name} (${p.reg_number})`)
      return res.status(400).json({ 
        success: false, 
        error: `Multiple captains found in the same team: ${captainNames.join(', ')}. A team can only have exactly one captain for ${sport}.` 
      })
    }

    // Validate that exactly one captain is in the team
    if (captainsInTeam.length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: `Team must have exactly one captain for ${sport}. At least one player in the team must be assigned as captain for this sport.` 
      })
    }

    // Validate that the logged-in user (from JWT token) is the captain for this sport
    // Only the captain assigned to a sport can create teams for that sport
    const loggedInUserRegNumber = req.user?.reg_number
    if (loggedInUserRegNumber) {
      const loggedInUserInTeam = playerData.find(p => p.reg_number === loggedInUserRegNumber)
      if (!loggedInUserInTeam) {
        return res.status(403).json({ 
          success: false, 
          error: `You must be included in the team to create it.` 
        })
      }
      
      const isLoggedInUserCaptain = loggedInUserInTeam.captain_in && 
        Array.isArray(loggedInUserInTeam.captain_in) && 
        loggedInUserInTeam.captain_in.includes(sport)
      
      if (!isLoggedInUserCaptain) {
        return res.status(403).json({ 
          success: false, 
          error: `You can only create teams for sports where you are assigned as captain. You are not assigned as captain for ${sport}.` 
        })
      }
    }

    // Check if there's already a captain in the existing team (if team already exists)
    // Find all players who are already in this team for this sport
    const existingTeamMembers = players.filter(s => {
      if (!s.participated_in || !Array.isArray(s.participated_in)) {
        return false
      }
      const participation = s.participated_in.find(
        p => p.sport === sport && p.team_name === team_name
      )
      return !!participation
    })

    // Check if any existing team member is a captain for this sport
    const existingCaptains = existingTeamMembers.filter(s => 
      s.captain_in && 
      Array.isArray(s.captain_in) && 
      s.captain_in.includes(sport)
    )

    // If there's already a captain in the team, and we're trying to add another captain
    if (existingCaptains.length > 0 && captainsInTeam.length > 0) {
      const existingCaptainName = existingCaptains[0].full_name
      const newCaptainName = captainsInTeam[0].full_name
      return res.status(400).json({ 
        success: false, 
        error: `Team "${team_name}" already has a captain (${existingCaptainName}) for ${sport}. Cannot add another captain (${newCaptainName}). A team can only have one captain.` 
      })
    }

    const updatedPlayers = []

    // Process each player
    for (const reg_number of reg_numbers) {
      const playerIndex = players.findIndex(p => p.reg_number === reg_number)
      if (playerIndex === -1) {
        errors.push(`Player with reg_number ${reg_number} not found`)
        continue
      }

      // Initialize participated_in array if it doesn't exist
      if (!players[playerIndex].participated_in) {
        players[playerIndex].participated_in = []
      }

      // Check for duplicate sport entries in participated_in array (uniqueness check)
      const sportSet = new Set(players[playerIndex].participated_in.map(p => p.sport))
      if (sportSet.size !== players[playerIndex].participated_in.length) {
        errors.push(`${players[playerIndex].full_name} (${reg_number}) has duplicate sport entries in participated_in array. Please fix the data first.`)
        continue
      }

      // Check maximum limit: participated_in array can have maximum 10 unique entries (based on sport name)
      const currentParticipationsCount = players[playerIndex].participated_in.length
      if (currentParticipationsCount >= 10) {
        errors.push(`${players[playerIndex].full_name} (${reg_number}) has reached maximum 10 participations (based on unique sport names). Please remove a participation first.`)
        continue
      }

      // Check if already participated in this sport (for team events, player can only be in one team per sport)
      const existingParticipation = players[playerIndex].participated_in.find(
        p => p.sport === sport
      )

      if (existingParticipation) {
        if (existingParticipation.team_name) {
          // Check if this player is a captain for this sport
          const isCaptain = players[playerIndex].captain_in && 
            Array.isArray(players[playerIndex].captain_in) && 
            players[playerIndex].captain_in.includes(sport)
          
          if (isCaptain) {
            errors.push(`${players[playerIndex].full_name} (${reg_number}) is a captain and has already created a team (${existingParticipation.team_name}) for ${sport}. A captain cannot create multiple teams for the same sport.`)
          } else {
            errors.push(`${players[playerIndex].full_name} (${reg_number}) is already in a team (${existingParticipation.team_name}) for ${sport}. A player can only belong to one team per sport.`)
          }
        } else {
          errors.push(`${players[playerIndex].full_name} (${reg_number}) is already registered for ${sport}`)
        }
        continue
      }

      // Check if this player is a captain for this sport
      const isCaptainForSport = players[playerIndex].captain_in && 
        Array.isArray(players[playerIndex].captain_in) && 
        players[playerIndex].captain_in.includes(sport)
      
      // Count team participations where sport IS in captain_in array (these count towards captain limit)
      const captainTeamParticipations = players[playerIndex].participated_in.filter(
        p => p.team_name && 
        players[playerIndex].captain_in && 
        Array.isArray(players[playerIndex].captain_in) && 
        players[playerIndex].captain_in.includes(p.sport)
      ).length

      // Get captain count
      const captainCount = players[playerIndex].captain_in && Array.isArray(players[playerIndex].captain_in) 
        ? players[playerIndex].captain_in.length 
        : 0

      // Only check limit if this sport IS in captain_in array
      // If player is a captain for this sport, check: team participations (for captain sports) should not exceed captain_in length
      if (isCaptainForSport) {
        if (captainTeamParticipations >= captainCount) {
          errors.push(`${players[playerIndex].full_name} (${reg_number}) has reached maximum team participations for captain sports (${captainCount}). Maximum team participations allowed for sports in captain_in array is equal to captain roles (${captainCount}).`)
          continue
        }
      }
      // If player is NOT a captain for this sport, they can still join the team (no limit check)

      // Add sport to participated_in array with team_name
      players[playerIndex].participated_in.push({ sport, team_name })
      updatedPlayers.push(players[playerIndex].reg_number)
    }

    // Write back to file
    fs.writeFileSync(playersJsonPath, JSON.stringify(players, null, 2))

    if (errors.length > 0) {
      return res.status(400).json({ 
        success: false, 
        error: errors.join('; '),
        updated_count: updatedPlayers.length
      })
    }

    res.json({ 
      success: true, 
      message: `Participation updated successfully for ${updatedPlayers.length} player(s)`,
      updated_count: updatedPlayers.length
    })
  } catch (error) {
    console.error('Error updating team participation:', error)
    res.status(500).json({ 
      success: false, 
      error: 'Failed to update team participation',
      details: error.message 
    })
  }
})

// API endpoint to update participated_in field
app.post('/api/update-participation', authenticateToken, (req, res) => {
  try {
    let { reg_number, sport } = req.body

    // Trim fields
    reg_number = reg_number?.trim()
    sport = sport?.trim()

    // Validate required fields
    if (!reg_number || !sport) {
      return res.status(400).json({ 
        success: false, 
        error: 'Registration number and sport are required' 
      })
    }

    // List of Team Events sports (individual registration not allowed)
    const teamSports = [
      'Cricket', 'Volleyball', 'Badminton', 'Table Tennis', 'Kabaddi', 
      'Relay 4×100 m', 'Relay 4×400 m'
    ]

    // Check if the sport is a Team Event (individual registration not allowed)
    if (teamSports.includes(sport)) {
      return res.status(400).json({ 
        success: false, 
        error: `${sport} is a Team Event. Individual registration is not allowed. Please register as a team.` 
      })
    }

    // Read existing data
    let players = []
    if (fs.existsSync(playersJsonPath)) {
      const fileContent = fs.readFileSync(playersJsonPath, 'utf8')
      players = JSON.parse(fileContent)
    }

    // Find player
    const playerIndex = players.findIndex(p => p.reg_number === reg_number)
    if (playerIndex === -1) {
      return res.status(404).json({ 
        success: false, 
        error: 'Player not found' 
      })
    }

    // Initialize participated_in array if it doesn't exist
    if (!players[playerIndex].participated_in) {
      players[playerIndex].participated_in = []
    }

    // Check for duplicate sport entries in participated_in array (uniqueness check)
    const sportSet = new Set(players[playerIndex].participated_in.map(p => p.sport))
    if (sportSet.size !== players[playerIndex].participated_in.length) {
      return res.status(400).json({ 
        success: false, 
        error: 'participated_in array contains duplicate sport entries. Please fix the data first.' 
      })
    }

    // Check maximum limit: participated_in array can have maximum 10 unique entries (based on sport name)
    const currentParticipationsCount = players[playerIndex].participated_in.length
    if (currentParticipationsCount >= 10) {
      return res.status(400).json({ 
        success: false, 
        error: 'Maximum 10 participations allowed (based on unique sport names). Please remove a participation first.' 
      })
    }

    // Check if already participated in this sport (same sport cannot be participated twice)
    const existingParticipation = players[playerIndex].participated_in.find(
      p => p.sport === sport
    )

    if (existingParticipation) {
      return res.status(400).json({ 
        success: false, 
        error: `You are already registered for ${sport}. Same sport cannot be participated twice.` 
      })
    }

    // Count non-team participations (entries without team_name)
    const nonTeamParticipations = players[playerIndex].participated_in.filter(
      p => !p.team_name
    ).length

    // Get captain count
    const captainCount = players[playerIndex].captain_in && Array.isArray(players[playerIndex].captain_in) 
      ? players[playerIndex].captain_in.length 
      : 0
    
    // Check maximum limit: (captain_in length + non-team participated_in) should not exceed 10
    if (captainCount + nonTeamParticipations >= 10) {
      const remainingSlots = 10 - captainCount
      if (remainingSlots <= 0) {
        return res.status(400).json({ 
          success: false, 
          error: `Maximum limit reached. You are a captain in ${captainCount} sport(s). You cannot register for any non-team events. Total (captain roles + non-team participations) cannot exceed 10.` 
        })
      } else {
        return res.status(400).json({ 
          success: false, 
          error: `Maximum limit reached. You are a captain in ${captainCount} sport(s) and have ${nonTeamParticipations} non-team participation(s). You can only register for ${remainingSlots} more non-team event(s). Total (captain roles + non-team participations) cannot exceed 10.` 
        })
      }
    }

    // Add sport to participated_in array (without team_name for individual events)
    players[playerIndex].participated_in.push({ sport })

    // Write back to file
    fs.writeFileSync(playersJsonPath, JSON.stringify(players, null, 2))

    // Return player data (excluding password for security)
    const { password: _, ...playerData } = players[playerIndex]

    res.json({ 
      success: true, 
      message: `Participation updated successfully for ${sport}`,
      player: playerData
    })
  } catch (error) {
    console.error('Error updating participation:', error)
    res.status(500).json({ 
      success: false, 
      error: 'Failed to update participation',
      details: error.message 
    })
  }
})

// API endpoint for login
app.post('/api/login', (req, res) => {
  try {
    let { reg_number, password } = req.body

    // Trim fields
    reg_number = reg_number?.trim()
    password = password?.trim()

    // Validate required fields
    if (!reg_number || !password) {
      return res.status(400).json({ 
        success: false, 
        error: 'Registration number and password are required' 
      })
    }

    // Read existing data
    let players = []
    if (fs.existsSync(playersJsonPath)) {
      const fileContent = fs.readFileSync(playersJsonPath, 'utf8')
      players = JSON.parse(fileContent)
    }

    // Find player with matching reg_number
    const player = players.find(p => p.reg_number === reg_number)

    if (!player) {
      return res.status(401).json({ 
        success: false, 
        error: 'Invalid registration number or password' 
      })
    }

    // Check password
    if (player.password !== password) {
      return res.status(401).json({ 
        success: false, 
        error: 'Invalid registration number or password' 
      })
    }

    // Initialize participated_in and captain_in if they don't exist
    if (!player.participated_in) {
      player.participated_in = []
    }
    if (!player.captain_in) {
      player.captain_in = []
    }

    // Generate JWT token
    const tokenPayload = {
      reg_number: player.reg_number,
      full_name: player.full_name,
      isAdmin: player.reg_number === 'admin'
    }

    const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN })

    // Return player data (excluding password for security) and token
    const { password: _, ...playerData } = player

    res.json({ 
      success: true, 
      message: 'Login successful',
      player: playerData,
      token: token
    })
  } catch (error) {
    console.error('Error during login:', error)
    res.status(500).json({ 
      success: false, 
      error: 'Failed to process login',
      details: error.message 
    })
  }
})

// API endpoint to save player data
app.post('/api/save-player', (req, res) => {
  try {
    let { reg_number, full_name, gender, department_branch, year, mobile_number, email_id, password } = req.body

    // Trim all string fields
    reg_number = reg_number?.trim()
    full_name = full_name?.trim()
    gender = gender?.trim()
    department_branch = department_branch?.trim()
    year = year?.trim()
    mobile_number = mobile_number?.trim()
    email_id = email_id?.trim()
    password = password?.trim()

    // Validate required fields
    if (!reg_number || !full_name || !gender || !department_branch || !year || !mobile_number || !email_id || !password) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required fields' 
      })
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email_id)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid email format' 
      })
    }

    // Validate phone number (should be numeric and reasonable length)
    const phoneRegex = /^[0-9]{10}$/
    if (!phoneRegex.test(mobile_number)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid mobile number. Must be 10 digits.' 
      })
    }

    // Validate gender
    const validGenders = ['Male', 'Female']
    if (!validGenders.includes(gender)) {
      return res.status(400).json({ 
        success: false, 
        error: `Invalid gender. Must be one of: ${validGenders.join(', ')}` 
      })
    }

    // Validate department
    const validDepartments = ['CSE', 'CSE (AI)', 'ECE', 'EE', 'CE', 'ME', 'MTE']
    if (!validDepartments.includes(department_branch)) {
      return res.status(400).json({ 
        success: false, 
        error: `Invalid department/branch. Must be one of: ${validDepartments.join(', ')}` 
      })
    }

    // Validate year
    const validYears = ['1st Year (2025)', '2nd Year (2024)', '3rd Year (2023)', '4th Year (2022)']
    if (!validYears.includes(year)) {
      return res.status(400).json({ 
        success: false, 
        error: `Invalid year. Must be one of: ${validYears.join(', ')}` 
      })
    }

    // Read existing data
    let players = []
    if (fs.existsSync(playersJsonPath)) {
      const fileContent = fs.readFileSync(playersJsonPath, 'utf8')
      players = JSON.parse(fileContent)
    }

    // Check if player with same reg_number already exists
    const existingIndex = players.findIndex(s => s.reg_number === reg_number)
    if (existingIndex !== -1) {
      // Reject duplicate registration
      return res.status(409).json({ 
        success: false, 
        error: 'Registration number already exists. Please use a different registration number.',
        code: 'DUPLICATE_REG_NUMBER'
      })
    }

    // Create new player object (use trimmed values)
    const newPlayer = {
      reg_number,
      full_name,
      gender,
      department_branch,
      year,
      mobile_number,
      email_id,
      password,
      participated_in: [],
      captain_in: [],
    }
    
    // Add to array
    players.push(newPlayer)

    // Write back to file
    fs.writeFileSync(playersJsonPath, JSON.stringify(players, null, 2))

    res.json({ 
      success: true, 
      message: 'Player data saved successfully',
      player: newPlayer
    })
  } catch (error) {
    console.error('Error saving player data:', error)
    res.status(500).json({ 
      success: false, 
      error: 'Failed to save player data',
      details: error.message 
    })
  }
})

// API endpoint to save multiple players (for team events)
app.post('/api/save-players', (req, res) => {
  try {
    let { players } = req.body

    if (!Array.isArray(players) || players.length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid players data' 
      })
    }

    // Define valid values
    const validGenders = ['Male', 'Female']
    const validDepartments = ['CSE', 'CSE (AI)', 'ECE', 'EE', 'CE', 'ME', 'MTE']
    const validYears = ['1st Year (2025)', '2nd Year (2024)', '3rd Year (2023)', '4th Year (2022)']
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    const phoneRegex = /^[0-9]{10}$/

    // Validate and trim each player
    for (let i = 0; i < players.length; i++) {
      const player = players[i]
      
      // Trim all fields
      player.reg_number = player.reg_number?.trim()
      player.full_name = player.full_name?.trim()
      player.gender = player.gender?.trim()
      player.department_branch = player.department_branch?.trim()
      player.year = player.year?.trim()
      player.mobile_number = player.mobile_number?.trim()
      player.email_id = player.email_id?.trim()
      player.password = player.password?.trim()

      // Validate required fields
      if (!player.reg_number || !player.full_name || !player.gender || 
          !player.department_branch || !player.year || !player.mobile_number || !player.email_id || !player.password) {
        return res.status(400).json({ 
          success: false, 
          error: 'Missing required fields in one or more players' 
        })
      }

      // Validate email format
      if (!emailRegex.test(player.email_id)) {
        return res.status(400).json({ 
          success: false, 
          error: `Invalid email format for player ${i + 1}: ${player.email_id}` 
        })
      }

      // Validate phone number
      if (!phoneRegex.test(player.mobile_number)) {
        return res.status(400).json({ 
          success: false, 
          error: `Invalid mobile number for player ${i + 1}. Must be 10 digits.` 
        })
      }

      // Validate gender
      if (!validGenders.includes(player.gender)) {
        return res.status(400).json({ 
          success: false, 
          error: `Invalid gender for player ${i + 1}. Must be one of: ${validGenders.join(', ')}` 
        })
      }

      // Validate department
      if (!validDepartments.includes(player.department_branch)) {
        return res.status(400).json({ 
          success: false, 
          error: `Invalid department/branch for player ${i + 1}. Must be one of: ${validDepartments.join(', ')}` 
        })
      }

      // Validate year
      if (!validYears.includes(player.year)) {
        return res.status(400).json({ 
          success: false, 
          error: `Invalid year for player ${i + 1}. Must be one of: ${validYears.join(', ')}` 
        })
      }
    }

    // Read existing data
    let existingPlayers = []
    if (fs.existsSync(playersJsonPath)) {
      const fileContent = fs.readFileSync(playersJsonPath, 'utf8')
      existingPlayers = JSON.parse(fileContent)
    }

    // Check for duplicates within the incoming array
    const regNumbers = new Set()
    for (const player of players) {
      if (regNumbers.has(player.reg_number)) {
        return res.status(409).json({ 
          success: false, 
          error: `Duplicate registration number found in the provided data: ${player.reg_number}`,
          code: 'DUPLICATE_REG_NUMBER'
        })
      }
      regNumbers.add(player.reg_number)
    }

    // Check for duplicates against existing players
    const existingRegNumbers = new Set(existingPlayers.map(s => s.reg_number))
    for (const player of players) {
      if (existingRegNumbers.has(player.reg_number)) {
        return res.status(409).json({ 
          success: false, 
          error: `Registration number already exists: ${player.reg_number}`,
          code: 'DUPLICATE_REG_NUMBER'
        })
      }
    }

    // Add new players
    existingPlayers.push(...players)

    // Write back to file
    fs.writeFileSync(playersJsonPath, JSON.stringify(existingPlayers, null, 2))

    res.json({ 
      success: true, 
      message: `${players.length} player(s) saved successfully`,
      count: players.length
    })
  } catch (error) {
    console.error('Error saving players data:', error)
    res.status(500).json({ 
      success: false, 
      error: 'Failed to save players data',
      details: error.message 
    })
  }
})

// API endpoint to remove participation for non-team events
app.delete('/api/remove-participation', authenticateToken, requireAdmin, (req, res) => {
  try {
    let { reg_number, sport } = req.body

    // Trim fields
    reg_number = reg_number?.trim()
    sport = sport?.trim()

    // Validate required fields
    if (!reg_number || !sport) {
      return res.status(400).json({ 
        success: false, 
        error: 'Registration number and sport are required' 
      })
    }

    // Read existing data
    let players = []
    if (fs.existsSync(playersJsonPath)) {
      const fileContent = fs.readFileSync(playersJsonPath, 'utf8')
      players = JSON.parse(fileContent)
    }

    // Find player
    const playerIndex = players.findIndex(p => p.reg_number === reg_number)
    if (playerIndex === -1) {
      return res.status(404).json({ 
        success: false, 
        error: 'Player not found' 
      })
    }

    // Initialize participated_in array if it doesn't exist
    if (!players[playerIndex].participated_in) {
      players[playerIndex].participated_in = []
    }

    // Find the participation entry for this sport (non-team event - no team_name)
    const participationIndex = players[playerIndex].participated_in.findIndex(
      p => p.sport === sport && !p.team_name
    )

    if (participationIndex === -1) {
      return res.status(404).json({ 
        success: false, 
        error: `Player is not registered for ${sport} as a non-team event` 
      })
    }

    // Remove the participation entry
    players[playerIndex].participated_in.splice(participationIndex, 1)

    // Write back to file
    fs.writeFileSync(playersJsonPath, JSON.stringify(players, null, 2))

    // Return player data (excluding password for security)
    const { password: _, ...playerData } = players[playerIndex]

    res.json({ 
      success: true, 
      message: `Participation removed successfully for ${sport}`,
      player: playerData
    })
  } catch (error) {
    console.error('Error removing participation:', error)
    res.status(500).json({ 
      success: false, 
      error: 'Failed to remove participation',
      details: error.message 
    })
  }
})

// API endpoint to get all teams for a specific sport
app.get('/api/teams/:sport', authenticateToken, (req, res) => {
  try {
    // Decode the sport name from URL parameter
    let sport = decodeURIComponent(req.params.sport)
    console.log('Received request for teams - sport:', sport)

    if (!sport) {
      return res.status(400).json({ 
        success: false, 
        error: 'Sport name is required' 
      })
    }

    // Read existing data
    let players = []
    if (fs.existsSync(playersJsonPath)) {
      const fileContent = fs.readFileSync(playersJsonPath, 'utf8')
      players = JSON.parse(fileContent)
    }

    // Filter out admin user
    const nonAdminPlayers = players.filter(p => p.reg_number !== 'admin')

    // Group players by team name for the specified sport
    const teamsMap = new Map()

    for (const player of nonAdminPlayers) {
      if (!player.participated_in || !Array.isArray(player.participated_in)) {
        continue
      }

      // Find participation in this sport with a team_name
      // Use exact match for sport name
      const participation = player.participated_in.find(
        p => p.sport === sport && p.team_name
      )

      if (participation && participation.team_name) {
        const teamName = participation.team_name

        // Initialize team if it doesn't exist
        if (!teamsMap.has(teamName)) {
          teamsMap.set(teamName, [])
        }

        // Add player to team (excluding password)
        const { password: _, ...playerData } = player
        teamsMap.get(teamName).push(playerData)
      }
    }

    // Convert map to array of teams
    const teams = Array.from(teamsMap.entries()).map(([teamName, players]) => ({
      team_name: teamName,
      players: players,
      player_count: players.length
    }))

    // Sort teams by team name
    teams.sort((a, b) => a.team_name.localeCompare(b.team_name))

    console.log(`Found ${teams.length} teams for sport: ${sport}`)

    res.json({ 
      success: true, 
      sport: sport,
      teams: teams,
      total_teams: teams.length
    })
  } catch (error) {
    console.error('Error getting teams:', error)
    res.status(500).json({ 
      success: false, 
      error: 'Failed to get teams',
      details: error.message 
    })
  }
})

// API endpoint to get all participants for a specific sport (non-team events)
app.get('/api/participants/:sport', authenticateToken, requireAdmin, (req, res) => {
  try {
    // Decode the sport name from URL parameter
    let sport = decodeURIComponent(req.params.sport)
    console.log('Received request for participants - sport:', sport)

    if (!sport) {
      return res.status(400).json({ 
        success: false, 
        error: 'Sport name is required' 
      })
    }

    // Read existing data
    let players = []
    if (fs.existsSync(playersJsonPath)) {
      const fileContent = fs.readFileSync(playersJsonPath, 'utf8')
      players = JSON.parse(fileContent)
    }

    // Filter out admin user
    const nonAdminPlayers = players.filter(p => p.reg_number !== 'admin')

    // Find all players who have participated in this sport (non-team events don't have team_name)
    const participants = []

    for (const player of nonAdminPlayers) {
      if (!player.participated_in || !Array.isArray(player.participated_in)) {
        continue
      }

      // Find participation in this sport without team_name (individual/cultural events)
      const participation = player.participated_in.find(
        p => p.sport === sport && !p.team_name
      )

      if (participation) {
        // Add player to participants list (excluding password)
        const { password: _, ...playerData } = player
        participants.push(playerData)
      }
    }

    // Sort participants by name
    participants.sort((a, b) => a.full_name.localeCompare(b.full_name))

    res.json({ 
      success: true, 
      sport: sport,
      participants: participants,
      total_participants: participants.length
    })
  } catch (error) {
    console.error('Error getting participants:', error)
    res.status(500).json({ 
      success: false, 
      error: 'Failed to get participants',
      details: error.message 
    })
  }
})

// API endpoint to update/replace a player in a team
app.post('/api/update-team-player', authenticateToken, requireAdmin, (req, res) => {
  try {
    let { team_name, sport, old_reg_number, new_reg_number } = req.body

    // Trim fields
    sport = sport?.trim()
    team_name = team_name?.trim()
    old_reg_number = old_reg_number?.trim()
    new_reg_number = new_reg_number?.trim()

    // Validate required fields
    if (!team_name || !sport || !old_reg_number || !new_reg_number) {
      return res.status(400).json({ 
        success: false, 
        error: 'Team name, sport, old registration number, and new registration number are required' 
      })
    }

    // Read existing data
    let players = []
    if (fs.existsSync(playersJsonPath)) {
      const fileContent = fs.readFileSync(playersJsonPath, 'utf8')
      players = JSON.parse(fileContent)
    }

    // Find old player
    const oldPlayerIndex = players.findIndex(s => s.reg_number === old_reg_number)
    if (oldPlayerIndex === -1) {
      return res.status(404).json({ 
        success: false, 
        error: 'Old player not found' 
      })
    }

    // Find new player
    const newPlayerIndex = players.findIndex(s => s.reg_number === new_reg_number)
    if (newPlayerIndex === -1) {
      return res.status(404).json({ 
        success: false, 
        error: 'New player not found' 
      })
    }

    // Check if old player is in the team
    const oldPlayer = players[oldPlayerIndex]
    if (!oldPlayer.participated_in || !Array.isArray(oldPlayer.participated_in)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Old player is not registered for any sport' 
      })
    }

    const oldPlayerParticipation = oldPlayer.participated_in.find(
      p => p.sport === sport && p.team_name === team_name
    )

    if (!oldPlayerParticipation) {
      return res.status(400).json({ 
        success: false, 
        error: 'Old player is not in this team' 
      })
    }

    // Get all current team members (excluding the old player)
    const currentTeamMembers = players.filter(s => {
      if (!s.participated_in || !Array.isArray(s.participated_in)) {
        return false
      }
      const participation = s.participated_in.find(
        p => p.sport === sport && p.team_name === team_name
      )
      return !!participation && s.reg_number !== old_reg_number
    })

    // Validate new player
    const newPlayer = players[newPlayerIndex]

    // Check if new player is already in this team
    if (currentTeamMembers.some(m => m.reg_number === new_reg_number)) {
      return res.status(400).json({ 
        success: false, 
        error: 'New player is already in this team' 
      })
    }

    // Check if new player has already participated in this sport
    if (newPlayer.participated_in && Array.isArray(newPlayer.participated_in)) {
      const existingParticipation = newPlayer.participated_in.find(
        p => p.sport === sport
      )
      if (existingParticipation) {
        if (existingParticipation.team_name) {
          return res.status(400).json({ 
            success: false, 
            error: `New player is already in a team (${existingParticipation.team_name}) for ${sport}. A player can only belong to one team per sport.` 
          })
        } else {
          return res.status(400).json({ 
            success: false, 
            error: `New player is already registered for ${sport}` 
          })
        }
      }
    }

    // Check for duplicate sport entries in participated_in array (uniqueness check)
    if (newPlayer.participated_in && Array.isArray(newPlayer.participated_in)) {
      const sportSet = new Set(newPlayer.participated_in.map(p => p.sport))
      if (sportSet.size !== newPlayer.participated_in.length) {
        return res.status(400).json({ 
          success: false, 
          error: 'New player has duplicate sport entries in participated_in array. Please fix the data first.' 
        })
      }

      // Check maximum limit: participated_in array can have maximum 10 unique entries (based on sport name)
      if (newPlayer.participated_in.length >= 10) {
        return res.status(400).json({ 
          success: false, 
          error: 'New player has reached maximum 10 participations (based on unique sport names). Please remove a participation first.' 
        })
      }
    }

    // Count non-team participations (entries without team_name)
    const nonTeamParticipations = newPlayer.participated_in && Array.isArray(newPlayer.participated_in)
      ? newPlayer.participated_in.filter(p => !p.team_name).length
      : 0

    // Check if new player is a captain for this sport
    const isNewPlayerCaptainForSport = newPlayer.captain_in && 
      Array.isArray(newPlayer.captain_in) && 
      newPlayer.captain_in.includes(sport)

    // Count team participations where sport IS in captain_in array (these count towards captain limit)
    const captainTeamParticipations = newPlayer.participated_in && Array.isArray(newPlayer.participated_in)
      ? newPlayer.participated_in.filter(
          p => p.team_name && 
          newPlayer.captain_in && 
          Array.isArray(newPlayer.captain_in) && 
          newPlayer.captain_in.includes(p.sport)
        ).length
      : 0

    // Get captain count
    const captainCount = newPlayer.captain_in && Array.isArray(newPlayer.captain_in) 
      ? newPlayer.captain_in.length 
      : 0

    // Only check limit if new player IS a captain for this sport
    // If new player is a captain for this sport, check: team participations (for captain sports) should not exceed captain_in length
    if (isNewPlayerCaptainForSport) {
      if (captainTeamParticipations >= captainCount) {
        return res.status(400).json({ 
          success: false, 
          error: `New player has reached maximum team participations for captain sports (${captainCount}). Maximum team participations allowed for sports in captain_in array is equal to captain roles (${captainCount}).` 
        })
      }
    }
    // If new player is NOT a captain for this sport, they can still join the team (no limit check)

    // Check maximum limit: (captain_in length + non-team participated_in) should not exceed 10
    if (captainCount + nonTeamParticipations >= 10) {
      return res.status(400).json({ 
        success: false, 
        error: `New player has reached maximum limit. Total (captain roles + non-team participations) cannot exceed 10. Current: ${captainCount} captain role(s) + ${nonTeamParticipations} non-team participation(s).` 
      })
    }

    // Validate gender match with team
    if (currentTeamMembers.length > 0) {
      const teamGender = currentTeamMembers[0].gender
      if (newPlayer.gender !== teamGender) {
        return res.status(400).json({ 
          success: false, 
          error: `Gender mismatch: New player must have the same gender (${teamGender}) as other team members.` 
        })
      }

      // Validate year match with team
      const teamYear = currentTeamMembers[0].year
      if (newPlayer.year !== teamYear) {
        return res.status(400).json({ 
          success: false, 
          error: `Year mismatch: New player must be in the same year (${teamYear}) as other team members.` 
        })
      }
    }

    // Check for multiple captains in the team
    const isNewPlayerCaptain = newPlayer.captain_in && 
      Array.isArray(newPlayer.captain_in) && 
      newPlayer.captain_in.includes(sport)

    const existingCaptains = currentTeamMembers.filter(s => 
      s.captain_in && 
      Array.isArray(s.captain_in) && 
      s.captain_in.includes(sport)
    )

    if (existingCaptains.length > 0 && isNewPlayerCaptain) {
      const existingCaptainName = existingCaptains[0].full_name
      return res.status(400).json({ 
        success: false, 
        error: `Team already has a captain (${existingCaptainName}) for ${sport}. Cannot add another captain. A team can only have one captain.` 
      })
    }

    // Remove old player from team
    const oldPlayerPartIndex = oldPlayer.participated_in.findIndex(
      p => p.sport === sport && p.team_name === team_name
    )
    if (oldPlayerPartIndex !== -1) {
      oldPlayer.participated_in.splice(oldPlayerPartIndex, 1)
    }

    // Add new player to team
    if (!newPlayer.participated_in) {
      newPlayer.participated_in = []
    }
    newPlayer.participated_in.push({ sport, team_name })

    // Write back to file
    fs.writeFileSync(playersJsonPath, JSON.stringify(players, null, 2))

    // Return updated data
    const { password: _, ...newPlayerData } = newPlayer

    res.json({ 
      success: true, 
      message: `Player updated successfully in team ${team_name}`,
      old_player: { reg_number: old_reg_number, full_name: oldPlayer.full_name },
      new_player: newPlayerData
    })
  } catch (error) {
    console.error('Error updating team player:', error)
    res.status(500).json({ 
      success: false, 
      error: 'Failed to update team player',
      details: error.message 
    })
  }
})

// API endpoint to delete a team (remove all players' associations to the team)
app.delete('/api/delete-team', authenticateToken, requireAdmin, (req, res) => {
  try {
    let { team_name, sport } = req.body

    // Trim fields
    sport = sport?.trim()
    team_name = team_name?.trim()

    // Validate required fields
    if (!team_name || !sport) {
      return res.status(400).json({ 
        success: false, 
        error: 'Team name and sport are required' 
      })
    }

    // Read existing data
    let players = []
    if (fs.existsSync(playersJsonPath)) {
      const fileContent = fs.readFileSync(playersJsonPath, 'utf8')
      players = JSON.parse(fileContent)
    }

    // Find all players who are in this team
    const teamMembers = []
    let deletedCount = 0

    for (let i = 0; i < players.length; i++) {
      const player = players[i]
      if (!player.participated_in || !Array.isArray(player.participated_in)) {
        continue
      }

      // Find participation in this team
      const participationIndex = player.participated_in.findIndex(
        p => p.sport === sport && p.team_name === team_name
      )

      if (participationIndex !== -1) {
        // Remove this participation
        player.participated_in.splice(participationIndex, 1)
        teamMembers.push({
          reg_number: player.reg_number,
          full_name: player.full_name
        })
        deletedCount++
      }
    }

    if (deletedCount === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Team not found or has no members' 
      })
    }

    // Write back to file
    fs.writeFileSync(playersJsonPath, JSON.stringify(players, null, 2))

    res.json({ 
      success: true, 
      message: `Team "${team_name}" deleted successfully. Removed ${deletedCount} player(s) from the team.`,
      deleted_count: deletedCount,
      team_members: teamMembers
    })
  } catch (error) {
    console.error('Error deleting team:', error)
    res.status(500).json({ 
      success: false, 
      error: 'Failed to delete team',
      details: error.message 
    })
  }
})

// API endpoint to update player data
app.put('/api/update-player', authenticateToken, requireAdmin, (req, res) => {
  try {
    let { reg_number, full_name, gender, department_branch, year, mobile_number, email_id } = req.body

    // Trim all string fields
    reg_number = reg_number?.trim()
    full_name = full_name?.trim()
    gender = gender?.trim()
    department_branch = department_branch?.trim()
    year = year?.trim()
    mobile_number = mobile_number?.trim()
    email_id = email_id?.trim()

    // Validate required fields (password is not required for update)
    if (!reg_number || !full_name || !gender || !department_branch || !year || !mobile_number || !email_id) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required fields' 
      })
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email_id)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid email format' 
      })
    }

    // Validate phone number (should be numeric and reasonable length)
    const phoneRegex = /^[0-9]{10}$/
    if (!phoneRegex.test(mobile_number)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid mobile number. Must be 10 digits.' 
      })
    }

    // Validate gender
    const validGenders = ['Male', 'Female']
    if (!validGenders.includes(gender)) {
      return res.status(400).json({ 
        success: false, 
        error: `Invalid gender. Must be one of: ${validGenders.join(', ')}` 
      })
    }

    // Validate department
    const validDepartments = ['CSE', 'CSE (AI)', 'ECE', 'EE', 'CE', 'ME', 'MTE']
    if (!validDepartments.includes(department_branch)) {
      return res.status(400).json({ 
        success: false, 
        error: `Invalid department/branch. Must be one of: ${validDepartments.join(', ')}` 
      })
    }

    // Validate year
    const validYears = ['1st Year (2025)', '2nd Year (2024)', '3rd Year (2023)', '4th Year (2022)']
    if (!validYears.includes(year)) {
      return res.status(400).json({ 
        success: false, 
        error: `Invalid year. Must be one of: ${validYears.join(', ')}` 
      })
    }

    // Read existing data
    let players = []
    if (fs.existsSync(playersJsonPath)) {
      const fileContent = fs.readFileSync(playersJsonPath, 'utf8')
      players = JSON.parse(fileContent)
    }

    // Find player with matching reg_number
    const playerIndex = players.findIndex(p => p.reg_number === reg_number)
    if (playerIndex === -1) {
      return res.status(404).json({ 
        success: false, 
        error: 'Player not found' 
      })
    }

    // Preserve existing password, participated_in, and captain_in
    const existingPlayer = players[playerIndex]
    const updatedPlayer = {
      ...existingPlayer,
      reg_number, // Keep original reg_number (cannot be changed)
      full_name,
      gender,
      department_branch,
      year,
      mobile_number,
      email_id,
      // Preserve password, participated_in, and captain_in
      password: existingPlayer.password,
      participated_in: existingPlayer.participated_in || [],
      captain_in: existingPlayer.captain_in || [],
    }

    // Update player in array
    players[playerIndex] = updatedPlayer

    // Write back to file
    fs.writeFileSync(playersJsonPath, JSON.stringify(players, null, 2))

    // Return updated player (excluding password)
    const { password: _, ...playerData } = updatedPlayer

    res.json({ 
      success: true, 
      message: 'Player data updated successfully',
      player: playerData
    })
  } catch (error) {
    console.error('Error updating player data:', error)
    res.status(500).json({ 
      success: false, 
      error: 'Failed to update player data',
      details: error.message 
    })
  }
})

// API endpoint to export players data to Excel
app.get('/api/export-excel', authenticateToken, requireAdmin, (req, res) => {
  try {
    // Read existing data
    let players = []
    if (fs.existsSync(playersJsonPath)) {
      const fileContent = fs.readFileSync(playersJsonPath, 'utf8')
      players = JSON.parse(fileContent)
    }

    // Filter out admin user
    const nonAdminPlayers = players.filter(p => p.reg_number !== 'admin')

    // Define all sports in order with exact column headers as specified
    const sportColumns = [
      { header: 'CRICKET', sport: 'Cricket' },
      { header: 'VOLLEYBALL', sport: 'Volleyball' },
      { header: 'BADMINTON', sport: 'Badminton' },
      { header: 'TABLE TENNIS', sport: 'Table Tennis' },
      { header: 'KABADDI', sport: 'Kabaddi' },
      { header: 'RELAY 4×100 M', sport: 'Relay 4×100 m' },
      { header: 'RELAY 4×400 M', sport: 'Relay 4×400 m' },
      { header: 'CARROM', sport: 'Carrom' },
      { header: 'CHESS', sport: 'Chess' },
      { header: 'SPRINT 100 M', sport: 'Sprint 100 m' },
      { header: 'SPRINT 200 M', sport: 'Sprint 200 m' },
      { header: 'SPRINT 400 M', sport: 'Sprint 400 m' },
      { header: 'LONG JUMP', sport: 'Long Jump' },
      { header: 'HIGH JUMP', sport: 'High Jump' },
      { header: 'JAVELIN', sport: 'Javelin' },
      { header: 'SHOT PUT', sport: 'Shot Put' },
      { header: 'DISCUS THROW', sport: 'Discus Throw' },
      { header: 'ESSAY WRITING', sport: 'Essay Writing' },
      { header: 'STORY WRITING', sport: 'Story Writing' },
      { header: 'GROUP DISCUSSION', sport: 'Group Discussion' },
      { header: 'DEBATE', sport: 'Debate' },
      { header: 'EXTEMPORE', sport: 'Extempore' },
      { header: 'QUIZ', sport: 'Quiz' },
      { header: 'DUMB CHARADES', sport: 'Dumb Charades' },
      { header: 'PAINTING', sport: 'Painting' },
      { header: 'SINGING', sport: 'Singing' }
    ]

    // Team sports (can have CAPTAIN or PARTICIPANT)
    const teamSports = [
      'Cricket',
      'Volleyball',
      'Badminton',
      'Table Tennis',
      'Kabaddi',
      'Relay 4×100 m',
      'Relay 4×400 m'
    ]

    // Prepare data for Excel
    const excelData = nonAdminPlayers.map(player => {
      const row = {
        'REG Number': player.reg_number || '',
        'Full Name': player.full_name || '',
        'Gender': player.gender || '',
        'Department/Branch': player.department_branch || '',
        'Year': player.year || '',
        'Mobile Number': player.mobile_number || '',
        'Email Id': player.email_id || ''
      }

      // Add sport columns with exact headers as specified
      sportColumns.forEach(({ header, sport }) => {
        const isTeamSport = teamSports.includes(sport)
        const isCaptain = player.captain_in && 
                         Array.isArray(player.captain_in) && 
                         player.captain_in.includes(sport)
        const isParticipant = player.participated_in && 
                             Array.isArray(player.participated_in) && 
                             player.participated_in.some(p => p.sport === sport)

        if (isTeamSport) {
          // Team sports: CAPTAIN, PARTICIPANT, or NA
          if (isCaptain) {
            row[header] = 'CAPTAIN'
          } else if (isParticipant) {
            row[header] = 'PARTICIPANT'
          } else {
            row[header] = 'NA'
          }
        } else {
          // Individual/Cultural sports: PARTICIPANT or NA
          if (isParticipant) {
            row[header] = 'PARTICIPANT'
          } else {
            row[header] = 'NA'
          }
        }
      })

      return row
    })

    // Create workbook and worksheet
    const worksheet = XLSX.utils.json_to_sheet(excelData)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Players Report')

    // Generate Excel buffer
    const excelBuffer = XLSX.write(workbook, { 
      type: 'buffer', 
      bookType: 'xlsx' 
    })

    // Set response headers
    const filename = `Players_Report_${new Date().toISOString().split('T')[0]}.xlsx`
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)

    // Send Excel file
    res.send(excelBuffer)
  } catch (error) {
    console.error('Error exporting Excel:', error)
    res.status(500).json({ 
      success: false, 
      error: 'Failed to export Excel file',
      details: error.message 
    })
  }
})

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
  console.log(`Players JSON will be saved to: ${playersJsonPath}`)
})

