"""
PyDux 3.0 — UI-Agnostic State Management for Python Desktop Applications.
Designed for high performance, memoized selectors, zero redundant re-renders,
and seamless compatibility with Qyro, PySide6, PyQt5, Tkinter, and Kivy.
"""

from pydux.core.store import Store, create_store
from pydux.core.selector import create_selector, shallow_equal, deep_equal, is_identical
from pydux.core.types import Action, Reducer, Selector, Middleware, Dispatch
from pydux.devtools.tracker import PyDuxDevTools, devtools_middleware
from pydux.adapters.base import MainThreadBridge, ReactiveBinding, connect
from pydux.adapters.qyro import QyroReactiveComponent, connect_qyro

__version__ = "3.0.0"
__all__ = [
    "Store",
    "create_store",
    "create_selector",
    "shallow_equal",
    "deep_equal",
    "is_identical",
    "Action",
    "Reducer",
    "Selector",
    "Middleware",
    "Dispatch",
    "PyDuxDevTools",
    "devtools_middleware",
    "MainThreadBridge",
    "ReactiveBinding",
    "connect",
    "QyroReactiveComponent",
    "connect_qyro",
]
