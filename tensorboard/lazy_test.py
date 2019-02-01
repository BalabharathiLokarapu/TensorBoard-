# Copyright 2019 The TensorFlow Authors. All Rights Reserved.
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
"""Unit tests for the `tensorboard.lazy` module."""

from __future__ import absolute_import
from __future__ import division
from __future__ import print_function

import unittest

from tensorboard import lazy


class LazyTest(unittest.TestCase):

  def test_self_composition(self):
    """A lazy module should be able to load another lazy module."""
    # This test can fail if the `LazyModule` implementation stores the
    # cached module as a field on the module itself rather than a
    # closure value. (See pull request review comments on #1781 for
    # details.)

    @lazy.lazy_load("inner")
    def inner():
      import collections  # pylint: disable=g-import-not-at-top
      return collections

    @lazy.lazy_load("outer")
    def outer():
      return inner

    x1 = outer.namedtuple
    x2 = inner.namedtuple
    self.assertEqual(x1, x2)


if __name__ == '__main__':
  unittest.main()
