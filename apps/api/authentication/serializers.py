from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)

        # Agregar campos personalizados al token
        token['username'] = user.username
        token['is_staff'] = user.is_staff
        
        try:
            token['rol'] = user.usuario.rol
        except:
            token['rol'] = 'usuario'

        return token