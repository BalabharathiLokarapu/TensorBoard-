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
import {ChangeDetectionStrategy, Component, Input} from '@angular/core';
import {Store} from '@ngrx/store';
import {Observable} from 'rxjs';

import {State} from '../../../app_state';
import {getEnabledColorGroupByRegex} from '../../../selectors';
import {runGroupByChanged} from '../../actions';
import {getRunGroupBy} from '../../store/runs_selectors';
import {GroupBy} from '../../types';

/**
 * Renders run grouping menu controls.
 */
@Component({
  selector: 'runs-group-menu-button',
  template: `
    <runs-group-menu-button-component
      [selectedGroupBy]="selectedGroupBy$ | async"
      [showGroupByRegex]="showGroupByRegex$ | async"
      (onGroupByChange)="onGroupByChange($event)"
    ></runs-group-menu-button-component>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RunsGroupMenuButtonContainer {
  showGroupByRegex$: Observable<boolean> = this.store.select(
    getEnabledColorGroupByRegex
  );

  @Input() experimentIds!: string[];

  constructor(private readonly store: Store<State>) {}

  readonly selectedGroupBy$: Observable<GroupBy> = this.store.select(
    getRunGroupBy
  );

  onGroupByChange(groupBy: GroupBy) {
    this.store.dispatch(
      runGroupByChanged({
        experimentIds: this.experimentIds,
        groupBy,
      })
    );
  }
}
