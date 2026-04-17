from cryptography.fernet import Fernet
import os


# Cargar la clave de cifrado desde variable de entorno (obligatorio en producción)
FERNET_KEY = os.environ.get("FERNET_KEY")
if not FERNET_KEY:
    raise RuntimeError("[SEGURIDAD] No se ha definido la variable de entorno FERNET_KEY. Genera una clave segura y configúrala antes de iniciar el backend.")
fernet = Fernet(FERNET_KEY.encode())

def encrypt_text(plain_text: str) -> str:
    return fernet.encrypt(plain_text.encode()).decode()

def decrypt_text(cipher_text: str) -> str:
    return fernet.decrypt(cipher_text.encode()).decode()
