# Copyright 2017 The TensorFlow Authors. All Rights Reserved.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
# ==============================================================================
"""Tests the TensorBoard core endpoints."""

from __future__ import absolute_import
from __future__ import division
from __future__ import print_function

import collections
import contextlib
import json
import os
import shutil

import tensorflow as tf
from werkzeug import test as werkzeug_test
from werkzeug import wrappers

from tensorboard import db
from tensorboard.backend import application
from tensorboard.backend.event_processing import plugin_event_multiplexer as event_multiplexer  # pylint: disable=line-too-long
from tensorboard.plugins import base_plugin
from tensorboard.plugins.core import core_plugin


class CorePluginTest(tf.test.TestCase):
  _only_use_meta_graph = False  # Server data contains only a GraphDef

  def setUp(self):
    self.temp_dir = self.get_temp_dir()
    self.addCleanup(shutil.rmtree, self.temp_dir)

    self.startLogdirBasedServer(self.temp_dir)
    self.startDbBasedServer(self.temp_dir)

  def startLogdirBasedServer(self, temp_dir):
    self.logdir = temp_dir
    self._generate_test_data(run_name='run1')
    self.multiplexer = event_multiplexer.EventMultiplexer(
        size_guidance=application.DEFAULT_SIZE_GUIDANCE,
        purge_orphaned_data=True)
    context = base_plugin.TBContext(
        assets_zip_provider=get_test_assets_zip_provider(),
        logdir=self.logdir,
        multiplexer=self.multiplexer,
        window_title='title foo')
    self.logdir_based_plugin = core_plugin.CorePlugin(context)
    app = application.TensorBoardWSGIApp(
        self.logdir,
        [self.logdir_based_plugin],
        self.multiplexer,
        0,
        path_prefix='')
    self.logdir_based_server = werkzeug_test.Client(app, wrappers.BaseResponse)

  def startDbBasedServer(self, temp_dir):
    self.db_uri = 'sqlite:' + os.path.join(temp_dir, 'db.sqlite')
    db_module, db_connection_provider = application.get_database_info(
        self.db_uri)
    if db_connection_provider is not None:
      with contextlib.closing(db_connection_provider()) as db_conn:
        schema = db.Schema(db_conn)
        schema.create_tables()
        schema.create_indexes()
    context = base_plugin.TBContext(
        assets_zip_provider=get_test_assets_zip_provider(),
        db_module=db_module,
        db_connection_provider=db_connection_provider,
        db_uri=self.db_uri,
        window_title='title foo')
    self.db_based_plugin = core_plugin.CorePlugin(context)
    app = application.TensorBoardWSGI([self.db_based_plugin])
    self.db_based_server = werkzeug_test.Client(app, wrappers.BaseResponse)

  def testRoutesProvided(self):
    """Tests that the plugin offers the correct routes."""
    routes = self.logdir_based_plugin.get_plugin_apps()
    self.assertIsInstance(routes['/data/logdir'], collections.Callable)
    self.assertIsInstance(routes['/data/runs'], collections.Callable)

  def testIndex_returnsActualHtml(self):
    """Test the format of the /data/runs endpoint."""
    response = self.logdir_based_server.get('/')
    self.assertEqual(200, response.status_code)
    self.assertStartsWith(response.headers.get('Content-Type'), 'text/html')
    html = response.get_data()
    self.assertStartsWith(html, b'<!doctype html>')

  def testDataPaths_disableAllCaching(self):
    """Test the format of the /data/runs endpoint."""
    for path in ('/data/runs', '/data/logdir'):
      response = self.logdir_based_server.get(path)
      self.assertEqual(200, response.status_code, msg=path)
      self.assertEqual('0', response.headers.get('Expires'), msg=path)

  def testEnvironmentForDbUri(self):
    """Test that the environment route correctly returns the database URI."""
    parsed_object = self._get_json(self.db_based_server, '/data/environment')
    self.assertEqual(parsed_object['data_location'], self.db_uri)

  def testEnvironmentForLogdir(self):
    """Test that the environment route correctly returns the logdir."""
    parsed_object = self._get_json(
        self.logdir_based_server, '/data/environment')
    self.assertEqual(parsed_object['data_location'], self.logdir)

  def testEnvironmentForWindowTitle(self):
    """Test that the environment route correctly returns the window title."""
    parsed_object_db = self._get_json(
        self.db_based_server, '/data/environment')
    parsed_object_logdir = self._get_json(
        self.logdir_based_server, '/data/environment')
    self.assertEqual(
        parsed_object_db['window_title'], parsed_object_logdir['window_title'])
    self.assertEqual(parsed_object_db['window_title'], 'title foo')

  def testLogdir(self):
    """Test the format of the data/logdir endpoint."""
    parsed_object = self._get_json(self.logdir_based_server, '/data/logdir')
    self.assertEqual(parsed_object, {'logdir': self.logdir})

  def testRuns(self):
    """Test the format of the /data/runs endpoint."""
    run_json = self._get_json(self.logdir_based_server, '/data/runs')
    self.assertEqual(run_json, ['run1'])

  def testRunsAppendOnly(self):
    """Test that new runs appear after old ones in /data/runs."""
    # We use three runs: the 'run1' that we already created in our
    # `setUp` method, plus runs with names lexicographically before and
    # after it (so that just sorting by name doesn't have a chance of
    # working).
    fake_wall_times = {
        'run1': 1234.0,
        'avocado': 2345.0,
        'zebra': 3456.0,
        'mysterious': None,
    }

    stubs = tf.test.StubOutForTesting()
    def FirstEventTimestamp_stub(multiplexer_self, run_name):
      del multiplexer_self
      matches = [candidate_name
                 for candidate_name in fake_wall_times
                 if run_name.endswith(candidate_name)]
      self.assertEqual(len(matches), 1, '%s (%s)' % (matches, run_name))
      wall_time = fake_wall_times[matches[0]]
      if wall_time is None:
        raise ValueError('No event timestamp could be found')
      else:
        return wall_time

    stubs.SmartSet(self.multiplexer,
                   'FirstEventTimestamp',
                   FirstEventTimestamp_stub)

    def add_run(run_name):
      self._generate_test_data(run_name)
      self.multiplexer.AddRunsFromDirectory(self.logdir)
      self.multiplexer.Reload()

    # Add one run: it should come last.
    add_run('avocado')
    self.assertEqual(self._get_json(self.logdir_based_server, '/data/runs'),
                     ['run1', 'avocado'])

    # Add another run: it should come last, too.
    add_run('zebra')
    self.assertEqual(self._get_json(self.logdir_based_server, '/data/runs'),
                     ['run1', 'avocado', 'zebra'])

    # And maybe there's a run for which we somehow have no timestamp.
    add_run('mysterious')
    self.assertEqual(self._get_json(self.logdir_based_server, '/data/runs'),
                     ['run1', 'avocado', 'zebra', 'mysterious'])

    stubs.UnsetAll()

  def _get_json(self, server, path):
    response = server.get(path)
    self.assertEqual(200, response.status_code)
    return self._get_json_payload(response)

  def _get_json_payload(self, response):
    self.assertStartsWith(response.headers.get('Content-Type'),
                          'application/json')
    return json.loads(response.get_data().decode('utf-8'))

  def _generate_test_data(self, run_name):
    """Generates the test data directory.

    The test data has a single run of the given name, containing:
      - a graph definition and metagraph definition

    Arguments:
      run_name: The directory under self.logdir into which to write
          events.
    """
    run_path = os.path.join(self.logdir, run_name)
    os.makedirs(run_path)

    writer = tf.summary.FileWriter(run_path)

    # Add a simple graph event.
    graph_def = tf.GraphDef()
    node1 = graph_def.node.add()
    node1.name = 'a'
    node2 = graph_def.node.add()
    node2.name = 'b'
    node2.attr['very_large_attr'].s = b'a' * 2048  # 2 KB attribute

    meta_graph_def = tf.MetaGraphDef(graph_def=graph_def)

    if self._only_use_meta_graph:
      writer.add_meta_graph(meta_graph_def)
    else:
      writer.add_graph(graph_def)

    writer.flush()
    writer.close()


class CorePluginUsingMetagraphOnlyTest(CorePluginTest):
  # Tests new ability to use only the MetaGraphDef
  _only_use_meta_graph = True  # Server data contains only a MetaGraphDef


def get_test_assets_zip_provider():
  path = os.path.join(tf.resource_loader.get_data_files_path(),
                      'test_webfiles.zip')
  if not os.path.exists(path):
    tf.logging.warning('test_webfiles.zip static assets not found: %s', path)
    return None
  return lambda: open(path, 'rb')


if __name__ == '__main__':
  tf.test.main()
