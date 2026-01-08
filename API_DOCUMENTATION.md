# SlideBanai API Documentation

## Overview

SlideBanai is an AI-powered presentation platform with real-time collaboration, analytics, and AI coaching capabilities. This document provides comprehensive API documentation with complete endpoint reference.

## Quick Start

### Prerequisites
- Backend server running on `http://localhost:5000`
- Postman installed (for testing the collection)
- Authentication token (use `dev-test-token` for development)

### Import Collection in Postman

1. Open Postman
2. Click **Import** button (top-left)
3. Select **Upload Files** tab
4. Choose `SlideBanai-API.postman_collection.json`
5. Import the environment file `SlideBanai-Environment.postman_environment.json`
6. Select the environment in the dropdown (top-right)
7. You're ready to test API endpoints!

## Authentication

All API endpoints require Bearer token authentication via the Authorization header:

```
Authorization: Bearer dev-test-token
```

For development/testing, use the token: `dev-test-token`

**Production**: Replace with actual JWT tokens from your authentication provider.

## Base URL

- **Development**: `http://localhost:5000`
- **Production**: Update the `baseUrl` variable in Postman environment

## API Endpoints

### 1. Presentations API

**Base Path**: `/presentations`

#### List All Presentations
- **Method**: GET
- **Path**: `/presentations`
- **Response**: Array of presentations
- **Headers**: Authorization: Bearer {token}

```json
{
  "id": 1,
  "user_id": 1,
  "title": "Q1 2026 Product Launch",
  "description": "Comprehensive product launch presentation",
  "status": "draft",
  "slides_count": 12,
  "created_at": "2026-01-08T10:00:00Z",
  "updated_at": "2026-01-08T11:00:00Z"
}
```

#### Create Presentation
- **Method**: POST
- **Path**: `/presentations`
- **Body**:
```json
{
  "title": "Product Launch Q1 2026",
  "description": "Comprehensive product launch presentation",
  "status": "draft",
  "slides_count": 0
}
```

#### Get Presentation by ID
- **Method**: GET
- **Path**: `/presentations/{id}`
- **Parameters**: 
  - `id` (path): Presentation ID

#### Update Presentation
- **Method**: PUT
- **Path**: `/presentations/{id}`
- **Body**:
```json
{
  "title": "Updated Title",
  "description": "Updated description",
  "status": "published"
}
```

#### Delete Presentation
- **Method**: DELETE
- **Path**: `/presentations/{id}`
- **Response**: 204 No Content

---

### 2. Slides API

**Base Path**: `/presentations/{presentationId}/slides`

#### Get All Slides
- **Method**: GET
- **Path**: `/presentations/{presentationId}/slides`
- **Parameters**:
  - `presentationId` (path): Parent presentation ID

#### Create Slide
- **Method**: POST
- **Path**: `/presentations/{presentationId}/slides`
- **Body**:
```json
{
  "slide_number": 1,
  "content": "# Welcome to SlideBanai\n\nAI-Powered Presentation Platform",
  "background_color": "#FFFFFF"
}
```

#### Get Slide
- **Method**: GET
- **Path**: `/presentations/{presentationId}/slides/{slideId}`

#### Update Slide
- **Method**: PUT
- **Path**: `/presentations/{presentationId}/slides/{slideId}`
- **Body**:
```json
{
  "content": "# Updated Slide Content",
  "background_color": "#F0F0F0"
}
```

#### Delete Slide
- **Method**: DELETE
- **Path**: `/presentations/{presentationId}/slides/{slideId}`

---

### 3. Integrations API

**Base Path**: `/presentations/{presentationId}/integrations`

Connect presentations with external services (Google Slides, Canva, etc.)

#### Get Integration
- **Method**: GET
- **Path**: `/presentations/{presentationId}/integrations`

#### Create Google Slides Integration
- **Method**: POST
- **Path**: `/presentations/{presentationId}/integrations`
- **Body**:
```json
{
  "provider": "google_slides",
  "external_id": "1BxiMVs0XRA5nFMwSxQSFZwCW_8NrWrb6how-SVndUX8",
  "edit_url": "https://docs.google.com/presentation/d/.../edit",
  "view_url": "https://docs.google.com/presentation/d/.../preview",
  "thumbnail_url": "https://lh3.googleusercontent.com/..."
}
```

**Supported Providers**:
- `google_slides` - Google Slides integration
- `canva` - Canva integration

---

### 4. Collaborators API

**Base Path**: `/api/collaboration`

Real-time collaboration and team management.

#### Get All Collaborators
- **Method**: GET
- **Path**: `/api/collaboration/{presentationId}`
- **Response**: List of collaborators with roles

#### Add Collaborator
- **Method**: POST
- **Path**: `/api/collaboration/{presentationId}`
- **Body**:
```json
{
  "userId": 2,
  "role": "editor"
}
```

**Available Roles**:
- `owner` - Full access, can manage collaborators
- `editor` - Can edit slides and content
- `viewer` - Read-only access
- `commenter` - Can view and comment

#### Update Collaborator Role
- **Method**: PATCH
- **Path**: `/api/collaboration/{presentationId}/{userId}`
- **Body**:
```json
{
  "role": "viewer"
}
```

#### Remove Collaborator
- **Method**: DELETE
- **Path**: `/api/collaboration/{presentationId}/{userId}`

---

### 5. Analytics API

**Base Path**: `/api/analytics`

Track usage metrics and performance statistics.

#### Dashboard Analytics
- **Method**: GET
- **Path**: `/api/analytics/dashboard`
- **Response**:
```json
{
  "total_users": 150,
  "total_sessions": 850,
  "avg_presentation_score": 78.5,
  "presentations_created": 320,
  "total_practice_hours": 4200,
  "active_users_today": 45,
  "trends": {
    "sessions_last_7_days": [120, 135, 142, 158, 165, 172, 180],
    "avg_scores_last_7_days": [75.2, 76.1, 77.3, 78.2, 78.8, 79.1, 79.5]
  },
  "top_presentations": [...],
  "language_performance": {...}
}
```

#### Presentation Analytics
- **Method**: GET
- **Path**: `/api/analytics/presentation/{presentationId}`
- **Parameters**:
  - `presentationId` (path): Presentation ID
- **Response**: Detailed metrics for specific presentation

---

### 6. Collaboration Features

**Base Path**: `/api/collaboration`

Advanced collaboration features and real-time updates.

#### Get Collaboration Overview
- **Method**: GET
- **Path**: `/api/collaboration/overview`
- **Description**: Get high-level collaboration statistics

#### Get Collaboration Statistics
- **Method**: GET
- **Path**: `/api/collaboration/stats`
- **Description**: Detailed collaboration metrics

#### Get Recent Collaborations
- **Method**: GET
- **Path**: `/api/collaboration/recent`
- **Query Parameters**:
  - `limit` (optional): Number of items to return (default: 10)

#### Get Collaboration Suggestions
- **Method**: GET
- **Path**: `/api/collaboration/suggestions`
- **Description**: Get AI-powered suggestions for collaboration partners

#### Get Active Collaborators
- **Method**: GET
- **Path**: `/api/collaboration/presentations/{presentationId}/active`
- **Description**: List currently online collaborators for a presentation

#### Get Collaboration Timeline
- **Method**: GET
- **Path**: `/api/collaboration/presentations/{presentationId}/timeline`
- **Query Parameters**:
  - `hours` (optional): Number of hours to look back (default: 24)
- **Description**: Timeline of collaboration events

#### Check Presentation Access
- **Method**: GET
- **Path**: `/api/collaboration/presentations/{presentationId}/access`
- **Description**: Verify user has access to presentation

#### Update User Presence
- **Method**: POST
- **Path**: `/api/collaboration/presence`
- **Body**:
```json
{
  "presentationId": 1,
  "isOnline": true,
  "cursorPosition": {
    "x": 100,
    "y": 200
  }
}
```

---

### 7. Coach Sessions API

**Base Path**: `/coach-sessions`

AI-powered coaching for presentation practice.

#### Create Coach Session
- **Method**: POST
- **Path**: `/coach-sessions`
- **Body**:
```json
{
  "presentation_id": 1,
  "mode": "existing_presentation",
  "language": "english",
  "duration_minutes": 15
}
```

**Session Modes**:
- `existing_presentation` - Practice with existing slides
- `new_topic` - Create presentation on new topic
- `free_form` - Practice without slides

**Languages**: `english`, `spanish`, `french`, `german`, `chinese`, `japanese`

#### Get Coach Session
- **Method**: GET
- **Path**: `/coach-sessions/{sessionId}`

#### Add Session Configuration
- **Method**: POST
- **Path**: `/coach-sessions/{sessionId}/config`
- **Body**:
```json
{
  "session_id": 1,
  "audience_type": "corporate_executives",
  "speech_style": "formal",
  "technicality_level": "intermediate",
  "slide_range_start": 1,
  "slide_range_end": 10
}
```

**Audience Types**:
- `general_audience`
- `technical_experts`
- `corporate_executives`
- `investors`
- `students`

**Speech Styles**:
- `formal` - Professional, structured
- `casual` - Conversational, friendly
- `persuasive` - Sales-focused
- `educational` - Teaching-focused

#### Submit User Recording
- **Method**: POST
- **Path**: `/coach-sessions/{sessionId}/recording`
- **Body**:
```json
{
  "session_id": 1,
  "transcript": "Thank you all for being here today...",
  "video_duration": 900
}
```

#### Add Performance Score
- **Method**: POST
- **Path**: `/coach-sessions/{sessionId}/scores`
- **Body**:
```json
{
  "session_id": 1,
  "metric": "pace",
  "score": 85
}
```

**Metrics**:
- `pace` - Speaking speed (0-100)
- `clarity` - Speech clarity (0-100)
- `engagement` - Audience engagement (0-100)
- `eye_contact` - Eye contact simulation (0-100)
- `hand_gestures` - Hand gesture appropriateness (0-100)
- `filler_words` - Filler word frequency (0-100)

#### Add Feedback Item
- **Method**: POST
- **Path**: `/coach-sessions/{sessionId}/feedback`
- **Body**:
```json
{
  "session_id": 1,
  "type": "improvement",
  "content": "Try to slow down your pace on slide 3"
}
```

**Feedback Types**:
- `improvement` - Area for improvement
- `strength` - What you did well
- `tip` - Helpful tip or suggestion

---

### 8. AI Outputs API

**Base Path**: `/coach-sessions/{sessionId}/ai-outputs`

AI-generated content including speech scripts and feedback summaries.

#### Get AI Output
- **Method**: GET
- **Path**: `/coach-sessions/{sessionId}/ai-outputs`
- **Response**: List of generated outputs

#### Create AI Output (Speech Script)
- **Method**: POST
- **Path**: `/coach-sessions/{sessionId}/ai-outputs`
- **Body**:
```json
{
  "session_id": 1,
  "type": "speech_script",
  "content": "Welcome everyone to our quarterly meeting...",
  "model_used": "gpt-4"
}
```

**Output Types**:
- `speech_script` - AI-generated speech for slides
- `feedback_summary` - Summary of all feedback
- `improvement_plan` - Personalized improvement recommendations

---

### 9. Templates API

**Base Path**: `/templates`

Presentation templates and layout management.

#### Get All Templates
- **Method**: GET
- **Path**: `/templates`
- **Response**: Available templates

#### Create Template
- **Method**: POST
- **Path**: `/templates`
- **Body**:
```json
{
  "name": "Business Pitch",
  "description": "Professional business pitch template",
  "category": "business",
  "thumbnail_url": "https://example.com/thumbnail.png"
}
```

#### Apply Template to Presentation
- **Method**: POST
- **Path**: `/presentations/{presentationId}/templates`
- **Body**:
```json
{
  "template_id": 1
}
```

---

## Error Handling

### HTTP Status Codes

- `200` - OK: Request successful
- `201` - Created: Resource created successfully
- `204` - No Content: Request successful, no response body
- `400` - Bad Request: Invalid request parameters
- `401` - Unauthorized: Missing or invalid authentication
- `403` - Forbidden: User doesn't have permission
- `404` - Not Found: Resource doesn't exist
- `409` - Conflict: Resource already exists
- `500` - Internal Server Error: Server error

### Error Response Format

```json
{
  "error": "Error message description",
  "code": "ERROR_CODE",
  "status": 400,
  "timestamp": "2026-01-08T10:00:00Z"
}
```

---

## Rate Limiting

- **Free Tier**: 100 requests/hour
- **Pro Tier**: 1000 requests/hour
- **Enterprise**: Unlimited

Rate limit headers are included in responses:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1641624000
```

---

## Pagination

For list endpoints, use query parameters:

```
GET /presentations?page=1&limit=20&sort=created_at&order=desc
```

**Parameters**:
- `page` - Page number (starts at 1)
- `limit` - Results per page (default: 20, max: 100)
- `sort` - Sort field (e.g., `created_at`, `title`)
- `order` - Sort order (`asc` or `desc`)

**Response**:
```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  }
}
```

---

## WebSocket Endpoints (Real-time Features)

### Collaboration Updates
```
WebSocket: ws://localhost:5000/ws/collaboration/{presentationId}
```

**Events**:
- `collaborator_joined` - User joined presentation
- `collaborator_left` - User left presentation
- `slide_updated` - Slide content changed
- `cursor_moved` - User cursor position updated
- `presence_updated` - User online/offline status changed

---

## Common Query Patterns

### Get user's presentations
```
GET /presentations?user_id=1&status=active
```

### Get recent presentations
```
GET /presentations?sort=created_at&order=desc&limit=10
```

### Get collaborations in last 7 days
```
GET /api/collaboration/timeline?hours=168
```

### Get analytics for specific date range
```
GET /api/analytics/dashboard?start_date=2026-01-01&end_date=2026-01-08
```

---

## Testing with Postman

### Setup Steps

1. **Import Collection**
   - File: `SlideBanai-API.postman_collection.json`
   - All 50+ endpoints included

2. **Import Environment**
   - File: `SlideBanai-Environment.postman_environment.json`
   - Pre-configured variables for quick testing

3. **Configure Variables**
   - Update `baseUrl` if not using localhost:5000
   - Update `authToken` with your actual token
   - Adjust `presentationId`, `userId`, etc. for your resources

4. **Run Collection**
   - Click **Runner** button
   - Select the collection
   - Run with desired environment
   - View test results and coverage

---

## Integration Examples

### cURL Example

```bash
# Get all presentations
curl -X GET http://localhost:5000/presentations \
  -H "Authorization: Bearer dev-test-token" \
  -H "Content-Type: application/json"

# Create presentation
curl -X POST http://localhost:5000/presentations \
  -H "Authorization: Bearer dev-test-token" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "My Presentation",
    "description": "A great presentation",
    "status": "draft"
  }'
```

### JavaScript/Node.js Example

```javascript
const api = axios.create({
  baseURL: 'http://localhost:5000',
  headers: {
    'Authorization': 'Bearer dev-test-token',
    'Content-Type': 'application/json'
  }
});

// Get presentations
const presentations = await api.get('/presentations');

// Create presentation
const newPresentation = await api.post('/presentations', {
  title: 'My Presentation',
  description: 'A great presentation',
  status: 'draft'
});
```

### Python Example

```python
import requests

headers = {
    'Authorization': 'Bearer dev-test-token',
    'Content-Type': 'application/json'
}

# Get presentations
response = requests.get('http://localhost:5000/presentations', headers=headers)
presentations = response.json()

# Create presentation
data = {
    'title': 'My Presentation',
    'description': 'A great presentation',
    'status': 'draft'
}
response = requests.post('http://localhost:5000/presentations', json=data, headers=headers)
new_presentation = response.json()
```

---

## Support & Troubleshooting

### Common Issues

**401 Unauthorized**
- Check that Authorization header is present
- Use correct token: `Bearer dev-test-token`
- Ensure token hasn't expired

**404 Not Found**
- Verify resource ID exists
- Check URL path for typos
- Ensure using correct base URL

**500 Internal Server Error**
- Check server logs
- Verify database connection
- Restart backend server

### Getting Help

- **API Documentation**: See this file
- **Swagger UI**: http://localhost:5000/api-docs
- **Postman Collection**: Import and test endpoints
- **Logs**: Check server console for error messages

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-01-08 | Initial release with 50+ endpoints |

---

**Last Updated**: 2026-01-08
**API Version**: 1.0.0
**Status**: Production Ready ✅
