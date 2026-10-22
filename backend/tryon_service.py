
import os
import logging
from gradio_client import Client, handle_file

logger = logging.getLogger(__name__)

IDM_VTON_SPACE = "yisol/IDM-VTON"


def run_virtual_tryon(
    human_path,
    garment_path,
    output_path,
    garment_name="Garment",
    category="upper",
    timeout_seconds=300
):
    """
    Generate a real AI virtual try-on image using IDM-VTON.
    Saves the generated image to output_path.
    """

    try:
        if not os.path.isfile(human_path):
            raise FileNotFoundError(
                f"Person image not found: {human_path}"
            )

        if not os.path.isfile(garment_path):
            raise FileNotFoundError(
                f"Garment image not found: {garment_path}"
            )

        os.makedirs(os.path.dirname(output_path), exist_ok=True)

        logger.info("Connecting to IDM-VTON...")

        client = Client(
            IDM_VTON_SPACE,
            httpx_kwargs={"timeout": timeout_seconds}
        )

        human = handle_file(human_path)
        garment = handle_file(garment_path)

        description = f"a person wearing {garment_name}"

        logger.info("Generating try-on image for %s", garment_name)

        result = client.predict(
            {
                "background": human,
                "layers": [],
                "composite": human
            },
            garment,
            description,
            True,
            False,
            30,
            42,
            api_name="/tryon"
        )

        # IDM-VTON commonly returns a tuple/list containing
        # the generated image path and additional output data.
        result_path = None

        if isinstance(result, (tuple, list)):
            for item in result:
                if isinstance(item, str) and os.path.isfile(item):
                    result_path = item
                    break
                if isinstance(item, dict):
                    candidate = (
                        item.get("path")
                        or item.get("image")
                    )
                    if isinstance(candidate, str) and os.path.isfile(candidate):
                        result_path = candidate
                        break
        elif isinstance(result, str) and os.path.isfile(result):
            result_path = result
        elif isinstance(result, dict):
            candidate = result.get("path") or result.get("image")
            if isinstance(candidate, str) and os.path.isfile(candidate):
                result_path = candidate

        if not result_path:
            raise RuntimeError(
                f"Could not locate generated image in IDM-VTON response: {result!r}"
            )

        # Copy the actual AI-generated output into Flask uploads.
        from shutil import copy2
        copy2(result_path, output_path)

        logger.info("IDM-VTON result saved to %s", output_path)

        return {
            "success": True,
            "engine": "IDM-VTON",
            "fitScore": None,
            "recommendedSize": None,
            "silhouetteMatch": None
        }

    except Exception as exc:
        logger.exception("IDM-VTON try-on failed: %s", exc)
        raise RuntimeError(
            f"AI virtual try-on failed: {exc}"
        ) from exc
