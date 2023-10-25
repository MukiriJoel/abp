import pdfplumber
from pytesseract import pytesseract
from PIL import Image
import re

# Set the path to the Tesseract executable
pytesseract.tesseract_cmd = '/opt/homebrew/bin/tesseract'

def extract_and_save_checked_checkboxes(pdf_filename, output_filename):
    pdf = pdfplumber.open(pdf_filename)

    checkbox_labels_values = []

    for page in pdf.pages:
        # Instead of page.images, consider all potential regions that might contain checkboxes
        for x in range(0, int(page.width) - 20, 20):  # Subtract 20 to stay within bounds
            for y in range(0, int(page.height) - 20, 20):  # Subtract 20 to stay within bounds
                img_cropped = page.crop((x, y, x+20, y+20))

                img_pil = img_cropped.to_image().original
                img_pil = img_pil.convert('L')

                value = pytesseract.image_to_string(img_pil).strip()

                if re.search(r'\bX\b', value):  # Use regex to allow for minor variations
                    preceding_text = page.extract_text(x - 200, y, x, y+20)
                    if preceding_text:
                        checkbox_labels_values.append(f"{preceding_text.strip()}: {value}")

    pdf.close()

    with open(output_filename, "w", encoding="utf-8") as output_file:
        output_file.write("\n".join(checkbox_labels_values))

if __name__ == "__main__":
    pdf_file = "sample.pdf"  # Specify the correct path if it's not in the current directory
    output_file = "checkedValues.txt"

    extract_and_save_checked_checkboxes(pdf_file, output_file)
    print(f"Checked checkbox labels and values have been saved to {output_file}")
