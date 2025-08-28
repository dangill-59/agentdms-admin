import logging
from datetime import datetime, timedelta
from django.conf import settings
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from users.models import User
from authentication.serializers import (
    LoginSerializer, AuthResponseSerializer, UserSerializer,
    ForgotPasswordSerializer, ResetPasswordSerializer
)
from authentication.services import JwtService, PasswordService


logger = logging.getLogger(__name__)


@api_view(['POST'])
@permission_classes([AllowAny])
def login(request):
    """
    Authenticate user using email and password credentials.
    Supports both database authentication and demo authentication for development.
    Equivalent to C# AuthController.Login method.
    """
    serializer = LoginSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    email = serializer.validated_data['email']
    password = serializer.validated_data['password']

    logger.info(f"Login attempt for email: {email}")

    try:
        # First, try database authentication
        logger.debug(f"Attempting database authentication for email: {email}")
        
        try:
            user = User.objects.select_related().prefetch_related(
                'user_roles__role__role_permissions__permission'
            ).get(email=email)
            
            logger.debug(f"User found in database for email: {email}")
            
            # Verify password using custom password hash or Django's password
            password_match = False
            if user.password_hash:
                # Use custom bcrypt hash
                password_match = PasswordService.verify_password(password, user.password_hash)
            else:
                # Fallback to Django's password system
                password_match = user.check_password(password)
            
            logger.debug(f"Password verification result for email {email}: {password_match}")

            if password_match:
                logger.info(f"Database authentication successful for email: {email}")
                
                # Database authentication successful
                user_serializer = UserSerializer(user)
                user_data = user_serializer.data

                # Generate JWT token
                token = JwtService.generate_token(user_data)
                expires_at = (datetime.utcnow() + timedelta(hours=24)).strftime("%Y-%m-%dT%H:%M:%SZ")

                response_data = {
                    'token': token,
                    'user': user_data,
                    'expires_at': expires_at
                }

                logger.info(f"JWT token generated successfully for user: {email}")
                return Response(response_data, status=status.HTTP_200_OK)
            
        except User.DoesNotExist:
            logger.warning(f"User not found in database for email: {email}")
            user = None
            password_match = False

        # If database auth failed or user not found, try demo authentication
        if not user or not password_match:
            logger.debug(f"Attempting demo authentication for email: {email}")
            
            # Check for demo credentials (matching C# hardcoded credentials)
            demo_user = None
            
            if email == "admin@agentdms.com" and password == "admin123":
                logger.info(f"Demo authentication successful for email: {email}")
                demo_user = {
                    'id': '1',
                    'username': 'admin',
                    'email': email,
                    'is_immutable': False,
                    'roles': [{
                        'id': '1',
                        'user_id': '1',
                        'role_id': '1',
                        'role_name': 'Administrator',
                        'created_at': datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%S.%fZ")
                    }],
                    'permissions': ['workspace.admin']
                }
            elif email == "gill.dan2@gmail.com" and password == "admin123":
                logger.info(f"Demo authentication successful for dan user: {email}")
                demo_user = {
                    'id': '2',
                    'username': 'gill.dan2',
                    'email': email,
                    'is_immutable': False,
                    'roles': [{
                        'id': '2',
                        'user_id': '2',
                        'role_id': '2',
                        'role_name': 'User',
                        'created_at': datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%S.%fZ")
                    }],
                    'permissions': ['document.view']
                }
            elif email == "superadmin@agentdms.com" and password == "sarasa123":
                logger.info(f"Hardcoded superadmin authentication successful for email: {email}")
                demo_user = {
                    'id': '0',
                    'username': 'superadmin',
                    'email': email,
                    'is_immutable': True,
                    'roles': [{
                        'id': '0',
                        'user_id': '0',
                        'role_id': '0',
                        'role_name': 'Super Admin',
                        'created_at': datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%S.%fZ")
                    }],
                    'permissions': ['workspace.admin', 'document.view', 'document.edit', 'document.delete', 'document.print', 'document.annotate']
                }

            if demo_user:
                # Generate JWT token for demo user
                token = JwtService.generate_token(demo_user)
                expires_at = (datetime.utcnow() + timedelta(hours=24)).strftime("%Y-%m-%dT%H:%M:%SZ")

                response_data = {
                    'token': token,
                    'user': demo_user,
                    'expires_at': expires_at
                }

                logger.info(f"Demo JWT token generated successfully for user: {email}")
                return Response(response_data, status=status.HTTP_200_OK)

        # Authentication failed
        error_message = "Incorrect password" if user else "User not found"
        if not settings.DEBUG:
            error_message = "Invalid email or password"
        
        logger.info(f"Returning Unauthorized response. Reason: {error_message}")
        return Response({'message': error_message}, status=status.HTTP_401_UNAUTHORIZED)

    except Exception as ex:
        logger.error(f"An exception occurred during authentication attempt for email: {email}", exc_info=True)
        return Response({'message': 'An error occurred during authentication'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
def logout(request):
    """
    Log out the current user by invalidating their session.
    Equivalent to C# AuthController.Logout method.
    """
    logger.info("User logout requested")
    return Response({'message': 'Logged out successfully'}, status=status.HTTP_200_OK)


@api_view(['GET'])
def get_current_user(request):
    """
    Retrieve the current authenticated user's information.
    Validates the JWT token and returns user details.
    Equivalent to C# AuthController.GetCurrentUser method.
    """
    logger.debug("Current user information requested")
    
    # Extract the JWT token from the Authorization header
    auth_header = request.META.get('HTTP_AUTHORIZATION')
    if auth_header and auth_header.startswith('Bearer '):
        token = auth_header[7:]  # Remove 'Bearer ' prefix
        logger.debug("JWT token found in Authorization header, validating token")
        
        user_data = JwtService.validate_token(token)
        
        if user_data:
            logger.info(f"JWT token validation successful for user: {user_data.get('email')}")
            return Response(user_data, status=status.HTTP_200_OK)
        else:
            logger.warning("JWT token validation failed")
    else:
        logger.debug("No valid Authorization header found, falling back to demo user")

    # Fallback to sample user data for demo purposes
    demo_user = {
        'id': '1',
        'username': 'admin',
        'email': 'admin@agentdms.com',
        'is_immutable': False,
        'roles': [{
            'id': '1',
            'user_id': '1',
            'role_id': '1',
            'role_name': 'Administrator',
            'created_at': datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%S.%fZ")
        }],
        'permissions': ['workspace.admin']
    }

    logger.debug("Returning demo user data")
    return Response(demo_user, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([AllowAny])
def forgot_password(request):
    """
    Initiate a password reset process by sending a reset email to the user.
    Equivalent to C# AuthController.ForgotPassword method.
    """
    serializer = ForgotPasswordSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    email = serializer.validated_data['email']
    logger.info(f"Password reset request for email: {email}")

    try:
        # Check if user exists in database
        try:
            user = User.objects.get(email=email)
            logger.info(f"User found in database for password reset: {email}")
            # In a real implementation, you would:
            # 1. Generate a secure reset token
            # 2. Store it in the database with an expiration time
            # 3. Send an email with the reset link
            logger.info(f"Password reset email would be sent to: {email}")
        except User.DoesNotExist:
            # For security, always return success even if user doesn't exist
            # This prevents email enumeration attacks
            logger.warning(f"Password reset requested for non-existent user: {email}")

        # Always return success to prevent email enumeration
        return Response({
            'message': 'If an account with that email exists, a password reset link has been sent.'
        }, status=status.HTTP_200_OK)

    except Exception as ex:
        logger.error(f"Error processing password reset request for email: {email}", exc_info=True)
        return Response({
            'message': 'An error occurred while processing your request'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([AllowAny])
def reset_password(request):
    """
    Reset a user's password using a valid reset token.
    Equivalent to C# AuthController.ResetPassword method.
    """
    serializer = ResetPasswordSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    token = serializer.validated_data['token']
    new_password = serializer.validated_data['new_password']

    logger.info("Password reset attempt with token")

    try:
        # In a real implementation, you would:
        # 1. Validate the reset token
        # 2. Check if it's not expired
        # 3. Find the associated user
        # 4. Hash the new password
        # 5. Update the user's password in the database
        # 6. Invalidate the reset token

        # For demo purposes, simulate this process
        if not token or not new_password:
            return Response({
                'message': 'Invalid reset token or password'
            }, status=status.HTTP_400_BAD_REQUEST)

        # Simulate token validation (in reality, you'd validate against database)
        if token.startswith("demo-reset-token-"):
            logger.info("Demo password reset successful")
            return Response({
                'message': 'Password has been reset successfully'
            }, status=status.HTTP_200_OK)
        else:
            logger.warning("Invalid reset token provided")
            return Response({
                'message': 'Invalid or expired reset token'
            }, status=status.HTTP_400_BAD_REQUEST)

    except Exception as ex:
        logger.error("Error processing password reset", exc_info=True)
        return Response({
            'message': 'An error occurred while resetting your password'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
