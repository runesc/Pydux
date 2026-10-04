from setuptools import setup, find_packages

setup(
    name="pydux",
    version="3.0.0",
    description="UI-Agnostic State Management for Python Desktop Apps (Qyro, PySide6, PyQt5, Tkinter, Kivy)",
    author="PyDux Team",
    packages=find_packages(),
    python_requires=">=3.10",
    classifiers=[
        "Programming Language :: Python :: 3",
        "License :: OSI Approved :: MIT License",
        "Operating System :: OS Independent",
    ],
)
