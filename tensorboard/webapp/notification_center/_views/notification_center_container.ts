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
import {Component} from '@angular/core';
import {Store} from '@ngrx/store';
import {combineLatest, Observable} from 'rxjs';
import {map, shareReplay} from 'rxjs/operators';
import {State} from '../../app_state';
import * as actions from '../_redux/notification_center_actions';
import {
  getLastReadTime,
  getNotifications,
} from '../_redux/notification_center_selectors';
import {CategoryEnum} from '../_redux/notification_center_types';
import {ViewNotificationExt} from './view_types';

const iconMap = new Map([[CategoryEnum.WHATS_NEW, 'info_outline_24px']]);

@Component({
  selector: 'notification-center',
  template: `
    <notification-center-component
      [notifications]="notificationNotes$ | async"
      [hasUnreadMessages]="hasUnreadMessages$ | async"
      (bellIconClicked)="onBellIconClicked()"
    ></notification-center-component>
  `,
})
export class NotificationCenterContainer {
  // get notificaiton and also the lastRead from store
  readonly notificationNotes$: Observable<
    ViewNotificationExt[]
  > = combineLatest([
    this.store.select(getNotifications),
    this.store.select(getLastReadTime),
  ]).pipe(
    map(([notifications, lastReadTime]) => {
      return notifications.map((notification) => {
        // calculate the read-ness of each notification
        return {
          ...notification,
          hasRead: notification.dateInMs - lastReadTime < 0,
          icon: iconMap.get(notification.category) ?? null,
        };
      });
    }),
    shareReplay()
  );
  hasUnreadMessages$ = combineLatest([
    this.store.select(getNotifications),
    this.store.select(getLastReadTime),
  ]).pipe(
    map(([notifications, lastReadTime]) => {
      for (let notification of notifications) {
        if (notification.dateInMs - lastReadTime > 0) {
          return true;
        }
      }
      return false;
    })
  );

  lastReadTime$ = this.store.select(getLastReadTime);

  constructor(private readonly store: Store<State>) {}

  onBellIconClicked() {
    this.store.dispatch(actions.notificationBellClicked());
    // update
  }
}
