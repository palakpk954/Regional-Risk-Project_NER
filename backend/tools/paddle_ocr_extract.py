#!/usr/bin/env python3
import json
import sys


def emit(payload):
    print(json.dumps(payload, ensure_ascii=True))


def main():
    if len(sys.argv) < 2:
        emit({"ok": False, "error": "Input file path is required"})
        return 2

    input_path = sys.argv[1]

    try:
        from paddleocr import PaddleOCR
    except Exception as exc:  # pragma: no cover
        emit({
            "ok": False,
            "error": f"PaddleOCR import failed: {exc}. Install with: pip install paddleocr",
        })
        return 3

    try:
        ocr = PaddleOCR(use_angle_cls=True, lang="en")
        raw = ocr.ocr(input_path, cls=True)

        lines = []
        confidences = []

        if isinstance(raw, list):
            for page in raw:
                if not page:
                    continue
                for item in page:
                    if not item or len(item) < 2:
                        continue
                    text_info = item[1]
                    if not text_info:
                        continue
                    text = str(text_info[0]).strip()
                    conf = float(text_info[1]) if len(text_info) > 1 else 0.0
                    if text:
                        lines.append(text)
                        confidences.append(conf)

        avg_conf = sum(confidences) / len(confidences) if confidences else 0.0

        emit({
            "ok": True,
            "text": "\n".join(lines),
            "confidence": round(avg_conf, 4),
            "line_count": len(lines),
        })
        return 0
    except Exception as exc:  # pragma: no cover
        emit({"ok": False, "error": f"PaddleOCR execution failed: {exc}"})
        return 4


if __name__ == "__main__":
    sys.exit(main())
