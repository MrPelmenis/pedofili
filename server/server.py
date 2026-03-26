import os
import requests
from flask import Flask, request, jsonify, send_from_directory, make_response
from flask_cors import CORS
from dotenv import load_dotenv

load_dotenv()
CP_URL  = os.getenv("CP_URL")
CP_USER = os.getenv("CP_USER")
CP_PASS = os.getenv("CP_PASS")

app = Flask(__name__)
CORS(app)

PREVIEW_DIR = "./pdf-preview-images"
PDF_DIR = "./pdf-files"

#kkads insane porno lai browseris nelaadee pdfu
@app.route("/pdf-file/<path:filename>")
def serve_pdf(filename):
    file_path = os.path.join(PDF_DIR, filename)
    if not os.path.exists(file_path):
        return "File not found", 404
    response = make_response(send_from_directory(PDF_DIR, filename))
    response.headers["Content-Type"] = "application/pdf"
    response.headers["Content-Disposition"] = f"inline; filename=\"{filename}\""
    return response

def get_preview_filename(file_path):
    basename = os.path.basename(file_path)
    return os.path.splitext(basename)[0] + ".jpeg"

def do_search(query):
    fullQ=f"<query>{query}</query><relevance>yes</relevance>"
    resp = requests.post(
        CP_URL + "/api/databases/pdfs/search/json",
        data=fullQ,
        auth=(CP_USER, CP_PASS)
    )
    resp.raise_for_status()
    data = resp.json()
    print(fullQ)
    print(data)
    documents = data.get("cps:reply", {}).get("cps:content", {}).get("results", {}).get("document", [])
    if isinstance(documents, dict):
        documents = [documents]

    results = []
    for doc in documents:
        raw_authors = doc.get("authors")
        if raw_authors is None:
            authors = []
        else:
            a = raw_authors.get("author", [])
            authors = [a] if isinstance(a, str) else a
        
        file_path = doc.get("file")
        preview_name = get_preview_filename(file_path) if file_path else None
        preview_exists = preview_name and os.path.exists(os.path.join(PREVIEW_DIR, preview_name))

        results.append({
            "title":    doc.get("title"),
            "file":     file_path,
            "date":     doc.get("date"),
            "authors":  authors,
            "abstract": doc.get("abstract"),
            "preview":  f"/previews/{preview_name}" if preview_exists else None,
        })
    return results

@app.route("/search")
def search():
    query = request.args.get("query", "").strip()
    if not query:
        return jsonify({"error": "query is required"}), 400
    try:
        return jsonify({"query": query, "results": do_search(query)})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/previews/<path:filename>")
def preview(filename):
    return send_from_directory(PREVIEW_DIR, filename)

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=3002, debug=True)
