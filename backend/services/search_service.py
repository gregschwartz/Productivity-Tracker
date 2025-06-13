"""
Search query processing service with prompt injection protection and query improvement.
"""
import re
import weave
from typing import Optional
from services.ai_service import AIService

class SearchService:
    """Service for processing and improving search queries."""
    
    def __init__(self):
        self.ai_service = AIService()
        
        # Common prompt injection patterns
        self.injection_patterns = [
            r'\bignore\b.*\binstructions?\b',
            r'\bforget\b.*\babove\b',
            r'\bpretend\b.*\byou\s+are\b',
            r'\brole\s*[:=]\s*\w+',
            r'\bsystem\s*[:=]',
            r'\bassistant\s*[:=]',
            r'\buser\s*[:=]',
            r'```.*```',
            r'<[^>]*>.*</[^>]*>',
            r'\b(execute|run|eval|exec)\b.*\bcode\b',
            r'\bdisregard\b.*\bprevious\b',
            r'\boverride\b.*\bsettings?\b'
        ]
    
    @weave.op()
    def detect_prompt_injection(self, query: str) -> bool:
        """
        Detect potential prompt injection attempts.
        
        Args:
            query: The search query to check
            
        Returns:
            True if potential injection detected, False otherwise
        """
        query_lower = query.lower().strip()
        
        # Check for suspicious patterns
        for pattern in self.injection_patterns:
            if re.search(pattern, query_lower, re.IGNORECASE):
                return True
        
        # Check for excessive length (potential overflow attempt)
        if len(query) > 500:
            return True
            
        # Check for multiple consecutive special characters
        if re.search(r'[^\w\s]{5,}', query):
            return True
            
        return False
    
    @weave.op()
    def sanitize_query(self, query: str) -> str:
        """
        Sanitize search query by removing potentially harmful content.
        
        Args:
            query: The raw search query
            
        Returns:
            Sanitized query string
        """
        # Remove HTML/XML tags
        query = re.sub(r'<[^>]*>', '', query)
        
        # Remove code blocks
        query = re.sub(r'```.*?```', '', query, flags=re.DOTALL)
        
        # Remove role/system prompts
        query = re.sub(r'\b(role|system|assistant|user)\s*[:=]\s*[^\s]*', '', query, re.IGNORECASE)
        
        # Keep only alphanumeric, spaces, and basic punctuation
        query = re.sub(r'[^\w\s\-\.,!?]', ' ', query)
        
        # Collapse multiple spaces
        query = re.sub(r'\s+', ' ', query)
        
        return query.strip()
    
    @weave.op()
    async def improve_search_query(self, query: str) -> str:
        """
        Convert natural language queries to better search terms using AI.
        
        Args:
            query: The original search query
            
        Returns:
            Improved search query optimized for semantic search
        """
        # First check for prompt injection
        if self.detect_prompt_injection(query):
            # Return a safe, generic search term
            return "highfocus"
        
        # Sanitize the query
        sanitized_query = self.sanitize_query(query)
        
        # If query is very short or empty after sanitization, return as-is
        if len(sanitized_query.strip()) < 3:
            return sanitized_query.lower()
        
        # Use AI to improve the query, which will also do some prompt injection protection 
        improvement_prompt = f"""Convert this natural language search query into optimal keywords for semantic search of productivity summaries.

Rules:
1. Extract only the most relevant keywords and concepts
2. Remove filler words like "show me", "find", "weeks when", etc.
3. Focus on activity types, emotions, outcomes, and productivity concepts
4. Keep it concise (2-5 key words/phrases)
5. Return ONLY the improved search terms, nothing else

Examples:
"Show me weeks when I completed a lot of coding tasks" → "completed coding tasks"
"Find summaries about times I was stressed" → "stressed"
"Weeks with high productivity" → "high productivity focus"
"When did I work on machine learning projects?" → "machine learning"

Query: {sanitized_query}

Improved search terms:"""

        try:
            improved_query = await self.ai_service.generate_text(improvement_prompt)
            
            # Clean up the AI response
            improved_query = improved_query.strip().strip('"').strip("'")
            
            # Fallback to sanitized original if AI response is problematic
            if not improved_query or len(improved_query) > 100 or self.detect_prompt_injection(improved_query):
                return sanitized_query.lower()
                
            return improved_query.lower()
            
        except Exception:
            # Fallback to sanitized original query if AI improvement fails
            return sanitized_query.lower()
    
    @weave.op()
    def normalize_text_for_embedding(self, text: str) -> str:
        """
        Normalize text for consistent embedding generation.
        
        Args:
            text: The text to normalize
            
        Returns:
            Normalized text (lowercase, cleaned)
        """
        # Convert to lowercase
        text = text.lower()
        
        # Remove extra whitespace
        text = re.sub(r'\s+', ' ', text)
        
        # Remove leading/trailing whitespace
        text = text.strip()
        
        return text