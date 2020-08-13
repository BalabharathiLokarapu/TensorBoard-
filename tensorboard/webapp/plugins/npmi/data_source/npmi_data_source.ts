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
import {
  AnnotationListing,
  MetricListing,
  ValueListing,
} from './../store/npmi_types';
import {Injectable} from '@angular/core';
import {Observable, forkJoin} from 'rxjs';
import {TBHttpClient} from '../../../webapp_data_source/tb_http_client';

/** @typehack */ import * as _typeHackRxjs from 'rxjs';

export abstract class NpmiDataSource {
  abstract fetchData(): Observable<
    [AnnotationListing, MetricListing, ValueListing]
  >;
}

@Injectable()
export class NpmiHttpServerDataSource implements NpmiDataSource {
  private readonly httpPathPrefix = 'data/plugin/npmi';

  constructor(private readonly http: TBHttpClient) {}

  fetchData() {
    return forkJoin(
      this.fetchAnnotations(),
      this.fetchMetrics(),
      this.fetchValues()
    );
  }

  private fetchAnnotations() {
    return this.http.get<AnnotationListing>(
      this.httpPathPrefix + '/annotations'
    );
  }

  private fetchMetrics() {
    return this.http.get<MetricListing>(this.httpPathPrefix + '/metrics');
  }

  private fetchValues() {
    return this.http.get<ValueListing>(this.httpPathPrefix + '/values');
  }
}
