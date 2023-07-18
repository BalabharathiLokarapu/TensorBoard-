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
"""Wraps the base_plugin.TBContext to stores additional data shared across API
handlers for the HParams plugin backend."""


import collections
import os


from tensorboard.data import provider
from tensorboard.plugins.hparams import api_pb2
from tensorboard.plugins.hparams import json_format_compat
from tensorboard.plugins.hparams import metadata
from google.protobuf import json_format
from tensorboard.plugins.scalar import metadata as scalar_metadata

_DISCRETE_DOMAIN_TYPE_TO_DATA_TYPE = {
    provider.HyperparameterDomainType.DISCRETE_BOOL: api_pb2.DATA_TYPE_BOOL,
    provider.HyperparameterDomainType.DISCRETE_FLOAT: api_pb2.DATA_TYPE_FLOAT64,
    provider.HyperparameterDomainType.DISCRETE_STRING: api_pb2.DATA_TYPE_STRING,
}


class Context:
    """Wraps the base_plugin.TBContext to stores additional data shared across
    API handlers for the HParams plugin backend.

    Before adding fields to this class, carefully consider whether the
    field truelly needs to be accessible to all API handlers or if it
    can be passed separately to the handler constructor. We want to
    avoid this class becoming a magic container of variables that have
    no better place. See http://wiki.c2.com/?MagicContainer
    """

    def __init__(self, tb_context):
        """Instantiates a context.

        Args:
          tb_context: base_plugin.TBContext. The "base" context we extend.
        """
        self._tb_context = tb_context

    def experiment_from_metadata(
        self,
        ctx,
        experiment_id,
        hparams_run_to_tag_to_content,
        data_provider_hparams,
    ):
        """Returns the experiment proto defining the experiment.

        This method first attempts to find a metadata.EXPERIMENT_TAG tag and
        retrieve the associated proto.

        If no such tag is found, the method will attempt to build a minimal
        experiment proto by scanning for all metadata.SESSION_START_INFO_TAG
        tags (to compute the hparam_infos field of the experiment) and for all
        scalar tags (to compute the metric_infos field of the experiment).

        If no metadata.EXPERIMENT_TAG nor metadata.SESSION_START_INFO_TAG tags
        are found, then will build an experiment proto using the results from
        DataProvider.list_hyperparameters().

        Args:
          experiment_id: String, from `plugin_util.experiment_id`.
          hparams_run_to_tag_to_content: The output from an hparams_metadata()
            call. A dict `d` such that `d[run][tag]` is a `bytes` value with the
            summary metadata content for the keyed time series.
          data_provider_hparams: The ouput from an hparams_from_data_provider()
            call, corresponding to DataProvider.list_hyperparameters().
            A Collection[provider.Hyperparameter].

        Returns:
          The experiment proto. If no data is found for an experiment proto to
          be built, returns an entirely empty experiment.
        """
        experiment = self._find_experiment_tag(hparams_run_to_tag_to_content)
        if experiment:
            return experiment

        experiment_from_runs = self._compute_experiment_from_runs(
            ctx, experiment_id, hparams_run_to_tag_to_content
        )
        if experiment_from_runs:
            return experiment_from_runs

        experiment_from_data_provider_hparams = (
            self._experiment_from_data_provider_hparams(data_provider_hparams)
        )
        return (
            experiment_from_data_provider_hparams
            if experiment_from_data_provider_hparams
            else api_pb2.Experiment()
        )

    @property
    def tb_context(self):
        return self._tb_context

    def _convert_plugin_metadata(self, data_provider_output):
        return {
            run: {
                tag: time_series.plugin_content
                for (tag, time_series) in tag_to_time_series.items()
            }
            for (run, tag_to_time_series) in data_provider_output.items()
        }

    def hparams_metadata(self, ctx, experiment_id, run_tag_filter=None):
        """Reads summary metadata for all hparams time series.

        Args:
          experiment_id: String, from `plugin_util.experiment_id`.
          run_tag_filter: Optional `data.provider.RunTagFilter`, with
            the semantics as in `list_tensors`.

        Returns:
          A dict `d` such that `d[run][tag]` is a `bytes` value with the
          summary metadata content for the keyed time series.
        """
        return self._convert_plugin_metadata(
            self._tb_context.data_provider.list_tensors(
                ctx,
                experiment_id=experiment_id,
                plugin_name=metadata.PLUGIN_NAME,
                run_tag_filter=run_tag_filter,
            )
        )

    def scalars_metadata(self, ctx, experiment_id):
        """Reads summary metadata for all scalar time series.

        Args:
          experiment_id: String, from `plugin_util.experiment_id`.

        Returns:
          A dict `d` such that `d[run][tag]` is a `bytes` value with the
          summary metadata content for the keyed time series.
        """
        return self._convert_plugin_metadata(
            self._tb_context.data_provider.list_scalars(
                ctx,
                experiment_id=experiment_id,
                plugin_name=scalar_metadata.PLUGIN_NAME,
            )
        )

    def read_last_scalars(self, ctx, experiment_id, run_tag_filter):
        """Reads the most recent values from scalar time series.

        Args:
          experiment_id: String.
          run_tag_filter: Required `data.provider.RunTagFilter`, with
            the semantics as in `read_scalars`.

        Returns:
          A dict `d` such that `d[run][tag]` is a `provider.ScalarDatum`
          value, with keys only for runs and tags that actually had
          data, which may be a subset of what was requested.
        """
        data_provider_output = self._tb_context.data_provider.read_scalars(
            ctx,
            experiment_id=experiment_id,
            plugin_name=scalar_metadata.PLUGIN_NAME,
            run_tag_filter=run_tag_filter,
            # TODO(#3436): We assume that downsampling always includes
            # the most recent datum, which holds for all implementations
            # of interest but is not yet required by the interface.
            downsample=1,
        )
        return {
            run: {tag: data[-1] for (tag, data) in tag_to_data.items()}
            for (run, tag_to_data) in data_provider_output.items()
        }

    def hparams_from_data_provider(self, ctx, experiment_id):
        """Calls DataProvider.list_hyperparameters() and returns the result."""
        return self._tb_context.data_provider.list_hyperparameters(
            ctx, experiment_ids=[experiment_id]
        )

    def session_groups_from_data_provider(self, ctx, experiment_id):
        """Calls DataProvider.read_hyperparameters() and returns the result."""
        return self._tb_context.data_provider.read_hyperparameters(
            ctx, experiment_ids=[experiment_id]
        )

    def _find_experiment_tag(self, hparams_run_to_tag_to_content):
        """Finds the experiment associcated with the metadata.EXPERIMENT_TAG
        tag.

        Returns:
          The experiment or None if no such experiment is found.
        """
        # We expect only one run to have an `EXPERIMENT_TAG`; look
        # through all of them and arbitrarily pick the first one.
        for tags in hparams_run_to_tag_to_content.values():
            maybe_content = tags.get(metadata.EXPERIMENT_TAG)
            if maybe_content is not None:
                return metadata.parse_experiment_plugin_data(maybe_content)
        return None

    def _compute_experiment_from_runs(
        self, ctx, experiment_id, hparams_run_to_tag_to_content
    ):
        """Computes a minimal Experiment protocol buffer by scanning the runs.

        Returns None if there are no hparam infos logged.
        """
        hparam_infos = self._compute_hparam_infos(hparams_run_to_tag_to_content)
        if hparam_infos:
            metric_infos = self._compute_metric_infos(
                ctx, experiment_id, hparams_run_to_tag_to_content
            )
        else:
            metric_infos = []
        if not hparam_infos and not metric_infos:
            return None

        return api_pb2.Experiment(
            hparam_infos=hparam_infos, metric_infos=metric_infos
        )

    def _compute_hparam_infos(self, hparams_run_to_tag_to_content):
        """Computes a list of api_pb2.HParamInfo from the current run, tag
        info.

        Finds all the SessionStartInfo messages and collects the hparams values
        appearing in each one. For each hparam attempts to deduce a type that fits
        all its values. Finally, sets the 'domain' of the resulting HParamInfo
        to be discrete if the type is string or boolean.

        Returns:
          A list of api_pb2.HParamInfo messages.
        """
        # Construct a dict mapping an hparam name to its list of values.
        hparams = collections.defaultdict(list)
        for tag_to_content in hparams_run_to_tag_to_content.values():
            if metadata.SESSION_START_INFO_TAG not in tag_to_content:
                continue
            start_info = metadata.parse_session_start_info_plugin_data(
                tag_to_content[metadata.SESSION_START_INFO_TAG]
            )
            for (name, value) in start_info.hparams.items():
                hparams[name].append(value)

        # Try to construct an HParamInfo for each hparam from its name and list
        # of values.
        result = []
        for (name, values) in hparams.items():
            hparam_info = self._compute_hparam_info_from_values(name, values)
            if hparam_info is not None:
                result.append(hparam_info)
        return result

    def _compute_hparam_info_from_values(self, name, values):
        """Builds an HParamInfo message from the hparam name and list of
        values.

        Args:
          name: string. The hparam name.
          values: list of google.protobuf.Value messages. The list of values for the
            hparam.

        Returns:
          An api_pb2.HParamInfo message.
        """
        # Figure out the type from the values.
        # Ignore values whose type is not listed in api_pb2.DataType
        # If all values have the same type, then that is the type used.
        # Otherwise, the returned type is DATA_TYPE_STRING.
        result = api_pb2.HParamInfo(name=name, type=api_pb2.DATA_TYPE_UNSET)
        for v in values:
            v_type = _protobuf_value_type(v)
            if not v_type:
                continue
            if result.type == api_pb2.DATA_TYPE_UNSET:
                result.type = v_type
            elif result.type != v_type:
                result.type = api_pb2.DATA_TYPE_STRING
            if result.type == api_pb2.DATA_TYPE_STRING:
                # A string result.type does not change, so we can exit the loop.
                break

        # If we couldn't figure out a type, then we can't compute the hparam_info.
        if result.type == api_pb2.DATA_TYPE_UNSET:
            return None

        if result.type == api_pb2.DATA_TYPE_STRING:
            distinct_values = set(
                _protobuf_value_to_string(v)
                for v in values
                if _can_be_converted_to_string(v)
            )
            result.domain_discrete.extend(distinct_values)

        if result.type == api_pb2.DATA_TYPE_BOOL:
            result.domain_discrete.extend([True, False])

        return result

    def _experiment_from_data_provider_hparams(
        self,
        data_provider_hparams,
    ):
        """Returns an experiment protobuffer based on data provider hparams.

        Args:
          data_provider_hparams: The ouput from an hparams_from_data_provider()
            call, corresponding to DataProvider.list_hyperparameters().
            A Collection[provider.Hyperparameter].

        Returns:
          The experiment proto. If there are no hyperparameters in the input,
          returns None.
        """
        if not data_provider_hparams:
            return None

        hparam_infos = [
            self._convert_data_provider_hparam(dp_hparam)
            for dp_hparam in data_provider_hparams
        ]
        return api_pb2.Experiment(hparam_infos=hparam_infos)

    def _convert_data_provider_hparam(self, dp_hparam):
        """Builds an HParamInfo message from data provider Hyperparameter.

        Args:
          dp_hparam: The provider.Hyperparameter returned by the call to
            provider.DataProvider.list_hyperparameters().

        Returns:
          An HParamInfo to include in the Experiment.
        """
        hparam_info = api_pb2.HParamInfo(
            name=dp_hparam.hyperparameter_name,
            display_name=dp_hparam.hyperparameter_display_name,
        )
        if dp_hparam.domain_type == provider.HyperparameterDomainType.INTERVAL:
            hparam_info.type = api_pb2.DATA_TYPE_FLOAT64
            (dp_hparam_min, dp_hparam_max) = dp_hparam.domain
            hparam_info.domain_interval.min_value = dp_hparam_min
            hparam_info.domain_interval.max_value = dp_hparam_max
        elif dp_hparam.domain_type in _DISCRETE_DOMAIN_TYPE_TO_DATA_TYPE.keys():
            hparam_info.type = _DISCRETE_DOMAIN_TYPE_TO_DATA_TYPE.get(
                dp_hparam.domain_type
            )
            hparam_info.domain_discrete.extend(dp_hparam.domain)
        return hparam_info

    def _compute_metric_infos(
        self, ctx, experiment_id, hparams_run_to_tag_to_content
    ):
        return (
            api_pb2.MetricInfo(name=api_pb2.MetricName(group=group, tag=tag))
            for tag, group in self._compute_metric_names(
                ctx, experiment_id, hparams_run_to_tag_to_content
            )
        )

    def _compute_metric_names(
        self, ctx, experiment_id, hparams_run_to_tag_to_content
    ):
        """Computes the list of metric names from all the scalar (run, tag)
        pairs.

        The return value is a list of (tag, group) pairs representing the metric
        names. The list is sorted in Python tuple-order (lexicographical).

        For example, if the scalar (run, tag) pairs are:
        ("exp/session1", "loss")
        ("exp/session2", "loss")
        ("exp/session2/eval", "loss")
        ("exp/session2/validation", "accuracy")
        ("exp/no-session", "loss_2"),
        and the runs corresponding to sessions are "exp/session1", "exp/session2",
        this method will return [("loss", ""), ("loss", "/eval"), ("accuracy",
        "/validation")]

        More precisely, each scalar (run, tag) pair is converted to a (tag, group)
        metric name, where group is the suffix of run formed by removing the
        longest prefix which is a session run. If no session run is a prefix of
        'run', the pair is skipped.

        Returns:
          A python list containing pairs. Each pair is a (tag, group) pair
          representing a metric name used in some session.
        """
        session_runs = set(
            run
            for run, tags in hparams_run_to_tag_to_content.items()
            if metadata.SESSION_START_INFO_TAG in tags
        )
        metric_names_set = set()
        scalars_run_to_tag_to_content = self.scalars_metadata(
            ctx, experiment_id
        )
        for run, tags in scalars_run_to_tag_to_content.items():
            session = _find_longest_parent_path(session_runs, run)
            if not session:
                continue
            group = os.path.relpath(run, session)
            # relpath() returns "." for the 'session' directory, we use an empty
            # string.
            if group == ".":
                group = ""
            metric_names_set.update((tag, group) for tag in tags)
        metric_names_list = list(metric_names_set)
        # Sort metrics for determinism.
        metric_names_list.sort()
        return metric_names_list


def _find_longest_parent_path(path_set, path):
    """Finds the longest "parent-path" of 'path' in 'path_set'.

    This function takes and returns "path-like" strings which are strings
    made of strings separated by os.sep. No file access is performed here, so
    these strings need not correspond to actual files in some file-system..
    This function returns the longest ancestor path
    For example, for path_set=["/foo/bar", "/foo", "/bar/foo"] and
    path="/foo/bar/sub_dir", returns "/foo/bar".

    Args:
      path_set: set of path-like strings -- e.g. a list of strings separated by
        os.sep. No actual disk-access is performed here, so these need not
        correspond to actual files.
      path: a path-like string.

    Returns:
      The element in path_set which is the longest parent directory of 'path'.
    """
    # This could likely be more efficiently implemented with a trie
    # data-structure, but we don't want to add an extra dependency for that.
    while path not in path_set:
        if not path:
            return None
        path = os.path.dirname(path)
    return path


def _can_be_converted_to_string(value):
    if not _protobuf_value_type(value):
        return False
    return json_format_compat.is_serializable_value(value)


def _protobuf_value_type(value):
    """Returns the type of the google.protobuf.Value message as an
    api.DataType.

    Returns None if the type of 'value' is not one of the types supported in
    api_pb2.DataType.

    Args:
      value: google.protobuf.Value message.
    """
    if value.HasField("number_value"):
        return api_pb2.DATA_TYPE_FLOAT64
    if value.HasField("string_value"):
        return api_pb2.DATA_TYPE_STRING
    if value.HasField("bool_value"):
        return api_pb2.DATA_TYPE_BOOL
    return None


def _protobuf_value_to_string(value):
    """Returns a string representation of given google.protobuf.Value message.

    Args:
      value: google.protobuf.Value message. Assumed to be of type 'number',
        'string' or 'bool'.
    """
    value_in_json = json_format.MessageToJson(value)
    if value.HasField("string_value"):
        # Remove the quotations.
        return value_in_json[1:-1]
    return value_in_json
