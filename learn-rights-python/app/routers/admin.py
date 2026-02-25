from fastapi import APIRouter, Depends
from app.database import get_db
from app.deps import require_auth

router = APIRouter()


@router.get("/users", dependencies=[Depends(require_auth)])
def get_all_users():
    db = get_db()
    users = list(db["users"].find({}, {"password": 0}))
    for u in users:
        u["_id"] = str(u["_id"])
    return users


@router.get("/stats", dependencies=[Depends(require_auth)])
def get_user_stats():
    db = get_db()
    total_users = db["users"].count_documents({})
    total_modules = db["modules"].count_documents({})
    completed_modules = db["progresses"].count_documents({"completed": True}) if "progresses" in db.list_collection_names() else 0
    return {"totalUsers": total_users, "totalModules": total_modules, "completedModules": completed_modules}


@router.get("/reports", dependencies=[Depends(require_auth)])
def get_progress_reports():
    db = get_db()
    if "progresses" not in db.list_collection_names():
        return []
    pipeline = [
        {"$group": {"_id": "$moduleId", "count": {"$sum": 1}}},
        {"$lookup": {"from": "modules", "localField": "_id", "foreignField": "_id", "as": "module"}},
        {"$unwind": {"path": "$module"}},
    ]
    return list(db["progresses"].aggregate(pipeline))
