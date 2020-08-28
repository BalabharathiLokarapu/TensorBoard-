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
 * Unit tests for the violin filters.
 */
import {TestBed} from '@angular/core/testing';
import {By} from '@angular/platform-browser';

import {Action, Store} from '@ngrx/store';
import {State} from '../../../../app_state';
import {provideMockStore, MockStore} from '@ngrx/store/testing';

import {ViolinFiltersComponent} from './violin_filters_component';
import {ViolinFiltersContainer} from './violin_filters_container';
import {appStateFromNpmiState, createNpmiState} from '../../testing';
import {createState, createCoreState} from '../../../../core/testing';
import * as npmiActions from '../../actions';
import {getSidebarExpanded} from '../../store';

/** @typehack */ import * as _typeHackStore from '@ngrx/store';

describe('Npmi Violin Filters Container', () => {
  let store: MockStore<State>;
  let dispatchedActions: Action[];
  const css = {
    FILTERS_TOOLBAR: '.filters-toolbar',
    SIDE_TOGGLE: '.side-toggle',
    BUTTON: 'button',
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ViolinFiltersContainer, ViolinFiltersComponent],
      imports: [],
      providers: [
        provideMockStore({
          initialState: {
            ...createState(createCoreState()),
            ...appStateFromNpmiState(createNpmiState()),
          },
        }),
      ],
    }).compileComponents();
    store = TestBed.inject<Store<State>>(Store) as MockStore<State>;

    dispatchedActions = [];
    spyOn(store, 'dispatch').and.callFake((action: Action) => {
      dispatchedActions.push(action);
    });
  });

  it('renders npmi violin filters component', () => {
    const fixture = TestBed.createComponent(ViolinFiltersContainer);
    fixture.detectChanges();

    const violinFilters = fixture.debugElement.query(
      By.css(css.FILTERS_TOOLBAR)
    );
    expect(violinFilters).toBeTruthy();
  });

  it('dispatches toggle expanded action when hide button clicked', () => {
    store.overrideSelector(getSidebarExpanded, true);
    const fixture = TestBed.createComponent(ViolinFiltersContainer);
    fixture.detectChanges();

    const sideToggle = fixture.debugElement.query(By.css(css.SIDE_TOGGLE));
    expect(sideToggle).toBeTruthy();
    const hideButton = sideToggle.query(By.css(css.BUTTON));
    expect(hideButton).toBeTruthy();
    hideButton.nativeElement.click();

    expect(dispatchedActions).toEqual([
      npmiActions.npmiToggleSidebarExpanded(),
    ]);
  });
});
