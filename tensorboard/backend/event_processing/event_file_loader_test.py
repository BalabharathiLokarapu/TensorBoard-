# Copyright 2015 The TensorFlow Authors. All Rights Reserved.
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

"""Tests for event_file_loader."""

from __future__ import absolute_import
from __future__ import division
from __future__ import print_function

import os
import tempfile

from tensorboard.compat import tf


from tensorboard.backend.event_processing import event_file_loader


class EventFileLoaderTest(tf.test.TestCase):
  # A record containing a simple event.
  RECORD = (b'\x18\x00\x00\x00\x00\x00\x00\x00\xa3\x7fK"\t\x00\x00\xc0%\xddu'
            b'\xd5A\x1a\rbrain.Event:1\xec\xf32\x8d')

  def _WriteToFile(self, filename, data):
    with open(filename, 'ab') as f:
      f.write(data)

  def _LoaderForTestFile(self, filename):
    return event_file_loader.EventFileLoader(
        os.path.join(self.get_temp_dir(), filename))

  def testEmptyEventFile(self):
    filename = tempfile.NamedTemporaryFile(dir=self.get_temp_dir()).name
    self._WriteToFile(filename, b'')
    loader = self._LoaderForTestFile(filename)
    self.assertEqual(len(list(loader.Load())), 0)

  def testSingleWrite(self):
    filename = tempfile.NamedTemporaryFile(dir=self.get_temp_dir()).name
    self._WriteToFile(filename, EventFileLoaderTest.RECORD)
    loader = self._LoaderForTestFile(filename)
    events = list(loader.Load())
    self.assertEqual(len(events), 1)
    self.assertEqual(events[0].wall_time, 1440183447.0)
    self.assertEqual(len(list(loader.Load())), 0)

  def testMultipleWrites(self):
    filename = tempfile.NamedTemporaryFile(dir=self.get_temp_dir()).name
    self._WriteToFile(filename, EventFileLoaderTest.RECORD)
    loader = self._LoaderForTestFile(filename)
    self.assertEqual(len(list(loader.Load())), 1)
    self._WriteToFile(filename, EventFileLoaderTest.RECORD)
    self.assertEqual(len(list(loader.Load())), 1)

  def testMultipleLoads(self):
    filename = tempfile.NamedTemporaryFile(dir=self.get_temp_dir()).name
    self._WriteToFile(filename, EventFileLoaderTest.RECORD)
    loader = self._LoaderForTestFile(filename)
    loader.Load()
    loader.Load()
    self.assertEqual(len(list(loader.Load())), 1)

  def testMultipleWritesAtOnce(self):
    filename = tempfile.NamedTemporaryFile(dir=self.get_temp_dir()).name
    self._WriteToFile(filename, EventFileLoaderTest.RECORD)
    self._WriteToFile(filename, EventFileLoaderTest.RECORD)
    loader = self._LoaderForTestFile(filename)
    self.assertEqual(len(list(loader.Load())), 2)

  def testMultipleWritesWithBadWrite(self):
    filename = tempfile.NamedTemporaryFile(dir=self.get_temp_dir()).name
    self._WriteToFile(filename, EventFileLoaderTest.RECORD)
    self._WriteToFile(filename, EventFileLoaderTest.RECORD)
    # Test that we ignore partial record writes at the end of the file.
    self._WriteToFile(filename, b'123')
    loader = self._LoaderForTestFile(filename)
    self.assertEqual(len(list(loader.Load())), 2)


class RawEventFileLoaderTest(EventFileLoaderTest):

  def _LoaderForTestFile(self, filename):
    return event_file_loader.RawEventFileLoader(
        os.path.join(self.get_temp_dir(), filename))

  def testSingleWrite(self):
    filename = tempfile.NamedTemporaryFile(dir=self.get_temp_dir()).name
    self._WriteToFile(filename, EventFileLoaderTest.RECORD)
    loader = self._LoaderForTestFile(filename)
    event_protos = list(loader.Load())
    self.assertEqual(len(event_protos), 1)
    # Record format has a 12 byte header and a 4 byte trailer.
    expected_event_proto = EventFileLoaderTest.RECORD[12:-4]
    self.assertEqual(event_protos[0], expected_event_proto)


if __name__ == '__main__':
  tf.test.main()
