import functions_framework
from google.cloud import storage, firestore
from google import genai
from google.genai import types
import json
import re
import os
from datetime import datetime, timezone

PROJECT_ID     = "egr302-snapdose"
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")


#  Snap-26 trigger: fires on any new object in the bucket
@functions_framework.cloud_event
def on_image_upload(cloud_event):
    """Cloud Storage trigger → Gemini carb estimate → Firestore."""

    data        = cloud_event.data
    bucket_name = data["bucket"]
    file_name   = data["name"]

    #process image files
    if not file_name.lower().endswith((".jpg", ".jpeg", ".png", ".webp", ".heic")):
        print(f"Skipping non-image file: {file_name}")
        return

    print(f"Processing: gs://{bucket_name}/{file_name}")

    storage_client = storage.Client()
    bucket = storage_client.bucket(bucket_name)
    blob   = bucket.blob(file_name)
    image_bytes = blob.download_as_bytes()
    mime_type   = blob.content_type or _guess_mime(file_name)

    # 2. Snap-56 Call Gemini with API
    client = genai.Client(api_key=GEMINI_API_KEY)

    prompt = (
        "You are a certified diabetes nutritionist. Analyze the food in this image and estimate total carbohydrate content.\n\n"
        "- If PACKAGED or RESTAURANT food: identify the exact product and use its official nutritional label values, adjusted for the portion visible.\n"
        "- If HOMEMADE or WHOLE food: identify each ingredient, estimate portion sizes from visual cues, and calculate carbs using standard USDA values.\n"
        "- If MIXED: apply both methods and sum the totals.\n\n"
        "Account for cooking methods where relevant. If portion size is unclear, state your assumption in notes.\n"
        "Respond ONLY with valid JSON in this exact format:\n"
        '{"estimated_carbs_grams": <number>, "confidence": "<low|medium|high>", '
        '"foods_detected": [<list of food items with estimated portions>], '
        '"method_used": "<packaged_lookup|homemade_estimation|mixed>", '
        '"notes": "<how you arrived at the estimate and any assumptions made>"}'
    )

    response = client.models.generate_content(
        model="gemini-3.1-pro-preview",
        contents=[
            types.Part.from_bytes(data=image_bytes, mime_type=mime_type),
            prompt
        ]
    )
    raw_text = response.text.strip()
    print(f"Gemini raw response: {raw_text}")

    # Snap-57 Parse the JSON response
    carb_data = _parse_gemini_response(raw_text)

    #  Snap-52 Write to Firestore
    db  = firestore.Client(project=PROJECT_ID)
    doc = db.collection("meal_carb_estimates").document()
    doc.set({
        "image_bucket":          bucket_name,
        "image_path":            file_name,
        "image_gs_uri":          f"gs://{bucket_name}/{file_name}",
        "estimated_carbs_grams": carb_data.get("estimated_carbs_grams"),
        "confidence":            carb_data.get("confidence"),
        "foods_detected":        carb_data.get("foods_detected", []),
        "notes":                 carb_data.get("notes", ""),
        "raw_gemini_response":   raw_text,
        "created_at":            datetime.now(timezone.utc),
        "status":                "completed",
    })

    print(f"Saved to Firestore doc: {doc.id}")
    print(f"  → {carb_data.get('estimated_carbs_grams')}g carbs "
          f"(confidence: {carb_data.get('confidence')})")


def _parse_gemini_response(text: str) -> dict:
    match = re.search(r"```(?:json)?\s*([\s\S]*?)```", text)
    if match:
        text = match.group(1).strip()
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        print("WARNING: Could not parse JSON, storing raw text")
        return {
            "estimated_carbs_grams": None,
            "confidence": "unknown",
            "foods_detected": [],
            "notes": text,
        }


def _guess_mime(filename: str) -> str:
    ext = filename.lower().split(".")[-1]
    return {
        "jpg": "image/jpeg", "jpeg": "image/jpeg",
        "png": "image/png",  "webp": "image/webp",
        "heic": "image/heic",
    }.get(ext, "image/jpeg")