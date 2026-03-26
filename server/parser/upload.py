import os
import sys
import subprocess

# --- Config ---
XML_DIR  = "./xml-files"
CP_URL   = "http://localhost:8081/api/databases/pdfs/insert"
CP_USER  = "root"
CP_PASS  = "pass"

# --- Run ---

xml_files = sorted(f for f in os.listdir(XML_DIR) if f.endswith(".xml"))
total = len(xml_files)

if total == 0:
    print(f"No XML files found in {XML_DIR}")
    sys.exit(1)

print(f"Found {total} XML files, uploading to {CP_URL}\n")

ok = fail = 0

for i, fname in enumerate(xml_files, 1):
    fpath = os.path.join(XML_DIR, fname)
    print(f"[{i}/{total}] {fname} ... ", end="", flush=True)

    result = subprocess.run(
        [
            "curl", "-s", "-o", "/dev/null", "-w", "%{http_code}",
            CP_URL,
            "-u", f"{CP_USER}:{CP_PASS}",
            "-H", "Content-Type: application/xml",
            "-d", f"@{fpath}",
        ],
        capture_output=True,
        text=True,
    )

    status = result.stdout.strip()
    if status.startswith("2"):
        print(f"OK ({status})")
        ok += 1
    else:
        print(f"FAIL ({status})")
        if result.stderr.strip():
            print(f"    stderr: {result.stderr.strip()}")
        fail += 1

print(f"\nDone. {ok} OK, {fail} failed out of {total}.")
