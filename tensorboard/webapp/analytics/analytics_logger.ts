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

export abstract class AnalyticsLogger {
  sendPageView(plugin: string) {}
}

// We fake the global 'ga' object, so the object is a noop. The
// google.analytics typing gives the object a type of UniversalAnalytics.ga.
// We do not track open source users.
declare const ga: Function;

@Injectable()
export class GoogleAnalyticsLogger implements AnalyticsLogger {
  sendPageView(plugin: string) {
    let pathname = window.location.pathname;
    pathname += pathname.endsWith('/') ? plugin : '/' + plugin;
    ga('set', 'page', pathname);
    ga('send', 'pageview');
  }
}
