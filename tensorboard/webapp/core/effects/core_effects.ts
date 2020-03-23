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
import {Action, Store} from '@ngrx/store';
import {Actions, ofType, createEffect} from '@ngrx/effects';
import {Observable, of, zip} from 'rxjs';
import {
  map,
  mergeMap,
  catchError,
  withLatestFrom,
  filter,
  tap,
} from 'rxjs/operators';
import {
  coreLoaded,
  manualReload,
  reload,
  pluginsListingRequested,
  pluginsListingLoaded,
  pluginsListingFailed,
} from '../actions';
import {getPluginsListLoaded} from '../store';
import {DataLoadState} from '../../types/data';
import {TBServerDataSource} from '../../webapp_data_source/tb_server_data_source';
import {getEnabledExperimentalPlugins} from '../../feature_flag/store/feature_flag_selectors';
import {State} from '../../app_state';

/** @typehack */ import * as _typeHackRxjs from 'rxjs';
/** @typehack */ import * as _typeHackNgrx from '@ngrx/store/src/models';
/** @typehack */ import * as _typeHackNgrxEffects from '@ngrx/effects';

@Injectable()
export class CoreEffects {
  /**
   * Requires to be exported for JSCompiler. JSCompiler, otherwise,
   * think it is unused property and deadcode eliminate away.
   */
  /** @export */
  readonly loadPluginsListing$ = createEffect(() =>
    this.actions$.pipe(
      ofType(coreLoaded, reload, manualReload),
      withLatestFrom(
        this.store.select(getPluginsListLoaded),
        this.store.select(getEnabledExperimentalPlugins)
      ),
      filter(([, {state}]) => state !== DataLoadState.LOADING),
      tap(() => this.store.dispatch(pluginsListingRequested())),
      mergeMap(([, , enablesExperimentalPlugins]) => {
        return zip(
          this.webappDataSource.fetchPluginsListing(enablesExperimentalPlugins),
          this.webappDataSource.fetchRuns(),
          this.webappDataSource.fetchEnvironments()
        ).pipe(
          map(([plugins]) => {
            return pluginsListingLoaded({plugins});
          }, catchError(() => of(pluginsListingFailed())))
        ) as Observable<Action>;
      })
    )
  );

  constructor(
    private actions$: Actions,
    private store: Store<State>,
    private webappDataSource: TBServerDataSource
  ) {}
}
