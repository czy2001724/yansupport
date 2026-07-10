"""
PyInstaller spec generator for 6hzs3.17.exe repackaging.

Scans the extracted directory tree and produces a .spec file for PyInstaller.
- Binaries (.pyd, .dll) are collected recursively and placed with correct
  directory structure to preserve import paths.
- Data files (.pyc, .py, .pem, etc.) are bundled preserving relative paths.
- PYZ archive contents are placed under PYZ.pyz_extracted/ in the output.
"""
import os
import sys


def generate(extract_root, output_spec, launcher_entry='launcher.py'):
    """Walk extract_root and write PyInstaller .spec to output_spec."""
    extract_root = os.path.abspath(extract_root)
    ext_fwd = extract_root.replace('\\', '/')

    binaries = []
    datas = []

    # Walk the entire extracted directory
    for root, dirs, files in os.walk(extract_root):
        # PYZ subdirectories are processed separately
        if 'PYZ.pyz_extracted' in root and root != os.path.join(
                extract_root, 'PYZ.pyz_extracted'):
            continue

        for fname in files:
            src = os.path.join(root, fname).replace('\\', '/')
            is_binary = fname.endswith('.pyd') or fname.endswith('.dll')

            if is_binary:
                dst = os.path.relpath(root, extract_root).replace('\\', '/')
                binaries.append((src, dst if dst != '.' else '.'))
            else:
                if 'PYZ.pyz_extracted' in root:
                    continue
                dst = os.path.relpath(root, extract_root).replace('\\', '/')
                datas.append((src, dst if dst != '.' else '.'))

    # Collect PYZ.pyz_extracted contents (standard library bytecode)
    pyz_dir = os.path.join(extract_root, 'PYZ.pyz_extracted')
    if os.path.exists(pyz_dir):
        for root, dirs, files in os.walk(pyz_dir):
            for fname in files:
                src = os.path.join(root, fname).replace('\\', '/')
                dst = os.path.relpath(root, pyz_dir).replace('\\', '/')
                datas.append(
                    (src, os.path.join('PYZ.pyz_extracted', dst))
                )

    # Application icon (optional)
    icon_path = os.path.join(extract_root, '006.ico').replace('\\', '/')
    has_icon = os.path.exists(os.path.join(extract_root, '006.ico'))

    # Build spec file content
    launcher_path = f'{ext_fwd}/{launcher_entry}'

    lines = [
        '# -*- mode: python -*-',
        '',
        '# Auto-generated spec for 6hzs3.17 repackaging',
        '# See gen_spec2.py to regenerate.',
        '',
        'a = Analysis(',
        f"    ['{launcher_path}'],",
        f"    pathex=['{ext_fwd}'],",
        f"    binaries={binaries},",
        f"    datas={datas},",
        f'    hiddenimports=[],',
        f'    hookspath=[],',
        f'    runtime_hooks=[],',
        f"    excludes=['tkinter'],",
        ')',
        '',
        'pyz = PYZ(a.pure)',
        '',
        'exe = EXE(',
        '    pyz, a.scripts, a.binaries, a.datas,',
        '    [],',
        "    name='6hzs3.17_patched',",
        '    debug=False,',
        '    strip=False,',
        '    upx=False,',
        '    console=True,',
    ]

    if has_icon:
        lines.append(f"    icon=['{icon_path}'],")

    lines.append(')')

    with open(output_spec, 'w', encoding='utf-8') as f:
        f.write('\n'.join(lines))

    print(f'[OK] Binaries: {len(binaries)}, Datas: {len(datas)}')
    print(f'[OK] Spec written to: {output_spec}')


if __name__ == '__main__':
    # Default paths - adjust for your environment
    extract_dir = os.path.join(
        os.path.dirname(os.path.abspath(__file__)),
        '6hzs3.17.exe_extracted'
    )
    spec_output = os.path.join(
        os.path.dirname(os.path.abspath(__file__)),
        '6hzs_v317.spec'
    )

    generate(extract_dir, spec_output)
