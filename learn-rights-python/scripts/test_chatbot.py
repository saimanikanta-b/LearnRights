import requests
BASE = "http://localhost:5000/api"
for msg, desc in [("hello", "Greeting"), ("What are my rights for domestic violence?", "Rights query")]:
    print("Test:", desc)
    try:
        r = requests.post(BASE + "/ai/chatbot", json={"message": msg, "context": "general"}, timeout=30)
        print("OK:", (r.json().get("response") or "")[:200])
    except Exception as e:
        print("Error:", e)
    print("---")
