from fastapi import APIRouter, UploadFile, File, Depends, HTTPException, Form, Query
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
    uploaded_by: Optional[str] = Form(None),
    department: Optional[str] = Form(None),
    user_email: Optional[str] = Form(None),
    org_id: Optional[int] = Form(None),
    user_id: Optional[int] = Form(None),
    db: Session = Depends(get_db)
):
    """Uploads document (PDF, TXT, DOCX), stores multi-tenant metadata in PostgreSQL and vector embeddings in ChromaDB."""
    try:
        from app.models.document import Document as DocModel, DocumentChunk as ChunkModel
        from app.models.user import User
        from sqlalchemy.sql import func
        
        # Resolve user_id and org_id automatically if not explicitly provided
        effective_org_id = org_id
        effective_user_id = user_id
        lookup_email = (user_email or "").strip().lower()
        if lookup_email:
            user_rec = db.query(User).filter(func.lower(User.email) == lookup_email).first()
            if user_rec:
                if effective_org_id is None:
                    effective_org_id = user_rec.org_id
                if effective_user_id is None:
                    effective_user_id = user_rec.id
                if not uploaded_by:
                    uploaded_by = user_rec.full_name or user_rec.email

        timestamp_prefix = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
        original_filename = file.filename
        file.filename = f"{timestamp_prefix}_{file.filename}"

        file_path = save_pdf(file)
        extracted_text = extract_text(file_path)
        
        # Analyze if this file is already perfectly present in this organization
        existing_query = db.query(DocModel).filter(DocModel.file_size == len(extracted_text))
        if effective_org_id is not None:
            existing_query = existing_query.filter(DocModel.org_id == effective_org_id)
        existing_docs = existing_query.all()
        for doc in existing_docs:
            if doc.filename.endswith(f"_{original_filename}") or doc.filename == original_filename:
                if os.path.exists(file_path):
                    os.remove(file_path)
                raise HTTPException(
                    status_code=409, 
                    detail=f"Analysis Complete: The file '{original_filename}' is already present in your Organization Knowledge Hub."
                )

        if not extracted_text.strip():
            extracted_text = f"Document: {file.filename}\nContent uploaded to Knowledge Hub."

        chunks = chunk_text(extracted_text)

        # 1. Save Document metadata in PostgreSQL (cogniva_db)
        doc_id = None
        uploader_name = uploaded_by or user_email or "Enterprise Employee"
        dept_name = department or ("Engineering" if "spec" in file.filename.lower() or "contract" in file.filename.lower() else "General")
        try:
            ext = file.filename.split('.')[-1].lower() if '.' in file.filename else 'pdf'
            doc_record = DocModel(
                filename=file.filename,
                file_type=ext.upper(),
                file_path=file_path,
                file_size=len(extracted_text),
                uploaded_by=uploader_name,
                total_chunks=len(chunks),
                status="Indexed in PostgreSQL & ChromaDB",
                department=dept_name,
                org_id=effective_org_id,
                user_id=effective_user_id
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

        # 2. Store Vector Embeddings in ChromaDB Persistent Client with Multi-Tenant metadata
        now_ts = datetime.datetime.now().strftime("%Y-%m-%d %H:%M")
        stored_chunks = store_embeddings(
            filename=file.filename,
            chunks=chunks,
            department=dept_name,
            document_id=doc_id,
            category="PDF/DOCX Document",
            timestamp=now_ts,
            org_id=effective_org_id,
            user_id=effective_user_id
        )

        return {
            "success": True,
            "filename": file.filename,
            "document_id": doc_id,
            "org_id": effective_org_id,
            "user_id": effective_user_id,
            "characters": len(extracted_text),
            "chunks": stored_chunks,
            "collection": "knowledge_base",
            "message": "Document & Chunks Metadata Saved to PostgreSQL DB & ChromaDB Vector Store"
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Document upload error: {str(e)}")


@router.post("/knowledge-text")
def upload_knowledge_text(
    request: KnowledgeTextRequest,
    db: Session = Depends(get_db)
):
    """Indexes structured text knowledge into PostgreSQL (memory_vault) AND ChromaDB vector store."""
    try:
        # 1. Save structured record in PostgreSQL memory table
        db_id = None
        try:
            from app.models.memory import Memory
            new_mem = Memory(
                title=request.title,
                decision=request.description,
                reason=request.category,
                department=request.department or "Engineering",
                priority="Medium"
            )
            db.add(new_mem)
            db.commit()
            db.refresh(new_mem)
            db_id = new_mem.id
        except Exception as db_err:
            db.rollback()
            print(f"PostgreSQL memory table insert note: {db_err}")

        # 2. Save vector embeddings into ChromaDB vector store
        chunks = chunk_text(request.description)
        if not chunks:
            chunks = [request.description]

        virtual_filename = f"knowledge_{request.title.lower().replace(' ', '_')[:30]}.txt"
        now_ts = datetime.datetime.now().strftime("%Y-%m-%d %H:%M")
        stored_chunks = store_embeddings(
            filename=virtual_filename,
            chunks=chunks,
            department=request.department or "Engineering",
            document_id=db_id,
            category=request.category or "Organizational Decision",
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
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Knowledge entry error: {str(e)}")


@router.get("/history")
def get_upload_history(
    user_id: Optional[str] = Query(None),
    scope: Optional[str] = Query("all"),
    org_id: Optional[int] = Query(None),
    user_type: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """Returns categorized history of documents and memories scoped to organization and user permissions."""
    history = []
    uploads_dir = "uploads"
    seen_filenames = set()

    from app.models.document import Document as DocModel
    from app.models.user import User
    from sqlalchemy.sql import func

    # Determine effective org_id and user information
    effective_org_id = org_id
    resolved_user = None
    if user_id:
        clean_uid = str(user_id).strip().lower()
        if clean_uid.isdigit():
            resolved_user = db.query(User).filter(User.id == int(clean_uid)).first()
        else:
            resolved_user = db.query(User).filter(func.lower(User.email) == clean_uid).first()
        if resolved_user:
            if effective_org_id is None:
                effective_org_id = resolved_user.org_id
            if not user_type:
                user_type = getattr(resolved_user, "user_type", "employee")

    # 1. Query PostgreSQL Document table with Multi-Tenant Filtering
    try:
        query = db.query(DocModel)
        # Multi-Tenant Isolation: strictly isolate data by organization
        if user_type != "cogniva_admin":
            if effective_org_id is not None:
                query = query.filter((DocModel.org_id == effective_org_id) | (DocModel.org_id.is_(None)))
            else:
                query = query.filter(DocModel.org_id.is_(None))

        db_docs = query.order_by(DocModel.upload_date.desc()).all()
    except Exception as e:
        print(f"Document table query notice: {e}")
        db_docs = []

    # Process documents: colleagues within the same org see all org docs
    for doc in db_docs:
        uploader = doc.uploaded_by if doc.uploaded_by else "Enterprise Employee"
        
        # Check ownership and admin permissions
        is_super_admin = (user_type == "cogniva_admin")
        is_org_admin = (user_type == "org_admin" and (effective_org_id is None or doc.org_id is None or doc.org_id == effective_org_id))
        
        is_uploader = False
        if resolved_user:
            if doc.user_id and doc.user_id == resolved_user.id:
                is_uploader = True
            elif resolved_user.email and doc.uploaded_by and (resolved_user.email.lower() in doc.uploaded_by.lower() or doc.uploaded_by.lower() in resolved_user.email.lower()):
                is_uploader = True
            elif resolved_user.full_name and doc.uploaded_by and resolved_user.full_name.lower() in doc.uploaded_by.lower():
                is_uploader = True
        elif user_id:
            clean_u = str(user_id).strip().lower()
            if doc.user_id and str(doc.user_id) == clean_u:
                is_uploader = True
            elif uploader and (clean_u in uploader.lower() or uploader.lower() in clean_u):
                is_uploader = True

        # Scope filter:
        # 'mine' -> only documents uploaded by this specific user
        # 'all'  -> all shared organization documents visible to all colleagues!
        if scope == "mine" and not (is_uploader or is_super_admin):
            continue

        can_delete = is_super_admin or is_org_admin or is_uploader

        ext = f".{doc.file_type.lower()}" if doc.file_type else ".pdf"
        ftype = f"{doc.file_type} Document" if doc.file_type else "PDF Document"
        size = doc.file_size or 1024
        ts = doc.upload_date.strftime("%Y-%m-%d %H:%M") if doc.upload_date else datetime.datetime.now().strftime("%Y-%m-%d %H:%M")
        
        seen_filenames.add(doc.filename)
        history.append({
            "id": f"doc_{doc.id}",
            "name": doc.filename,
            "type": ftype,
            "extension": ext,
            "category": "Architecture Spec" if any(k in doc.filename.lower() for k in ["srs", "spec", "arch", "contract"]) else "General Document",
            "department": doc.department or "General",
            "uploaded_by": uploader,
            "user_id": doc.user_id,
            "org_id": doc.org_id,
            "can_delete": can_delete,
            "is_owner": is_uploader,
            "chunks": doc.total_chunks or 1,
            "size_bytes": size,
            "size_formatted": f"{(size / 1024):.1f} KB" if size < 1048576 else f"{(size / 1048576):.2f} MB",
            "timestamp": ts,
            "status": doc.status or "Vector Indexed in ChromaDB",
            "source": "Knowledge Hub Ingestion",
            "priority": "High" if "srs" in doc.filename.lower() or "contract" in doc.filename.lower() else "Medium",
            "description": f"Document: {doc.filename}\nIndexed in Knowledge Hub.",
            "content": f"Document: {doc.filename}\nIndexed in Knowledge Hub."
        })

    # 2. Query PostgreSQL Memory table for structured memories
    try:
        from app.models.memory import Memory
        memories = db.query(Memory).order_by(Memory.id.desc()).all()
        for mem in memories:
            if scope == "mine" and not is_super_admin:
                continue

            history.append({
                "id": f"mem_{mem.id}",
                "name": mem.title,
                "type": "Structured Memory",
                "extension": ".txt",
                "category": mem.reason if mem.reason and len(mem.reason) < 30 else "Decision Memory",
                "department": mem.department or "Engineering",
                "uploaded_by": "Enterprise Memory Vault",
                "can_delete": user_type in ["cogniva_admin", "org_admin"],
                "is_owner": False,
                "chunks": 1,
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
def clear_all_data(
    user_type: Optional[str] = Query(None),
    org_id: Optional[int] = Query(None),
    db: Session = Depends(get_db)
):
    """Deletes uploaded physical files, ChromaDB vectors, and records with role-based restrictions."""
    # 1. Employees cannot clear all organization data
    if user_type == "employee":
        raise HTTPException(
            status_code=403,
            detail="Permission Denied: Regular employees cannot wipe organization data. Only Organization Admins can perform this action."
        )

    import shutil
    from app.models.document import Document, DocumentChunk
    from clear_all_data import execute_data_wipe

    # If cogniva_admin or full maintenance, run comprehensive clean
    if user_type == "cogniva_admin" or org_id is None:
        result = execute_data_wipe()
        return {
            "success": True,
            "message": "All data cleared successfully across the platform!",
            "deleted_files": result.get("deleted_files", 0),
            "deleted_vectors": result.get("deleted_vectors", 0)
        }

    # If org_admin, only delete documents and vectors belonging to their org_id
    deleted_docs_count = 0
    deleted_vectors_count = 0
    try:
        from app.services.vector_service import collection
        org_docs = db.query(Document).filter(Document.org_id == org_id).all()
        for doc in org_docs:
            # Remove file
            if doc.file_path and os.path.exists(doc.file_path):
                try:
                    os.remove(doc.file_path)
                except Exception:
                    pass
            # Remove chunks & doc
            db.query(DocumentChunk).filter(DocumentChunk.document_id == doc.id).delete()
            db.delete(doc)
            deleted_docs_count += 1

            # Delete matching ChromaDB vectors
            try:
                chroma_data = collection.get()
                if chroma_data and "ids" in chroma_data and chroma_data["ids"]:
                    target_ids = []
                    for idx, vector_id in enumerate(chroma_data["ids"]):
                        meta = chroma_data["metadatas"][idx] if "metadatas" in chroma_data and idx < len(chroma_data["metadatas"]) else {}
                        if meta.get("filename") == doc.filename or str(meta.get("org_id")) == str(org_id):
                            target_ids.append(vector_id)
                    if target_ids:
                        collection.delete(ids=target_ids)
                        deleted_vectors_count += len(target_ids)
            except Exception:
                pass
        
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Org data clear failed: {str(e)}")

    return {
        "success": True,
        "message": f"Organization data cleared successfully! ({deleted_docs_count} documents removed)",
        "deleted_docs": deleted_docs_count,
        "deleted_vectors": deleted_vectors_count
    }


@router.delete("/record/{record_id}")
def delete_single_record(
    record_id: str,
    user_id: Optional[str] = Query(None),
    user_email: Optional[str] = Query(None),
    user_type: Optional[str] = Query(None),
    org_id: Optional[int] = Query(None),
    db: Session = Depends(get_db)
):
    """Deletes a specific document or memory record with strict multi-tenant ownership validation."""
    try:
        from app.services.vector_service import collection
        from app.models.memory import Memory
        from app.models.document import Document, DocumentChunk
        from app.models.user import User
        from sqlalchemy.sql import func

        # Resolve user info if not passed directly
        resolved_user = None
        if user_id:
            clean_uid = str(user_id).strip().lower()
            if clean_uid.isdigit():
                resolved_user = db.query(User).filter(User.id == int(clean_uid)).first()
            else:
                resolved_user = db.query(User).filter(func.lower(User.email) == clean_uid).first()
            if resolved_user and not user_type:
                user_type = getattr(resolved_user, "user_type", "employee")
            if resolved_user and org_id is None:
                org_id = resolved_user.org_id

        # 1. Check if deleting a structured memory
        if record_id.startswith("mem_"):
            try:
                mem_id = int(record_id[4:])
                if user_type not in ["cogniva_admin", "org_admin"]:
                    raise HTTPException(status_code=403, detail="Permission Denied: Only Admins can remove structured organization memories.")
                db.query(Memory).filter(Memory.id == mem_id).delete()
                db.commit()
                return {"success": True, "message": f"Memory record '{record_id}' deleted successfully."}
            except HTTPException:
                raise
            except Exception as e:
                db.rollback()
                raise HTTPException(status_code=500, detail=f"Memory delete error: {str(e)}")

        # 2. Check document in database
        target_doc = None
        filename = record_id
        if record_id.startswith("doc_"):
            try:
                doc_id_val = int(record_id[4:])
                target_doc = db.query(Document).filter(Document.id == doc_id_val).first()
                if target_doc:
                    filename = target_doc.filename
            except Exception:
                pass
        elif record_id.startswith("file_"):
            filename = record_id[5:]
            target_doc = db.query(Document).filter(Document.filename == filename).first()
        else:
            target_doc = db.query(Document).filter(Document.filename == filename).first()

        # If document exists, enforce multi-tenant and ownership permissions
        if target_doc:
            # Multi-Tenant check
            if user_type != "cogniva_admin" and target_doc.org_id is not None and org_id is not None:
                if int(target_doc.org_id) != int(org_id):
                    raise HTTPException(
                        status_code=403,
                        detail="Permission Denied: Cross-organization document deletion is prohibited."
                    )

            # Ownership check
            is_super_admin = (user_type == "cogniva_admin")
            is_org_admin = (user_type == "org_admin")
            is_owner = False

            clean_email = (user_email or (resolved_user.email if resolved_user else "")).strip().lower()
            clean_uid = str(user_id or (resolved_user.id if resolved_user else "")).strip().lower()
            doc_uploader = (target_doc.uploaded_by or "").strip().lower()

            if target_doc.user_id and clean_uid and str(target_doc.user_id) == clean_uid:
                is_owner = True
            elif clean_email and (clean_email in doc_uploader or doc_uploader in clean_email):
                is_owner = True
            elif clean_uid and (clean_uid in doc_uploader or doc_uploader in clean_uid):
                is_owner = True

            if not (is_super_admin or is_org_admin or is_owner):
                raise HTTPException(
                    status_code=403,
                    detail="Permission Denied: You can only remove data you personally uploaded. Common organization data cannot be removed."
                )

        # Proceed to delete matching physical upload file
        uploads_dir = "uploads"
        fpath = os.path.join(uploads_dir, filename)
        if os.path.exists(fpath) and os.path.isfile(fpath):
            try:
                os.remove(fpath)
            except Exception as e:
                print(f"File remove notice: {e}")

        # Delete matching ChromaDB vectors
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
            print(f"Chroma delete vector notice: {ve}")

        # Delete PostgreSQL document records
        if target_doc:
            try:
                db.query(DocumentChunk).filter(DocumentChunk.document_id == target_doc.id).delete()
                db.delete(target_doc)
                db.commit()
            except Exception as de:
                db.rollback()
                print(f"DB delete doc notice: {de}")

        return {"success": True, "message": f"Document '{filename}' deleted successfully."}
    except HTTPException:
        raise
    except Exception as e:
        return {"success": False, "message": str(e)}


@router.post("/wipe-all-now")
def wipe_all_now(db: Session = Depends(get_db)):
    """Immediate Clean Wipe endpoint to remove all currently existing parsed documents, chunks, and vectors."""
    from clear_all_data import execute_data_wipe
    res = execute_data_wipe()
    return {
        "success": True,
        "message": "All existing parsed data, documents, and vector store successfully wiped!",
        "result": res
    }


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