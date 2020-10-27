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
import {Action, Store} from '@ngrx/store';
import {Observable} from 'rxjs';

/**
 * An alert structure used when creating newly reported alerts.
 */
export interface AlertReport {
  /**
   * Localized text describing the alert.
   */
  localizedMessage: string;

  followupAction?: {
    /**
     * Localized name of a followup action.
     */
    localizedLabel: string;

    /**
     * A factory that defines how to create the followup action. At the time
     * when the followup action is requested, the Observable is subscribed to,
     * and the resulting action is dispatched.
     *
     * Note: clients do not need to subscribe to this observable, but they
     * should ensure that it completes after 1 emission (e.g. take(1)).
     */
    getFollowupAction$: (store: Store) => Observable<Action>;
  };
}

/**
 * An alert exposed by the feature's selectors.
 */
export type AlertInfo = AlertReport & {created: number};
