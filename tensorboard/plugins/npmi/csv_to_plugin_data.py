# Copyright 2020 The TensorFlow Authors. All Rights Reserved.
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
"""Convert csv data to logs for the plugin."""

from __future__ import absolute_import
from __future__ import division
from __future__ import print_function

import tensorflow as tf
import numpy as np
import csv
import os.path
from absl import app
from absl import flags
from tensorboard.plugins.npmi import summary

tf.compat.v1.enable_eager_execution()

FLAGS = flags.FLAGS

flags.DEFINE_string(
    "csv_path",
    "",
    "CSV file to convert to npmi plugin data.",
)


def contains_npmi_metric(metrics):
    for metric in metrics:
        if metric.startswith('nPMI@') or metric.startswith('nPMI_diff@'):
            return True
    return False


def convert_file(file_path):
    if not os.path.exists(file_path):
        print("No such file found. Conversion failed.")
        return
    metrics = []
    annotations = []
    values = []
    with open(file_path) as csv_file:
        csv_reader = csv.reader(csv_file)
        metrics = next(csv_reader)[1:]
        if not contains_npmi_metric(metrics):
            print("No metric is prefixed with nPMI@ or nPMI_diff@. No export generated.")
            return
        for row in csv_reader:
            annotations.append(row[0])
            values.append(row[1:])
        values = np.array(values).astype(np.float)

    writer = tf.summary.create_file_writer(os.path.dirname(file_path))
    with writer.as_default():
        tensor_result = tf.convert_to_tensor(values)
        tensor_annotations = tf.convert_to_tensor(annotations)
        tensor_metrics = tf.convert_to_tensor(metrics)

        summary.npmi_values(tensor_result, 1)
        summary.npmi_annotations(tensor_annotations, 1)
        summary.npmi_metrics(tensor_metrics, 1)
    writer.close()
    print("Successfuly saved converted output to %s" %
          os.path.dirname(file_path))


def main(unused_argv):
    print("Converting file: %s" % FLAGS.csv_path)
    convert_file(FLAGS.csv_path)


if __name__ == "__main__":
    app.run(main)
