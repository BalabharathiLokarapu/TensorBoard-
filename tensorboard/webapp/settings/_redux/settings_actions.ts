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
import {createAction, props} from '@ngrx/store';

import {TooltipSort} from '../../metrics/types';

/** @typehack */ import * as _typeHackModels from '@ngrx/store/src/models';

export const tooltipSortChanged = createAction(
  '[Settings] Global TimeSeries Tooltip Sort Setting Changed',
  props<{sort: TooltipSort}>()
);

export const scalarSmoothingChanged = createAction(
  '[Settings] Global TimeSeries Scalar Smoothing Setting Changed',
  props<{smoothing: number}>()
);

export const ignoreOutliersToggled = createAction(
  '[Settings] Global TimeSeries Ignore Outlier Setting Toggled'
);
