from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from taskflow.database import get_db
from taskflow.dependencies import DbSession, get_current_user
from taskflow.models import Tag
from taskflow.schemas import TagCreate, TagOut  # add these to schemas.py

router = APIRouter(prefix="/tags", tags=["tags"])


@router.get("", response_model=list[TagOut])
def list_tags(db: Session = Depends(get_db), _: object = Depends(get_current_user)):
    return db.scalars(select(Tag).order_by(Tag.name)).all()


@router.post("", response_model=TagOut, status_code=status.HTTP_201_CREATED)
def create_tag(payload: TagCreate, db: Session = Depends(get_db), _: object = Depends(get_current_user)):
    existing = db.scalar(select(Tag).where(Tag.name == payload.name))
    if existing:
        raise HTTPException(status_code=409, detail="Tag already exists")
    tag = Tag(name=payload.name)
    db.add(tag)
    db.commit()
    db.refresh(tag)
    return tag


@router.delete("/{tag_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_tag(tag_id: int, db: Session = Depends(get_db), _: object = Depends(get_current_user)):
    tag = db.get(Tag, tag_id)
    if not tag:
        raise HTTPException(status_code=404, detail="Tag not found")
    db.delete(tag)
    db.commit()
