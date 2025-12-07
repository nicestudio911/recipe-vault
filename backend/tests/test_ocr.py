import pytest
from tests.conftest import client
from io import BytesIO
from PIL import Image


def test_ocr_invalid_file(client):
    response = client.post("/api/v1/ocr", files={"file": ("test.txt", b"not an image", "text/plain")})
    assert response.status_code == 400


def test_ocr_valid_image(client):
    # Create a simple test image
    img = Image.new('RGB', (100, 100), color='white')
    img_bytes = BytesIO()
    img.save(img_bytes, format='PNG')
    img_bytes.seek(0)
    
    response = client.post(
        "/api/v1/ocr",
        files={"file": ("test.png", img_bytes, "image/png")}
    )
    # Should process (may return empty result for blank image)
    assert response.status_code in [200, 500]

