"""One-time Firebase provisioning; delete after execution."""
from time import sleep
import requests
from firebase_admin import credentials

PROJECT_ID = "reminai-afc7a"
credential = credentials.Certificate(
    r"C:\Users\abdul\Downloads\reminai-afc7a-firebase-adminsdk-fbsvc-0ab4adcaa4.json"
)
headers = {
    "Authorization": f"Bearer {credential.get_access_token().access_token}",
    "Content-Type": "application/json",
}


def wait(operation_url: str) -> dict:
    for _ in range(60):
        response = requests.get(operation_url, headers=headers, timeout=30)
        response.raise_for_status()
        operation = response.json()
        if operation.get("done"):
            if "error" in operation:
                raise RuntimeError(operation["error"])
            return operation
        sleep(2)
    raise TimeoutError("Firebase operation did not complete in time")


for service in ("firestore.googleapis.com", "identitytoolkit.googleapis.com"):
    response = requests.post(
        f"https://serviceusage.googleapis.com/v1/projects/{PROJECT_ID}/services/{service}:enable",
        headers=headers,
        timeout=30,
    )
    if response.status_code not in (200, 409):
        response.raise_for_status()
    if response.status_code == 200:
        wait(f"https://serviceusage.googleapis.com/v1/{response.json()['name']}")

# A Firestore location is immutable. The user explicitly selected Mumbai.
database_response = requests.post(
    f"https://firestore.googleapis.com/v1/projects/{PROJECT_ID}/databases?databaseId=(default)",
    headers=headers,
    json={"locationId": "asia-south1", "type": "FIRESTORE_NATIVE"},
    timeout=30,
)
if database_response.status_code == 200:
    wait(f"https://firestore.googleapis.com/v1/{database_response.json()['name']}")
elif database_response.status_code != 409:
    database_response.raise_for_status()

# Enable Firebase Email/Password authentication for the newly created web app.
auth_response = requests.patch(
    f"https://identitytoolkit.googleapis.com/admin/v2/projects/{PROJECT_ID}/config?updateMask=signIn.email.enabled,signIn.email.passwordRequired",
    headers=headers,
    json={"signIn": {"email": {"enabled": True, "passwordRequired": True}}},
    timeout=30,
)
auth_response.raise_for_status()
print("Firestore and Firebase email/password authentication provisioned.")
