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
    const { reg_number, sport } = req.body

    // Validate required fields
    if (!reg_number || !sport) {
      return res.status(400).json({ 
        success: false, 
        error: 'Registration number and sport are required' 
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
    const { reg_numbers, sport } = req.body

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
          errors.push(`${student.full_name} (${reg_number}) is already in a team (${existingParticipation.team_name}) for ${sport}. A player can only belong to one team per sport.`)
        } else {
          errors.push(`${student.full_name} (${reg_number}) is already registered for ${sport}`)
        }
        continue
      }

      // Check maximum limit of 3 participations
      if (student.participated_in.length >= 3) {
        errors.push(`${student.full_name} (${reg_number}) has reached maximum 3 participations`)
        continue
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
app.post('/api/update-team-participation', (req, res) => {
  try {
    const { reg_numbers, sport, team_name } = req.body

    // Validate required fields
    if (!reg_numbers || !Array.isArray(reg_numbers) || reg_numbers.length === 0 || !sport || !team_name) {
      return res.status(400).json({ 
        success: false, 
        error: 'Registration numbers array, sport, and team name are required' 
      })
    }

    // Read existing data
    let students = []
    if (fs.existsSync(studentsJsonPath)) {
      const fileContent = fs.readFileSync(studentsJsonPath, 'utf8')
      students = JSON.parse(fileContent)
    }

    const updatedStudents = []
    const errors = []

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
          errors.push(`${students[studentIndex].full_name} (${reg_number}) is already in a team (${existingParticipation.team_name}) for ${sport}. A player can only belong to one team per sport.`)
        } else {
          errors.push(`${students[studentIndex].full_name} (${reg_number}) is already registered for ${sport}`)
        }
        continue
      }

      // Check maximum limit of 3 participations
      if (students[studentIndex].participated_in.length >= 3) {
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
    const { reg_number, sport } = req.body

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

    // Check maximum limit of 3 participations (across all types of sports)
    if (students[studentIndex].participated_in.length >= 3) {
      return res.status(400).json({ 
        success: false, 
        error: 'Maximum 3 participations allowed. You have already registered for 3 sports. Please remove a participation first.' 
      })
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
    const { reg_number, password } = req.body

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
    const { reg_number, full_name, gender, department_branch, year, mobile_number, email_id, password } = req.body

    // Validate required fields
    if (!reg_number || !full_name || !gender || !department_branch || !year || !mobile_number || !email_id || !password) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required fields' 
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

    // Create new student object
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
    const { students } = req.body

    if (!Array.isArray(students) || students.length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid students data' 
      })
    }

    // Validate each student
    for (const student of students) {
      if (!student.reg_number || !student.full_name || !student.gender || 
          !student.department_branch || !student.year || !student.mobile_number || !student.email_id || !student.password) {
        return res.status(400).json({ 
          success: false, 
          error: 'Missing required fields in one or more students' 
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

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
  console.log(`Students JSON will be saved to: ${studentsJsonPath}`)
})

