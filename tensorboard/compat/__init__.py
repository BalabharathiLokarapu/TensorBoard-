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

"""Compat module.

Provides a compat layer for TensorFlow methods so we can build without
TensorFlow in some cases.
"""

from __future__ import absolute_import
from __future__ import division
from __future__ import print_function

try:
  from . import notf
  USING_TF = notf.use_tf()
except ImportError:
  try:
    import tensorflow as tf
    USING_TF = True
  except ImportError:
    USING_TF = False

if not USING_TF:
  from . import tensorflow_stub as tf  # noqa
