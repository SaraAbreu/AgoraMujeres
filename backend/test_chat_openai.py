import requests

url = "http://127.0.0.1:8000/chat"
headers = {"Content-Type": "application/json"}

messages = [
    "Hola, ¿cómo estás?",
    "¿Qué puedes hacer por mí?"
]

for msg in messages:
    response = requests.post(url, headers=headers, json={"message": msg})
    print(f"Pregunta: {msg}\nRespuesta: {response.text}\n")
