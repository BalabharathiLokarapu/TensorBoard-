/* Copyright 2019 The TensorFlow Authors. All Rights Reserved.

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

/** Data-related types */

export enum DataLoadState {
  NOT_LOADED,
  LOADED,
  LOADING,
  FAILED,
}

export enum LoadFailureCode {
  UNKNOWN = 'UNKNOWN',
  NOT_FOUND = 'NOT_FOUND',
}

export interface LoadState {
  state: DataLoadState;
  // Time of last successful load. Time since epoch.
  lastLoadedTimeInMs: number | null;
  // Reason for failure of most recently completed request. This should not be
  // set if there has not been a failure or if the most recently completed
  // request was successful.
  failedCode?: LoadFailureCode;
}
