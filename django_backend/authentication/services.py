import jwt
import bcrypt
from datetime import datetime, timedelta
from django.conf import settings
from django.utils import timezone
from authentication.serializers import UserSerializer


class JwtService:
    """
    JWT service for token generation and validation.
    Equivalent to C# IJwtService.
    """

    @staticmethod
    def generate_token(user_data):
        """
        Generate JWT token for user.
        Equivalent to C# GenerateToken method.
        """
        if isinstance(user_data, dict):
            payload = user_data
        else:
            # Convert Django user object to dict
            serializer = UserSerializer(user_data)
            payload = serializer.data

        # Add JWT standard claims
        payload.update({
            'iss': settings.JWT_ISSUER,
            'aud': settings.JWT_AUDIENCE,
            'exp': datetime.utcnow() + timedelta(hours=24),
            'iat': datetime.utcnow(),
        })

        token = jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm='HS256')
        return token

    @staticmethod
    def validate_token(token):
        """
        Validate JWT token and return user data.
        Equivalent to C# ValidateToken method.
        """
        try:
            payload = jwt.decode(
                token, 
                settings.JWT_SECRET_KEY, 
                algorithms=['HS256'],
                audience=settings.JWT_AUDIENCE,
                issuer=settings.JWT_ISSUER
            )
            
            # Remove JWT standard claims to get user data
            user_data = {k: v for k, v in payload.items() if k not in ['exp', 'iat', 'iss', 'aud']}
            return user_data
        except jwt.ExpiredSignatureError:
            return None
        except jwt.InvalidTokenError:
            return None


class PasswordService:
    """
    Password hashing and verification service.
    Equivalent to BCrypt functionality in C# backend.
    """

    @staticmethod
    def hash_password(password):
        """Hash password using bcrypt."""
        password_bytes = password.encode('utf-8')
        salt = bcrypt.gensalt()
        hashed = bcrypt.hashpw(password_bytes, salt)
        return hashed.decode('utf-8')

    @staticmethod
    def verify_password(password, hashed_password):
        """Verify password against hash."""
        password_bytes = password.encode('utf-8')
        hashed_bytes = hashed_password.encode('utf-8')
        return bcrypt.checkpw(password_bytes, hashed_bytes)