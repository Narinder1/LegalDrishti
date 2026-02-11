"""
Text Extraction Service - Uses Docling for document text extraction
Supports PDF, DOCX, and other document formats
"""
import os
import re
import logging
from typing import Optional, Dict, Any

logger = logging.getLogger(__name__)


class ExtractionService:
    """Service for extracting text from documents using Docling"""

    @staticmethod
    async def extract_text(file_path: str, extraction_method: str = "direct") -> Dict[str, Any]:
        """
        Extract text from a document using Docling.

        Args:
            file_path: Path to the document file
            extraction_method: One of 'direct', 'ocr', 'hybrid'

        Returns:
            Dictionary with raw_text and metadata
        """
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"Document file not found: {file_path}")

        file_ext = os.path.splitext(file_path)[1].lower()

        try:
            # Use Docling for extraction
            from docling.document_converter import DocumentConverter, PdfFormatOption
            from docling.datamodel.pipeline_options import PdfPipelineOptions
            from docling.datamodel.base_models import InputFormat

            # Configure pipeline options based on extraction method
            pipeline_options = PdfPipelineOptions()

            if extraction_method == "ocr":
                pipeline_options.do_ocr = True
                pipeline_options.do_table_structure = True
            elif extraction_method == "hybrid":
                pipeline_options.do_ocr = True
                pipeline_options.do_table_structure = True
            else:
                # direct - text extraction without OCR
                pipeline_options.do_ocr = False
                pipeline_options.do_table_structure = True

            converter = DocumentConverter(
                format_options={
                    InputFormat.PDF: PdfFormatOption(pipeline_options=pipeline_options)
                }
            )

            # Convert the document
            result = converter.convert(file_path)

            # Get the full text as markdown (preserves structure)
            raw_text = result.document.export_to_markdown()

            # Count pages if available
            page_count = None
            if hasattr(result.document, 'pages') and result.document.pages:
                page_count = len(result.document.pages)

            # Count words
            word_count = len(raw_text.split()) if raw_text else 0

            return {
                "raw_text": raw_text,
                "page_count": page_count,
                "word_count": word_count,
                "extraction_method": extraction_method,
            }

        except ImportError:
            logger.warning("Docling not installed, falling back to basic extraction")
            return await ExtractionService._fallback_extract(file_path, file_ext)

        except Exception as e:
            logger.error(f"Docling extraction failed: {str(e)}, falling back to basic extraction")
            return await ExtractionService._fallback_extract(file_path, file_ext)

    @staticmethod
    async def _fallback_extract(file_path: str, file_ext: str) -> Dict[str, Any]:
        """Fallback text extraction without Docling"""
        raw_text = ""

        if file_ext == ".txt":
            with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                raw_text = f.read()
        elif file_ext == ".pdf":
            try:
                import fitz  # PyMuPDF
                doc = fitz.open(file_path)
                pages = []
                for page in doc:
                    pages.append(page.get_text())
                raw_text = "\n\n".join(pages)
                doc.close()
            except ImportError:
                raise RuntimeError(
                    "Neither docling nor PyMuPDF is installed. Install docling: pip install docling"
                )
        else:
            raise RuntimeError(f"Unsupported file type for fallback extraction: {file_ext}")

        word_count = len(raw_text.split()) if raw_text else 0
        return {
            "raw_text": raw_text,
            "page_count": None,
            "word_count": word_count,
            "extraction_method": "fallback",
        }

    @staticmethod
    async def clean_text(raw_text: str) -> str:
        """
        Clean extracted text by removing artifacts, normalizing whitespace, etc.

        Args:
            raw_text: The raw extracted text

        Returns:
            Cleaned text string
        """
        if not raw_text:
            return ""

        cleaned = raw_text

        # Remove HTML comments like <!-- image -->
        cleaned = re.sub(r"<!--\s*\w+\s*-->", "", cleaned)

        # Remove HTML entities and unknown tags
        cleaned = re.sub(r"&lt;unknown&gt;", "", cleaned, flags=re.IGNORECASE)
        cleaned = re.sub(r"&[a-z]+;", "", cleaned, flags=re.IGNORECASE)

        # Normalize line endings
        cleaned = cleaned.replace("\r\n", "\n").replace("\r", "\n")

        # Remove repeated header/footer patterns (like "NC: 2025:KHC:410" or "CP No. 411 of 2024")
        cleaned = re.sub(r"\n\s*NC:\s*\d{4}:[A-Z]+:\d+\s*\n", "\n", cleaned)
        cleaned = re.sub(r"\n\s*CP\s+No\.?\s+\d+\s+of\s+\d{4}\s*\n", "\n", cleaned, flags=re.IGNORECASE)
        
        # Remove standalone ## symbols on a line
        cleaned = re.sub(r"\n\s*#{1,6}\s*\n", "\n", cleaned)
        
        # Remove ## markdown symbols from the beginning of headings
        cleaned = re.sub(r"^#{1,6}\s+", "", cleaned, flags=re.MULTILINE)
        
        # Remove bullet point dashes from list items (- i., - ii., - iv., etc.)
        cleaned = re.sub(r"^-\s+", "", cleaned, flags=re.MULTILINE)

        # Remove excessive blank lines (more than 2 consecutive)
        cleaned = re.sub(r"\n{3,}", "\n\n", cleaned)

        # Remove page numbers (common patterns like "Page 1 of 10", "- 1 -", etc.)
        cleaned = re.sub(r"\n\s*[-–—]?\s*\d+\s*[-–—]?\s*\n", "\n", cleaned)
        cleaned = re.sub(r"\nPage\s+\d+\s*(of\s+\d+)?\s*\n", "\n", cleaned, flags=re.IGNORECASE)

        # Remove common header/footer artifacts
        cleaned = re.sub(r"\n\s*(CONFIDENTIAL|DRAFT|DO NOT DISTRIBUTE)\s*\n", "\n", cleaned, flags=re.IGNORECASE)
        
        # Remove footer patterns (List No, Sl No, etc.)
        cleaned = re.sub(r"\n\s*List\s+No\.?:\s*\d+\s*\n", "\n", cleaned, flags=re.IGNORECASE)
        cleaned = re.sub(r"\n\s*Sl\s+No\.?:\s*\d+\s*\n", "\n", cleaned, flags=re.IGNORECASE)

        # Normalize whitespace within lines (collapse multiple spaces/tabs)
        cleaned = re.sub(r"[ \t]+", " ", cleaned)

        # Remove leading/trailing whitespace from each line
        lines = cleaned.split("\n")
        lines = [line.strip() for line in lines]
        cleaned = "\n".join(lines)

        # Remove leading/trailing whitespace from entire text
        cleaned = cleaned.strip()

        return cleaned
