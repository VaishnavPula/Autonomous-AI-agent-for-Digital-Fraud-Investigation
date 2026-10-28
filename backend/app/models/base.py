from sqlalchemy.orm import DeclarativeBase, declared_attr
from sqlalchemy import DateTime, func
from datetime import datetime
from typing import Any


class Base(DeclarativeBase):
    @declared_attr.directive
    def __tablename__(cls) -> str:
        return cls.__name__.lower()

    id: Any
    created_at: Any
    updated_at: Any


class TimestampMixin:
    created_at = None
    updated_at = None