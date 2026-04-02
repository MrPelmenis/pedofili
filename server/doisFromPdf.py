import requests
import pdf2doi

CROSSREF_URL = "https://api.crossref.org/works/{}"
HEADERS = {"User-Agent": "pdfili/1.0 (normundspeld@gmail.com)"}


def get_crossref_metadata(doi: str) -> dict | None:
    try:
        r = requests.get(CROSSREF_URL.format(doi), headers=HEADERS, timeout=10)
        r.raise_for_status()
        msg = r.json()["message"]
        return {
            "doi":       msg.get("DOI"),
            "title":     (msg.get("title") or [None])[0],
            "authors":   [
                f"{a.get('given', '')} {a.get('family', '')}".strip()
                for a in msg.get("author", [])
            ],
            "year":      (msg.get("published", {}).get("date-parts") or [[None]])[0][0],
            "journal":   (msg.get("container-title") or [None])[0],
            "publisher": msg.get("publisher"),
            "abstract":  msg.get("abstract"),
            "references": msg.get("reference", []),
        }
    except Exception as e:
        #print(f"    Crossref error for DOI {doi}: {e}")
        return None


def extract_doi_metadata(pdf_path: str) -> dict | None:
    result = pdf2doi.pdf2doi(pdf_path)
    doi = result.get("identifier") if result else None

    if not doi:
        #print(f"    No DOI found in {pdf_path}")
        return None

    #print(f"    DOI found: {doi}")
    return get_crossref_metadata(doi)
