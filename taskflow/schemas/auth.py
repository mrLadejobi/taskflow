"""Pydantic schemas for authentication flows."""
from pydantic import BaseModel, EmailStr


class LoginRequest(BaseModel):
    """Credentials submitted to the login endpoint."""

    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    """JWT access token returned after successful authentication."""

    access_token: str
    token_type: str = "bearer"


class TokenPayload(BaseModel):
    """Decoded contents of an access token."""

    sub: str
    exp: int
