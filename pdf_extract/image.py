import cv2
import pytesseract

# Load the image using OpenCV
image = cv2.imread('page.png')

# Preprocess the image (you may need to adjust these steps)
gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
ret, thresholded = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)

# Use OpenCV to find contours (potential checkboxes)
contours, _ = cv2.findContours(thresholded, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

checkbox_values = {}

# Iterate through the contours (potential checkboxes)
for contour in contours:
    # Calculate the bounding box of the contour
    x, y, w, h = cv2.boundingRect(contour)

    # Extract the region of interest (ROI) for OCR
    roi = thresholded[y:y+h, x:x+w]

    # Use Tesseract OCR to extract text from the ROI
    value = pytesseract.image_to_string(roi)

    if value:
        # Check if OCR detected a value, and associate it with the bounding box
        checkbox_values[(x, y, w, h)] = value

# Print the detected checkboxes and their values
for (x, y, w, h), value in checkbox_values.items():
    print(f"Checkbox at ({x}, {y}): {value}")
