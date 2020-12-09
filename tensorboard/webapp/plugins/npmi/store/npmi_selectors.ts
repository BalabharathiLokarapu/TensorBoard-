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
import {createSelector, createFeatureSelector} from '@ngrx/store';
import {
  NPMI_FEATURE_KEY,
  NpmiState,
  LoadState,
  AnnotationDataListing,
  MetricListing,
  State,
  ArithmeticElement,
  MetricFilterListing,
  AnnotationSort,
} from './npmi_types';

// HACK: These imports are for type inference.
// https://github.com/bazelbuild/rules_nodejs/issues/1013

/** @typehack */ import * as _typeHackStore from '@ngrx/store';

const selectNpmiState = createFeatureSelector<State, NpmiState>(
  NPMI_FEATURE_KEY
);

export const getPluginDataLoaded = createSelector(
  selectNpmiState,
  (state: NpmiState): LoadState => {
    return state.pluginDataLoaded;
  }
);

export const getAnnotationData = createSelector(
  selectNpmiState,
  (state: NpmiState): AnnotationDataListing => {
    return state.annotationData;
  }
);

export const getRunToMetrics = createSelector(
  selectNpmiState,
  (state: NpmiState): MetricListing => {
    return state.runToMetrics;
  }
);

export const getSelectedAnnotations = createSelector(
  selectNpmiState,
  (state: NpmiState): string[] => {
    return state.selectedAnnotations;
  }
);

export const getFlaggedAnnotations = createSelector(
  selectNpmiState,
  (state: NpmiState): string[] => {
    return state.flaggedAnnotations;
  }
);

export const getHiddenAnnotations = createSelector(
  selectNpmiState,
  (state: NpmiState): string[] => {
    return state.hiddenAnnotations;
  }
);

export const getAnnotationsRegex = createSelector(
  selectNpmiState,
  (state: NpmiState): string => {
    return state.annotationsRegex;
  }
);

export const getMetricsRegex = createSelector(
  selectNpmiState,
  (state: NpmiState): string => {
    return state.metricsRegex;
  }
);

export const getMetricArithmetic = createSelector(
  selectNpmiState,
  (state: NpmiState): ArithmeticElement[] => {
    return state.metricArithmetic;
  }
);

export const getMetricFilters = createSelector(
  selectNpmiState,
  (state: NpmiState): MetricFilterListing => {
    return state.metricFilters;
  }
);

export const getAnnotationSort = createSelector(
  selectNpmiState,
  (state: NpmiState): AnnotationSort => {
    return state.sort;
  }
);

export const getPCExpanded = createSelector(
  selectNpmiState,
  (state: NpmiState): boolean => {
    return state.pcExpanded;
  }
);

export const getAnnotationsExpanded = createSelector(
  selectNpmiState,
  (state: NpmiState): boolean => {
    return state.annotationsExpanded;
  }
);

export const getSidebarExpanded = createSelector(
  selectNpmiState,
  (state: NpmiState): boolean => {
    return state.sidebarExpanded;
  }
);

export const getShowCounts = createSelector(
  selectNpmiState,
  (state: NpmiState): boolean => {
    return state.showCounts;
  }
);

export const getShowHiddenAnnotations = createSelector(
  selectNpmiState,
  (state: NpmiState): boolean => {
    return state.showHiddenAnnotations;
  }
);

export const getSidebarWidth = createSelector(
  selectNpmiState,
  (state: NpmiState): number => {
    return state.sidebarWidth;
  }
);
