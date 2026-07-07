import pdfplumber
import PyPDF2
import logging
from fastapi import UploadFile
from pathlib import Path
import shutil

logger = logging.getLogger("NOVA_AI")

class FileService:
    def __init__(self, upload_dir: str = "uploads/temporary"):
        self.upload_dir = Path(upload_dir)
        self.upload_dir.mkdir(parents=True, exist_ok=True)

    async def save_temp_file(self, file: UploadFile) -> Path:
        file_path = self.upload_dir / file.filename
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        return file_path

    def extract_text(self, file_path: Path) -> str:
        extension = file_path.suffix.lower()
        if extension == ".pdf":
            return self._extract_pdf(file_path)
        elif extension == ".txt":
            with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                return f.read()
        elif extension == ".docx":
            return self._extract_docx(file_path)
        else:
            return "File type not supported for text extraction."

    def _extract_docx(self, file_path: Path) -> str:
        try:
            import docx
            doc = docx.Document(file_path)
            full_text = []
            for para in doc.paragraphs:
                full_text.append(para.text)
            return "\n".join(full_text)
        except Exception as e:
            logger.error(f"Docx parsing failed: {e}")
            return "Failed to parse Word Document."

    def _extract_pdf(self, file_path: Path) -> str:
        text = ""
        try:
            with pdfplumber.open(file_path) as pdf:
                for page in pdf.pages:
                    page_text = page.extract_text()
                    if page_text:
                        text += page_text + "\n"
        except Exception as e:
            logger.warning(f"pdfplumber failed: {e}. Falling back to PyPDF2.")
            try:
                with open(file_path, "rb") as f:
                    reader = PyPDF2.PdfReader(f)
                    for page in reader.pages:
                        page_text = page.extract_text()
                        if page_text:
                            text += page_text + "\n"
            except Exception as fallback_e:
                logger.error(f"PyPDF2 fallback failed: {fallback_e}")
        return text

file_service = FileService()
