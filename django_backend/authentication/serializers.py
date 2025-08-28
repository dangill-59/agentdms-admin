from rest_framework import serializers
from users.models import User, UserRole


class LoginSerializer(serializers.Serializer):
    """
    Serializer for login requests.
    Equivalent to C# LoginRequest model.
    """
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)


class UserRoleSerializer(serializers.ModelSerializer):
    """
    Serializer for user roles.
    Equivalent to C# UserRoleDto.
    """
    role_name = serializers.CharField(source='role.name', read_only=True)

    class Meta:
        model = UserRole
        fields = ['id', 'user_id', 'role_id', 'role_name', 'created_at']


class UserSerializer(serializers.ModelSerializer):
    """
    Serializer for user information.
    Equivalent to C# UserDto.
    """
    roles = UserRoleSerializer(source='user_roles', many=True, read_only=True)
    permissions = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'is_immutable', 'roles', 'permissions']

    def get_permissions(self, obj):
        """Get all permissions for the user through their roles."""
        permissions = set()
        for user_role in obj.user_roles.all():
            for role_permission in user_role.role.role_permissions.all():
                permissions.add(role_permission.permission.name)
        return list(permissions)


class AuthResponseSerializer(serializers.Serializer):
    """
    Serializer for authentication response.
    Equivalent to C# AuthResponse model.
    """
    token = serializers.CharField()
    user = UserSerializer()
    expires_at = serializers.CharField()


class ForgotPasswordSerializer(serializers.Serializer):
    """
    Serializer for forgot password requests.
    Equivalent to C# ForgotPasswordRequest model.
    """
    email = serializers.EmailField()


class ResetPasswordSerializer(serializers.Serializer):
    """
    Serializer for reset password requests.
    Equivalent to C# ResetPasswordRequest model.
    """
    token = serializers.CharField()
    new_password = serializers.CharField(write_only=True)