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
import {Action, createReducer, on} from '@ngrx/store';

import * as actions from '../actions/feature_flag_actions';
import {initialState} from './feature_flag_store_config_provider';
import {FeatureFlagState} from './feature_flag_types';

/** @typehack */ import * as _typeHackStore from '@ngrx/store';

const reducer = createReducer<FeatureFlagState>(
  initialState,
  on(actions.partialFeatureFlagsLoaded, (state, {features}) => {
    // Feature flag values have been loaded from a data source. Override current
    // flags with any values specified by the data source and leave values for
    // unspecified properties unchanged.
    return {
      ...state,
      isFeatureFlagsLoaded: true,
      features: {
        ...state.features,
        ...features,
      },
    };
  })
);

export function reducers(state: FeatureFlagState | undefined, action: Action) {
  return reducer(state, action);
}
