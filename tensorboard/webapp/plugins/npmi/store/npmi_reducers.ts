import {MetricListing, ValueListing, SummaryListing} from './npmi_types';
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

import * as actions from '../actions';
import {NPMIState, DataLoadState} from './npmi_types';

// HACK: These imports are for type inference.
// https://github.com/bazelbuild/rules_nodejs/issues/1013
/** @typehack */ import * as _typeHackStore from '@ngrx/store/store';

const initialState: NPMIState = {
  annotationsData: {},
  annotationsLoaded: {
    state: DataLoadState.NOT_LOADED,
    lastLoadedTimeInMs: null,
  },
  metricsData: {},
  countMetricsData: {},
  npmiMetricsData: {},
  metricsLoaded: {
    state: DataLoadState.NOT_LOADED,
    lastLoadedTimeInMs: null,
  },
  valuesData: {},
  countValuesData: {},
  npmiValuesData: {},
  valuesLoaded: {
    state: DataLoadState.NOT_LOADED,
    lastLoadedTimeInMs: null,
  },
  countData: {},
};

const reducer = createReducer(
  initialState,
  on(
    actions.annotationsRequested,
    (state: NPMIState): NPMIState => {
      return {
        ...state,
        annotationsLoaded: {
          ...state.annotationsLoaded,
          state: DataLoadState.LOADING,
        },
      };
    }
  ),
  on(
    actions.annotationsRequestFailed,
    (state: NPMIState): NPMIState => {
      return {
        ...state,
        annotationsLoaded: {
          ...state.annotationsLoaded,
          state: DataLoadState.FAILED,
        },
      };
    }
  ),
  on(
    actions.annotationsLoaded,
    (state: NPMIState, {annotations}): NPMIState => {
      return {
        ...state,
        annotationsData: annotations,
        annotationsLoaded: {
          state: DataLoadState.LOADED,
          lastLoadedTimeInMs: Date.now(),
        },
      };
    }
  ),
  on(
    actions.metricsRequested,
    (state: NPMIState): NPMIState => {
      return {
        ...state,
        metricsLoaded: {
          ...state.metricsLoaded,
          state: DataLoadState.LOADING,
        },
      };
    }
  ),
  on(
    actions.metricsRequestFailed,
    (state: NPMIState): NPMIState => {
      return {
        ...state,
        metricsLoaded: {
          ...state.metricsLoaded,
          state: DataLoadState.FAILED,
        },
      };
    }
  ),
  on(
    actions.metricsLoaded,
    (state: NPMIState, {metrics}): NPMIState => {
      let countMetricsData: MetricListing = {};
      let npmiMetricsData: MetricListing = {};
      let probMetricsData: MetricListing = {};
      for (let key in metrics) {
        countMetricsData[key] = [];
        npmiMetricsData[key] = [];
        probMetricsData[key] = [];
        for (let value of metrics[key]) {
          if (value.startsWith('count@')) {
            countMetricsData[key].push(value);
          } else if (value.startsWith('nPMI')) {
            npmiMetricsData[key].push(value);
          } else if (value.startsWith('prob')) {
            probMetricsData[key].push(value);
          }
        }
      }
      return {
        ...state,
        metricsData: metrics,
        countMetricsData: countMetricsData,
        npmiMetricsData: npmiMetricsData,
        metricsLoaded: {
          state: DataLoadState.LOADED,
          lastLoadedTimeInMs: Date.now(),
        },
      };
    }
  ),
  on(
    actions.valuesRequested,
    (state: NPMIState): NPMIState => {
      return {
        ...state,
        valuesLoaded: {
          ...state.valuesLoaded,
          state: DataLoadState.LOADING,
        },
      };
    }
  ),
  on(
    actions.valuesRequestFailed,
    (state: NPMIState): NPMIState => {
      return {
        ...state,
        valuesLoaded: {
          ...state.valuesLoaded,
          state: DataLoadState.FAILED,
        },
      };
    }
  ),
  on(
    actions.valuesLoaded,
    (state: NPMIState, {values, metrics}): NPMIState => {
      let countValuesData: ValueListing = {};
      let npmiValuesData: ValueListing = {};
      let probValuesData: ValueListing = {};
      let countData: SummaryListing = {};
      for (let key in values) {
        countValuesData[key] = [];
        npmiValuesData[key] = [];
        probValuesData[key] = [];
        countData[key] = [];
        for (let row of values[key]) {
          let countRow = [];
          let npmiRow = [];
          let probRow = [];
          for (let index in metrics[key]) {
            if (metrics[key][index].startsWith('count@')) {
              countRow.push(row[index]);
            } else if (metrics[key][index] === 'count') {
              countData[key].push(row[index]);
            } else if (metrics[key][index].startsWith('nPMI')) {
              npmiRow.push(row[index]);
            } else if (metrics[key][index].startsWith('prob')) {
              probRow.push(row[index]);
            }
          }
          countValuesData[key].push(countRow);
          npmiValuesData[key].push(npmiRow);
          probValuesData[key].push(probRow);
        }
      }
      return {
        ...state,
        valuesData: values,
        countValuesData: countValuesData,
        npmiValuesData: npmiValuesData,
        valuesLoaded: {
          state: DataLoadState.LOADED,
          lastLoadedTimeInMs: Date.now(),
        },
        countData: countData,
      };
    }
  )
);

export function reducers(state: NPMIState, action: Action) {
  return reducer(state, action);
}
