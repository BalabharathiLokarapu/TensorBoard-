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
import {Component} from '@angular/core';
import {Store, select} from '@ngrx/store';

import {
  getReloadEnabled,
  getReloadPeriodInMs,
  getPageSize,
} from '../_redux/settings_selectors';
import {State} from '../_redux/settings_types';
import {
  toggleReloadEnabled,
  // changeReloadPeriod,
  // changePageSize,
} from '../_redux/settings_actions';

/** @typehack */ import * as _typeHackRxjs from 'rxjs';

@Component({
  selector: 'settings-dialog',
  template: `
    <settings-dialog-component
      [reloadEnabled]="reloadEnabled$ | async"
      [reloadPeriodInMs]="reloadPeriodInMs$ | async"
      [pageSize]="pageSize$ | async"
      (reloadToggled)="onReloadToggled()"
      (reloadPeriodInMsChanged)="onReloadPeriodInMsChanged()"
      (pageSizeChanged)="onPageSizeChanged()"
    ></settings-dialog-component>
  `,
})
export class SettingsDialogContainer {
  readonly reloadEnabled$ = this.store.pipe(select(getReloadEnabled));
  readonly getReloadPeriodInMs$ = this.store.pipe(select(getReloadPeriodInMs));
  readonly pageSize$ = this.store.pipe(select(getPageSize));

  constructor(private store: Store<State>) {}

  onReloadToggled(): void {
    this.store.dispatch(toggleReloadEnabled());
  }

  onReloadPeriodInMsChanged(event: unknown): void {
    debugger;
    // this.store.dispatch(changeReloadPeriod());
  }

  onPageSizeChanged(event: unknown): void {
    debugger;
    // this.store.dispatch(changePageSize());
  }
}
