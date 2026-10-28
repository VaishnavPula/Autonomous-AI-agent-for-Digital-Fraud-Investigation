from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.models import User
from app.auth.security import verify_token as decode_access_token
from app.auth.schemas import TokenData


oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl="/api/v1/auth/login"
)


def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    payload = decode_access_token(token)

    if payload is None:
        raise credentials_exception

    user_id = payload.get("sub")

    if user_id is None:
        raise credentials_exception

    token_data = TokenData(user_id=str(user_id))

    user = (
        db.query(User)
        .filter(User.id == token_data.user_id)
        .first()
    )

    if user is None:
        raise credentials_exception

    return user


def get_current_active_user(
    current_user: User = Depends(get_current_user),
) -> User:
    if not current_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user",
        )

    return current_user


def get_current_superuser(
    current_user: User = Depends(get_current_active_user),
) -> User:
    if not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions",
        )

    return current_user


class RoleChecker:
    def __init__(self, allowed_roles: list[str]):
        self.allowed_roles = allowed_roles

    def __call__(
        self,
        current_user: User = Depends(get_current_active_user),
    ) -> User:
        if current_user.role not in self.allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=(
                    f"Role {current_user.role} not allowed. "
                    f"Required: {self.allowed_roles}"
                ),
            )

        return current_user


require_superuser = get_current_superuser

require_admin = RoleChecker(["ADMIN"])

require_lead_investigator = RoleChecker(
    ["ADMIN", "LEAD_INVESTIGATOR"]
)

require_investigator = RoleChecker(
    ["ADMIN", "LEAD_INVESTIGATOR", "INVESTIGATOR"]
)

require_analyst = RoleChecker(
    ["ADMIN", "LEAD_INVESTIGATOR", "INVESTIGATOR", "ANALYST"]
)
