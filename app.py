from flask import Flask, render_template, request
import fitz
from docx import Document
import os

from matplotlib import text

app = Flask(__name__)

UPLOAD_FOLDER = "uploads"
app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER

os.makedirs(UPLOAD_FOLDER, exist_ok=True)

def extract_text(filepath):
    text = ""

    if filepath.endswith(".pdf"):
        pdf = fitz.open(filepath)

        for page in pdf:
            text += page.get_text()

        pdf.close()

    elif filepath.endswith(".docx"):

        doc = Document(filepath)

        for para in doc.paragraphs:
            text += para.text + "\n"

    return text


@app.route("/")
def home():
    return render_template("index.html")


@app.route("/upload", methods=["POST"])
def upload():

    if "resume" not in request.files:
        return "No file selected"

    file = request.files["resume"]

    if file.filename == "":
        return "Please choose a file"

    filepath = os.path.join(app.config["UPLOAD_FOLDER"], file.filename)
    file.save(filepath)

    text = extract_text(filepath)

    return render_template(
        "index.html",
        extracted_text=text,
        filename=file.filename
)


if __name__ == "__main__":
    app.run(debug=True)