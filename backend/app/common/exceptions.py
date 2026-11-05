from fastapi import HTTPException, status


class CredentialsException(HTTPException):
    def __init__(self):
        super().__init__(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="No se pudieron validar las credenciales",
            headers={"WWW-Authenticate": "Bearer"},
        )


class UserAlreadyExistsException(HTTPException):
    def __init__(self):
        # Generic message on purpose: it must not confirm whether an email exists.
        super().__init__(
            status_code=status.HTTP_409_CONFLICT,
            detail="No se pudo completar el registro. Revisa los datos o inicia sesión.",
        )


class NotFoundException(HTTPException):
    def __init__(self, resource: str = "Recurso"):
        super().__init__(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"{resource} no encontrado",
        )


class ForbiddenException(HTTPException):
    def __init__(self):
        super().__init__(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permiso para acceder a este recurso",
        )


class ConflictException(HTTPException):
    def __init__(self, detail: str = "El recurso ya existe"):
        super().__init__(
            status_code=status.HTTP_409_CONFLICT,
            detail=detail,
        )


class RateLimitException(HTTPException):
    def __init__(self, retry_after: int = 60):
        super().__init__(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Demasiadas solicitudes. Inténtalo de nuevo más tarde.",
            headers={"Retry-After": str(retry_after)},
        )
