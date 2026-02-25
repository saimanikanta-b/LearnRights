# Converted from test-quiz.js - test quiz by module ID (requires valid token)
import requests
import sys

BASE = "http://localhost:5000/api"
# Pass token as first arg: python test_quiz.py YOUR_JWT_TOKEN
TOKEN = sys.argv[1] if len(sys.argv) > 1 else ""


def main():
    print("Testing quiz endpoint...")
    url = f"{BASE}/quizzes/module?moduleId=6961197fb9c0423985754c6e"
    headers = {}
    if TOKEN:
        headers["Authorization"] = f"Bearer {TOKEN}"
    try:
        r = requests.get(url, headers=headers or None, timeout=10)
        r.raise_for_status()
        data = r.json()
        print("Quiz endpoint working!")
        print("Response status:", r.status_code)
        first = data[0] if isinstance(data, list) and data else data
        print("Quiz title:", first.get("title"))
        print("Number of questions:", len(first.get("questions") or []))
        qs = first.get("questions") or []
        if qs:
            print("First question:", qs[0].get("question"))
    except Exception as e:
        print("Quiz endpoint failed:", e)
        if hasattr(e, "response") and e.response is not None:
            print("Status:", e.response.status_code)
            try:
                print("Message:", e.response.json().get("detail"))
            except Exception:
                pass


if __name__ == "__main__":
    main()
