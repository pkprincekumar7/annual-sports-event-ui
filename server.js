import express from 'express'
import cors from 'cors'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const PORT = 3001

// Middleware
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Ensure json_store directory exists
const jsonStorePath = path.join(__dirname, 'public', 'json_store')
const studentsJsonPath = path.join(jsonStorePath, 'students.json')

if (!fs.existsSync(jsonStorePath)) {
  fs.mkdirSync(jsonStorePath, { recursive: true })
}

// Initialize students.json if it doesn't exist
if (!fs.existsSync(studentsJsonPath)) {
  fs.writeFileSync(studentsJsonPath, JSON.stringify([], null, 2))
}

// API endpoint to get all students
app.get('/api/students', (req, res) => {
  try {
    let students = []
    if (fs.existsSync(studentsJsonPath)) {
      const fileContent = fs.readFileSync(studentsJsonPath, 'utf8')
      students = JSON.parse(fileContent)
    }
    res.json({ success: true, students })
  } catch (error) {
    console.error('Error reading students data:', error)
    res.status(500).json({ 
      success: false, 
      error: 'Failed to read students data',
      details: error.message 
    })
  }
})

// API endpoint to get team sports (for captain assignment)
app.get('/api/sports', (req, res) => {
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

// API endpoint to add captain
app.post('/api/add-captain', (req, res) => {
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
    let students = []
    if (fs.existsSync(studentsJsonPath)) {
      const fileContent = fs.readFileSync(studentsJsonPath, 'utf8')
      students = JSON.parse(fileContent)
    }

    // Find student
    const studentIndex = students.findIndex(s => s.reg_number === reg_number)
    if (studentIndex === -1) {
      return res.status(404).json({ 
        success: false, 
        error: 'Student not found' 
      })
    }

    // Initialize captain_in array if it doesn't exist
    if (!students[studentIndex].captain_in) {
      students[studentIndex].captain_in = []
    }

    // Check if already a captain for this sport
    if (students[studentIndex].captain_in.includes(sport)) {
      return res.status(400).json({ 
        success: false, 
        error: `Student is already a captain for ${sport}` 
      })
    }

    // Check maximum limit of 3 sports for captain
    if (students[studentIndex].captain_in.length >= 3) {
      return res.status(400).json({ 
        success: false, 
        error: 'Maximum 3 sports allowed for being a captain. Please remove a captain assignment first.' 
      })
    }

    // Add sport to captain_in array
    students[studentIndex].captain_in.push(sport)

    // Write back to file
    fs.writeFileSync(studentsJsonPath, JSON.stringify(students, null, 2))

    // Return student data (excluding password for security)
    const { password: _, ...studentData } = students[studentIndex]

    res.json({ 
      success: true, 
      message: `Captain added successfully for ${sport}`,
      student: studentData
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

// API endpoint to validate participations before team registration
app.post('/api/validate-participations', (req, res) => {
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
    let students = []
    if (fs.existsSync(studentsJsonPath)) {
      const fileContent = fs.readFileSync(studentsJsonPath, 'utf8')
      students = JSON.parse(fileContent)
    }

    const errors = []

    // Validate each student
    for (const reg_number of reg_numbers) {
      const student = students.find(s => s.reg_number === reg_number)
      if (!student) {
        errors.push(`Student with reg_number ${reg_number} not found`)
        continue
      }

      // Initialize participated_in array if it doesn't exist
      if (!student.participated_in) {
        student.participated_in = []
      }

      // Check if already participated in this sport (for team events, player can only be in one team per sport)
      const existingParticipation = student.participated_in.find(p => p.sport === sport)
      if (existingParticipation) {
        if (existingParticipation.team_name) {
          // Check if this student is a captain for this sport
          const isCaptain = student.captain_in && Array.isArray(student.captain_in) && student.captain_in.includes(sport)
          if (isCaptain) {
            errors.push(`${student.full_name} (${reg_number}) is a captain and has already created a team (${existingParticipation.team_name}) for ${sport}. A captain cannot create multiple teams for the same sport.`)
          } else {
            errors.push(`${student.full_name} (${reg_number}) is already in a team (${existingParticipation.team_name}) for ${sport}. A player can only belong to one team per sport.`)
          }
        } else {
          errors.push(`${student.full_name} (${reg_number}) is already registered for ${sport}`)
        }
        continue
      }

      // Check maximum limit of 3 participations
      // For captains: team events (as captain) + non-team events = maximum 3
      const captainCount = student.captain_in && Array.isArray(student.captain_in) 
        ? student.captain_in.length 
        : 0
      const currentParticipations = student.participated_in.length
      
      // Total allowed = 3
      // If they are captain in N sports, those count as N participations
      if (currentParticipations + captainCount >= 3) {
        const remainingSlots = 3 - captainCount
        if (remainingSlots <= 0) {
          errors.push(`${student.full_name} (${reg_number}) is a captain in ${captainCount} sport(s) and has reached maximum 3 participations. Cannot register for any more events.`)
        } else {
          errors.push(`${student.full_name} (${reg_number}) is a captain in ${captainCount} sport(s). You can only register for ${remainingSlots} non-team event(s).`)
        }
        continue
      }
    }

    // Check for multiple captains in the same request
    // Note: This is a preliminary check. The actual team validation happens in update-team-participation
    const captainsInRequest = reg_numbers
      .map(rn => students.find(s => s.reg_number === rn))
      .filter(s => s && s.captain_in && Array.isArray(s.captain_in) && s.captain_in.includes(sport))

    if (captainsInRequest.length > 1) {
      const captainNames = captainsInRequest.map(s => `${s.full_name} (${s.reg_number})`)
      errors.push(`Multiple captains found in the same team registration: ${captainNames.join(', ')}. A team can only have one captain for ${sport}.`)
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
app.post('/api/update-team-participation', (req, res) => {
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
    let students = []
    if (fs.existsSync(studentsJsonPath)) {
      const fileContent = fs.readFileSync(studentsJsonPath, 'utf8')
      students = JSON.parse(fileContent)
    }

    // Validate all players exist and have same gender and year
    const playerData = []
    const errors = []

    for (const reg_number of reg_numbers) {
      const student = students.find(s => s.reg_number === reg_number)
      if (!student) {
        errors.push(`Student with reg_number ${reg_number} not found`)
        continue
      }
      playerData.push(student)
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
    // A team can only have one captain for a specific sport
    const captainsInTeam = playerData.filter(p => 
      p.captain_in && 
      Array.isArray(p.captain_in) && 
      p.captain_in.includes(sport)
    )

    if (captainsInTeam.length > 1) {
      const captainNames = captainsInTeam.map(p => `${p.full_name} (${p.reg_number})`)
      return res.status(400).json({ 
        success: false, 
        error: `Multiple captains found in the same team: ${captainNames.join(', ')}. A team can only have one captain for ${sport}.` 
      })
    }

    // Check if there's already a captain in the existing team (if team already exists)
    // Find all students who are already in this team for this sport
    const existingTeamMembers = students.filter(s => {
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

    const updatedStudents = []

    // Process each student
    for (const reg_number of reg_numbers) {
      const studentIndex = students.findIndex(s => s.reg_number === reg_number)
      if (studentIndex === -1) {
        errors.push(`Student with reg_number ${reg_number} not found`)
        continue
      }

      // Initialize participated_in array if it doesn't exist
      if (!students[studentIndex].participated_in) {
        students[studentIndex].participated_in = []
      }

      // Check if already participated in this sport (for team events, player can only be in one team per sport)
      const existingParticipation = students[studentIndex].participated_in.find(
        p => p.sport === sport
      )

      if (existingParticipation) {
        if (existingParticipation.team_name) {
          // Check if this student is a captain for this sport
          const isCaptain = students[studentIndex].captain_in && 
            Array.isArray(students[studentIndex].captain_in) && 
            students[studentIndex].captain_in.includes(sport)
          
          if (isCaptain) {
            errors.push(`${students[studentIndex].full_name} (${reg_number}) is a captain and has already created a team (${existingParticipation.team_name}) for ${sport}. A captain cannot create multiple teams for the same sport.`)
          } else {
            errors.push(`${students[studentIndex].full_name} (${reg_number}) is already in a team (${existingParticipation.team_name}) for ${sport}. A player can only belong to one team per sport.`)
          }
        } else {
          errors.push(`${students[studentIndex].full_name} (${reg_number}) is already registered for ${sport}`)
        }
        continue
      }

      // Check maximum limit of 3 participations
      // For team events: current participations + this new team participation should be <= 3
      // Note: Team events count as 1 participation each
      const currentParticipations = students[studentIndex].participated_in.length
      if (currentParticipations >= 3) {
        errors.push(`${students[studentIndex].full_name} (${reg_number}) has reached maximum 3 participations`)
        continue
      }

      // Add sport to participated_in array with team_name
      students[studentIndex].participated_in.push({ sport, team_name })
      updatedStudents.push(students[studentIndex].reg_number)
    }

    // Write back to file
    fs.writeFileSync(studentsJsonPath, JSON.stringify(students, null, 2))

    if (errors.length > 0) {
      return res.status(400).json({ 
        success: false, 
        error: errors.join('; '),
        updated_count: updatedStudents.length
      })
    }

    res.json({ 
      success: true, 
      message: `Participation updated successfully for ${updatedStudents.length} player(s)`,
      updated_count: updatedStudents.length
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
app.post('/api/update-participation', (req, res) => {
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
    let students = []
    if (fs.existsSync(studentsJsonPath)) {
      const fileContent = fs.readFileSync(studentsJsonPath, 'utf8')
      students = JSON.parse(fileContent)
    }

    // Find student
    const studentIndex = students.findIndex(s => s.reg_number === reg_number)
    if (studentIndex === -1) {
      return res.status(404).json({ 
        success: false, 
        error: 'Student not found' 
      })
    }

    // Initialize participated_in array if it doesn't exist
    if (!students[studentIndex].participated_in) {
      students[studentIndex].participated_in = []
    }

    // Check if already participated in this sport (same sport cannot be participated twice)
    const existingParticipation = students[studentIndex].participated_in.find(
      p => p.sport === sport
    )

    if (existingParticipation) {
      return res.status(400).json({ 
        success: false, 
        error: `You are already registered for ${sport}. Same sport cannot be participated twice.` 
      })
    }

    // Check maximum limit of 3 participations
    // For captains: team events (as captain) + non-team events = maximum 3
    // Calculate: current participations + captain_in count (for team sports they'll participate in)
    const captainCount = students[studentIndex].captain_in && Array.isArray(students[studentIndex].captain_in) 
      ? students[studentIndex].captain_in.length 
      : 0
    const currentParticipations = students[studentIndex].participated_in.length
    
    // Total allowed = 3
    // If they are captain in N sports, those count as N participations
    // So: current participations + captain_in count should be < 3 to allow adding a non-team event
    if (currentParticipations + captainCount >= 3) {
      const remainingSlots = 3 - captainCount
      if (remainingSlots <= 0) {
        return res.status(400).json({ 
          success: false, 
          error: `Maximum 3 participations allowed. You are a captain in ${captainCount} sport(s). You cannot register for any non-team events.` 
        })
      } else {
        return res.status(400).json({ 
          success: false, 
          error: `Maximum 3 participations allowed. You are a captain in ${captainCount} sport(s). You can only register for ${remainingSlots} non-team event(s).` 
        })
      }
    }

    // Add sport to participated_in array (without team_name for individual events)
    students[studentIndex].participated_in.push({ sport })

    // Write back to file
    fs.writeFileSync(studentsJsonPath, JSON.stringify(students, null, 2))

    // Return student data (excluding password for security)
    const { password: _, ...studentData } = students[studentIndex]

    res.json({ 
      success: true, 
      message: `Participation updated successfully for ${sport}`,
      student: studentData
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
    let students = []
    if (fs.existsSync(studentsJsonPath)) {
      const fileContent = fs.readFileSync(studentsJsonPath, 'utf8')
      students = JSON.parse(fileContent)
    }

    // Find student with matching reg_number
    const student = students.find(s => s.reg_number === reg_number)

    if (!student) {
      return res.status(401).json({ 
        success: false, 
        error: 'Invalid registration number or password' 
      })
    }

    // Check password
    if (student.password !== password) {
      return res.status(401).json({ 
        success: false, 
        error: 'Invalid registration number or password' 
      })
    }

    // Initialize participated_in and captain_in if they don't exist
    if (!student.participated_in) {
      student.participated_in = []
    }
    if (!student.captain_in) {
      student.captain_in = []
    }

    // Return student data (excluding password for security)
    const { password: _, ...studentData } = student

    res.json({ 
      success: true, 
      message: 'Login successful',
      student: studentData
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

// API endpoint to save student data
app.post('/api/save-student', (req, res) => {
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
    let students = []
    if (fs.existsSync(studentsJsonPath)) {
      const fileContent = fs.readFileSync(studentsJsonPath, 'utf8')
      students = JSON.parse(fileContent)
    }

    // Check if student with same reg_number already exists
    const existingIndex = students.findIndex(s => s.reg_number === reg_number)
    if (existingIndex !== -1) {
      // Reject duplicate registration
      return res.status(409).json({ 
        success: false, 
        error: 'Registration number already exists. Please use a different registration number.',
        code: 'DUPLICATE_REG_NUMBER'
      })
    }

    // Create new student object (use trimmed values)
    const newStudent = {
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
    students.push(newStudent)

    // Write back to file
    fs.writeFileSync(studentsJsonPath, JSON.stringify(students, null, 2))

    res.json({ 
      success: true, 
      message: 'Student data saved successfully',
      student: newStudent
    })
  } catch (error) {
    console.error('Error saving student data:', error)
    res.status(500).json({ 
      success: false, 
      error: 'Failed to save student data',
      details: error.message 
    })
  }
})

// API endpoint to save multiple students (for team events)
app.post('/api/save-students', (req, res) => {
  try {
    let { students } = req.body

    if (!Array.isArray(students) || students.length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid students data' 
      })
    }

    // Define valid values
    const validGenders = ['Male', 'Female']
    const validDepartments = ['CSE', 'CSE (AI)', 'ECE', 'EE', 'CE', 'ME', 'MTE']
    const validYears = ['1st Year (2025)', '2nd Year (2024)', '3rd Year (2023)', '4th Year (2022)']
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    const phoneRegex = /^[0-9]{10}$/

    // Validate and trim each student
    for (let i = 0; i < students.length; i++) {
      const student = students[i]
      
      // Trim all fields
      student.reg_number = student.reg_number?.trim()
      student.full_name = student.full_name?.trim()
      student.gender = student.gender?.trim()
      student.department_branch = student.department_branch?.trim()
      student.year = student.year?.trim()
      student.mobile_number = student.mobile_number?.trim()
      student.email_id = student.email_id?.trim()
      student.password = student.password?.trim()

      // Validate required fields
      if (!student.reg_number || !student.full_name || !student.gender || 
          !student.department_branch || !student.year || !student.mobile_number || !student.email_id || !student.password) {
        return res.status(400).json({ 
          success: false, 
          error: 'Missing required fields in one or more students' 
        })
      }

      // Validate email format
      if (!emailRegex.test(student.email_id)) {
        return res.status(400).json({ 
          success: false, 
          error: `Invalid email format for student ${i + 1}: ${student.email_id}` 
        })
      }

      // Validate phone number
      if (!phoneRegex.test(student.mobile_number)) {
        return res.status(400).json({ 
          success: false, 
          error: `Invalid mobile number for student ${i + 1}. Must be 10 digits.` 
        })
      }

      // Validate gender
      if (!validGenders.includes(student.gender)) {
        return res.status(400).json({ 
          success: false, 
          error: `Invalid gender for student ${i + 1}. Must be one of: ${validGenders.join(', ')}` 
        })
      }

      // Validate department
      if (!validDepartments.includes(student.department_branch)) {
        return res.status(400).json({ 
          success: false, 
          error: `Invalid department/branch for student ${i + 1}. Must be one of: ${validDepartments.join(', ')}` 
        })
      }

      // Validate year
      if (!validYears.includes(student.year)) {
        return res.status(400).json({ 
          success: false, 
          error: `Invalid year for student ${i + 1}. Must be one of: ${validYears.join(', ')}` 
        })
      }
    }

    // Read existing data
    let existingStudents = []
    if (fs.existsSync(studentsJsonPath)) {
      const fileContent = fs.readFileSync(studentsJsonPath, 'utf8')
      existingStudents = JSON.parse(fileContent)
    }

    // Check for duplicates within the incoming array
    const regNumbers = new Set()
    for (const student of students) {
      if (regNumbers.has(student.reg_number)) {
        return res.status(409).json({ 
          success: false, 
          error: `Duplicate registration number found in the provided data: ${student.reg_number}`,
          code: 'DUPLICATE_REG_NUMBER'
        })
      }
      regNumbers.add(student.reg_number)
    }

    // Check for duplicates against existing students
    const existingRegNumbers = new Set(existingStudents.map(s => s.reg_number))
    for (const student of students) {
      if (existingRegNumbers.has(student.reg_number)) {
        return res.status(409).json({ 
          success: false, 
          error: `Registration number already exists: ${student.reg_number}`,
          code: 'DUPLICATE_REG_NUMBER'
        })
      }
    }

    // Add new students
    existingStudents.push(...students)

    // Write back to file
    fs.writeFileSync(studentsJsonPath, JSON.stringify(existingStudents, null, 2))

    res.json({ 
      success: true, 
      message: `${students.length} student(s) saved successfully`,
      count: students.length
    })
  } catch (error) {
    console.error('Error saving students data:', error)
    res.status(500).json({ 
      success: false, 
      error: 'Failed to save students data',
      details: error.message 
    })
  }
})

// API endpoint to get all teams for a specific sport
app.get('/api/teams/:sport', (req, res) => {
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
    let students = []
    if (fs.existsSync(studentsJsonPath)) {
      const fileContent = fs.readFileSync(studentsJsonPath, 'utf8')
      students = JSON.parse(fileContent)
    }

    // Filter out admin user
    const nonAdminStudents = students.filter(s => s.reg_number !== '00000000000')

    // Group students by team name for the specified sport
    const teamsMap = new Map()

    for (const student of nonAdminStudents) {
      if (!student.participated_in || !Array.isArray(student.participated_in)) {
        continue
      }

      // Find participation in this sport with a team_name
      // Use exact match for sport name
      const participation = student.participated_in.find(
        p => p.sport === sport && p.team_name
      )

      if (participation && participation.team_name) {
        const teamName = participation.team_name

        // Initialize team if it doesn't exist
        if (!teamsMap.has(teamName)) {
          teamsMap.set(teamName, [])
        }

        // Add student to team (excluding password)
        const { password: _, ...studentData } = student
        teamsMap.get(teamName).push(studentData)
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
app.get('/api/participants/:sport', (req, res) => {
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
    let students = []
    if (fs.existsSync(studentsJsonPath)) {
      const fileContent = fs.readFileSync(studentsJsonPath, 'utf8')
      students = JSON.parse(fileContent)
    }

    // Filter out admin user
    const nonAdminStudents = students.filter(s => s.reg_number !== '00000000000')

    // Find all students who have participated in this sport (non-team events don't have team_name)
    const participants = []

    for (const student of nonAdminStudents) {
      if (!student.participated_in || !Array.isArray(student.participated_in)) {
        continue
      }

      // Find participation in this sport without team_name (individual/cultural events)
      const participation = student.participated_in.find(
        p => p.sport === sport && !p.team_name
      )

      if (participation) {
        // Add student to participants list (excluding password)
        const { password: _, ...studentData } = student
        participants.push(studentData)
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

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
  console.log(`Students JSON will be saved to: ${studentsJsonPath}`)
})

