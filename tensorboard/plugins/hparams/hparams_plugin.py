"""The TensorBoard HParams plugin.

See `http_api.md` in this directory for specifications of the routes for this
plugin.
"""

from __future__ import absolute_import
from __future__ import division
from __future__ import print_function

import json

import werkzeug
from werkzeug import wrappers

from tensorboard.plugins.hparams import api_pb2
from tensorboard.plugins.hparams import backend_context
from tensorboard.plugins.hparams import error
from tensorboard.plugins.hparams import get_experiment
from tensorboard.plugins.hparams import list_metric_evals
from tensorboard.plugins.hparams import list_session_groups
from tensorboard.plugins.hparams import metadata
from google.protobuf import json_format
from tensorboard.backend import http_util
from tensorboard.plugins import base_plugin
from tensorboard.plugins.scalar import metadata as scalars_metadata
from tensorboard.util import tb_logging


logger = tb_logging.get_logger()


class HParamsPlugin(base_plugin.TBPlugin):
  """HParams Plugin for TensorBoard."""

  plugin_name = metadata.PLUGIN_NAME

  def __init__(self, context):
    """Instantiates HParams plugin via TensorBoard core.

    Args:
      context: A base_plugin.TBContext instance.
    """
    self._context = backend_context.Context(context)

  def get_plugin_apps(self):
    """See base class."""

    return {
        '/experiment': self.get_experiment_route,
        '/session_groups': self.list_session_groups_route,
        '/metric_evals': self.list_metric_evals_route,
    }

  def is_active(self):
    """Returns True if the hparams plugin is active.

    The hparams plugin is active iff there is a tag with
    the hparams plugin name as its plugin name and the scalars plugin is
    registered and active.
    """
    if not self._context.multiplexer:
      return False
    scalars_plugin = self._get_scalars_plugin()
    if not scalars_plugin or not scalars_plugin.is_active():
      return False
    return bool(self._context.multiplexer.PluginRunToTagToContent(
        metadata.PLUGIN_NAME))

  # ---- /experiment -----------------------------------------------------------
  @wrappers.Request.application
  def get_experiment_route(self, request):
    try:
      _verify_request_is_post(request, '/experiment')
      # This backend currently ignores the request parameters, but we must
      # advance the input stream to skip them -- otherwise the next HTTP
      # request will be parsed incorrectly.
      _ = request.stream.exhaust()
      return http_util.Respond(
          request,
          json_format.MessageToJson(
              get_experiment.Handler(self._context).run(),
              including_default_value_fields=True,
          ), 'application/json')
    except error.HParamsError as e:
      logger.error('HParams error: %s' % e)
      raise werkzeug.exceptions.BadRequest(description=str(e))

  # ---- /session_groups -------------------------------------------------------
  @wrappers.Request.application
  def list_session_groups_route(self, request):
    try:
      _verify_request_is_post(request, '/session_groups')
      request_proto = json_format.Parse(request.data,
                                        api_pb2.ListSessionGroupsRequest())
      return http_util.Respond(
          request,
          json_format.MessageToJson(
              list_session_groups.Handler(self._context, request_proto).run(),
              including_default_value_fields=True,
          ),
          'application/json')
    except error.HParamsError as e:
      logger.error('HParams error: %s' % e)
      raise werkzeug.exceptions.BadRequest(description=str(e))

  # ---- /metric_evals ---------------------------------------------------------
  @wrappers.Request.application
  def list_metric_evals_route(self, request):
    try:
      _verify_request_is_post(request, '/metric_evals')
      request_proto = json_format.Parse(request.data,
                                        api_pb2.ListMetricEvalsRequest())
      scalars_plugin = self._get_scalars_plugin()
      if not scalars_plugin:
        raise error.HParamsError('Internal error: the scalars plugin is not'
                                 ' registered; yet, the hparams plugin is'
                                 ' active.')
      return http_util.Respond(
          request,
          json.dumps(
              list_metric_evals.Handler(request_proto, scalars_plugin).run()),
          'application/json')
    except error.HParamsError as e:
      logger.error('HParams error: %s' % e)
      raise werkzeug.exceptions.BadRequest(description=str(e))

  def _get_scalars_plugin(self):
    """Tries to get the scalars plugin.

    Returns:
    The scalars plugin or None if it is not yet registered.
    """
    return self._context.tb_context.plugin_name_to_instance.get(
        scalars_metadata.PLUGIN_NAME)


def _verify_request_is_post(request, end_point):
  if request.method != 'POST':
    raise error.HParamsError('%s must be a POST. Got: %s' %
                             (end_point, request.method))
