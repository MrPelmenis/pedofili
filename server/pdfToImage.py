import os
from pdf2image import convert_from_path

INPUT_DIR = "./pdf-files"
OUTPUT_DIR = "./pdf-preview-images"

os.makedirs(OUTPUT_DIR, exist_ok=True)

pdf_files = [f for f in os.listdir(INPUT_DIR) if f.lower().endswith(".pdf")]
print(f"Found {len(pdf_files)} PDF(s)")

for filename in pdf_files:
    pdf_path = os.path.join(INPUT_DIR, filename)
    output_name = os.path.splitext(filename)[0] + ".jpeg"
    output_path = os.path.join(OUTPUT_DIR, output_name)

    try:
        pages = convert_from_path(pdf_path, dpi=150, first_page=1, last_page=1)
        img = pages[0]

        # Resize if larger than 1080x1920
        max_w, max_h = 400, 600 
        if img.width > max_w or img.height > max_h:
            img.thumbnail((max_w, max_h))

        img.save(output_path, "JPEG", quality=85)
        print(f"  ✓ {filename} → {output_name} ({img.width}x{img.height})")
    except Exception as e:
        print(f"  ✗ {filename} — {e}")
