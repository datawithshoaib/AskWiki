from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any, Literal

class Message(BaseModel):
    role: Literal["user", "assistant", "system"]
    content: str

class SourceDocument(BaseModel):
    title: str = "Wikipedia"
    source: str
    content: str
    score: Optional[float] = None
    page: Optional[int] = None

class ReasoningStep(BaseModel):
    step: str
    status: Literal["running", "complete", "skipped", "error"]
    detail: Optional[str] = None
    timestamp: Optional[float] = None

class ChatRequest(BaseModel):
    query: str = Field(..., min_length=1, description="User's question or search query")
    history: List[Message] = Field(default_factory=list, description="Recent conversation turns")
    stream: bool = Field(default=True, description="Whether to stream the answer")
    use_agentic_loop: bool = Field(default=True, description="Enable LangGraph agentic retrieval & grading")
    top_k: Optional[int] = Field(default=4, ge=1, le=10)

class ChatResponse(BaseModel):
    answer: str
    sources: List[SourceDocument] = Field(default_factory=list)
    reasoning_steps: List[ReasoningStep] = Field(default_factory=list)
    confidence: Optional[float] = None
    query_rewritten: Optional[str] = None
