"""POST /transcribe — convert audio to text via OpenAI Whisper."""

from __future__ import annotations

from fastapi import APIRouter, File, HTTPException, UploadFile

from config import settings

router = APIRouter()


@router.post("/transcribe")
async def transcribe_audio(file: UploadFile = File(...)) -> dict:
    """Accept an audio file (m4a, mp3, wav, webm) and return its transcription."""
    if not settings.has_openai:
        raise HTTPException(
            status_code=503,
            detail="Transcription not available — add OPENAI_API_KEY to .env",
        )

    audio_bytes = await file.read()
    if not audio_bytes:
        raise HTTPException(status_code=400, detail="Empty audio file received")

    # expo-camera records .mov on iOS; Whisper handles audio+video containers.
    filename = file.filename or "audio.m4a"
    content_type = file.content_type or "audio/m4a"
    # Normalise content-type so Whisper accepts it
    if content_type in ("video/quicktime", "video/mp4"):
        content_type = "video/mp4"
        if not filename.endswith((".mov", ".mp4")):
            filename = filename + ".mp4"

    try:
        from openai import OpenAI  # type: ignore[import]

        client = OpenAI(api_key=settings.openai_api_key)
        response = client.audio.transcriptions.create(
            model="whisper-1",
            file=(filename, audio_bytes, content_type),
            language="en",
        )
        return {"text": response.text.strip()}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Transcription failed: {exc}") from exc
