import requests
import json
import base64
from gemini import gemini
from dotenv import load_dotenv
import os

load_dotenv()

test_link = (
    "https://api.github.com/repos/taseskics/devconnect/git/trees/main?recursive=1"
)

response = requests.get(
    test_link, headers={"Authorization": f"token {os.environ.get('GITHUB_TOKEN')}"}
)
d = response.json()
print(d)
for obj in d["tree"]:
    if obj["type"] == "tree":
        continue
    path = obj["path"]
    ext = path[path.rfind(".") :]
    print(path, ext)
    if ext not in {".py", ".ts", ".tsx", ".jsx", ".md", ".js"}:
        continue
    fileURL = obj["url"]
    fileResponse = requests.get(
        fileURL, headers={"Authorization": f"token {os.environ.get('GITHUB_TOKEN')}"}
    )

    fileContent = fileResponse.json()["content"]

    strContent = base64.b64decode(fileContent).decode("utf-8")
    print(gemini(strContent, path))