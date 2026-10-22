
from gradio_client import Client, handle_file

client = Client(
    "yisol/IDM-VTON",
    httpx_kwargs={"timeout": 300}
)

human = handle_file("uploads/my_photo.jpeg")
garment = handle_file(
    "../frontend/src/assets/Products/kurti.jpg"
)

print("Connected to IDM-VTON.")
print("Uploading images and testing try-on...")

result = client.predict(
    {
        "background": human,
        "layers": [],
        "composite": human
    },
    garment,
    "a casual printed kurti",
    True,
    False,
    30,
    42,
    api_name="/tryon"
)

print("Result:", result)
