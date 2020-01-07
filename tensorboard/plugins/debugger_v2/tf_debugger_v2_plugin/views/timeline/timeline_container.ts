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
import {ChangeDetectionStrategy, Component, OnInit} from '@angular/core';
import {select, Store, createSelector} from '@ngrx/store';

import {State} from '../../store/debugger_types';
import {
  alertsViewLoaded,
  requestExecutionDigests,
  executionScrollLeft,
  executionScrollRight,
} from '../../actions';
import {
  getActiveRunId,
  getDisplayCount,
  getNumExecutionsLoaded,
  getNumExecutions,
  getExecutionPageSize,
  getExecutionScrollBeginIndex,
  getVisibleExecutionDigests,
} from '../../store';
import {DataLoadState, ExecutionDigest} from '../../store/debugger_types';
import {ExecutionDigestForDisplay} from './timeline_component';

/** @typehack */ import * as _typeHackRxjs from 'rxjs';

const FUNCTION_OP_TYPE_PREFIXES: string[] = [
  '__forward_',
  '__backward_',
  '__inference_',
];

/**
 * Get a display version of the execution digest.
 * @param executionDigest
 * @param strLen
 */
export function getExecutionDigestForDisplay(
  executionDigest: ExecutionDigest | null,
  strLen = 1
): ExecutionDigestForDisplay {
  if (!executionDigest) {
    // The execution digest at this index hasn't been loaded from the data source.
    return {
      op_type: '(N/A)',
      short_op_type: '..',
      is_graph: false,
    };
  }
  const functionPrefixes = FUNCTION_OP_TYPE_PREFIXES.filter((prefix) =>
    executionDigest.op_type.startsWith(prefix)
  );
  if (functionPrefixes.length) {
    // This is the execution of a tf.function (FuncGraph).
    const functionNameWithSuffix = executionDigest.op_type.slice(
      functionPrefixes[0].length
    );
    return {
      op_type: executionDigest.op_type,
      short_op_type: functionNameWithSuffix.slice(0, strLen),
      is_graph: true,
    };
  } else {
    return {
      op_type: executionDigest.op_type,
      short_op_type: executionDigest.op_type.slice(0, strLen),
      is_graph: false,
    };
  }
}

@Component({
  selector: 'tf-debugger-v2-timeline',
  template: `
    <timeline-component
      [activeRunId]="activeRunId$ | async"
      [loadingNumExecutions]="loadingNumExecutions$ | async"
      [numExecutions]="numExecutions$ | async"
      [scrollBeginIndex]="scrollBeginIndex$ | async"
      [pageSize]="pageSize$ | async"
      [displayCount]="displayCount$ | async"
      [displayExecutionDigests]="displayExecutionDigests$ | async"
      (onRequestExecutionDigests)="onRequestExecutionDigests($event)"
      (onNavigateLeft)="onNavigateLeft()"
      (onNavigateRight)="onNavigateRight()"
    ></timeline-component>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TimelineContainer implements OnInit {
  readonly activeRunId$ = this.store.pipe(select(getActiveRunId));

  readonly loadingNumExecutions$ = this.store.pipe(
    select(
      createSelector(
        getNumExecutionsLoaded,
        (loaded) => {
          return loaded.state == DataLoadState.LOADING;
        }
      )
    )
  );

  readonly scrollBeginIndex$ = this.store.pipe(
    select(getExecutionScrollBeginIndex)
  );

  readonly pageSize$ = this.store.pipe(select(getExecutionPageSize));

  readonly displayCount$ = this.store.pipe(select(getDisplayCount));

  readonly displayExecutionDigests$ = this.store.pipe(
    select(
      createSelector(
        getVisibleExecutionDigests,
        (visibleDigests) => {
          return visibleDigests.map((digest) =>
            getExecutionDigestForDisplay(digest)
          );
        }
      )
    )
  );

  readonly numExecutions$ = this.store.pipe(select(getNumExecutions));

  constructor(private readonly store: Store<State>) {}

  ngOnInit(): void {
    this.store.dispatch(alertsViewLoaded());
  }

  onRequestExecutionDigests(specs: {
    runId: string;
    begin: number;
    end: number;
    pageSize: number;
  }) {
    this.store.dispatch(requestExecutionDigests(specs));
  }

  onNavigateLeft() {
    this.store.dispatch(executionScrollLeft());
  }

  onNavigateRight() {
    this.store.dispatch(executionScrollRight());
  }
}
