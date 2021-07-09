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

// HACK: Below import is for type inference.
// https://github.com/bazelbuild/rules_nodejs/issues/1013
/** @typehack */ import * as _typeHackModels from '@ngrx/store/src/models';
import {Settings} from './settings_types';

/**
 * Action for when user wants to enable/disable reload.
 */
export const toggleReloadEnabled = createAction(
  '[Settings] Reload Enable Toggled'
);

/**
 * Action for when user wants to change the reload period.
 */
export const changeReloadPeriod = createAction(
  '[Settings] Reload Period Change',
  props<{periodInMs: number}>()
);

/**
 * Action for when user wants to an item count in a page of a paginated view.
 */
export const changePageSize = createAction(
  '[Settings] Page Size Change',
  props<{size: number}>()
);

/**
 * Action dispatched by app when it requests saved settings.
 */
export const fetchSavedSettingsRequested = createAction(
  '[Settings] Fetch Saved Settings Requested'
);

/**
 * Action dispatched by app when request for saved settings succeeds.
 */
export const fetchSavedSettingsSucceeded = createAction(
  '[Settings] Fetch Saved Settings Succeeded',
  props<{savedSettings: Partial<Settings>}>()
);

/**
 * Action dispatched by app when request for saved settings fails.
 */
export const fetchSavedSettingsFailed = createAction(
  '[Settings] Fetch Saved Settings Failed'
);
