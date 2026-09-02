from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database.base import Base


class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=True)
    filename = Column(String(255), nullable=False)
    file_type = Column(String(50), nullable=True, default="pdf")
    file_path = Column(String(500), nullable=True)
    file_size = Column(Integer, default=0)
    uploaded_by = Column(String(100), default="Akash M")
    department = Column(String(100), default="Engineering & Product")
    total_chunks = Column(Integer, default=0)
    status = Column(String(50), default="Indexed & Active")
    upload_date = Column(DateTime(timezone=True), server_default=func.now())

    chunks = relationship("DocumentChunk", back_populates="document", cascade="all, delete-orphan")


class DocumentChunk(Base):
    __tablename__ = "document_chunks"

    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, ForeignKey("documents.id", ondelete="CASCADE"), nullable=False)
    chunk_no = Column(Integer, nullable=False)
    chunk_text = Column(Text, nullable=False)
    token_count = Column(Integer, default=0)
    page = Column(Integer, nullable=True)
    chroma_doc_id = Column(String(255), nullable=True)

    document = relationship("Document", back_populates="chunks")
