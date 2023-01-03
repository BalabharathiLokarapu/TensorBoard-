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

export enum ThemeValue {
  BROWSER_DEFAULT = 'browser_default',
  LIGHT = 'light',
  DARK = 'dark',
}

// When adding a new value to the enum, please implement the deserializer on
// data_source/metrics_data_source.ts.
// When editing a value of the enum, please write a backward compatible
// deserializer in tensorboard/webapp/metrics/store/metrics_reducers.ts
export enum TooltipSort {
  DEFAULT = 'default',
  ALPHABETICAL = 'alphabetical',
  ASCENDING = 'ascending',
  DESCENDING = 'descending',
  NEAREST = 'nearest',
  NEAREST_X = 'nearest_x',
  NEAREST_Y = 'nearest_Y',
}

/**
 * Global settings that the backend remembers. `declare`d so properties do not
 * get mangled or mangled differently when a version compiler changes.
 *
 * For example, ClosureCompiler can mangle property names to make the payload
 * smaller and so can `terser` (with config).
 */
export declare interface BackendSettings {
  scalarSmoothing?: number;
  tooltipSort?: TooltipSort;
  ignoreOutliers?: boolean;
  autoReload?: boolean;
  autoReloadPeriodInMs?: number;
  paginationSize?: number;
  theme?: ThemeValue;
  notificationLastReadTimeInMs?: number;
  sideBarWidthInPercent?: number;
  timeSeriesSettingsPaneOpened?: boolean;
  timeSeriesCardMinWidth?: number | null;
  stepSelectorEnabled?: boolean;
  rangeSelectionEnabled?: boolean;
  linkedTimeEnabled?: boolean;
}

/**
 * Internal representation of persistable settings. Unlike BackendSettings, this
 * interface is not `declare`d, meaning the property names can be mangled and
 * user should not use string literals to access its property value.
 */
export interface PersistableSettings {
  scalarSmoothing?: number;
  tooltipSortString?: TooltipSort;
  ignoreOutliers?: boolean;
  autoReload?: boolean;
  autoReloadPeriodInMs?: number;
  pageSize?: number;
  themeOverride?: ThemeValue;
  notificationLastReadTimeInMs?: number;
  sideBarWidthInPercent?: number;
  timeSeriesSettingsPaneOpened?: boolean;
  timeSeriesCardMinWidth?: number | null;
  stepSelectorEnabled?: boolean;
  rangeSelectionEnabled?: boolean;
  linkedTimeEnabled?: boolean;
}
