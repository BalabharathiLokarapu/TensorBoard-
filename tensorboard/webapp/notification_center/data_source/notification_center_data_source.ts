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
import {Injectable} from '@angular/core';
import {Observable} from 'rxjs';
import {map} from 'rxjs/operators';
import {TBHttpClient} from '../../webapp_data_source/tb_http_client';
import {
  BackendNotificationRequest,
  BackendNotificationResponse,
} from './notification_center_backend_types';
import {NotificationCenterDataSource} from './types';

/**
 * An implementation of NotificationCenterDataSource that treats RunIds as identifiers
 * containing run name and experimentId.
 */
@Injectable()
export class TBNotificationCenterDataSource
  implements NotificationCenterDataSource {
  constructor(private readonly http: TBHttpClient) {}

  private fetchNotificationBackendRequest(
    backendRequest: BackendNotificationRequest
  ): Observable<{response: BackendNotificationResponse}> {
    const body = new FormData();
    body.append('requests', JSON.stringify([backendRequest]));
    return this.http
      .post<BackendNotificationResponse[]>(`/notifications`, body)
      .pipe(
        map((responses: BackendNotificationResponse[]) => {
          return {response: responses[0]};
        })
      );
  }
}
