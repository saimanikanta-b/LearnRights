from pathlib import Path
import uuid
from fastapi import APIRouter, HTTPException, UploadFile, File
from bson import ObjectId
from app.database import get_db
from app.schemas import UpdateProfileBody
from app.config import UPLOAD_DIR

router = APIRouter()


@router.get("/{userId}")
def get_profile(userId: str):
    db = get_db()
    try:
        oid = ObjectId(userId)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid user ID")
    user = db["users"].find_one({"_id": oid}, {"password": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user["_id"] = str(user["_id"])
    if user.get("completedModules"):
        user["completedModules"] = [str(x) for x in user["completedModules"]]
    if user.get("quizzes"):
        user["quizzes"] = [{**q, "moduleId": str(q.get("moduleId") or q.get("_id", ""))} if isinstance(q, dict) else q for q in user["quizzes"]]
    return user


@router.put("/{userId}")
def update_profile(userId: str, body: UpdateProfileBody):
    db = get_db()
    try:
        oid = ObjectId(userId)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid user ID")
    user = db["users"].find_one({"_id": oid})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    upd = {}
    if body.name is not None:
        upd["name"] = body.name
    if body.email is not None:
        upd["email"] = body.email
    if body.mobile is not None:
        upd["mobile"] = body.mobile
    if body.preferredLanguage is not None:
        upd["preferredLanguage"] = body.preferredLanguage
    if body.showOnLeaderboard is not None:
        upd["showOnLeaderboard"] = body.showOnLeaderboard
    if body.emailNotifications is not None:
        upd["emailNotifications"] = body.emailNotifications
    if upd:
        db["users"].update_one({"_id": oid}, {"$set": upd})
    user = db["users"].find_one({"_id": oid}, {"password": 0})
    user["_id"] = str(user["_id"])
    return {"message": "Profile updated", "user": user}


@router.post("/{userId}/photo")
async def upload_photo(userId: str, profilePhoto: UploadFile = File(...)):
    db = get_db()
    try:
        oid = ObjectId(userId)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid user ID")
    user = db["users"].find_one({"_id": oid})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    ext = Path(profilePhoto.filename or "").suffix or ".jpg"
    name = uuid.uuid4().hex + ext
    path = UPLOAD_DIR / name
    content = await profilePhoto.read()
    path.write_bytes(content)
    old_photo = user.get("profilePhoto")
    if old_photo and "/" in old_photo:
        old_name = old_photo.split("/")[-1]
        old_path = UPLOAD_DIR / old_name
        if old_path.exists():
            old_path.unlink()
    profile_path = "/uploads/" + name
    db["users"].update_one({"_id": oid}, {"$set": {"profilePhoto": profile_path}})
    return {"message": "Photo uploaded", "profilePhoto": profile_path}
