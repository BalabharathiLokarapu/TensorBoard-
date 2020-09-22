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
import {ChangeDetectionStrategy, Component} from '@angular/core';

@Component({
  selector: 'tensorboard-wrapper-component',
  template: `
    <app-header></app-header>
    <plugins class="plugins"></plugins>
    <reloader></reloader>
  `,
  styles: [
    `
      :host {
        display: flex;
        flex-direction: column;
        height: 100%;
      }

      app-header {
        box-shadow: 0 1px 3px 3px rgba(0, 0, 0, 0.25);
        flex: 0 0;
        z-index: 1; /* The box shadow needs to extend out of the app-header. */
      }

      .plugins {
        flex: 1 1;
        overflow: auto;
        position: relative;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TensorBoardWrapperComponent {}
