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
"""Collection of first-party plugins.

This module exists to isolate tensorboard.program from the potentially
heavyweight build dependencies for first-party plugins. This way people
doing custom builds of TensorBoard have the option to only pay for the
dependencies they want.

This module also grants the flexibility to those doing custom builds, to
automatically inherit the centrally-maintained list of standard plugins,
for less repetition.
"""

from __future__ import absolute_import
from __future__ import division
from __future__ import print_function

import logging
import os
import pkg_resources

from tensorboard.compat import tf
from tensorboard.plugins import base_plugin
from tensorboard.plugins.audio import audio_plugin
from tensorboard.plugins.beholder import beholder_plugin_loader
from tensorboard.plugins.core import core_plugin
from tensorboard.plugins.custom_scalar import custom_scalars_plugin
from tensorboard.plugins.debugger import debugger_plugin_loader
from tensorboard.plugins.distribution import distributions_plugin
from tensorboard.plugins.graph import graphs_plugin
from tensorboard.plugins.histogram import histograms_plugin
from tensorboard.plugins.hparams import hparams_plugin_loader
from tensorboard.plugins.image import images_plugin
from tensorboard.plugins.interactive_inference import (
    interactive_inference_plugin_loader
)
from tensorboard.plugins.pr_curve import pr_curves_plugin
from tensorboard.plugins.profile import profile_plugin_loader
from tensorboard.plugins.projector import projector_plugin
from tensorboard.plugins.scalar import scalars_plugin
from tensorboard.plugins.text import text_plugin
from tensorboard.plugins.mesh import mesh_plugin


logger = logging.getLogger(__name__)

_PLUGINS = [
    core_plugin.CorePluginLoader(),
    beholder_plugin_loader.BeholderPluginLoader(),
    scalars_plugin.ScalarsPlugin,
    custom_scalars_plugin.CustomScalarsPlugin,
    images_plugin.ImagesPlugin,
    audio_plugin.AudioPlugin,
    graphs_plugin.GraphsPlugin,
    distributions_plugin.DistributionsPlugin,
    histograms_plugin.HistogramsPlugin,
    pr_curves_plugin.PrCurvesPlugin,
    projector_plugin.ProjectorPlugin,
    text_plugin.TextPlugin,
    interactive_inference_plugin_loader.InteractiveInferencePluginLoader(),
    profile_plugin_loader.ProfilePluginLoader(),
    debugger_plugin_loader.DebuggerPluginLoader(),
    hparams_plugin_loader.HParamsPluginLoader(),
    mesh_plugin.MeshPlugin,
]

def get_plugins():
  """Returns a list specifying TensorBoard's default first-party plugins.

  Plugins are specified in this list either via a TBLoader instance to load the
  plugin, or the TBPlugin class itself which will be loaded using a BasicLoader.

  This list can be passed to the `tensorboard.program.TensorBoard` API.

  :rtype: list[Union[base_plugin.TBLoader, Type[base_plugin.TBPlugin]]]
  """

  return _PLUGINS[:]

# TODO(stephanwlee): Combine with get_plugins when concept of first-party
# plugins is undone.
def get_dynamic_plugins():
  """Returns a list specifying TensorBoard's dynamically loaded plugins.

	A dynamic TensorBoard plugin is specified using entry_points [1]. This will be
  the de facto mechanism to load plugins and there no longer will be a concept
  of the first-party plugins as depicted above in `get_plugins`.

  This list can be passed to the `tensorboard.program.TensorBoard` API.

  Returns:
		a list of base_plugin.TBPlugin

  [1]: https://packaging.python.org/specifications/entry-points/
  """
  dynamic_plugins = [
      entry_point.load()
      for entry_point
      in pkg_resources.iter_entry_points('tensorboard_plugins')]

  return [
      get_plugin()[2]
      for get_plugin in dynamic_plugins]
