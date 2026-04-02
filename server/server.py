import os
import requests
from flask import Flask, request, jsonify, send_from_directory, make_response
from flask_cors import CORS
from dotenv import load_dotenv

from pdfToImage import generate_preview
from parser import extract_paper_data
from doisFromPdf import extract_doi_metadata
from xml_builder import build_xml, save_xml, upload_xml

import json

load_dotenv()

CP_URL  = os.getenv("CP_URL")
CP_USER = os.getenv("CP_USER")
CP_PASS = os.getenv("CP_PASS")

app = Flask(__name__)
CORS(app)

PREVIEW_DIR  = "./pdf-preview-images"
PDF_DIR      = "./pdf-files"
XML_OUT_PATH = "./xml-files"   

os.makedirs(PDF_DIR,      exist_ok=True)
os.makedirs(PREVIEW_DIR,  exist_ok=True)
os.makedirs(os.path.dirname(XML_OUT_PATH) if os.path.dirname(XML_OUT_PATH) else ".", exist_ok=True)


@app.route("/upload", methods=["POST"])
def upload():
    if "file" not in request.files:
        return jsonify({"error": "No file part in request"}), 400

    file = request.files["file"]

    if file.filename == "":
        return jsonify({"error": "No file selected"}), 400

    filename = file.filename
    if not filename.lower().endswith(".pdf"):
        return jsonify({"error": f"'{filename}' is not a PDF (wrong extension)"}), 400

    if file.mimetype not in ("application/pdf", "application/octet-stream"):
        header = file.stream.read(4)
        file.stream.seek(0)
        if header != b"%PDF":
            return jsonify({"error": f"'{filename}' is not a valid PDF file"}), 400

    save_path = os.path.join(PDF_DIR, filename)
    file.save(save_path)
    print(f"  Saved PDF: {filename}")

    image_path  = generate_preview(save_path, PREVIEW_DIR)
    doi_info    = extract_doi_metadata(save_path)   
    grobid_info = extract_paper_data(save_path)

    xml_string = build_xml(
        doi_info    = doi_info,
        grobid_info = grobid_info,
        image_path  = image_path,
    )
    XML_OUT_PATH = f"{XML_OUT_PATH}/{os.path.splitext(filename)[0]}.xml"
    save_xml(xml_string, XML_OUT_PATH)

    upload_result = upload_xml(xml_string, CP_URL, CP_USER, CP_PASS)
    if upload_result["success"]:
        print(f"  XML uploaded to ContextPrime OK")
    else:
        print(f"  XML upload failed: {upload_result['error']}")
 
    return jsonify({
        "message":       "Upload successful",
        "filename":      filename,
        "doi_found":     doi_info is not None,
        "xml_saved":     XML_OUT_PATH,
        "cp_upload":     upload_result,
    }), 200


def get_preview_filename(file_path):
    basename = os.path.basename(file_path)
    return os.path.splitext(basename)[0] + ".jpeg"

def clean_filename(file_path):
    if not file_path:
        return None
    return os.path.basename(file_path)


def do_search(query):
    fullQ = f"<query>{query}</query><relevance>decending</relevance>"
    resp = requests.post(
        CP_URL + "/api/databases/pdfs/search/json",
        data=fullQ,
        auth=(CP_USER, CP_PASS),
    )
    resp.raise_for_status()
    data = resp.json()

    documents = (
        data.get("cps:reply", {})
            .get("cps:content", {})
            .get("results", {})
            .get("document", [])
    )
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

        file_path    = doc.get("file")
        filename     = clean_filename(file_path)
        preview_name = get_preview_filename(file_path) if file_path else None
        preview_exists = preview_name and os.path.exists(
            os.path.join(PREVIEW_DIR, preview_name)
        )

        results.append({
            "title":    doc.get("title"),
            "file":     filename,
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


@app.route("/pdf-file/<path:filename>")
def serve_pdf(filename):
    file_path = os.path.join(PDF_DIR, filename)
    if not os.path.exists(file_path):
        return "File not found", 404
    response = make_response(send_from_directory(PDF_DIR, filename))
    response.headers["Content-Type"] = "application/pdf"
    response.headers["Content-Disposition"] = f'inline; filename="{filename}"'
    return response


@app.route("/previews/<path:filename>")
def preview(filename):
    return send_from_directory(PREVIEW_DIR, filename)


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=3002, debug=True)
