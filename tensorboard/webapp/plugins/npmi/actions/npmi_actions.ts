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
import {createAction, props} from '@ngrx/store';
import {
  AnnotationListing,
  MetricListing,
  ValueListing,
} from '../store/npmi_types';

// HACK: Below import is for type inference.
// https://github.com/bazelbuild/rules_nodejs/issues/1013
/** @typehack */ import * as _typeHackModels from '@ngrx/store/src/models';

/**
 * Actions for the NPMI Component.
 */
export const npmiLoaded = createAction('[NPMI] nPMI Loaded');

export const npmiUnloaded = createAction('[NPMI] nPMI Unloaded');

export const npmiAnnotationsRequested = createAction(
  '[NPMI] nPMI Annotations Requested'
);

export const npmiAnnotationsLoaded = createAction(
  '[NPMI] nPMI Annotations Loaded',
  props<{annotations: AnnotationListing}>()
);

export const npmiAnnotationsRequestFailed = createAction(
  '[NPMI] nPMI Annotations Request Failed'
);

export const npmiMetricsAndValuesRequested = createAction(
  '[NPMI] nPMI Metrics and Values Requested'
);

export const npmiMetricsAndValuesLoaded = createAction(
  '[NPMI] nPMI Metrics and Values Loaded',
  props<{metrics: MetricListing; values: ValueListing}>()
);

export const npmiMetricsAndValuesRequestFailed = createAction(
  '[NPMI] nPMI Metrics and Values Request Failed'
);
