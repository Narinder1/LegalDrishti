"""
Helper utilities
"""
import re
import os
import hashlib
from typing import Optional
from app.core.config import settings


def sanitize_text(text: str) -> str:
    """
    Sanitize text input - remove potentially harmful content
    """
    if not text:
        return ""
    
    # Remove excessive whitespace
    text = " ".join(text.split())
    
    # Remove control characters (except newlines)
    text = re.sub(r'[\x00-\x08\x0b\x0c\x0e-\x1f\x7f-\x9f]', '', text)
    
    return text.strip()


def validate_file_extension(filename: str) -> bool:
    """
    Check if file extension is allowed
    """
    if not filename:
        return False
    
    ext = filename.rsplit('.', 1)[-1].lower() if '.' in filename else ''
    return ext in settings.allowed_extensions_list


def get_file_extension(filename: str) -> Optional[str]:
    """
    Get file extension from filename
    """
    if not filename or '.' not in filename:
        return None
    return filename.rsplit('.', 1)[-1].lower()


def ensure_dir(path: str) -> None:
    """
    Ensure directory exists, create if not
    """
    os.makedirs(path, exist_ok=True)


def truncate_text(text: str, max_length: int = 100, suffix: str = "...") -> str:
    """
    Truncate text to max length with suffix
    """
    if not text or len(text) <= max_length:
        return text
    return text[:max_length - len(suffix)] + suffix


def calculate_file_hash(file_path: str) -> str:
    """
    Calculate SHA-256 hash of a file
    """
    hash_sha256 = hashlib.sha256()
    with open(file_path, "rb") as f:
        for chunk in iter(lambda: f.read(4096), b""):
            hash_sha256.update(chunk)
    return hash_sha256.hexdigest()


def calculate_file_hash_from_upload(file_data: bytes) -> str:
    """
    Calculate SHA-256 hash from uploaded file data
    """
    return hashlib.sha256(file_data).hexdigest()
