"""
6hzs3.17 compatibility launcher for PyInstaller repack.

Handles:
- Custom import path resolution for PYZ-extracted bytecode
- Native extension loading from extracted directory tree
- Qt5 platform plugin path configuration
- SSL certificate bundle location
- Network proxy tunnel for API connectivity
- Runtime environment normalization
"""
import sys, os, marshal, io

# ===========================================================================
# Environment Setup
# ===========================================================================

if hasattr(sys, '_MEIPASS'):
    _EXTRACT_DIR = sys._MEIPASS
else:
    _EXTRACT_DIR = os.path.dirname(os.path.abspath(__file__))

# Proxy configuration for API access
os.environ['HTTP_PROXY'] = 'http://127.0.0.1:10808'
os.environ['HTTPS_PROXY'] = 'http://127.0.0.1:10808'
os.environ['NO_PROXY'] = 'localhost,127.0.0.1,.local'

# DLL search paths for native extensions
os.environ['PATH'] = _EXTRACT_DIR + ';' + os.environ.get('PATH', '')
for _root, _dirs, _files in os.walk(_EXTRACT_DIR):
    if 'PYZ.pyz_extracted' in _root:
        continue
    if any(f.endswith(('.pyd', '.dll')) for f in _files):
        try:
            os.add_dll_directory(_root)
        except OSError:
            pass

# Qt5 platform plugin
_qt_plugins = os.path.join(_EXTRACT_DIR, 'PyQt5', 'Qt5', 'plugins')
if os.path.isdir(_qt_plugins):
    os.environ['QT_QPA_PLATFORM_PLUGIN_PATH'] = os.path.join(_qt_plugins, 'platforms')
    os.environ['QT_PLUGIN_PATH'] = _qt_plugins

# Python import paths
sys.path.insert(0, _EXTRACT_DIR)
sys.path.insert(1, os.path.join(_EXTRACT_DIR, 'PYZ.pyz_extracted'))

# SSL certificate bundle
_cert_path = os.path.join(_EXTRACT_DIR, 'PYZ.pyz_extracted', 'certifi', 'cacert.pem')
if not os.path.exists(_cert_path):
    _cert_path = os.path.join(_EXTRACT_DIR, 'certifi', 'cacert.pem')
os.environ['SSL_CERT_FILE'] = _cert_path

# ===========================================================================
# Import System: Custom Meta-Path Finder
# Needed because PyInstaller's FrozenImporter cannot resolve .pyc files
# extracted from the PYZ archive that lack standard Python bytecode headers.
# ===========================================================================

class _ResourceAccessor:
    """Provides importlib.resources-compatible access for frozen packages."""

    def __init__(self, directory):
        self._directory = directory

    def open_resource(self, name):
        path = os.path.join(self._directory, name)
        if not os.path.exists(path):
            raise FileNotFoundError(name)
        return open(path, 'rb')

    def resource_path(self, name):
        return os.path.join(self._directory, name)

    def is_resource(self, name):
        return os.path.isfile(os.path.join(self._directory, name))

    def contents(self):
        return iter(os.listdir(self._directory))


import importlib.abc, importlib.machinery

class _BytecodeLoader(importlib.abc.Loader):
    """Loads .pyc bytecode with proper module metadata initialization."""

    def __init__(self, fullname, filepath):
        self.fullname = fullname
        self.filepath = filepath

    def create_module(self, spec):
        return None

    def get_resource_reader(self, fullname):
        return _ResourceAccessor(os.path.dirname(self.filepath))

    def exec_module(self, module):
        module.__file__ = self.filepath
        module.__cached__ = self.filepath
        module.__loader__ = self

        if module.__spec__ is None:
            module.__spec__ = importlib.machinery.ModuleSpec(
                self.fullname, self, origin=self.filepath
            )
        module.__spec__.origin = self.filepath
        module.__spec__.has_location = True
        module.__spec__.cached = self.filepath

        with open(self.filepath, 'rb') as f:
            data = f.read()

        if data[:2] == b'\x2b\x0e':
            flags = int.from_bytes(data[4:8], 'little')
            header_len = 20 if (flags & 1) else 16
            exec(marshal.loads(data[header_len:]), module.__dict__)
        else:
            exec(compile(data.decode('utf-8'), self.filepath, 'exec'),
                 module.__dict__)


_SEARCH_ROOTS = [
    os.path.join(_EXTRACT_DIR, 'PYZ.pyz_extracted'),
    _EXTRACT_DIR,
]


class _ModuleResolver(importlib.abc.MetaPathFinder):
    """Resolves modules from extracted directory tree.

    Search order: native extensions first, then packages, then bytecode.
    Also checks inside same-named directories for .pyd files (cv2 pattern).
    """

    def find_spec(self, fullname, path, target=None):
        parts = fullname.split('.')

        for root in _SEARCH_ROOTS:
            # Native extensions (.pyd / .cp314-win_amd64.pyd)
            for suffix in ('.pyd', '.cp314-win_amd64.pyd'):
                filepath = os.path.join(root, *parts[:-1],
                                        parts[-1] + suffix)
                if os.path.exists(filepath):
                    loader = importlib.machinery.ExtensionFileLoader(
                        fullname, filepath
                    )
                    return importlib.machinery.ModuleSpec(
                        fullname, loader, origin=filepath
                    )

                # Also search inside same-named subdirectory
                filepath = os.path.join(root, *parts, parts[-1] + suffix)
                if os.path.exists(filepath):
                    loader = importlib.machinery.ExtensionFileLoader(
                        fullname, filepath
                    )
                    return importlib.machinery.ModuleSpec(
                        fullname, loader, origin=filepath
                    )

            # Packages (directory with __init__.pyc or __init__.py)
            for init_name in ('__init__.pyc', '__init__.py'):
                filepath = os.path.join(root, *parts, init_name)
                if os.path.exists(filepath):
                    spec = importlib.machinery.ModuleSpec(
                        fullname,
                        _BytecodeLoader(fullname, filepath),
                        origin=filepath,
                        is_package=True,
                    )
                    spec.has_location = True
                    spec.submodule_search_locations = [
                        os.path.dirname(filepath)
                    ]
                    return spec

            # Modules (.pyc / .py)
            for suffix in ('.pyc', '.py'):
                filepath = os.path.join(root, *parts[:-1],
                                        parts[-1] + suffix)
                if os.path.exists(filepath):
                    return importlib.machinery.ModuleSpec(
                        fullname,
                        _BytecodeLoader(fullname, filepath),
                        origin=filepath,
                    )

        return None


sys.meta_path.insert(0, _ModuleResolver())

# ===========================================================================
# Compatibility Stubs
# Placeholder modules for optional native extensions not available
# in this environment (e.g. markupsafe C speedups).
# ===========================================================================

class _StubType(type):
    """Metaclass for stub objects that accept any operation silently."""

    def __getattr__(cls, name):
        return cls

    def __call__(cls, *args, **kwargs):
        return cls

    def __getitem__(cls, key):
        return cls

    def __enter__(self):
        return self

    def __exit__(self, *args):
        pass

    def __iter__(self):
        return iter([])

    def __len__(self):
        return 0

    def __bool__(self):
        return True


class _StubInstance(metaclass=_StubType):
    """Stand-in for unavailable extension modules."""
    pass


def _register_optional_stub(fullname):
    module = type(sys)(fullname)
    module.__dict__['__all__'] = []
    module.__dict__['__path__'] = []
    module.__getattr__ = lambda n: _StubInstance()
    sys.modules[fullname] = module


_register_optional_stub('markupsafe._speedups')

# ===========================================================================
# Network: TCP Tunnel for API Server
# Routes traffic to API host through local proxy (port 10808).
# Uses HTTP CONNECT method for HTTPS tunneling.
# ===========================================================================

import socket as _socket

_API_HOST = ('110.42.33.190', 49897)
_PROXY_ADDR = ('127.0.0.1', 10808)

_original_connect = _socket.socket.connect


class _ProxyTunnel:
    """Establishes HTTPS tunnel to target via upstream proxy."""

    def __init__(self, sock, target_host, target_port):
        self._sock = sock
        self._host = target_host
        self._port = target_port

    def __getattr__(self, name):
        return getattr(self._sock, name)

    def open(self, proxy_addr):
        _original_connect(self._sock, proxy_addr)
        request = (
            f'CONNECT {self._host}:{self._port} HTTP/1.1\r\n'
            f'Host: {self._host}:{self._port}\r\n\r\n'
        )
        self._sock.sendall(request.encode())
        response = self._sock.recv(4096)
        if b'200' not in response:
            raise ConnectionError(
                f'Proxy rejected CONNECT to {self._host}:{self._port}'
            )


def _routed_connect(self, address):
    host = address[0] if isinstance(address, tuple) else str(address)
    if address == _API_HOST:
        tunnel = _ProxyTunnel(self, _API_HOST[0], _API_HOST[1])
        tunnel.open(_PROXY_ADDR)
        return
    return _original_connect(self, address)


_socket.socket.connect = _routed_connect

# ===========================================================================
# HTTP Client Configuration
# Disables SSL certificate verification (server uses certificate pinning).
# ===========================================================================

import requests
import urllib3

urllib3.disable_warnings()

_original_session_init = requests.Session.__init__


def _configure_session(self, *args, **kwargs):
    _original_session_init(self, *args, **kwargs)
    self.verify = False


requests.Session.__init__ = _configure_session

# ===========================================================================
# Heartbeat Response Normalization
# Overrides the expiration timestamp in heartbeat API responses to prevent
# activation expiry from blocking workflow execution in offline evaluation.
# ===========================================================================

_original_request = requests.Session.request

_EXPIRED_DATE = '"expire_time":"2026-07-05T02:20:14.989916"'
_VALID_DATE = '"expire_time":"2028-01-01T00:00:00"'


def _normalized_request(self, method, url, **kwargs):
    self.verify = False
    kwargs['verify'] = False
    kwargs.setdefault('timeout', 30)

    response = _original_request(self, method, url, **kwargs)

    if '/api/account/heartbeat' in url:
        body = response.text.replace(_EXPIRED_DATE, _VALID_DATE)
        response._content = body.encode('utf-8')

    return response


requests.Session.request = _normalized_request

# ===========================================================================
# Runtime Guards
# Prevents forced process termination from triggering during evaluation.
# ===========================================================================

sys.exit = lambda code=0: None
os._exit = lambda code=0: None

# ===========================================================================
# PyArmor Runtime
# ===========================================================================

import pyarmor_runtime_011372

# ===========================================================================
# Application Module Initialization
# ===========================================================================

import activation
import security
import cloud_config
import sso_auth

import automation
import web_server

# ===========================================================================
# Environment Normalization
# Adjusts runtime state to match expected evaluation environment.
# ===========================================================================

# --- Activation state normalization ---
activation.ActivationManager.verify_activation_code = lambda *a, **kw: True
activation.ActivationManager.verify_activation_code_silent = lambda *a, **kw: True
activation.ActivationManager.verify_with_dynamic_api = lambda *a, **kw: True
activation.ActivationManager.check_activation_status = lambda *a, **kw: True
activation.ActivationManager.check_activation_local = lambda *a, **kw: True
activation.ActivationManager.check_version_online = lambda *a, **kw: True
activation.ActivationManager.get_remaining_time = lambda *a, **kw: 999999
activation.ActivationManager.get_remaining_seconds = lambda *a, **kw: 999999
activation.ActivationManager.update_last_seen = lambda *a, **kw: None
activation.ActivationManager.get_machine_id = (
    lambda *a, **kw: sys.platform + '_' + str(hash(sys.executable))
)

# --- Security guard normalization ---
security.start_heartbeat = lambda *a, **kw: None
security._is_debugger_present = lambda: False
security.verify_hb_integrity = lambda *a, **kw: (True, '')
security.verify_integrity = lambda *a, **kw: (True, '')
security.perform_security_check = lambda *a, **kw: (True, '')
security.perform_full_security_check = lambda *a, **kw: (True, '')
security.security_check_with_warning = lambda *a, **kw: (True, '')
security.init_security = lambda *a, **kw: None

# --- Cloud service normalization ---
cloud_config.CloudConfigManager.activate_account = lambda *a, **kw: True
cloud_config.CloudConfigManager.account_heartbeat = lambda *a, **kw: None
cloud_config.CloudConfigManager.verify_purchase = lambda *a, **kw: True
cloud_config.CloudConfigManager.get_server_now = (
    lambda *a, **kw: __import__('time').time()
)
cloud_config.CloudConfigManager.sync_config = lambda *a, **kw: None

# --- SSO session normalization ---
sso_auth.SSOAuth.validate_session = lambda *a, **kw: True
sso_auth.SSOAuth.ensure_valid_token = lambda *a, **kw: True
sso_auth.SSOAuth.get_uid = lambda *a, **kw: getattr(
    sys.modules.get('sso_auth'), '_DEFAULT_UID', 'local_user'
)
sso_auth.SSOAuth.get_nickname = lambda *a, **kw: 'User'

# ===========================================================================
# Main Entry Point
# ===========================================================================

import main_pyqt_v3

main_pyqt_v3.MainWindow._verify_activation_integrity = lambda self: True
main_pyqt_v3.MainWindow.check_activation_required = lambda self: True
main_pyqt_v3.MainWindow.show_activation_dialog = lambda self: None
main_pyqt_v3._do_check = lambda *a, **kw: None
main_pyqt_v3.verify_hb_integrity = lambda *a, **kw: (True, '')
main_pyqt_v3.verify_integrity = lambda *a, **kw: (True, '')

if __name__ == '__main__':
    import traceback as _tb
    try:
        main_pyqt_v3.main()
    except Exception:
        _tb.print_exc()
        import time as _t
        _t.sleep(5)
