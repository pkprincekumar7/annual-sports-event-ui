# Team Creation Flow - API Calls

This document describes all API endpoints called when a captain creates a team.

## Flow Overview

When a captain creates a team, the following sequence of API calls occurs:

### Step 1: Modal Opens (Team Registration Form)

**When:** Captain clicks on a team sport card and the registration modal opens

**API Call:**
- **GET** `/api/players`
  - **Purpose:** Fetch list of all players for the team member selection dropdown
  - **Authentication:** ✅ Requires `authenticateToken`
  - **Response:** List of all players (excluding admin)
  - **Used in:** `RegisterModal.jsx` (line 19)

---

### Step 2: Form Submission - Validation

**When:** Captain fills in team name, selects players, and clicks submit

**Frontend Validations (before API calls):**
1. Team name is not empty
2. All player slots are filled
3. Logged-in user is included in the team
4. No duplicate players
5. All players have same gender
6. All players have same year

**API Call:**
- **POST** `/api/validate-participations`
  - **Purpose:** Validate that all selected players can participate in the team
  - **Authentication:** ✅ Requires `authenticateToken`
  - **Request Body:**
    ```json
    {
      "reg_numbers": ["12345", "23456", ...],
      "sport": "Cricket"
    }
  ```
  - **Validations Performed:**
    - All players exist
    - No player is already in a team for this sport
    - No player has duplicate sport entries
    - No player has exceeded 10 unique participations
    - Exactly one captain is in the team
    - **Logged-in user is the captain for this sport** (NEW validation)
    - Team participation limits for captain sports
  - **Response:** Success or error message
  - **Used in:** `RegisterModal.jsx` (line 237)

---

### Step 3: Save Team Participation

**When:** After validation passes

**API Call:**
- **POST** `/api/update-team-participation`
  - **Purpose:** Save team participation for all players in the team
  - **Authentication:** ✅ Requires `authenticateToken`
  - **Request Body:**
    ```json
    {
      "reg_numbers": ["12345", "23456", ...],
      "sport": "Cricket",
      "team_name": "Team Alpha"
    }
  ```
  - **Validations Performed:**
    - All players exist
    - All players have same gender
    - All players have same year
    - No duplicate players in team
    - Exactly one captain is in the team
    - **Logged-in user is the captain for this sport** (NEW validation)
    - No player is already in a team for this sport
    - No duplicate sport entries in participated_in
    - Maximum 10 unique participations per player
    - Team participation limits for captain sports
    - Captain cannot create multiple teams for same sport
  - **Response:** Success message with updated player data
  - **Used in:** `RegisterModal.jsx` (line 281)

---

### Step 4: Refresh Player Data (Optional)

**When:** If the logged-in user is one of the players in the team

**API Call:**
- **GET** `/api/players`
  - **Purpose:** Refresh player data to update logged-in user's information
  - **Authentication:** ✅ Requires `authenticateToken`
  - **Response:** List of all players
  - **Used in:** `RegisterModal.jsx` (line 303)
  - **Note:** Only called if `loggedInUser.reg_number` is in `playerRegNumbers`

---

## Summary of API Calls

| Step | Method | Endpoint | Purpose | Auth Required |
|------|--------|----------|---------|---------------|
| 1 | GET | `/api/players` | Fetch players list for dropdown | ✅ Yes |
| 2 | POST | `/api/validate-participations` | Validate team participation | ✅ Yes |
| 3 | POST | `/api/update-team-participation` | Save team participation | ✅ Yes |
| 4 | GET | `/api/players` | Refresh player data (optional) | ✅ Yes |

## Key Validations

### Backend Validations in `/api/validate-participations`:
1. ✅ All players exist
2. ✅ No duplicate players
3. ✅ No player already in a team for this sport
4. ✅ No duplicate sport entries
5. ✅ Maximum 10 unique participations
6. ✅ Exactly one captain in team
7. ✅ **Logged-in user is captain for this sport** ⭐ NEW
8. ✅ Team participation limits for captain sports

### Backend Validations in `/api/update-team-participation`:
1. ✅ All players exist
2. ✅ All players have same gender
3. ✅ All players have same year
4. ✅ No duplicate players
5. ✅ Exactly one captain in team
6. ✅ **Logged-in user is captain for this sport** ⭐ NEW
7. ✅ No player already in a team for this sport
8. ✅ No duplicate sport entries
9. ✅ Maximum 10 unique participations
10. ✅ Captain cannot create multiple teams for same sport
11. ✅ Team participation limits for captain sports

## Error Handling

- If validation fails at Step 2, the process stops and shows error message
- If Step 3 fails, error message is shown and team is not saved
- All API calls use `fetchWithAuth` which automatically handles token expiration

