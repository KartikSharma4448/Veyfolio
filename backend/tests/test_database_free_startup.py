import os
from pathlib import Path
import subprocess
import sys


def test_backend_starts_without_database_variables_or_drivers():
    env = os.environ.copy()
    env.pop('MONGO_URL', None)
    env.pop('DB_NAME', None)
    env['PYTHON_DOTENV_DISABLED'] = '1'
    code = '''
import importlib.abc
import sys
class NoDatabaseDrivers(importlib.abc.MetaPathFinder):
    def find_spec(self, fullname, path=None, target=None):
        if fullname.split('.')[0] in {'motor', 'pymongo'}:
            raise ImportError('Database drivers must not be imported')
sys.meta_path.insert(0, NoDatabaseDrivers())
from server import app
paths = {route.path for route in app.routes}
assert '/api/' in paths
assert '/api/ats/score' in paths
assert '/api/auth/signup' not in paths
assert '/api/auth/verify' not in paths
assert '/api/status' not in paths
'''
    subprocess.run([sys.executable, '-c', code], cwd=Path(__file__).resolve().parents[1], env=env, check=True, timeout=20)
