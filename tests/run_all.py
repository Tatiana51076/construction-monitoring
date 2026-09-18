"""Простой раннер тестов без pytest — запускает все функции test_*.

Запуск: python tests/run_all.py
"""
import importlib
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
sys.path.insert(0, os.path.join(HERE, "..", "backend"))

MODULES = ["test_dedup", "test_engine", "test_daylevel", "test_schedule"]


def main() -> int:
    passed = failed = 0
    for name in MODULES:
        mod = importlib.import_module(name)
        for attr in dir(mod):
            if attr.startswith("test_"):
                try:
                    getattr(mod, attr)()
                    print(f"PASS {name}.{attr}")
                    passed += 1
                except Exception as e:
                    print(f"FAIL {name}.{attr}: {e!r}")
                    failed += 1
    print(f"\n{passed} passed, {failed} failed")
    return 1 if failed else 0


if __name__ == "__main__":
    raise SystemExit(main())
