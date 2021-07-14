/* Copyright 2021 The TensorFlow Authors. All Rights Reserved.

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

/**
 * Global settings that the backend remembers. `declare`d so it does not get
 * mangled or mangled differently when compiler changes.
 */
export declare interface BackendSettings {
  scalarSmoothing?: number;
  tooltipSort?: string;
  ignoreOutliers?: boolean;
}

/**
 * Internal representation of persistable settings. Unlike BackendSettings, this
 * interface is not `declare`d, meaning the property names can be mangled and
 * user should not use string literals to access its property value.
 */
export interface PersistableSettings {
  scalarSmoothing?: number;
  tooltipSortString?: string;
  ignoreOutliers?: boolean;
}
