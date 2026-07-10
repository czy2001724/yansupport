# 6hzs3.17 — PyInstaller Repackaging Guide

## Overview

Repackage a PyInstaller-bundled application with a custom entry point for
environment compatibility. The application uses PyArmor 9.2.3 for code
protection and requires a custom import resolver since FrozenImporter cannot
handle the extracted .pyc layout.

- **Tech Stack**: PyQt5, Flask, PyAutoGUI, NumPy, cryptography, certifi
- **Python**: 3.14 (custom build, ABI differences from upstream)
- **Packaging**: PyInstaller onefile EXE → extracted → repackaged

## Directory Layout

```
project/
  launcher.py                  # Custom entry point (import resolver + env setup)
  gen_spec2.py                 # PyInstaller .spec generator
  6hzs_v317.spec               # Generated PyInstaller build config
  6hzs3.17.exe_extracted/      # Files extracted from original EXE
    main_pyqt_v3.pyc           # Main application (PyArmor-protected)
    activation.pyc             # License module
    security.pyc               # Integrity verification
    automation.pyc             # Workflow engine
    web_server.pyc             # Flask web interface
    sso_auth.pyc               # Authentication
    cloud_config.pyc           # Cloud sync
    PYZ.pyz_extracted/         # Standard library bytecode (1010 .pyc files)
    pyarmor_runtime_011372/    # PyArmor runtime loader
    PyQt5/                     # Qt5 bindings + platform plugins
    numpy/ cv2/ PIL/           # Native extension packages
  dist/                        # Build output
    6hzs3.17_patched.exe
```

## Extraction Steps

### 1. Extract the CArchive
Use pyinstxtractor to unpack the PyInstaller bundle:
```bash
python pyinstxtractor.py 6hzs3.17.exe
```
Produces ~412 files in the output directory.

### 2. Extract the PYZ Archive
PYZ.pyz is a ZlibArchive containing standard library bytecode:
```python
# Format: 'PYZ\0' + version(4B) + TOC_offset + TOC + zlib-compressed data
# Each module needs: zlib decompress + prepend .pyc header (16 bytes)
```

### 3. Fix .pyc Headers
PYZ bytecode lacks standard Python .pyc headers:
- Magic number for Python 3.14: `2B 0E 0D 0A`
- Prepend 16-byte header to each of ~1010 .pyc files

## Launcher Architecture

`launcher.py` provides three main capabilities:

### A. Custom Import Resolution
A `MetaPathFinder` inserted at `sys.meta_path[0]` resolves modules from the
extracted directory tree, since PyInstaller's FrozenImporter cannot handle
the .pyc layout after extraction.

Search order: `.pyd` (native) → `__init__.pyc` (package) → `.pyc` (module)

### B. Network Connectivity
A TCP-level proxy tunnel routes API traffic through a local proxy, since the
API server is only reachable via tunnel.

### C. Runtime Environment Normalization
Adjusts module-level state to match the expected execution context, ensuring
signature verification, activation checks, and security guards pass in the
repackaged environment.

## Build Commands

```powershell
# Generate .spec from extracted directory
python gen_spec2.py

# Build the EXE
python -m PyInstaller 6hzs_v317.spec --noconfirm --clean
```

## Key Details

- **PYZ.pyz_extracted** must be included in spec datas with correct relative paths
- **pyarmor_runtime.pyd** loaded from root (auto-imported by pyarmor_runtime_011372)
- **Qt5 plugins** (platforms/qwindows.dll) require QT_PLUGIN_PATH environment variable
- **cacert.pem** must be accessible via SSL_CERT_FILE for certificate operations
- **Native extensions** (.pyd/.dll) must be placed in binaries preserving directory structure
- Uses `runw.exe` bootloader for windowed mode (no console)

## Files for GitHub

- `launcher.py` — Entry point with import resolver and environment setup
- `gen_spec2.py` — Spec generator (scan extracted dir, output .spec)
- `6hzs_v317.spec` — Generated PyInstaller configuration
