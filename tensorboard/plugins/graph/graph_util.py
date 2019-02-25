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
"""Utilities for graph plugin."""
from tensorboard.compat.proto import function_pb2


class _ProtoListNonUniqueKeyError(Exception):
  pass


class _SameKeyDiffContentError(Exception):
  pass


def _safe_copy_proto_list_values(dst_proto_list, src_proto_list, get_key):
  """Safely copies the value from src_proto_list to dst_proto_list.

  First checks whether keys in both dst_proto_list and src_proto_list are
  unique. If not, it raises a _ProtoListNonUniqueKeyError. It copies if
  dst_proto_list does not contain an item with the same key. In case an item
  is found with the same key, it checks whether contents match and, if not, it
  raises a _SameKeyDiffContentError.

  Args:
    dst_proto_list: A `RepeatedCompositeContainer` or
      `RepeatedScalarContainer` into which values should be copied.
    src_proto_list: A container holding the same kind of values as in
      `dst_proto_list` from which values should be copied.
    get_key: A function that takes an element of `dst_proto_list` or
      `src_proto_list` and returns a key, such that if two elements have
      the same key then it is required that they be deep-equal. For
      instance, if `dst_proto_list` is a list of nodes, then `get_key`
      might be `lambda node: node.name` to indicate that if two nodes
      have the same name then they must be the same node. All keys must
      be hashable.

  Raises:
    _ProtoListNonUniqueKeyError: a proto_list contains items with duplicate
      keys.
    _SameKeyDiffContentError: an item with the same key has different contents.
  """

  def _assert_proto_container_unique_keys(proto_list, get_key):
    """Asserts whether proto_list only contains unique keys.

    Args:
      proto_list
    """
    keys = set()
    for item in proto_list:
      key = get_key(item)
      if key in keys:
        raise _ProtoListNonUniqueKeyError(key)
      keys.add(key)

  _assert_proto_container_unique_keys(dst_proto_list, get_key)
  _assert_proto_container_unique_keys(src_proto_list, get_key)

  key_to_proto = {}
  for proto in dst_proto_list:
    key = get_key(proto)
    key_to_proto[key] = proto

  for proto in src_proto_list:
    key = get_key(proto)
    if key in key_to_proto:
      if proto != key_to_proto.get(key):
        raise _SameKeyDiffContentError(key)
    else:
      dst_proto_list.add().CopyFrom(proto)


def combine_graph_defs(to_proto, from_proto):
  """Combines two GraphDefs by adding nodes from from_proto into to_proto.

  All GraphDefs are expected to be of TensorBoard's.
  It assumes node names are unique across GraphDefs if contents differ. The
  names can be the same if the NodeDef content are exactly the same.

  Args:
    to_proto: A destination TensorBoard GraphDef.
    from_proto: A TensorBoard GraphDef to copy contents from.

  Returns:
    to_proto

  Raises:
    ValueError in case any assumption about GraphDef is violated: A
    GraphDef should have unique node, function, and gradient function
    names. Also, when merging GraphDefs, they should have not have nodes,
    functions, or gradient function mappings that share the name but details
    do not match.
  """
  if from_proto.version != to_proto.version:
    raise ValueError('Cannot combine GraphDefs of different versions.')

  try:
    _safe_copy_proto_list_values(
        to_proto.node,
        from_proto.node,
        lambda n: n.name)
  except _ProtoListNonUniqueKeyError as exc:
    raise ValueError('A GraphDef contains non-unique node names: %s' % exc)
  except _SameKeyDiffContentError as exc:
    raise ValueError(
      ('Cannot combine GraphDefs because nodes share a name '
       'but contents are different: %s') % exc)
  try:
    _safe_copy_proto_list_values(
        to_proto.library.function,
        from_proto.library.function,
        lambda n: n.signature.name)
  except _ProtoListNonUniqueKeyError as exc:
    raise ValueError('A GraphDef contains non-unique function names: %s' % exc)
  except _SameKeyDiffContentError as exc:
    raise ValueError(
      ('Cannot combine GraphDefs because functions share a name '
       'but are different: %s') % exc)

  try:
    _safe_copy_proto_list_values(
        to_proto.library.gradient,
        from_proto.library.gradient,
        lambda g: g.gradient_func)
  except _ProtoListNonUniqueKeyError as exc:
    raise ValueError(
      'A GraphDef contains non-unique gradient function names: %s' % exc)
  except _SameKeyDiffContentError as exc:
    raise ValueError(
      ('Cannot combine GraphDefs because gradients share a gradient_func name '
       'but maps to a different function: %s') % exc)

  return to_proto
