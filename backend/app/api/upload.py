from fastapi import APIRouter
from fastapi import UploadFile
from fastapi import File
from app.services.chunk_service import chunk_text
from app.services.upload_service import save_pdf
from app.services.pdf_service import extract_text
from app.services.vector_service import store_embeddings
router = APIRouter(
    prefix="/upload",
    tags=["Knowledge Hub"]
)


@router.post("/")
async def upload_pdf(

    file: UploadFile = File(...)

):

    file_path = save_pdf(file)

    extracted_text = extract_text(file_path)
    chunks = chunk_text(extracted_text)

    stored_chunks = store_embeddings(
    file.filename,
    chunks
)

    return {

    "success": True,

    "filename": file.filename,

    "characters": len(extracted_text),

    "chunks": stored_chunks,

    "collection": "knowledge_base",

    "message": "Document Indexed Successfully"

}