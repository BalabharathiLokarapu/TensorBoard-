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
"""Communication channel used by the TensorBoard Debugger Plugin."""

from __future__ import absolute_import
from __future__ import division
from __future__ import print_function

import Queue
import threading
import time


class CommChannel(object):
  """A class that handles the queueing of outgoing and incoming messages."""

  def __init__(self):
    self._outgoing = []
    self._outgoing_counter = 0
    self._outgoing_lock = threading.Lock()

    self._incoming = Queue.Queue()

  def put_outgoing(self, message):
    """Put a message into the outgoing message stack.

    Outgoing message will be stored indefinitely to support multi-users.
    """
    with self._outgoing_lock:
      self._outgoing.append(message)
      self._outgoing_counter += 1

  def get_outgoing(self, pos):
    """Get message(s) from the outgoing message stack.

    Blocks until an item at stack position pos becomes available.

    Args:
       pos: An int specifying the top position of the message stack to access.
         For example, if the stack counter is at 3 and pos == 2, then the 2nd
         item on the stack will be returned, together with an int that indicates
         the current stack heigh (3 in this case).

    Returns:
      1. The item at stack position pos.
      2. The height of the stack when the retun values are generated.
    """
    assert pos > 0, "Invalid pos %d: pos must be > 0" % pos
    self._wait_till_stack_height(pos)
    with self._outgoing_lock:
      return self._outgoing[pos - 1], self._outgoing_counter

  def _wait_till_stack_height(self, pos, polling_period=0.01):
    while self._outgoing_counter < pos:
      time.sleep(polling_period)

  def put_incoming(self, message):
    self._incoming.put(message)

  def get_incoming(self):
    return self._incoming.get()
