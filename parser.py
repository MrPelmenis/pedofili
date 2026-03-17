from grobid_client.grobid_client import GrobidClient
import xml.etree.ElementTree as ET
import os
import re

INPUT_DIR = "./dumps/pdfs"
OUTPUT_DIR = "/home/normunds/pdfiili/parsed"

client = GrobidClient(config_path="./config.json")

def extract_paper_data(pdf_path):
    _, status, rsp = client.process_pdf(
        "processFulltextDocument",
        pdf_path,
        generateIDs=True,
        consolidate_header=False,
        consolidate_citations=False,
        include_raw_citations=False,
        include_raw_affiliations=False,
        tei_coordinates=False,
        segment_sentences=False
    )

    if status != 200:
        print(f"  Failed with status: {status}")
        return None

    root = ET.fromstring(rsp)
    ns = {'tei': 'http://www.tei-c.org/ns/1.0'}

    # Extract Title
    title_el = root.find(".//tei:fileDesc//tei:titleStmt//tei:title", ns)
    title = "".join(title_el.itertext()).strip() if title_el is not None else "Unknown"

    # Extract Date — try publicationStmt, then sourceDesc, then submission note
    date_el = (
        root.find(".//tei:publicationStmt/tei:date", ns) or
        root.find(".//tei:sourceDesc//tei:date", ns)
    )
    pub_date = date_el.get('when') if date_el is not None else None

    if not pub_date:
        note = root.find(".//tei:sourceDesc//tei:note[@type='submission']", ns)
        if note is not None and note.text:
            match = re.search(r'\d{4}[.\-]\d{2}[.\-]\d{2}', note.text)
            pub_date = match.group(0) if match else "Unknown"
        else:
            pub_date = "Unknown"

    # Extract Authors
    authors = []
    for author in root.findall(".//tei:sourceDesc//tei:author", ns):
        persName = author.find(".//tei:persName", ns)
        if persName is not None:
            surname = persName.find("tei:surname", ns)
            forename = persName.find("tei:forename", ns)
            name = f"{forename.text if forename is not None else ''} {surname.text if surname is not None else ''}"
            authors.append(name.strip())

    # Extract Abstract
    abstract_el = root.find(".//tei:profileDesc//tei:abstract//tei:p", ns)
    abstract = "".join(abstract_el.itertext()).strip() if abstract_el is not None else "Unknown"

    # Extract Methods/Experimental Sections
    methods_sections = []
    for div in root.findall(".//tei:body//tei:div", ns):
        head = div.find("tei:head", ns)
        if head is not None and head.text:
            heading = head.text.strip().lower()
            if any(keyword in heading for keyword in [
                "method", "experiment", "material", "procedure",
                "approach", "protocol", "technique", "setup",
                "characterization", "synthesis", "preparation",
                "recovery", "recycling process", "pretreatment"
            ]):
                paragraphs = []
                for p in div.findall(".//tei:p", ns):
                    text = "".join(p.itertext()).strip()
                    if text:
                        paragraphs.append(text)
                if paragraphs:
                    methods_sections.append({
                        "heading": head.text.strip(),
                        "text": "\n\n".join(paragraphs)
                    })

    # Extract Full Text
    paragraphs = []
    for p in root.findall(".//tei:body//tei:p", ns):
        text = "".join(p.itertext()).strip()
        if text:
            paragraphs.append(text)
    full_text = "\n\n".join(paragraphs)

    # Extract References
    references = []
    for ref in root.findall(".//tei:listBibl//tei:biblStruct", ns):
        ref_title_el = ref.find(".//tei:analytic//tei:title", ns)
        if ref_title_el is None:
            ref_title_el = ref.find(".//tei:monogr//tei:title", ns)
        ref_title = ref_title_el.text.strip() if ref_title_el is not None and ref_title_el.text else "Unknown"

        ref_authors = []
        for author in ref.findall(".//tei:author", ns):
            persName = author.find(".//tei:persName", ns)
            if persName is not None:
                surname = persName.find("tei:surname", ns)
                forename = persName.find("tei:forename", ns)
                name = f"{forename.text if forename is not None else ''} {surname.text if surname is not None else ''}"
                ref_authors.append(name.strip())

        ref_date_el = ref.find(".//tei:imprint//tei:date", ns)
        ref_date = ref_date_el.get("when", "Unknown") if ref_date_el is not None else "Unknown"

        references.append({
            "title": ref_title,
            "authors": ref_authors,
            "date": ref_date
        })

    return {
        "file": pdf_path,
        "title": title,
        "date": pub_date,
        "authors": authors,
        "abstract": abstract,
        "full_text": full_text,
        "references": references,
        "methods": methods_sections
    }


def save_as_xml(data, output_path):
    doc = ET.Element("document")

    ET.SubElement(doc, "file").text = data["file"]
    ET.SubElement(doc, "title").text = data["title"]
    ET.SubElement(doc, "date").text = data["date"]

    authors_el = ET.SubElement(doc, "authors")
    for author in data["authors"]:
        ET.SubElement(authors_el, "author").text = author

    ET.SubElement(doc, "abstract").text = data["abstract"]

    methods_el = ET.SubElement(doc, "methods")
    for section in data["methods"]:
        ET.SubElement(methods_el, "method").text = f"{section['heading']}: {section['text']}"

    ET.SubElement(doc, "full_text").text = data["full_text"]

    refs_el = ET.SubElement(doc, "references")
    for ref in data["references"]:
        ref_el = ET.SubElement(refs_el, "reference")
        ET.SubElement(ref_el, "title").text = ref["title"]
        ref_authors_el = ET.SubElement(ref_el, "authors")
        for author in ref["authors"]:
            ET.SubElement(ref_authors_el, "author").text = author
        ET.SubElement(ref_el, "date").text = ref["date"]

    tree = ET.ElementTree(doc)
    ET.indent(tree, space="  ")
    tree.write(output_path, encoding="unicode", xml_declaration=False)


# --- Run ---
os.makedirs(OUTPUT_DIR, exist_ok=True)
pdf_files = [f for f in os.listdir(INPUT_DIR) if f.lower().endswith(".pdf")]
print(f"Found {len(pdf_files)} PDF(s) in '{INPUT_DIR}'")

for filename in pdf_files:
    pdf_path = os.path.join(INPUT_DIR, filename)
    print(f"\nProcessing: {pdf_path}")
    data = extract_paper_data(pdf_path)
    if data:
        output_path = os.path.join(OUTPUT_DIR, os.path.splitext(filename)[0] + ".xml")
        save_as_xml(data, output_path)
        print(f"  Title:   {data['title']}")
        print(f"  Date:    {data['date']}")
        print(f"  Authors: {', '.join(data['authors'])}")
        print(f"  Refs:    {len(data['references'])}")
        print(f"  Saved → {output_path}")
    else:
        print(f"  Failed to process")
