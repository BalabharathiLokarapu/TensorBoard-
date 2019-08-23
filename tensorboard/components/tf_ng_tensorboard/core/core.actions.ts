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
import {createAction, props} from '@ngrx/store';
import {PluginId, PluginsListing} from '../types/api';

// HACK: Below import is for type inference.
// https://github.com/bazelbuild/rules_nodejs/issues/1013
import * as _typeHackModels from '@ngrx/store/src/models';

export const changePlugin = createAction(
  '[CORE] CHANGE_PLUGIN',
  props<{plugin: PluginId}>()
);

export const coreLoaded = createAction('[CORE] LOADED');

export const pluginsListingLoaded = createAction(
  '[CORE] FETCH_PLUGINS_LISTING_SUCCESSFUL',
  props<{plugins: PluginsListing}>()
);
export const pluginsListingFailed = createAction(
  '[CORE] FETCH_PLUGINS_LISTING_FAILED'
);
