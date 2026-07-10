"""
Limitador de tasa compartido (slowapi). Un único Limiter para toda la app,
importado tanto por server.py (para registrarlo en la app) como por los
routers que necesiten decorar sus propios endpoints (ej. subscriptions.py).
"""

from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)
