from fastapi import Depends
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.auth.models import User
from app.auth.service import get_user_by_id
from app.common.security import decode_token
from app.common.exceptions import CredentialsException

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db),
) -> User:
    payload = decode_token(token, expected_type="access")
    if payload is None:
        raise CredentialsException()

    user_id: str = payload.get("sub")
    if user_id is None:
        raise CredentialsException()

    user = await get_user_by_id(db, user_id)
    if user is None or not user.is_active:
        raise CredentialsException()

    return user
