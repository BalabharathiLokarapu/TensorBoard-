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
import {TestBed} from '@angular/core/testing';
import {provideMockActions} from '@ngrx/effects/testing';
import {Action, Store} from '@ngrx/store';
import {MockStore, provideMockStore} from '@ngrx/store/testing';
import {TBHttpClientTestingModule} from '../../../webapp_data_source/tb_http_client_testing';
import {Subject} from 'rxjs';

import {NpmiHttpServerDataSource} from '../data_source/npmi_data_source';
import {NpmiEffects} from '.';
import {createNpmiState} from '../testing';
import {State} from '../../../app_state';
import {DataLoadState, AnnotationListing} from '../store/npmi_types';
import {getAnnotationsLoaded} from '../store/npmi_selectors';
import * as actions from '../actions';

describe('metrics effects', () => {
  let dataSource: NpmiHttpServerDataSource;
  let effects: NpmiEffects;
  let store: MockStore<State>;
  let actions$: Subject<Action>;
  let actualActions: Action[] = [];

  beforeEach(async () => {
    actions$ = new Subject<Action>();
    actualActions = [];

    await TestBed.configureTestingModule({
      imports: [TBHttpClientTestingModule],
      providers: [
        provideMockActions(actions$),
        {
          provide: NpmiHttpServerDataSource,
        },
        NpmiEffects,
        provideMockStore({
          initialState: createNpmiState(),
        }),
      ],
    }).compileComponents();

    store = TestBed.inject<Store<State>>(Store) as MockStore<State>;
    spyOn(store, 'dispatch').and.callFake((action: Action) => {
      actualActions.push(action);
    });
    effects = TestBed.inject(NpmiEffects);
    dataSource = TestBed.inject(NpmiHttpServerDataSource);
    effects.loadData$.subscribe();
  });

  describe('load Annotations', () => {
    let fetchAnnotationsSpy: jasmine.Spy;
    let fetchAnnotationsSubject: Subject<AnnotationListing>;

    beforeEach(() => {
      fetchAnnotationsSubject = new Subject();
      fetchAnnotationsSpy = spyOn(
        dataSource,
        'fetchAnnotations'
      ).and.returnValue(fetchAnnotationsSubject);
    });

    it('loads Annotations on plugin open if data is not loaded', () => {
      store.overrideSelector(getAnnotationsLoaded, {
        state: DataLoadState.NOT_LOADED,
        lastLoadedTimeInMs: null,
      });
      store.refreshState();

      expect(fetchAnnotationsSpy).not.toHaveBeenCalled();
      expect(actualActions).toEqual([]);

      actions$.next(actions.npmiLoaded());
      fetchAnnotationsSubject.next({run_1: ['test_1', 'test_2']});

      expect(fetchAnnotationsSpy).toHaveBeenCalled();
      expect(actualActions).toEqual([
        actions.annotationsRequested(),
        actions.annotationsLoaded({annotations: {run_1: ['test_1', 'test_2']}}),
      ]);
    });
  });
});
