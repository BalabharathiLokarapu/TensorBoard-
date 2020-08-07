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
import {TextState, State, TEXT_FEATURE_KEY} from './text_types';

import {StepDatum} from '../data_source';

// HACK: These imports are for type inference.
// https://github.com/bazelbuild/rules_nodejs/issues/1013
/** @typehack */ import * as _typeHackSelector from '@ngrx/store/src/selector';
/** @typehack */ import * as _typeHackStore from '@ngrx/store/store';

const selectTextState = createFeatureSelector<State, TextState>(
  TEXT_FEATURE_KEY
);

export const getTextRunToTags = createSelector(
  selectTextState,
  (state: TextState) => state.runToTags
);

export const getTextData = createSelector(
  selectTextState,
  (state: TextState, props: {run: string; tag: string}): StepDatum[] | null => {
    // Refactor to `state.data.get(props.run)?.get(props.tag) || null` when prettier
    // supports TypeScript 3.8 (prettier 2.x).
    const tagToSteps = state.data.get(props.run);
    if (!tagToSteps) {
      return null;
    }

    return tagToSteps.get(props.tag) || null;
  }
);
