# Runtime hook - ensures DLLs are on PATH before any imports
import sys, os

# Add the extraction directory to PATH for DLL loading
extract_dir = os.path.dirname(os.path.abspath(sys.argv[0]))
if hasattr(sys, '_MEIPASS'):
    extract_dir = sys._MEIPASS

os.environ['PATH'] = extract_dir + ';' + os.environ.get('PATH', '')
sys.path.insert(0, extract_dir)
print(f'[hook] PATH updated: {extract_dir}')
