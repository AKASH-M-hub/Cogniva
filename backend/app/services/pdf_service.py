from pypdf import PdfReader


def extract_text(pdf_path: str):

    try:

        reader = PdfReader(pdf_path)

        extracted_text = ""

        for page in reader.pages:

            text = page.extract_text()

            if text:

                extracted_text += text + "\n"

        return extracted_text

    except Exception as e:

        raise Exception(
            f"PDF Extraction Failed : {str(e)}"
        )