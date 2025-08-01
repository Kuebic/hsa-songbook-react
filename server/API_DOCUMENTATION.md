# HSA Songbook REST API Documentation

## Base URL
```
http://localhost:3001/api
```

## Authentication
All protected endpoints require authentication via Clerk. Include the Clerk session token in the Authorization header:
```
Authorization: Bearer <clerk_session_token>
```

## Error Format
All errors follow this consistent format:
```json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": [] // Optional validation details
}
```

## Rate Limiting
- **Limit**: 5 requests per second per IP
- **Response**: 429 with error message when exceeded

---

## Songs API

### GET /api/songs
List songs with pagination and filtering.

**Query Parameters:**
- `page` (number, default: 1) - Page number
- `limit` (number, default: 20, max: 100) - Items per page
- `q` (string) - Search query (title, artist, lyrics)
- `key` (string) - Filter by musical key (C, D, E, F, G, A, B with sharps/flats)
- `difficulty` (string) - Filter by difficulty (beginner, intermediate, advanced)
- `artist` (string) - Filter by artist name (partial match)
- `themes` (string) - Comma-separated list of themes
- `sort` (string, default: title) - Sort field (title, artist, createdAt, rating, popularity)
- `order` (string, default: asc) - Sort order (asc, desc)

**Response:**
```json
{
  "songs": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "title": "Amazing Grace",
      "artist": "John Newton",
      "slug": "amazing-grace-jn-12345",
      "key": "G",
      "tempo": 80,
      "difficulty": "intermediate",
      "themes": ["worship", "grace"],
      "metadata": {
        "ratings": { "average": 4.5, "count": 10 },
        "views": 150
      },
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "pages": 8,
    "hasNext": true,
    "hasPrev": false
  }
}
```

### GET /api/songs/:slug
Get a single song by slug with full chord data.

**Response:**
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "title": "Amazing Grace",
  "artist": "John Newton",
  "slug": "amazing-grace-jn-12345",
  "chordData": "{title: Amazing Grace}\n{key: G}\n[G]Amazing grace...",
  "key": "G",
  "tempo": 80,
  "timeSignature": "4/4",
  "difficulty": "intermediate",
  "themes": ["worship", "grace"],
  "source": "Traditional",
  "lyrics": "Amazing grace, how sweet the sound...",
  "notes": "Play with feeling",
  "metadata": {
    "createdBy": "507f1f77bcf86cd799439012",
    "isPublic": true,
    "ratings": { "average": 4.5, "count": 10 },
    "views": 151
  },
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-02T00:00:00.000Z"
}
```

### POST /api/songs
Create a new song. **Requires authentication.**

**Request Body:**
```json
{
  "title": "New Song",
  "artist": "Artist Name",
  "chordData": "{title: New Song}\n{key: C}\n[C]Verse lyrics...",
  "key": "C",
  "tempo": 120,
  "timeSignature": "4/4",
  "difficulty": "beginner",
  "themes": ["worship"],
  "source": "Original",
  "lyrics": "Full lyrics here...",
  "notes": "Performance notes"
}
```

**Response:** Same as GET /api/songs/:slug

### PUT /api/songs/:id
Update an existing song. **Requires authentication and ownership/admin role.**

**Request Body:** Same as POST (all fields optional)

**Response:** Updated song object

---

## Arrangements API

### GET /api/arrangements/:songId
List all arrangements for a specific song.

**Response:**
```json
{
  "arrangements": [
    {
      "_id": "507f1f77bcf86cd799439013",
      "name": "Acoustic Version",
      "songIds": ["507f1f77bcf86cd799439011"],
      "createdBy": {
        "firstName": "John",
        "lastName": "Doe"
      },
      "key": "D",
      "tempo": 75,
      "difficulty": "intermediate",
      "description": "Fingerpicking arrangement",
      "tags": ["acoustic", "fingerpicking"],
      "metadata": {
        "isMashup": false,
        "isPublic": true,
        "ratings": { "average": 4.2, "count": 5 },
        "views": 80
      },
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

### GET /api/arrangements/single/:id
Get a single arrangement with full chord data.

**Response:** Arrangement object with `chordData` field included

### POST /api/arrangements
Create a new arrangement. **Requires authentication.**

**Request Body:**
```json
{
  "name": "My Arrangement",
  "songIds": ["507f1f77bcf86cd799439011"],
  "chordData": "{title: My Arrangement}\n{key: D}\n[D]Modified chords...",
  "key": "D",
  "tempo": 85,
  "difficulty": "advanced",
  "description": "Jazz arrangement with complex chords",
  "tags": ["jazz", "complex"],
  "mashupSections": [] // For mashups only
}
```

### PUT /api/arrangements/:id
Update an arrangement. **Requires authentication and ownership/admin role.**

---

## Setlists API

### GET /api/setlists
Get current user's setlists. **Requires authentication.**

**Response:**
```json
{
  "setlists": [
    {
      "_id": "507f1f77bcf86cd799439014",
      "name": "Sunday Service",
      "description": "Morning worship set",
      "songs": [
        {
          "songId": {
            "title": "Amazing Grace",
            "artist": "John Newton",
            "key": "G"
          },
          "arrangementId": {
            "name": "Acoustic Version",
            "key": "D"
          },
          "transpose": 2,
          "notes": "Start soft",
          "order": 0
        }
      ],
      "tags": ["worship", "morning"],
      "metadata": {
        "isPublic": false,
        "shareToken": "abc123def456",
        "estimatedDuration": 25,
        "usageCount": 3,
        "lastUsedAt": "2024-01-01T10:00:00.000Z"
      },
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

### GET /api/setlists/:id
Get a specific setlist. **Requires authentication and ownership.**

### GET /api/setlists/share/:shareToken
Get a public setlist by share token. **No authentication required.**

### POST /api/setlists
Create a new setlist. **Requires authentication.**

**Request Body:**
```json
{
  "name": "New Setlist",
  "description": "Description here",
  "songs": [
    {
      "songId": "507f1f77bcf86cd799439011",
      "arrangementId": "507f1f77bcf86cd799439013",
      "transpose": 0,
      "notes": "Performance notes",
      "order": 0
    }
  ],
  "tags": ["worship"],
  "isPublic": false
}
```

### PUT /api/setlists/:id
Update a setlist. **Requires authentication and ownership.**

### POST /api/setlists/:id/reorder
Reorder songs in a setlist. **Requires authentication and ownership.**

**Request Body:**
```json
{
  "songOrder": [
    { "songId": "507f1f77bcf86cd799439011", "order": 0 },
    { "songId": "507f1f77bcf86cd799439012", "order": 1 }
  ]
}
```

### DELETE /api/setlists/:id
Delete a setlist. **Requires authentication and ownership.**

---

## Health Check

### GET /api/health
Check API and database health.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "database": "connected"
}
```

---

## Status Codes

- **200** - Success
- **201** - Created
- **400** - Bad Request (validation errors)
- **401** - Unauthorized (missing/invalid auth)
- **403** - Forbidden (insufficient permissions)
- **404** - Not Found
- **409** - Conflict (duplicate data)
- **429** - Rate Limited
- **500** - Internal Server Error

## Content Types
- **Request**: `application/json`
- **Response**: `application/json`

## Example Usage

### Create a song and add it to a setlist
```bash
# 1. Create a song
curl -X POST http://localhost:3001/api/songs \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <clerk_token>" \
  -d '{
    "title": "My New Song",
    "artist": "Me",
    "chordData": "{title: My New Song}\n{key: C}\n[C]Amazing lyrics...",
    "key": "C",
    "difficulty": "beginner"
  }'

# 2. Create a setlist with the song
curl -X POST http://localhost:3001/api/setlists \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <clerk_token>" \
  -d '{
    "name": "My Setlist",
    "songs": [
      {
        "songId": "<song_id_from_step_1>",
        "transpose": 0,
        "order": 0
      }
    ]
  }'
```