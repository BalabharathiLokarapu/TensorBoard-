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
/**
 * Unit tests for the Main Container.
 */
import {TestBed} from '@angular/core/testing';
import {By} from '@angular/platform-browser';
import {NO_ERRORS_SCHEMA} from '@angular/core';

import {Store} from '@ngrx/store';
import {provideMockStore, MockStore} from '@ngrx/store/testing';

import {State} from '../../../../app_state';
import {getRunSelection} from './../../../../core/store/core_selectors';
import {appStateFromNpmiState, createNpmiState} from '../../testing';

import {MainComponent} from './main_component';
import {MainContainer} from './main_container';

/** @typehack */ import * as _typeHackStore from '@ngrx/store';

describe('Npmi Main Container', () => {
  let store: MockStore<State>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [MainComponent, MainContainer],
      imports: [],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [
        provideMockStore({
          initialState: appStateFromNpmiState(createNpmiState()),
        }),
      ],
    }).compileComponents();
    store = TestBed.inject<Store<State>>(Store) as MockStore<State>;
  });

  it('renders npmi main component without runs', () => {
    store.overrideSelector(getRunSelection, new Map([['run_1', false]]));
    const fixture = TestBed.createComponent(MainContainer);
    fixture.detectChanges();

    const runsElement = fixture.debugElement.query(
      By.css('tb-legacy-runs-selector')
    );
    expect(runsElement).toBeTruthy();

    const noRunsElement = fixture.debugElement.query(By.css('.noRun'));
    expect(noRunsElement).toBeTruthy();
  });

  it('renders npmi main component with run', () => {
    store.overrideSelector(getRunSelection, new Map([['run_1', true]]));
    const fixture = TestBed.createComponent(MainContainer);
    fixture.detectChanges();

    const runsElement = fixture.debugElement.query(
      By.css('tb-legacy-runs-selector')
    );
    expect(runsElement).toBeTruthy();

    const dataSelectionElement = fixture.debugElement.query(
      By.css('npmi-data-selection')
    );
    expect(dataSelectionElement).toBeTruthy();

    const noRunsElement = fixture.debugElement.query(By.css('.noRun'));
    expect(noRunsElement).toBeFalsy();
  });
});
