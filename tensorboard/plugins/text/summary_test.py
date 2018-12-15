# -*- coding: utf-8 -*-
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
"""Tests for the text plugin summary API."""

from __future__ import absolute_import
from __future__ import division
from __future__ import print_function

import glob
import os

import numpy as np
import six
import tensorflow as tf

from tensorboard.compat.proto import summary_pb2
from tensorboard.plugins.text import metadata
from tensorboard.plugins.text import summary
from tensorboard.util import tensor_util

try:
  from tensorboard.compat import tf_v2
except ImportError:
  tf_v2 = None

try:
  tf.enable_eager_execution()
except AttributeError:
  # TF 2.0 doesn't have this symbol because eager is the default.
  pass


class SummaryBaseTest(object):

  def text(self, *args, **kwargs):
    raise NotImplementedError()

  def test_tag(self):
    self.assertEqual('a', self.text('a', 'foo').value[0].tag)
    self.assertEqual('a/b', self.text('a/b', 'foo').value[0].tag)

  def test_metadata(self):
    pb = self.text('do', 'A deer. A female deer.')
    summary_metadata = pb.value[0].metadata
    plugin_data = summary_metadata.plugin_data
    self.assertEqual(summary_metadata.summary_description, '')
    self.assertEqual(plugin_data.plugin_name, metadata.PLUGIN_NAME)
    content = summary_metadata.plugin_data.content
    # There's no content, so successfully parsing is fine.
    metadata.parse_plugin_metadata(content)

  def test_explicit_description(self):
    description = 'A whole step above do.'
    pb = self.text('re', 'A drop of golden sun.', description=description)
    summary_metadata = pb.value[0].metadata
    self.assertEqual(summary_metadata.summary_description, description)
    plugin_data = summary_metadata.plugin_data
    self.assertEqual(plugin_data.plugin_name, metadata.PLUGIN_NAME)
    content = summary_metadata.plugin_data.content
    # There's no content, so successfully parsing is fine.
    metadata.parse_plugin_metadata(content)

  def test_bytes_value(self):
    pb = self.text('mi', b'A name\xe2\x80\xa6I call myself')
    value = tensor_util.make_ndarray(pb.value[0].tensor).item()
    self.assertIsInstance(value, six.binary_type)
    self.assertEqual(b'A name\xe2\x80\xa6I call myself', value)

  def test_unicode_value(self):
    pb = self.text('mi', u'A name\u2026I call myself')
    value = tensor_util.make_ndarray(pb.value[0].tensor).item()
    self.assertIsInstance(value, six.binary_type)
    self.assertEqual(b'A name\xe2\x80\xa6I call myself', value)

  def test_np_array_bytes_value(self):
    pb = self.text(
        'fa',
        np.array(
            [[b'A', b'long', b'long'], [b'way', b'to', b'run \xe2\x80\xbc']]))
    values = tensor_util.make_ndarray(pb.value[0].tensor).tolist()
    self.assertEqual(
        [[b'A', b'long', b'long'], [b'way', b'to', b'run \xe2\x80\xbc']],
        values)
    # Check that all entries are byte strings.
    for vectors in values:
      for value in vectors:
        self.assertIsInstance(value, six.binary_type)

  def test_np_array_unicode_value(self):
    pb = self.text(
        'fa',
        np.array(
            [[u'A', u'long', u'long'], [u'way', u'to', u'run \u203C']]))
    values = tensor_util.make_ndarray (pb.value[0].tensor).tolist()
    self.assertEqual(
        [[b'A', b'long', b'long'], [b'way', b'to', b'run \xe2\x80\xbc']],
        values)
    # Check that all entries are byte strings.
    for vectors in values:
      for value in vectors:
        self.assertIsInstance(value, six.binary_type)

  def test_non_string_value(self):
    with six.assertRaisesRegex(self, TypeError, r'must be of type.*string'):
      self.text('la', np.array(range(42)))


class SummaryV1PbTest(SummaryBaseTest, tf.test.TestCase):
  def text(self, *args, **kwargs):
    return summary.pb(*args, **kwargs)

  def test_tag(self):
    self.assertEqual('a/text_summary', self.text('a', 'foo').value[0].tag)
    self.assertEqual('a/b/text_summary', self.text('a/b', 'foo').value[0].tag)

  def test_non_string_value(self):
    with six.assertRaisesRegex(self, ValueError,
                               r'Expected binary or unicode string, got 0'):
      self.text('la', np.array(range(42)))

class SummaryV1OpTest(SummaryBaseTest, tf.test.TestCase):
  def text(self, *args, **kwargs):
    return tf.Summary.FromString(summary.op(*args, **kwargs).numpy())

  def test_tag(self):
    self.assertEqual('a/text_summary', self.text('a', 'foo').value[0].tag)
    self.assertEqual('a/b/text_summary', self.text('a/b', 'foo').value[0].tag)

  def test_scoped_tag(self):
    with tf.name_scope('scope'):
      self.assertEqual('scope/a/text_summary',
                       self.text('a', 'foo').value[0].tag)


class SummaryV2PbTest(SummaryBaseTest, tf.test.TestCase):
  def text(self, *args, **kwargs):
    return summary.text_pb(*args, **kwargs)


class SummaryV2OpTest(SummaryBaseTest, tf.test.TestCase):
  def setUp(self):
    super(SummaryV2OpTest, self).setUp()
    if tf_v2 is None:
      self.skipTest('TF v2 summary API not available')

  def text(self, *args, **kwargs):
    writer = tf_v2.summary.create_file_writer(self.get_temp_dir())
    with writer.as_default():
      summary.text(*args, **kwargs)
    writer.close()
    return self.read_single_event_from_eventfile().summary

  def read_single_event_from_eventfile(self):
    event_files = glob.glob(os.path.join(self.get_temp_dir(), '*'))
    self.assertEqual(len(event_files), 1)
    events = list(tf.compat.v1.train.summary_iterator(event_files[0]))
    # Expect a boilerplate event for the file_version, then the summary one.
    self.assertEqual(len(events), 2)
    return events[1]

  def test_scoped_tag(self):
    with tf.name_scope('scope'):
      self.assertEqual('scope/a', self.text('a', 'foo').value[0].tag)

  def test_step(self):
    self.text('a', 'foo', step=333)
    event = self.read_single_event_from_eventfile()
    self.assertEqual(333, event.step)


class SummaryV2OpGraphTest(SummaryV2OpTest, tf.test.TestCase):
  def text(self, *args, **kwargs):
    # Hack to extract current scope since there's no direct API for it.
    with tf.name_scope('_') as temp_scope:
      scope = temp_scope.rstrip('/_')
    @tf.function
    def graph_fn():
      # Recreate the active scope inside the defun since it won't propagate.
      with tf.name_scope(scope):
        summary.text(*args, **kwargs)
    writer = tf_v2.summary.create_file_writer(self.get_temp_dir())
    with writer.as_default():
      graph_fn()
    writer.close()
    return self.read_single_event_from_eventfile().summary


if __name__ == '__main__':
  tf.test.main()
