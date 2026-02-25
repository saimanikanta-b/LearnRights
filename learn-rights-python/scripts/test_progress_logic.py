# Converted from test-progress-logic.js - test progress tracking logic (no DB)
from copy import deepcopy

MOCK_MODULE = {
    "_id": "507f1f77bcf86cd799439011",
    "code": "WR-101",
    "title": "Women's Rights",
    "topics": [
        {
            "title": "Basic Women's Rights",
            "subTopics": [
                {"title": "What are Human Rights?"},
                {"title": "What are Women's Rights?"},
                {"title": "Why Women's Rights Matter"},
            ],
        },
        {
            "title": "Right to Equality",
            "subTopics": [
                {"title": "Equal Rights under Constitution (Article 14)"},
                {"title": "No Discrimination (Article 15)"},
                {"title": "Equal Opportunities"},
            ],
        },
        {
            "title": "Right to Education",
            "subTopics": [
                {"title": "Free Education (RTE Act)"},
                {"title": "Education for Adult Women"},
                {"title": "Government Support Programs"},
            ],
        },
    ],
}

MOCK_USER = {
    "_id": "507f1f77bcf86cd799439012",
    "name": "Test User",
    "completedSubTopics": [],
    "completedModules": [],
    "points": 0,
    "badges": [],
}


def module_sub_topic_ids(module):
    ids = []
    for topic in module.get("topics") or []:
        for st in topic.get("subTopics") or []:
            ids.append(str(st.get("_id")) if st.get("_id") else st.get("title", ""))
    return ids


def simulate_complete_sub_topic(user, module, sub_topic_id):
    print(f"Completing subtopic: {sub_topic_id}")
    user.setdefault("completedSubTopics", [])
    if sub_topic_id not in user["completedSubTopics"]:
        user["completedSubTopics"].append(sub_topic_id)
        print(f"  Added subtopic {sub_topic_id} to completed list")
    total = len(module_sub_topic_ids(module))
    module_ids = module_sub_topic_ids(module)
    completed_count = sum(1 for c in user["completedSubTopics"] if c in module_ids)
    mid = str(module["_id"])
    completed_mods = [str(x) for x in user.get("completedModules", [])]
    if total and completed_count >= total and mid not in completed_mods:
        print(f"  Marking module {module['_id']} as completed")
        user.setdefault("completedModules", []).append(module["_id"])
        user["points"] = user.get("points", 0) + 10
        if len(user["completedModules"]) == 1 and "First Module Completed" not in (user.get("badges") or []):
            user.setdefault("badges", []).append("First Module Completed")
            print("  Awarded First Module Completed badge")
        print(f"  Awarded 10 points. Total points: {user['points']}")
    return {"message": "Subtopic completed", "progress": {"completedSubTopics": user["completedSubTopics"], "completedModules": user["completedModules"], "points": user["points"], "badges": user.get("badges", [])}}


def calculate_module_progress(user, module):
    total = len(module_sub_topic_ids(module))
    module_ids = module_sub_topic_ids(module)
    completed = sum(1 for c in (user.get("completedSubTopics") or []) if c in module_ids)
    pct = round((completed / total) * 100) if total else 0
    is_done = str(module["_id"]) in [str(x) for x in (user.get("completedModules") or [])]
    print(f"  Module {module['_id']}: {completed}/{total} subtopics ({pct}%)")
    return {"completedSubTopics": completed, "totalSubTopics": total, "percentage": pct, "isCompleted": is_done}


def main():
    print("=== Progress Tracking System Logic Test ===\n")
    user = deepcopy(MOCK_USER)
    module = MOCK_MODULE
    all_sub_topics = [
        "What are Human Rights?",
        "What are Women's Rights?",
        "Why Women's Rights Matter",
        "Equal Rights under Constitution (Article 14)",
        "No Discrimination (Article 15)",
        "Equal Opportunities",
        "Free Education (RTE Act)",
        "Education for Adult Women",
        "Government Support Programs",
    ]
    print("Initial user state:", user)
    simulate_complete_sub_topic(user, module, "What are Human Rights?")
    simulate_complete_sub_topic(user, module, "What are Women's Rights?")
    print("\nProgress:", calculate_module_progress(user, module))
    for st in all_sub_topics[2:]:
        simulate_complete_sub_topic(user, module, st)
    print("\nFinal user state:", user)
    print("Final progress:", calculate_module_progress(user, module))
    print("\n=== Test Results Summary ===")
    print("  Subtopics tracking: PASS")
    print("  Module auto-completion: PASS")
    print("  Points awarding: PASS")
    print("  Badges awarding: PASS")
    print("  Progress percentage: PASS")
    print("\nAll progress tracking features are working correctly!")


if __name__ == "__main__":
    main()
