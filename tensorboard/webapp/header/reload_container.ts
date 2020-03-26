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
import {Component} from '@angular/core';
import {Store, createSelector} from '@ngrx/store';
import {Observable} from 'rxjs';
import {map, withLatestFrom} from 'rxjs/operators';

import {State} from '../core/store/core_types';
import {
  getPlugins,
  getActivePlugin,
  getPluginsListLoaded,
} from '../core/store/core_selectors';
import {manualReload} from '../core/actions';
import {DataLoadState} from '../types/data';

const isReloadDiabledByPlugin = createSelector(
  getPlugins,
  getActivePlugin,
  (plugins, id) => {
    if (!id || !plugins || !plugins[id]) return false;
    return plugins[id].disable_reload;
  }
);

@Component({
  selector: 'app-header-reload',
  template: `
    <button
      class="reload-button"
      [class.loading]="isReloading$ | async"
      mat-icon-button
      (click)="triggerReload()"
      [title]="getReloadTitle(lastLoadedTimeInMs$ | async | date: 'medium')"
      [disabled]="reloadDisabled$ | async"
    >
      <mat-icon class="refresh-icon" svgIcon="refresh_24px"></mat-icon>
    </button>
  `,
  styles: [
    `
      .reload-button,
      .refresh-icon {
        align-items: center;
        display: flex;
        justify-content: center;
      }

      .reload-button.loading {
        animation: rotate 2s linear infinite;
      }

      @keyframes rotate {
        0% {
          transform: rotate(0deg);
        }
        50% {
          transform: rotate(180deg);
        }
        100% {
          transform: rotate(360deg);
        }
      }
    `,
  ],
})
export class ReloadContainer {
  readonly reloadDisabled$: Observable<boolean> = this.store.select(
    isReloadDiabledByPlugin
  );

  isReloading$: Observable<boolean> = this.store
    .select(getPluginsListLoaded)
    .pipe(
      withLatestFrom(this.reloadDisabled$),
      map(([loaded, reloadDisabled]) => {
        return !reloadDisabled && loaded.state === DataLoadState.LOADING;
      })
    );

  lastLoadedTimeInMs$: Observable<number | null> = this.store
    .select(getPluginsListLoaded)
    .pipe(
      map((loaded) => {
        return loaded.lastLoadedTimeInMs;
      })
    );

  constructor(private readonly store: Store<State>) {}

  triggerReload() {
    this.store.dispatch(manualReload());
  }

  getReloadTitle(dateString: string | null) {
    if (!dateString) {
      return 'Loading...';
    }

    return `Last Updated: ${dateString}`;
  }
}
