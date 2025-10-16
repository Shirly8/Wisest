"""
RAG (Retrieval-Augmented Generation) module
Adapted from QueryIQ for Shirley's portfolio chatbot
Uses Gemini API (replaces Ollama) + Supabase (replaces ChromaDB)
"""

from .Query import query_rag
from . import RAG

__all__ = ['query_rag', 'RAG']
