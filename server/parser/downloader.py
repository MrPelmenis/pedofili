import requests
from bs4 import BeautifulSoup
import time
import os
import re

SCIHUB_BASE = "https://sci-hub.ru/"
OUTPUT_DIR = "pdfs"
os.makedirs(OUTPUT_DIR, exist_ok=True)

session = requests.Session()
session.headers.update({
    "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36",
    "Referer": SCIHUB_BASE,
})


def download_paper(doi: str) -> bool:
    try:
        r = session.get(SCIHUB_BASE + doi, timeout=15)
        soup = BeautifulSoup(r.text, "html.parser")

        pdf_url = None

        # Sci-Hub .ru stores it here
        meta = soup.find("meta", {"name": "citation_pdf_url"})
        if meta:
            pdf_url = meta.get("content")

        # Fallback: embed/iframe
        if not pdf_url:
            for tag in soup.find_all(["embed", "iframe"]):
                src = tag.get("src", "")
                if src and ".pdf" in src:
                    pdf_url = src
                    break

        # Fallback: raw HTML scan
        if not pdf_url:
            match = re.search(r'(https?://[^\s"\']+\.pdf[^\s"\']*)', r.text)
            if match:
                pdf_url = match.group(1)

        if not pdf_url:
            print(f"[SKIP] {doi}")
            return False

        # Handle relative URLs
        if pdf_url.startswith("/"):
            pdf_url = "https://sci-hub.ru" + pdf_url
        elif pdf_url.startswith("//"):
            pdf_url = "https:" + pdf_url

        pdf_r = session.get(pdf_url, timeout=30)
        safe_name = re.sub(r"[^\w\-.]", "_", doi) + ".pdf"
        with open(os.path.join(OUTPUT_DIR, safe_name), "wb") as f:
            f.write(pdf_r.content)
        print(f"[OK] {doi}")
        return True

    except Exception as e:
        print(f"[ERR] {doi}: {e}")
        return False


# --- Load your DOIs ---
with open("dois.txt") as f:
    dois = [line.strip() for line in f if line.strip()]

for doi in dois:
    download_paper(doi)
    time.sleep(2)  # be polite, avoid rate limiting
