from fastapi import APIRouter, UploadFile, File, Depends, HTTPException, Form
from fastapi.responses import FileResponse, Response, HTMLResponse
from typing import Optional
from pydantic import BaseModel
from sqlalchemy.orm import Session
import os
import datetime

from app.services.chunk_service import chunk_text
from app.services.upload_service import save_pdf
from app.services.pdf_service import extract_text
from app.services.vector_service import store_embeddings
from app.database.postgres import get_db

router = APIRouter(
    prefix="/upload",
    tags=["Knowledge Hub"]
)


class KnowledgeTextRequest(BaseModel):
    title: str
    description: str
    department: Optional[str] = "Engineering"
    category: Optional[str] = "Decision"
    reason: Optional[str] = ""
    priority: Optional[str] = "Medium"
    tags: Optional[str] = ""


@router.post("/n8n-proxy")
async def n8n_proxy(file: UploadFile = File(...), user_email: str = Form("default@cogniva.ai")):
    """Proxies the upload to n8n automation webhook to bypass browser CORS limitations."""
    import httpx
    
    file_bytes = await file.read()
    files = {'file': (file.filename, file_bytes, file.content_type)}
    data = {'user_email': user_email}
    
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.post("http://localhost:5678/webhook/knowledge-upload", data=data, files=files, timeout=60.0)
            
        if resp.status_code != 200:
            raise HTTPException(status_code=500, detail=f"n8n webhook returned error code {resp.status_code}: {resp.text}")
        
        try:
            return resp.json()
        except Exception:
            return {"success": True, "message": resp.text}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"n8n proxy error: {str(e)}")



@router.post("/")
def upload_document(
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """Uploads document (PDF, TXT, DOCX), stores metadata in PostgreSQL and vector embeddings in ChromaDB."""
    try:
        from app.models.document import Document as DocModel, DocumentChunk as ChunkModel
        
        timestamp_prefix = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
        original_filename = file.filename
        file.filename = f"{timestamp_prefix}_{file.filename}"

        file_path = save_pdf(file)
        extracted_text = extract_text(file_path)
        
        # Analyze if this file is already perfectly present in the DB
        existing_docs = db.query(DocModel).filter(DocModel.file_size == len(extracted_text)).all()
        for doc in existing_docs:
            if doc.filename.endswith(f"_{original_filename}") or doc.filename == original_filename:
                if os.path.exists(file_path):
                    os.remove(file_path)
                raise HTTPException(
                    status_code=409, 
                    detail=f"Analysis Complete: The file '{original_filename}' is already present in the Database. It needs not to be uploaded again."
                )

        if not extracted_text.strip():
            extracted_text = f"Document: {file.filename}\nContent uploaded to Knowledge Hub."

        chunks = chunk_text(extracted_text)

        # 1. Save Document metadata in PostgreSQL (cogniva_db)
        doc_id = None
        try:
            ext = file.filename.split('.')[-1].lower() if '.' in file.filename else 'pdf'
            doc_record = DocModel(
                filename=file.filename,
                file_type=ext.upper(),
                file_path=file_path,
                file_size=len(extracted_text),
                uploaded_by="Employee",
                total_chunks=len(chunks),
                status="Indexed in PostgreSQL & ChromaDB",
                department="Engineering" if "spec" in file.filename.lower() or "contract" in file.filename.lower() else "General"
            )
            db.add(doc_record)
            db.commit()
            db.refresh(doc_record)
            doc_id = doc_record.id

            # Save Chunks metadata in PostgreSQL
            for idx, chunk_str in enumerate(chunks):
                chunk_rec = ChunkModel(
                    document_id=doc_id,
                    chunk_no=idx + 1,
                    chunk_text=chunk_str[:500],  # preview
                    token_count=len(chunk_str.split()),
                    chroma_doc_id=f"{file.filename}_chunk_{idx}"
                )
                db.add(chunk_rec)
            
            db.commit()
        except Exception as db_err:
            db.rollback()
            print(f"PostgreSQL Document Metadata Save Notice: {db_err}")

        # 2. Store Vector Embeddings in ChromaDB Persistent Client
        now_ts = datetime.datetime.now().strftime("%Y-%m-%d %H:%M")
        stored_chunks = store_embeddings(
            filename=file.filename,
            chunks=chunks,
            department="Engineering" if "spec" in file.filename.lower() or "contract" in file.filename.lower() else "General",
            document_id=doc_id,
            category="PDF/DOCX Document",
            timestamp=now_ts
        )

        return {
            "success": True,
            "filename": file.filename,
            "document_id": doc_id,
            "characters": len(extracted_text),
            "chunks": stored_chunks,
            "collection": "knowledge_base",
            "message": "Document & Chunks Metadata Saved to PostgreSQL DB & ChromaDB Vector Store"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Document upload error: {str(e)}")


@router.post("/text")
async def add_knowledge_text(
    request: KnowledgeTextRequest,
    db: Session = Depends(get_db)
):
    """Indexes structured text knowledge into PostgreSQL (memory_vault) AND ChromaDB vector store."""
    try:
        # 1. Save to PostgreSQL database (pgAdmin accessible)
        try:
            from app.models.memory import Memory
            memory_record = Memory(
                department=request.department or "Engineering",
                title=request.title,
                decision=request.description,
                reason=request.reason or request.category or "Knowledge Memory Entry",
                priority=request.priority or "Medium"
            )
            db.add(memory_record)
            db.commit()
            db.refresh(memory_record)
            db_id = memory_record.id
        except Exception as db_err:
            db.rollback()
            db_id = "temp_id"
            print(f"PostgreSQL storage notice: {db_err}")

        # 2. Save vector embeddings into ChromaDB vector store
        combined_text = (
            f"KNOWLEDGE TITLE: {request.title}\n"
            f"DEPARTMENT: {request.department}\n"
            f"CATEGORY: {request.category}\n"
            f"PRIORITY: {request.priority}\n"
            f"TAGS: {request.tags}\n"
            f"DESCRIPTION: {request.description}\n"
            f"REASON / CONTEXT: {request.reason}"
        )
        
        now_ts = datetime.datetime.now().strftime("%Y-%m-%d %H:%M")
        timestamp_suffix = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
        virtual_filename = f"{request.department}_{request.title.replace(' ', '_')}_{timestamp_suffix}.txt"
        
        chunks = chunk_text(combined_text)
        stored_chunks = store_embeddings(
            filename=virtual_filename,
            chunks=chunks,
            department=request.department or "Engineering",
            category=request.category or "Structured Knowledge",
            timestamp=now_ts
        )

        return {
            "success": True,
            "db_id": db_id,
            "filename": virtual_filename,
            "title": request.title,
            "chunks": stored_chunks,
            "message": "Organizational Memory Saved to PostgreSQL DB & Vector Store"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Knowledge entry error: {str(e)}")


@router.get("/history")
def get_upload_history(db: Session = Depends(get_db)):
    """Returns categorized history of all uploaded documents and indexed memories."""
    history = []
    uploads_dir = "uploads"

    # 1. Scan physical uploads directory
    if os.path.exists(uploads_dir):
        for fname in os.listdir(uploads_dir):
            fpath = os.path.join(uploads_dir, fname)
            if os.path.isfile(fpath):
                stat = os.stat(fpath)
                ext = os.path.splitext(fname)[1].lower()
                ftype = "PDF Document" if ext == ".pdf" else "DOCX Document" if ext in [".docx", ".doc"] else "Presentation" if ext in [".ppt", ".pptx"] else "Text Document"
                
                # Fast content metadata summary without blocking pdfminer parsing
                full_content = f"Document File: {fname}\nType: {ftype}\nSize: {(stat.st_size / 1024):.1f} KB\nStatus: Vector Indexed in ChromaDB."
                if ext in [".txt", ".md", ".json"]:
                    try:
                        with open(fpath, "r", encoding="utf-8", errors="ignore") as tf:
                            full_content = tf.read(1000)
                    except Exception:
                        pass

                if not full_content or not full_content.strip():
                    full_content = f"Document File: {fname}\nUploaded and indexed in ChromaDB vector store."

                lname = fname.lower()
                category = "Architecture Spec" if any(k in lname for k in ["srs", "spec", "arch", "contract"]) else "SOP" if any(k in lname for k in ["array", "sorting", "searching", "sop", "dsa"]) else "Decision" if "memory" in lname else "General Document"
                
                history.append({
                    "id": f"file_{fname}",
                    "name": fname,
                    "type": ftype,
                    "extension": ext,
                    "category": category,
                    "department": "Engineering" if any(k in lname for k in ["srs", "contract", "dsa", "sorting", "searching"]) else "HR" if "hr" in lname else "General",
                    "size_bytes": stat.st_size,
                    "size_formatted": f"{(stat.st_size / 1024):.1f} KB" if stat.st_size < 1048576 else f"{(stat.st_size / 1048576):.2f} MB",
                    "timestamp": datetime.datetime.fromtimestamp(stat.st_mtime).strftime("%Y-%m-%d %H:%M"),
                    "status": "Vector Indexed in ChromaDB",
                    "source": "Physical Upload",
                    "priority": "High" if "srs" in lname or "contract" in lname else "Medium",
                    "description": full_content,
                    "content": full_content
                })

    # 2. Query PostgreSQL Memory table for structured memories
    try:
        from app.models.memory import Memory
        memories = db.query(Memory).order_by(Memory.id.desc()).all()
        for mem in memories:
            history.append({
                "id": f"mem_{mem.id}",
                "name": mem.title,
                "type": "Structured Memory",
                "extension": ".txt",
                "category": mem.reason if mem.reason and len(mem.reason) < 30 else "Decision Memory",
                "department": mem.department or "Engineering",
                "size_bytes": len(mem.decision or ""),
                "size_formatted": f"{len(mem.decision or '')} chars",
                "timestamp": mem.created_at.strftime("%Y-%m-%d %H:%M") if hasattr(mem, 'created_at') and mem.created_at else datetime.datetime.now().strftime("%Y-%m-%d %H:%M"),
                "status": "Indexed in PostgreSQL & ChromaDB",
                "source": "Memory Vault Entry",
                "priority": mem.priority or "Medium",
                "description": mem.decision,
                "content": mem.decision
            })
    except Exception as e:
        print(f"Memory table history fetch note: {e}")

    return {
        "success": True,
        "total_items": len(history),
        "history": history
    }


@router.delete("/clear-all")
def clear_all_data(db: Session = Depends(get_db)):
    """Deletes all uploaded physical files, ChromaDB vector embeddings, and PostgreSQL records."""
    import shutil
    from app.models.document import Document, DocumentChunk

    # 1. Clear physical uploads
    uploads_dir = "uploads"
    deleted_files_count = 0
    if os.path.exists(uploads_dir):
        for fname in os.listdir(uploads_dir):
            fpath = os.path.join(uploads_dir, fname)
            try:
                if os.path.isfile(fpath) or os.path.islink(fpath):
                    os.unlink(fpath)
                    deleted_files_count += 1
                elif os.path.isdir(fpath):
                    shutil.rmtree(fpath)
                    deleted_files_count += 1
            except Exception:
                pass

    # 2. Clear ChromaDB vector collection
    deleted_vectors_count = 0
    try:
        from app.services.vector_service import collection
        data = collection.get()
        if data and "ids" in data and len(data["ids"]) > 0:
            deleted_vectors_count = len(data["ids"])
            collection.delete(ids=data["ids"])
    except Exception:
        pass

    # 3. Clear PostgreSQL database tables
    try:
        db.query(DocumentChunk).delete()
        db.query(Document).delete()
        db.commit()
    except Exception as e:
        db.rollback()

    return {
        "success": True,
        "message": "All data cleared successfully!",
        "deleted_files": deleted_files_count,
        "deleted_vectors": deleted_vectors_count
    }


@router.delete("/record/{record_id}")
def delete_single_record(record_id: str, db: Session = Depends(get_db)):
    """Deletes a specific physical file or memory record and its ChromaDB vector embeddings."""
    try:
        from app.services.vector_service import collection
        from app.models.memory import Memory
        from app.models.document import Document, DocumentChunk

        filename = record_id
        if record_id.startswith("file_"):
            filename = record_id[5:]

        # 1. Delete memory record if structured memory
        if record_id.startswith("mem_"):
            try:
                mem_id = int(record_id[4:])
                db.query(Memory).filter(Memory.id == mem_id).delete()
                db.commit()
            except Exception as e:
                db.rollback()

        # 2. Delete physical upload file
        uploads_dir = "uploads"
        fpath = os.path.join(uploads_dir, filename)
        if os.path.exists(fpath) and os.path.isfile(fpath):
            try:
                os.remove(fpath)
            except Exception as e:
                print(f"File remove note: {e}")

        # 3. Delete matching ChromaDB vectors
        try:
            chroma_data = collection.get()
            if chroma_data and "ids" in chroma_data and chroma_data["ids"]:
                target_ids = []
                for idx, vector_id in enumerate(chroma_data["ids"]):
                    meta = chroma_data["metadatas"][idx] if "metadatas" in chroma_data and idx < len(chroma_data["metadatas"]) else {}
                    fname = meta.get("filename", meta.get("source", ""))
                    if fname == filename or vector_id == record_id:
                        target_ids.append(vector_id)
                
                if target_ids:
                    collection.delete(ids=target_ids)
        except Exception as ve:
            print(f"Chroma delete vector note: {ve}")

        # 4. Delete PostgreSQL document records
        try:
            docs = db.query(Document).filter(Document.filename == filename).all()
            for doc in docs:
                db.query(DocumentChunk).filter(DocumentChunk.document_id == doc.id).delete()
                db.delete(doc)
            db.commit()
        except Exception as de:
            db.rollback()

        return {"success": True, "message": f"Record '{filename}' deleted successfully."}
    except Exception as e:
        return {"success": False, "message": str(e)}


@router.delete("/chroma/{vector_id}")
def delete_chroma_vector(vector_id: str):
    """Deletes a specific ChromaDB vector chunk by its vector ID."""
    try:
        from app.services.vector_service import collection
        collection.delete(ids=[vector_id])
        return {"success": True, "message": f"ChromaDB vector '{vector_id}' deleted successfully."}
    except Exception as e:
        return {"success": False, "message": str(e)}


@router.get("/chroma-history")
def get_chroma_history():
    """Returns stored ChromaDB vector items, embeddings count, metadata, and chunk previews."""
    try:
        from app.services.vector_service import collection
        
        total_vectors = collection.count()
        data = collection.get(
            include=["documents", "metadatas"]
        )
        
        items = []
        if data and "ids" in data and data["ids"]:
            for idx, item_id in enumerate(data["ids"]):
                doc = data["documents"][idx] if "documents" in data and idx < len(data["documents"]) else ""
                meta = data["metadatas"][idx] if "metadatas" in data and idx < len(data["metadatas"]) else {}
                
                fname = meta.get("filename", meta.get("source", "Unknown_Source"))
                timestamp = meta.get("timestamp")
                if not timestamp:
                    timestamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M")

                items.append({
                    "id": item_id,
                    "filename": fname,
                    "chunk_index": meta.get("chunk_index", meta.get("chunk", 0)),
                    "department": meta.get("department", "Engineering"),
                    "category": meta.get("category", "Document Chunk"),
                    "document_id": str(meta.get("document_id", "N/A")),
                    "token_count": len(doc.split()) if doc else 0,
                    "char_count": len(doc) if doc else 0,
                    "preview": doc if doc else "",
                    "embedding_dim": "384 Float32 Vectors",
                    "embedding_model": "all-MiniLM-L6-v2",
                    "timestamp": timestamp
                })

        items.sort(key=lambda x: (x["timestamp"], x["filename"], x["chunk_index"]), reverse=True)
                
        return {
            "success": True,
            "collection_name": "knowledge_base",
            "total_vectors": total_vectors,
            "embedding_model": "all-MiniLM-L6-v2 (384-d)",
            "vector_store": "ChromaDB Persistent Client",
            "items": items
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "total_vectors": 0,
            "items": []
        }



@router.get("/file/{filename}")
def get_file_content(filename: str, download: bool = False, db: Session = Depends(get_db)):
    """Serves the actual document file download / view stream, or dynamically generates memory records."""
    import mimetypes
    
    uploads_dir = "uploads"
    file_path = os.path.join(uploads_dir, filename)
    if os.path.exists(file_path) and os.path.isfile(file_path):
        # Native browsers cannot render .docx files online, they auto-download.
        # If the user wants to truly view it online without downloading, we fallback to a clean text HTML extraction wrap.
        if not download and (filename.lower().endswith(".docx") or filename.lower().endswith(".doc")):
            try:
                import mammoth
                with open(file_path, "rb") as docx_file:
                    result = mammoth.convert_to_html(docx_file)
                    extracted = result.value
            except Exception:
                extracted = extract_text(file_path)
            
            html_content = f"<html><head><title>{filename}</title></head><body style='padding:40px; font-family:sans-serif; background-color:#f8fafc;'><div style='max-width:900px; margin:0 auto; background:white; padding:50px; border-radius:12px; box-shadow:0 1px 3px rgba(0,0,0,0.1); line-height:1.6; color:#334155;'>{extracted}</div></body></html>"
            return HTMLResponse(content=html_content)

        mime_type, _ = mimetypes.guess_type(file_path)
        media_type = mime_type or "application/octet-stream"
        
        return FileResponse(
            path=file_path,
            filename=filename,
            media_type=media_type,
            content_disposition_type="attachment" if download else "inline"
        )
    else:
        # Fallback: check if the filename matches a Structured Memory title in the DB
        from app.models.memory import Memory
        mem = db.query(Memory).filter(Memory.title == filename).first()
        if mem:
            content = f"MEMORY TITLE: {mem.title}\nDEPARTMENT: {mem.department or 'N/A'}\nPRIORITY: {mem.priority or 'N/A'}\n\nCONTENT PAYLOAD:\n{mem.decision or mem.reason or ''}"
            
            if not download:
                html_content = f"<html><head><title>{filename}</title></head><body style='padding:40px; font-family:sans-serif; background-color:#f8fafc;'><div style='max-width:900px; margin:0 auto; background:white; padding:50px; border-radius:12px; box-shadow:0 1px 3px rgba(0,0,0,0.1); line-height:1.6; color:#334155; white-space:pre-wrap;'>{content}</div></body></html>"
                return HTMLResponse(content=html_content)
            else:
                return Response(
                    content=content,
                    media_type="text/plain",
                    headers={"Content-Disposition": f"attachment; filename=\"{filename}.txt\""}
                )

    raise HTTPException(status_code=404, detail="File or Memory not found on server")