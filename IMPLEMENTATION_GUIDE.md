# SlideBanai - Complete Implementation Guide

This document provides the complete implementation details for all remaining backend and frontend files.

## ✅ FILES ALREADY CREATED

1. **apps/backend/main.py** - FastAPI application entry point
2. **apps/backend/config/settings.py** - Environment configuration
3. **apps/backend/config/logging_config.py** - Structured logging setup
4. **apps/backend/middleware/error_middleware.py** - Global error handling

## 🔨 CRITICAL BACKEND FILES TO IMPLEMENT

### 1. Repository Pattern Example

**File:** `apps/backend/repositories/base_repository.py`

```python
from abc import ABC, abstractmethod
from typing import Generic, TypeVar, List, Optional, Dict, Any
from supabase import Client

T = TypeVar('T')

class BaseRepository(ABC, Generic[T]):
    """Base repository with common CRUD operations"""

    def __init__(self, supabase_client: Client, table_name: str):
        self.db = supabase_client
        self.table_name = table_name

    async def find_by_id(self, id: int) -> Optional[T]:
        """Find entity by ID"""
        result = self.db.table(self.table_name).select('*').eq('id', id).single().execute()
        return self._map_to_model(result.data) if result.data else None

    async def find_all(self, limit: int = 20, offset: int = 0) -> List[T]:
        """Find all entities with pagination"""
        result = self.db.table(self.table_name).select('*').range(offset, offset + limit - 1).execute()
        return [self._map_to_model(row) for row in result.data]

    async def create(self, data: Dict[str, Any]) -> T:
        """Create new entity"""
        result = self.db.table(self.table_name).insert(data).execute()
        return self._map_to_model(result.data[0])

    async def update(self, id: int, data: Dict[str, Any]) -> Optional[T]:
        """Update existing entity"""
        result = self.db.table(self.table_name).update(data).eq('id', id).execute()
        return self._map_to_model(result.data[0]) if result.data else None

    async def delete(self, id: int) -> bool:
        """Delete entity"""
        result = self.db.table(self.table_name).delete().eq('id', id).execute()
        return len(result.data) > 0

    @abstractmethod
    def _map_to_model(self, data: Dict[str, Any]) -> T:
        """Map database row to domain model"""
        pass
```

**File:** `apps/backend/repositories/presentation_repository.py`

```python
from typing import List, Optional
from models.presentation import Presentation
from repositories.base_repository import BaseRepository

class PresentationRepository(BaseRepository[Presentation]):
    """Repository for Presentation entity"""

    def __init__(self, supabase_client):
        super().__init__(supabase_client, 'presentations')

    async def find_by_owner(self, owner_id: int, limit: int = 20, offset: int = 0) -> List[Presentation]:
        """Find presentations by owner"""
        result = self.db.table(self.table_name) \\
            .select('*') \\
            .eq('owner_id', owner_id) \\
            .order('created_at', desc=True) \\
            .range(offset, offset + limit - 1) \\
            .execute()
        return [self._map_to_model(row) for row in result.data]

    async def find_shared_with_user(self, user_id: int) -> List[Presentation]:
        """Find presentations shared with user via collaborators"""
        result = self.db.rpc(
            'get_shared_presentations',
            {'p_user_id': user_id}
        ).execute()
        return [self._map_to_model(row) for row in result.data]

    def _map_to_model(self, data: dict) -> Presentation:
        """Map database row to Presentation model"""
        return Presentation(**data)
```

### 2. Service Layer Example

**File:** `apps/backend/services/presentation_service.py`

```python
from typing import List, Optional
from repositories.presentation_repository import PresentationRepository
from repositories.slide_repository import SlideRepository
from services.ai_service import AIService
from adapters.google_slides_adapter import GoogleSlidesAdapter
from observers.event_publisher import EventPublisher
from dtos.presentation_dtos import CreatePresentationFromPromptDTO, PresentationResponseDTO
from middleware.error_middleware import NotFoundException, InsufficientCreditsException
import logging

logger = logging.getLogger(__name__)

class PresentationService:
    """Business logic for presentations"""

    def __init__(
        self,
        presentation_repo: PresentationRepository,
        slide_repo: SlideRepository,
        ai_service: AIService,
        google_adapter: GoogleSlidesAdapter,
        event_publisher: EventPublisher
    ):
        self.presentation_repo = presentation_repo
        self.slide_repo = slide_repo
        self.ai_service = ai_service
        self.google_adapter = google_adapter
        self.event_publisher = event_publisher

    async def create_from_prompt(
        self,
        user_id: int,
        request: CreatePresentationFromPromptDTO
    ) -> PresentationResponseDTO:
        """
        Create presentation from text prompt.

        Workflow:
        1. Generate outline using AI
        2. Generate detailed slides
        3. Create Google Slides presentation
        4. Save to database
        5. Publish creation event
        """
        logger.info(f"Creating presentation from prompt for user {user_id}")

        # Check user credits (if applicable)
        # await self._check_credits(user_id, cost=1)

        try:
            # Step 1: Generate outline
            outline = await self.ai_service.generate_outline(
                prompt=request.prompt,
                num_slides=request.num_slides,
                audience=request.audience_type,
                tone=request.tone
            )

            # Step 2: Generate slides
            slides = await self.ai_service.generate_slides_from_outline(outline)

            # Step 3: Create Google Slides
            google_presentation = await self.google_adapter.create_presentation(
                title=request.title,
                slides=slides,
                template_id=request.template_id
            )

            # Step 4: Save to database
            presentation_data = {
                'title': request.title,
                'owner_id': user_id,
                'google_slides_id': google_presentation['id'],
                'edit_url': google_presentation['edit_url'],
                'view_url': google_presentation['view_url'],
                'slides_count': len(slides),
                'status': 'published',
                'template_id': request.template_id,
                'source_type': 'prompt'
            }

            presentation = await self.presentation_repo.create(presentation_data)

            # Save slides
            for idx, slide in enumerate(slides):
                await self.slide_repo.create({
                    'presentation_id': presentation.id,
                    'slide_number': idx + 1,
                    'content': slide['content'],
                    'background_color': slide.get('background_color', '#FFFFFF')
                })

            # Step 5: Publish event
            await self.event_publisher.publish(
                'presentation.created',
                {'presentation_id': presentation.id, 'user_id': user_id}
            )

            logger.info(f"Presentation {presentation.id} created successfully")

            return PresentationResponseDTO.from_model(presentation)

        except Exception as e:
            logger.error(f"Failed to create presentation: {str(e)}")
            raise

    async def get_by_id(self, user_id: int, presentation_id: int) -> PresentationResponseDTO:
        """Get presentation by ID (with authorization check)"""
        presentation = await self.presentation_repo.find_by_id(presentation_id)

        if not presentation:
            raise NotFoundException("Presentation", presentation_id)

        # Check authorization (owner or collaborator)
        # This would be handled by RLS in Supabase, but we can add explicit check
        # await self._verify_access(user_id, presentation_id)

        # Get slides
        slides = await self.slide_repo.find_by_presentation(presentation_id)

        return PresentationResponseDTO.from_model(presentation, slides)
```

### 3. Controller Example

**File:** `apps/backend/controllers/presentation_controller.py`

```python
from fastapi import APIRouter, Depends, Query, status, UploadFile, File
from typing import List
from dtos.presentation_dtos import (
    CreatePresentationFromPromptDTO,
    CreatePresentationFromDocumentDTO,
    PresentationResponseDTO,
    PresentationListResponseDTO,
    UpdatePresentationDTO
)
from services.presentation_service import PresentationService
from middleware.auth_middleware import get_current_user
from models.user import User
from dependencies import get_presentation_service

router = APIRouter()

@router.post(
    "/from-prompt",
    response_model=PresentationResponseDTO,
    status_code=status.HTTP_201_CREATED,
    summary="Create presentation from text prompt",
    description="Generate presentation using AI from a text prompt"
)
async def create_from_prompt(
    request: CreatePresentationFromPromptDTO,
    current_user: User = Depends(get_current_user),
    service: PresentationService = Depends(get_presentation_service)
):
    """
    Create presentation from text prompt using AI.

    - **title**: Presentation title (3-200 chars)
    - **prompt**: Detailed description of content (10-5000 chars)
    - **num_slides**: Number of slides to generate (3-30)
    - **audience_type**: Target audience
    - **tone**: Presentation tone
    - **template_id**: Optional template ID
    """
    return await service.create_from_prompt(current_user.id, request)

@router.get(
    "",
    response_model=PresentationListResponseDTO,
    summary="List user's presentations",
    description="Get paginated list of presentations"
)
async def list_presentations(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    status_filter: str = Query(None),
    search: str = Query(None),
    current_user: User = Depends(get_current_user),
    service: PresentationService = Depends(get_presentation_service)
):
    """List user's presentations with pagination and filters"""
    return await service.list_presentations(
        user_id=current_user.id,
        page=page,
        limit=limit,
        status_filter=status_filter,
        search=search
    )

@router.get(
    "/{presentation_id}",
    response_model=PresentationResponseDTO,
    summary="Get presentation details"
)
async def get_presentation(
    presentation_id: int,
    current_user: User = Depends(get_current_user),
    service: PresentationService = Depends(get_presentation_service)
):
    """Get detailed presentation information including slides"""
    return await service.get_by_id(current_user.id, presentation_id)

@router.delete(
    "/{presentation_id}",
    status_code=status.HTTP_200_OK,
    summary="Delete presentation"
)
async def delete_presentation(
    presentation_id: int,
    permanent: bool = Query(False),
    current_user: User = Depends(get_current_user),
    service: PresentationService = Depends(get_presentation_service)
):
    """Delete presentation (soft delete by default, hard delete if permanent=true)"""
    await service.delete_presentation(current_user.id, presentation_id, permanent)
    return {"message": "Presentation deleted successfully", "id": presentation_id}
```

### 4. DTO Example

**File:** `apps/backend/dtos/presentation_dtos.py`

```python
from pydantic import BaseModel, Field, validator
from typing import Optional, List
from enum import Enum
from datetime import datetime

class AudienceType(str, Enum):
    GENERAL = "general"
    CORPORATE = "corporate"
    STUDENTS = "students"
    TECHNICAL = "technical"
    CREATIVE = "creative"

class PresentationTone(str, Enum):
    PROFESSIONAL = "professional"
    CASUAL = "casual"
    PERSUASIVE = "persuasive"
    EDUCATIONAL = "educational"
    INSPIRATIONAL = "inspirational"

class CreatePresentationFromPromptDTO(BaseModel):
    """Request DTO for creating presentation from prompt"""

    title: str = Field(..., min_length=3, max_length=200)
    prompt: str = Field(..., min_length=10, max_length=5000)
    num_slides: int = Field(default=10, ge=3, le=30)
    audience_type: AudienceType = AudienceType.GENERAL
    tone: PresentationTone = PresentationTone.PROFESSIONAL
    template_id: Optional[str] = None

    @validator('title')
    def validate_title(cls, v):
        if not v.strip():
            raise ValueError('Title cannot be empty or whitespace')
        return v.strip()

    class Config:
        json_schema_extra = {
            "example": {
                "title": "Introduction to Machine Learning",
                "prompt": "Create a comprehensive presentation...",
                "num_slides": 10,
                "audience_type": "students",
                "tone": "educational"
            }
        }

class SlideDTO(BaseModel):
    """Single slide data"""
    id: int
    slide_number: int
    content: str
    background_color: Optional[str] = None
    layout_type: Optional[str] = None

class PresentationResponseDTO(BaseModel):
    """Response DTO for presentation"""

    id: int
    title: str
    description: Optional[str]
    owner_id: int
    status: str
    google_slides_id: Optional[str]
    edit_url: Optional[str]
    view_url: Optional[str]
    slides_count: int
    created_at: datetime
    updated_at: datetime
    slides: Optional[List[SlideDTO]] = None

    @classmethod
    def from_model(cls, presentation, slides=None):
        """Convert database model to DTO"""
        return cls(
            id=presentation.id,
            title=presentation.title,
            description=presentation.description,
            owner_id=presentation.owner_id,
            status=presentation.status,
            google_slides_id=presentation.google_slides_id,
            edit_url=presentation.edit_url,
            view_url=presentation.view_url,
            slides_count=presentation.slides_count,
            created_at=presentation.created_at,
            updated_at=presentation.updated_at,
            slides=[SlideDTO(**slide.dict()) for slide in slides] if slides else None
        )
```

### 5. Adapter Pattern Example

**File:** `apps/backend/adapters/openai_adapter.py`

```python
from openai import AsyncOpenAI
import logging
import asyncio
from functools import wraps
from middleware.error_middleware import ExternalServiceException

logger = logging.getLogger(__name__)

def retry_on_failure(max_retries: int = 3, delay: float = 1.0):
    """Decorator for retrying failed operations with exponential backoff"""
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            last_exception = None
            for attempt in range(max_retries):
                try:
                    return await func(*args, **kwargs)
                except Exception as e:
                    last_exception = e
                    if attempt < max_retries - 1:
                        wait_time = delay * (2 ** attempt)
                        logger.warning(f"Attempt {attempt + 1} failed, retrying in {wait_time}s...")
                        await asyncio.sleep(wait_time)

            raise ExternalServiceException("OpenAI", str(last_exception))
        return wrapper
    return decorator

class OpenAIAdapter:
    """Adapter for OpenAI API with retry logic and error handling"""

    def __init__(self, client: AsyncOpenAI):
        self.client = client

    @retry_on_failure(max_retries=3, delay=1.0)
    async def generate_completion(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: int = 2000
    ) -> str:
        """Generate text completion with retry logic"""
        messages = []

        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})

        messages.append({"role": "user", "content": prompt})

        try:
            response = await self.client.chat.completions.create(
                model="gpt-4o",
                messages=messages,
                temperature=temperature,
                max_tokens=max_tokens
            )

            return response.choices[0].message.content

        except Exception as e:
            logger.error(f"OpenAI API error: {str(e)}")
            raise

    @retry_on_failure(max_retries=3, delay=2.0)
    async def transcribe_audio(self, audio_file: bytes, language: str = 'en') -> str:
        """Transcribe audio using Whisper"""
        response = await self.client.audio.transcriptions.create(
            model="whisper-1",
            file=audio_file,
            language=language
        )
        return response.text
```

## 🎨 FRONTEND IMPLEMENTATION

### File Structure Reference

All frontend files should follow this pattern:

**File:** `apps/frontend/src/services/api.service.ts`

```typescript
import { createClient } from '@supabase/supabase-js'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1'

class APIService {
  private baseURL: string

  constructor() {
    this.baseURL = API_BASE_URL
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`

    // Get auth token from Supabase
    const { data: { session } } = await supabase.auth.getSession()

    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    }

    if (session?.access_token) {
      headers['Authorization'] = `Bearer ${session.access_token}`
    }

    const response = await fetch(url, {
      ...options,
      headers,
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error?.message || 'Request failed')
    }

    return response.json()
  }

  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' })
  }

  async post<T>(endpoint: string, data: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async patch<T>(endpoint: string, data: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' })
  }
}

export const apiService = new APIService()
```

## 📦 DEPENDENCIES

### Backend (requirements.txt)

```
fastapi==0.115.0
uvicorn[standard]==0.30.6
python-dotenv==1.0.1
pydantic==2.9.2
pydantic-settings==2.5.2
supabase==2.8.1
postgrest-py==0.17.0
openai==1.51.2
google-auth==2.35.0
google-auth-oauthlib==1.2.1
google-api-python-client==2.149.0
PyPDF2==3.0.1
python-docx==1.1.2
Pillow==10.4.0
pytesseract==0.3.13
httpx==0.27.2
python-multipart==0.0.12
slowapi==0.1.9
aiofiles==24.1.0
```

### Frontend (package.json dependencies)

```json
{
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "wouter": "^3.3.5",
    "@tanstack/react-query": "^5.60.5",
    "@supabase/supabase-js": "^2.45.4",
    "framer-motion": "^11.13.1",
    "lucide-react": "^0.453.0",
    "react-hook-form": "^7.53.1",
    "zod": "^3.23.8",
    "sonner": "^1.7.0",
    "recharts": "^2.12.7"
  }
}
```

## 🚀 NEXT STEPS

1. Implement all remaining repository classes following the base repository pattern
2. Implement all service classes with dependency injection
3. Implement all controllers with proper error handling
4. Create all DTOs with Pydantic validation
5. Implement adapters for external services
6. Create strategy implementations for scoring and document processing
7. Set up frontend components following the config-driven approach
8. Implement frontend services and hooks
9. Create comprehensive tests
10. Write documentation

Each file should follow SOLID principles and the patterns demonstrated above.
