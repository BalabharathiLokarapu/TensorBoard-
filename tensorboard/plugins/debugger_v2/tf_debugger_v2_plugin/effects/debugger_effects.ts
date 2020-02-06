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
import {Injectable} from '@angular/core';
import {Store} from '@ngrx/store';
import {Actions, ofType, createEffect} from '@ngrx/effects';
import {
  concatMap,
  map,
  mergeMap,
  withLatestFrom,
  filter,
  tap,
} from 'rxjs/operators';
import {
  debuggerLoaded,
  debuggerRunsRequested,
  debuggerRunsLoaded,
  executionDataLoaded,
  executionDigestFocused,
  executionDigestsRequested,
  executionDigestsLoaded,
  executionScrollLeft,
  executionScrollRight,
  executionStackFramesRequested,
  numExecutionsLoaded,
  numExecutionsRequested,
  stackFramesLoaded,
} from '../actions';
import {
  getActiveRunId,
  getDebuggerRunsLoaded,
  getDisplayCount,
  getExecutionDigestsLoaded,
  getExecutionScrollBeginIndex,
  getNumExecutions,
  getNumExecutionsLoaded,
  getExecutionPageSize,
  getFocusedExecutionIndex,
  getLoadedExecutionData,
  getLoadedStackFrames,
} from '../store/debugger_selectors';
import {
  DataLoadState,
  DebuggerRunListing,
  StackFrame,
  State,
} from '../store/debugger_types';
import {Tfdbg2HttpServerDataSource} from '../data_source/tfdbg2_data_source';

/** @typehack */ import * as _typeHackRxjs from 'rxjs';
/** @typehack */ import * as _typeHackNgrxStore from '@ngrx/store/src/models';
/** @typehack */ import * as _typeHackNgrxEffects from '@ngrx/effects/effects';

/**
 * Getting page indices that are missing from the data and hence need to be
 * requested.
 *
 * @param begin Beginning item index (inclusive).
 * @param end Ending item index (exclusive).
 * @param pageSize Size of each page, i.e., how many items there are in each
 *   complete page. This must be `>= end - begin`, or an Error will be
 *   thrown.
 * @param numItems: Total number of items available from the data source.
 * @param pageLoadedSizes A map from page index to how many items have been
 *   loaded for that page so far.
 * @returns An array of the page indices that are currently missing and hence
 *   should be requested from the appropriate data source.
 */
function getMissingPages(
  begin: number,
  end: number,
  pageSize: number,
  numItems: number,
  pageLoadedSizes: {[page: number]: number}
): number[] {
  if (pageSize <= 0 || !Number.isInteger(pageSize)) {
    throw new Error(`Invalid pageSize: ${pageSize}`);
  }
  if (end > numItems) {
    throw new Error(
      `end index (${end}) exceeds total number of items (${numItems})`
    );
  }
  if (end - begin > pageSize) {
    throw new Error('begin-end span exceeds page size, which is not allowed');
  }

  // The constraint that `end - begin <= page` guarantees that at most only two
  // pages need to be requested.
  const missingPages: number[] = [];

  // Check whether the first of the two possible pages needs to be requested.
  const firstPageIndex = Math.floor(begin / pageSize);
  if (
    !(firstPageIndex in pageLoadedSizes) ||
    (pageLoadedSizes[firstPageIndex] < pageSize &&
      firstPageIndex * pageSize + pageLoadedSizes[firstPageIndex] < numItems)
  ) {
    missingPages.push(firstPageIndex);
  }

  const secondPageIndex = Math.floor((end - 1) / pageSize);
  if (secondPageIndex !== firstPageIndex) {
    const anyDigestMissing1 =
      !(secondPageIndex in pageLoadedSizes) ||
      (secondPageIndex * pageSize + pageLoadedSizes[secondPageIndex] < end &&
        end < numItems);
    if (anyDigestMissing1) {
      missingPages.push(secondPageIndex);
    }
  }

  return missingPages;
}

@Injectable()
export class DebuggerEffects {
  /**
   * Requires to be exported for JSCompiler. JSCompiler, otherwise,
   * think it is unused property and deadcode eliminate away.
   */
  /** @export */
  readonly loadRunListing$ = createEffect(() =>
    this.actions$.pipe(
      // TODO(cais): Explore consolidating this effect with the greater
      // webapp (in tensorboard/webapp), e.g., during PluginChanged actions.
      ofType(debuggerLoaded),
      withLatestFrom(this.store.select(getDebuggerRunsLoaded)),
      filter(([, {state}]) => state !== DataLoadState.LOADING),
      tap(() => this.store.dispatch(debuggerRunsRequested())),
      mergeMap(() => {
        return this.dataSource.fetchRuns().pipe(
          map(
            (runs) => {
              return debuggerRunsLoaded({runs: runs as DebuggerRunListing});
            }
            // TODO(cais): Add catchError() to pipe.
          )
        );
      })
    )
  );

  /** @export */
  readonly loadNumExecutions$ = createEffect(() =>
    this.actions$.pipe(
      ofType(debuggerRunsLoaded),
      withLatestFrom(this.store.select(getNumExecutionsLoaded)),
      filter(([props, loaded]) => {
        return (
          Object.keys(props.runs).length > 0 &&
          loaded.state !== DataLoadState.LOADING
        );
      }),
      tap(() => this.store.dispatch(numExecutionsRequested())),
      mergeMap(([props, loaded]) => {
        // TODO(cais): Handle multple runs. Currently it is assumed that there
        // is at most only one debugger run available.
        const runId = Object.keys(props.runs)[0];
        const begin = 0;
        const end = 0;
        return this.dataSource.fetchExecutionDigests(runId, begin, end).pipe(
          map((digests) => {
            return numExecutionsLoaded({numExecutions: digests.num_digests});
          })
        );
        // TODO(cais): Add catchError() to pipe.
      })
    )
  );

  /** @export */
  readonly initialExecutionDigestsLoading$ = createEffect(() =>
    this.actions$.pipe(
      ofType(numExecutionsLoaded),
      withLatestFrom(
        this.store.select(getActiveRunId),
        this.store.select(getExecutionPageSize),
        this.store.select(getExecutionDigestsLoaded)
      ),
      filter(([props, runId, _, loaded]) => {
        return (
          props.numExecutions > 0 &&
          runId !== null &&
          Object.keys(loaded.pageLoadedSizes).length === 0 &&
          loaded.state !== DataLoadState.LOADING
        );
      }),
      tap(() => {
        this.store.dispatch(executionDigestsRequested());
      }),
      mergeMap(([props, runId, pageSize, _]) => {
        const begin = 0;
        const end = Math.min(props.numExecutions, pageSize);
        return this.dataSource.fetchExecutionDigests(runId!, begin, end).pipe(
          map((digests) => {
            return executionDigestsLoaded(digests);
          })
        );
        // TODO(cais): Add catchError() to pipe.
      })
    )
  );

  /** @export */
  readonly initialExecutionFocusing$ = createEffect(() =>
    this.actions$.pipe(
      ofType(numExecutionsLoaded),
      withLatestFrom(
        this.store.select(getActiveRunId),
        this.store.select(getFocusedExecutionIndex)
      ),
      filter(([props, runId, focusIndex]) => {
        return props.numExecutions > 0 && runId !== null && focusIndex === null;
      }),
      map(() => {
        // Automatically focus on the first execution event when any
        // execution events exist.
        // TODO(cais): This should auto-focus on the first alert even
        // when any alerts exist.
        return executionDigestFocused({displayIndex: 0});
      })
    )
  );

  private readonly digestRequired$ = this.actions$.pipe(
    ofType(executionScrollLeft, executionScrollRight),
    withLatestFrom(
      this.store.select(getActiveRunId),
      this.store.select(getExecutionScrollBeginIndex),
      this.store.select(getNumExecutions),
      this.store.select(getDisplayCount),
      this.store.select(getExecutionPageSize)
    ),
    filter(([runId]) => {
      return runId !== null;
    }),
    map(
      ([_, runId, scrollBeginIndex, numExecutions, displayCount, pageSize]) => {
        const begin = scrollBeginIndex;
        const end = Math.min(numExecutions, begin + displayCount);
        return {
          runId: runId!,
          begin,
          end,
          pageSize,
        };
      }
    )
  );

  readonly missesPages$ = this.digestRequired$.pipe(
    withLatestFrom(this.store.select(getExecutionDigestsLoaded)),
    filter(([_, loaded]) => loaded.state !== DataLoadState.LOADING),
    map(([props, loaded]) => {
      return {
        props,
        loaded,
        missingPages: getMissingPages(
          props.begin,
          props.end,
          props.pageSize,
          loaded.numExecutions,
          loaded.pageLoadedSizes
        ),
      };
    }),
    filter(({missingPages}) => missingPages.length > 0)
  );

  /** @export */
  readonly loadExecutionDigests$ = createEffect(() =>
    this.missesPages$.pipe(
      tap(() => this.store.dispatch(executionDigestsRequested())),
      mergeMap(({props, loaded, missingPages}) => {
        const {runId, pageSize} = props;
        const actualBegin = missingPages[0] * pageSize;
        const actualEnd = Math.min(
          loaded.numExecutions,
          (missingPages[missingPages.length - 1] + 1) * pageSize
        );
        return this.dataSource
          .fetchExecutionDigests(runId, actualBegin, actualEnd)
          .pipe(
            map(
              (digests) => {
                return executionDigestsLoaded(digests);
              }
              // TODO(cais): Add catchError() to pipe.
            )
          );
      })
    )
  );

  /** @export */
  // when a execution digest is focused on, two requests are made
  // 1. To fetch the detailed execution data for the execution event.
  // 2. To fetch the stack trace of the execution event.
  readonly onExecutionDigestFocused$ = createEffect(() =>
    this.actions$.pipe(
      ofType(executionDigestFocused),
      withLatestFrom(
        this.store.select(getActiveRunId),
        this.store.select(getExecutionScrollBeginIndex),
        this.store.select(getLoadedExecutionData)
      ),
      filter(([focus, activeRunId, scrollBeginIndex, loadedExecutionData]) => {
        const focusIndex = scrollBeginIndex + focus.displayIndex;
        return (
          activeRunId !== null && loadedExecutionData[focusIndex] === undefined
        );
      }),
      concatMap(([focus, activeRunId, scrollBeginIndex]) => {
        const begin = scrollBeginIndex + focus.displayIndex;
        const end = begin + 1;
        return this.dataSource
          .fetchExecutionData(activeRunId!, begin, end)
          .pipe(
            tap((executionDataResponse) => {
              this.store.dispatch(executionDataLoaded(executionDataResponse));
            }),
            map((executionDataResponse) => executionDataResponse.executions[0]),
            withLatestFrom(
              this.store.select(getActiveRunId),
              this.store.select(getLoadedStackFrames)
            ),
            filter(([execution, _, loadedStackFrames]) => {
              // Determine if any of the stack frames of the stack trace is missing.
              // If so, make a request for the stack frames.
              for (const stackFrameId of execution.stack_frame_ids) {
                if (loadedStackFrames[stackFrameId] === undefined) {
                  return true;
                }
              }
              return false;
            }),
            concatMap(([execution, runId]) => {
              return this.dataSource
                .fetchStackFrames(runId!, execution.stack_frame_ids)
                .pipe(
                  map((stackFramesResponse) => {
                    const stackFramesById: {
                      [stackFrameId: string]: StackFrame;
                    } = {};
                    // TODO(cais): Do this reshaping in the backend and simplify
                    // the frontend code here.
                    for (let i = 0; i < execution.stack_frame_ids.length; ++i) {
                      stackFramesById[execution.stack_frame_ids[i]] =
                        stackFramesResponse.stack_frames[i];
                    }
                    return stackFramesLoaded({stackFrames: stackFramesById});
                  })
                );
            })
          );
        // TODO(cais): Add catchError() to pipe.
      })
    )
  );

  constructor(
    private actions$: Actions,
    private store: Store<State>,
    private dataSource: Tfdbg2HttpServerDataSource
  ) {}
}

export const TEST_ONLY = {
  getMissingPages,
};
