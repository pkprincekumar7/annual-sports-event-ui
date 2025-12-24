# API Endpoints Authentication Reference

This document lists all API endpoints with their authentication requirements.

## Public Endpoints (No Authentication Required)

| Method | Endpoint | Description | authenticateToken | requireAdmin |
|--------|----------|-------------|-------------------|---------------|
| POST | `/api/login` | Player login | ❌ | ❌ |
| POST | `/api/save-player` | Register a new player | ❌ | ❌ |
| POST | `/api/save-players` | Register multiple players (team) | ❌ | ❌ |

## Authenticated Endpoints (Require Login)

| Method | Endpoint | Description | authenticateToken | requireAdmin |
|--------|----------|-------------|-------------------|---------------|
| GET | `/api/players` | Get all players | ✅ | ❌ |
| POST | `/api/validate-participations` | Validate team participation before registration | ✅ | ❌ |
| POST | `/api/update-team-participation` | Register/update team participation | ✅ | ❌ |
| POST | `/api/update-participation` | Register/update individual participation | ✅ | ❌ |
| GET | `/api/teams/:sport` | Get teams for a specific sport | ✅ | ❌ |

## Admin-Only Endpoints (Require Admin Authentication)

| Method | Endpoint | Description | authenticateToken | requireAdmin |
|--------|----------|-------------|-------------------|---------------|
| GET | `/api/sports` | Get team sports list | ✅ | ✅ |
| POST | `/api/add-captain` | Add a player as captain for a sport | ✅ | ✅ |
| DELETE | `/api/remove-captain` | Remove captain role from a player | ✅ | ✅ |
| GET | `/api/captains-by-sport` | Get all captains grouped by sport | ✅ | ✅ |
| DELETE | `/api/remove-participation` | Remove player participation (non-team events) | ✅ | ✅ |
| GET | `/api/participants/:sport` | Get all participants for a sport (non-team events) | ✅ | ✅ |
| POST | `/api/update-team-player` | Replace a player in a team | ✅ | ✅ |
| DELETE | `/api/delete-team` | Delete an entire team | ✅ | ✅ |
| PUT | `/api/update-player` | Update player profile data | ✅ | ✅ |
| GET | `/api/export-excel` | Export players data to Excel | ✅ | ✅ |

## Summary

- **Total Endpoints**: 18
- **Public Endpoints**: 3 (no authentication)
- **Authenticated Endpoints**: 5 (require login, any user)
- **Admin-Only Endpoints**: 10 (require admin authentication)

## Notes

- `authenticateToken`: Verifies JWT token is valid and not expired
- `requireAdmin`: Checks if the authenticated user's `reg_number` is `'admin'`
- All authenticated endpoints require a valid JWT token in the `Authorization` header as `Bearer <token>`
- Token is obtained from `/api/login` endpoint upon successful login
- Token expires after 24 hours

