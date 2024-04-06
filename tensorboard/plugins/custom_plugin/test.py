import ntpath
import posixpath
import unittest
from unittest import mock
from unittest.mock import MagicMock, Mock,patch

from werkzeug import test
from werkzeug import wrappers
from werkzeug.test import EnvironBuilder

from tensorboard.plugins import base_plugin
from main_plugin import plugin
from tensorboard.plugins.scalar import metadata as scalar_metadata
from main_plugin import metadata
from main_plugin.plugin import System

def is_path_safe(path):
    """Returns the result depending on the plugin's static file handler."""
    example_plugin = plugin.System(base_plugin.TBContext())
    serve_static_file = example_plugin._serve_static_file

    client = test.Client(serve_static_file, wrappers.Response)
    response = client.get(plugin._PLUGIN_DIRECTORY_PATH_PART + path)
    return response.status_code == 200

class TestSystem(unittest.TestCase):

    def setUp(self):
        self.context_mock = Mock()
        self.context_mock.data_provider.list_scalars.return_value = {
            'run1': ['tag1', 'tag2'],
            'run2': ['tag3']
        }
        self.system = System(self.context_mock)

    def test_get_plugin_apps(self):
        self.assertEqual(
            self.system.get_plugin_apps(),
            {
                "/static/*": self.system._serve_static_file,
                "/tags": self.system._serve_tags,
                "/systerm": self.system._serve_system_states,
            }
        )

    def test_is_active(self):
        self.context_mock.data_provider = None
        self.assertFalse(self.system.is_active())

        self.context_mock.data_provider = MagicMock()
        self.assertTrue(self.system.is_active())


    def test_serve_tags(self):
        
        pass
        

    def test_server_system_states(self):
        pass
   
    def test_path_traversal(self):
        """Properly check whether a URL can be served from the static folder."""
        with mock.patch("builtins.open", mock.mock_open(read_data="data")):
            self.assertTrue(is_path_safe("static/index.js"))
            self.assertTrue(is_path_safe("./static/index.js"))
            self.assertTrue(is_path_safe("static/../static/index.js"))

            self.assertFalse(is_path_safe("../static/index.js"))
            self.assertFalse(is_path_safe("../index.js"))
            self.assertFalse(is_path_safe("static2/index.js"))
            self.assertFalse(is_path_safe("notstatic/index.js"))
            self.assertFalse(is_path_safe("static/../../index.js"))
            self.assertFalse(is_path_safe("..%2findex.js"))
            self.assertFalse(is_path_safe("%2e%2e/index.js"))
            self.assertFalse(is_path_safe("%2e%2e%2findex.js"))
            self.assertFalse(
                is_path_safe(
                    "static/../..\\org_tensorflow_tensorboard\\static\\index.js"
                )
            )
            self.assertFalse(
                is_path_safe(
                    "static/../../org_tensorflow_tensorboard/static/index.js"
                )
            )
            self.assertFalse(
                is_path_safe(
                    "static/%2e%2e%2f%2e%2e%5corg_tensorflow_tensorboard%5cstatic%5cindex.js"
                )
            )
            self.assertFalse(
                is_path_safe(
                    "static/%2e%2e%2f%2e%2e%2forg_tensorflow_tensorboard%2fstatic%2findex.js"
                )
            )

            # Test with OS specific path modules.
            with mock.patch("os.path", posixpath):
                self.assertTrue(is_path_safe("static/\\index.js"))

            with mock.patch("os.path", ntpath):
                self.assertFalse(is_path_safe("static/\\index.js"))


if __name__ == '__main__':
    unittest.main()
