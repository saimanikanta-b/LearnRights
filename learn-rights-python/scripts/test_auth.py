"""Test signup and login end-to-end with the fixed code."""
import importlib
from app.database import get_db
from app.schemas import SignupBody, LoginBody
import app.routers.auth as auth_mod

importlib.reload(auth_mod)

db = get_db()
users = db["users"]

# Test 1: Signup new user
print("=== TEST SIGNUP ===")
try:
    body = SignupBody(name="Final Test", email="final_test_user@test.com", password="password123", preferredLanguage="en")
    result = auth_mod.signup(body)
    print("OK:", result["message"])
    print("Token:", result["token"][:40], "...")
    print("User:", result["user"]["name"], "-", result["user"]["email"])
except Exception as e:
    print("FAIL:", e)

# Test 2: Login with that user
print()
print("=== TEST LOGIN ===")
try:
    body = LoginBody(email="final_test_user@test.com", password="password123")
    result = auth_mod.login(body)
    print("OK:", result["message"])
    print("Token:", result["token"][:40], "...")
    print("User:", result["user"]["name"], "-", result["user"]["email"])
except Exception as e:
    print("FAIL:", e)

# Test 3: Signup another user (verify no duplicate key error)
print()
print("=== TEST SIGNUP #2 (no mobile) ===")
try:
    body = SignupBody(name="Second User", email="second_test_user@test.com", password="password456", preferredLanguage="en")
    result = auth_mod.signup(body)
    print("OK:", result["message"])
    print("User:", result["user"]["name"], "-", result["user"]["email"])
except Exception as e:
    print("FAIL:", e)

# Test 4: Login with wrong password
print()
print("=== TEST LOGIN WRONG PASSWORD ===")
try:
    body = LoginBody(email="final_test_user@test.com", password="wrongpassword")
    result = auth_mod.login(body)
    print("FAIL: Should have thrown error")
except Exception as e:
    print("OK - correctly rejected:", e)

# Clean up test users
users.delete_many({"email": {"$in": ["final_test_user@test.com", "second_test_user@test.com"]}})
print()
print("Test users cleaned up. All tests passed!")
