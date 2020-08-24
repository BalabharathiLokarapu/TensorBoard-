/* Copyright 2020 The TensorFlow Authors. All Rights Reserved.

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
import {
  NpmiState,
  DataLoadState,
  NPMI_FEATURE_KEY,
  State,
  SortingOrder,
} from '../store/npmi_types';

export function createNpmiState(override?: Partial<NpmiState>): NpmiState {
  return {
    pluginDataLoaded: {
      state: DataLoadState.NOT_LOADED,
      lastLoadedTimeInMs: null,
    },
    annotationData: {},
    runToMetrics: {},
    selectedAnnotations: [],
    flaggedAnnotations: [],
    hiddenAnnotations: [],
    annotationsRegex: '',
    metricsRegex: '',
    metricArithmetic: [],
    metricFilters: {},
    sorting: {
      metric: '',
      order: SortingOrder.DOWN,
    },
    pcExpanded: true,
    annotationsExpanded: true,
    sidebarExpanded: true,
    showCounts: true,
    showHiddenAnnotations: false,
    sidebarWidth: 300,
    ...override,
  };
}

export function createState(npmiState: NpmiState): State {
  return {[NPMI_FEATURE_KEY]: npmiState};
}

export function appStateFromNpmiState(metricsState?: NpmiState): State {
  return {
    [NPMI_FEATURE_KEY]: metricsState || createNpmiState(),
  };
}
