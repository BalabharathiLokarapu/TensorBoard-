/* Copyright 2015 The TensorFlow Authors. All Rights Reserved.

Licensed under the Apache License, Version 2.0 (the 'License');
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an 'AS IS' BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
==============================================================================*/

/**
 * @fileoverview Common interfaces for the tensorflow graph visualizer.
 */

module tf {
  /**
   * Tracks task progress. Each task being passed a progress tracker needs
   * to call the below-defined methods to notify the caller about the gradual
   * progress of the task.
   */
  export interface ProgressTracker {
    updateProgress(incrementValue: number): void;
    setMessage(msg: string): void;
    reportError(msg: string, err: Error): void;
  }
} // close module tf


namespace tf.graph {
  // Note that tf-graph-control depends on the value of the enum.
  // Polymer does not let one use JS variable as a prop.
  export enum SelectionType {
    OP_GRAPH = 'opgraph',
    CONCEPTUAL_GRAPH = 'conceptual_graph',
    PROFILE = 'profile',
  };
}  // namespace tf.graph
