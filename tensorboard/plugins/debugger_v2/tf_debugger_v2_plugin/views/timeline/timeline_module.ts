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
  BrowserModule,
  HAMMER_GESTURE_CONFIG,
  HAMMER_LOADER,
} from '@angular/platform-browser';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {CommonModule} from '@angular/common';
import {NgModule} from '@angular/core';
import {GestureConfig} from '@angular/material';
import {MatButtonModule} from '@angular/material/button';
import {MatSliderModule} from '@angular/material/slider';

import {ExecutionDataModule} from '../execution_data/execution_data_module';
import {TimelineComponent} from './timeline_component';
import {TimelineContainer} from './timeline_container';

@NgModule({
  declarations: [TimelineComponent, TimelineContainer],
  imports: [
    BrowserAnimationsModule,
    BrowserModule,
    CommonModule,
    ExecutionDataModule,
    MatButtonModule,
    MatSliderModule,
  ],
  // TODO(cais): The following two providers are meant for the mat-slider
  // dragging to work. But the dragging is still not working, needs more
  // investigation. May be related to:
  // https://github.com/angular/components/issues/7905
  providers: [
    {
      provide: HAMMER_LOADER,
      useValue: () => new Promise(() => {}),
    },
    {provide: HAMMER_GESTURE_CONFIG, useClass: GestureConfig},
  ],
  exports: [TimelineContainer],
})
export class TimelineModule {}
