import fitz  # PyMuPDF
import os
import pytesseract
from PIL import Image

def convert_pdf_to_png(pdf_path, output_folder):
    doc = fitz.open(pdf_path)
    if not os.path.exists(output_folder):
        os.makedirs(output_folder)
    
    image_paths = []
    for page_num in range(doc.page_count):
        page = doc.load_page(page_num)
        image = page.get_pixmap()
        image_path = os.path.join(output_folder, f"page_{page_num}.png")
        image.save(image_path)
        image_paths.append(image_path)
    
    return image_paths

def detect_checked_checkboxes(image_paths):
    checked_boxes = []
    for image_path in image_paths:
        image = Image.open(image_path)
        text = pytesseract.image_to_string(image)
        
        # Check for marked checkboxes
        if "X" in text:
            checked_boxes.append(image_path)
    
    return checked_boxes

pdf_path = "sample.pdf"
image_paths = convert_pdf_to_png(pdf_path, "converted_image")
checked_boxes_images = detect_checked_checkboxes(image_paths)

print("Images with marked checkboxes:")
for image in checked_boxes_images:
    print(image)
