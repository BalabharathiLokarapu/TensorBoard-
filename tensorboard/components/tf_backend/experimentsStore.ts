/* Copyright 2018 The TensorFlow Authors. All Rights Reserved.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
==============================================================================*/
namespace tf_backend {

export type Experiment = {name: string};

export class ExperimentsStore extends BaseStore {
  private _experiments: Experiment[] = [];

  refresh() {
    const url = getRouter().experiments();
    return this.requestManager.request(url).then(newExperiments => {
      if (!_.isEqual(this._experiments, newExperiments)) {
        this._experiments = newExperiments;
        this.emitChange();
      }
    });
  }

  /**
   * Get the current list of experiments. If no data is available, this will be
   * an empty array (i.e., there is no distinction between "no experiment" and
   * "no experiment yet").
   */
  getExperiments(): Experiment[] {
    return this._experiments.slice();
  }
}

export const experimentsStore = new ExperimentsStore();

}  // namespace tf_backend
