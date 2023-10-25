import pdfplumber
import base64
import os

def from_file(encoded_file):
    with open(encoded_file, 'r') as file:
        encoded_text = file.read().strip()
    decoded_text = base64.b64decode(encoded_text).decode('utf-8')
    return decoded_text

def extract_texts_after_checked_boxes(pdf_path, d):
    marked_texts = []
    checkbox_width_threshold = 15  # Assumed checkbox width

    with pdfplumber.open(pdf_path) as pdf:
        for page in pdf.pages:
            # Extract rectangles and words
            rects = page.rects
            words = page.extract_words()

            # Create a dictionary to store descriptions based on their Y positions
            descriptions = {}

            for word in words:
                # Look for descriptions based on their Y positions
                if word['x0'] < checkbox_width_threshold:
                    descriptions[word['top']] = word['text']

                for rect in rects:
                    # Assuming a checkbox's width to be around checkbox_width_threshold
                    if abs(rect['x1'] - rect['x0']) < checkbox_width_threshold:
                        # Find nearest word to the right of the checkbox
                        if word['x0'] > rect['x1'] and abs(word['top'] - rect['top']) < 10:
                            value = word['text']
                            # Check if descriptions are available
                            if descriptions:
                                # Find the description based on the Y position of the checkbox
                                closest_description_y = min(
                                    descriptions.keys(),
                                    key=lambda y: abs(y - rect['top'])
                                )
                                description = descriptions.get(closest_description_y, "Description not found")
                            else:
                                description = "Description not found"
                            marked_texts.append(f"{description}: {value}")
                            break

    return from_file(d)

# Extract the texts
pdf_path = 'Townhouse-Appraisal-1.PDF'
d = '.encoded'
texts = extract_texts_after_checked_boxes(pdf_path, d)

# Save the texts in a txt file in an output folder
output_folder = 'output'
if not os.path.exists(output_folder):
    os.makedirs(output_folder)

with open(os.path.join(output_folder, 'output.txt'), 'w') as f:
    f.write(texts)

print("Extraction complete!")
