import cv2
import pytesseract
from pytesseract import Output
import json

def is_checked(roi):
    total = cv2.countNonZero(roi)
    height, width = roi.shape
    if total > (0.25 * width * height):  # adjust threshold as needed
        return True
    return False

# Load the image
img = cv2.imread('converted_image/page_0.png', 0)

# Thresholding the image
_, binary = cv2.threshold(img, 128, 255, cv2.THRESH_BINARY_INV)

# Find contours to identify checkbox regions
contours, _ = cv2.findContours(binary, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

checkbox_coords = []

for contour in contours:
    x, y, w, h = cv2.boundingRect(contour)
    if 10 < w < 40 and 10 < h < 40:  # adjust as per checkbox size
        checkbox_coords.append((x, y, w, h, is_checked(binary[y:y+h, x:x+w])))

data = pytesseract.image_to_data(binary, output_type=Output.DICT)

output = []
for i, word in enumerate(data["text"]):
    if word.strip():
        d = {"word": word, "left": data["left"][i], "top": data["top"][i], "width": data["width"][i], "height": data["height"][i]}
        
        # Check for nearby checkboxes
        for checkbox in checkbox_coords:
            x, y, w, h, checked = checkbox
            if d["left"] - (x + w) < 50 and abs(d["top"] - y) < 20:  # adjust as per layout
                d["checkbox_status"] = "Checked" if checked else "Not Checked"
        
        output.append(d)

with open('output.json', 'w') as f:
    json.dump(output, f)

print("Data saved to output.json")
