from fastapi.testclient import TestClient

from app.main import create_app


def test_ocean_products_demo_metadata_and_sample() -> None:
    with TestClient(create_app()) as client:
        products = client.get("/api/v1/ocean-products")
        assert products.status_code == 200
        assert {item["product"] for item in products.json()["products"]} == {"SEA_SURFACE_TEMPERATURE", "CHLOROPHYLL_A"}
        response = client.get("/api/v1/ocean-products/sample?latitude=13.1&longitude=80.4")
        assert response.status_code == 200
        assert response.json()["samples"]["sst"]["unit"] == "°C"
        assert response.json()["samples"]["chlorophyll"]["unit"] == "mg/m³"


def test_ocean_products_return_nodata_outside_demo_grid() -> None:
    with TestClient(create_app()) as client:
        response = client.get("/api/v1/ocean-products/sample?latitude=45&longitude=10")
        assert response.status_code == 200
        assert response.json()["samples"]["sst"]["value"] is None
        assert response.json()["samples"]["sst"]["quality"] == "NO_DATA"
