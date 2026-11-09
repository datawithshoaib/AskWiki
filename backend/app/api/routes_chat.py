import json
import asyncio
from typing import AsyncGenerator
from fastapi import APIRouter, HTTPException, Depends
from sse_starlette.sse import EventSourceResponse

from app.schemas.chat import ChatRequest, ChatResponse
from app.services.rag_graph import run_rag_pipeline, rag_agent, AgentState
from app.core.config import settings

router = APIRouter(prefix="/chat", tags=["Chat"])

@router.post("", response_model=ChatResponse)
async def chat_endpoint(request: ChatRequest):
    """
    Synchronous / standard API endpoint for querying the Wikipedia Knowledge Base.
    Executes the full LangGraph Corrective RAG pipeline.
    """
    try:
        history_dicts = [{"role": m.role, "content": m.content} for m in request.history]
        response = run_rag_pipeline(
            query=request.query,
            history=history_dicts,
            top_k=request.top_k or 4
        )
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"RAG execution failed: {str(e)}")


@router.post("/stream")
async def chat_stream_endpoint(request: ChatRequest):
    """
    Server-Sent Events (SSE) streaming endpoint.
    Emits real-time reasoning steps, retrieved sources, and token generation deltas.
    """
    async def event_generator() -> AsyncGenerator[str, None]:
        history_dicts = [{"role": m.role, "content": m.content} for m in request.history]
        
        # Initial step
        yield json.dumps({
            "event": "step",
            "data": {
                "step": "Pipeline Initialized",
                "status": "running",
                "detail": f"Starting LangGraph agentic workflow for '{request.query}'",
            }
        })
        await asyncio.sleep(0.05)

        try:
            # Run graph execution in thread pool to avoid blocking async loop
            loop = asyncio.get_event_loop()
            res = await loop.run_in_executor(
                None,
                run_rag_pipeline,
                request.query,
                history_dicts,
                request.top_k or 4
            )

            # Stream the reasoning steps that occurred
            for step in res.reasoning_steps:
                yield json.dumps({
                    "event": "step",
                    "data": {
                        "step": step.step,
                        "status": step.status,
                        "detail": step.detail,
                        "timestamp": step.timestamp
                    }
                })
                await asyncio.sleep(0.04)

            # Stream sources
            yield json.dumps({
                "event": "sources",
                "data": [s.model_dump() for s in res.sources]
            })

            # Stream text answer in chunks for responsive UI feel
            answer = res.answer
            chunk_size = 20
            for i in range(0, len(answer), chunk_size):
                token = answer[i:i+chunk_size]
                yield json.dumps({
                    "event": "token",
                    "data": token
                })
                await asyncio.sleep(0.015)

            # Completion event
            yield json.dumps({
                "event": "done",
                "data": {
                    "full_answer": answer,
                    "confidence": res.confidence
                }
            })

        except Exception as e:
            yield json.dumps({
                "event": "error",
                "data": str(e)
            })

    return EventSourceResponse(event_generator())
