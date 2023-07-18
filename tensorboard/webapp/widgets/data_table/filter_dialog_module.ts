/* Copyright 2023 The TensorFlow Authors. All Rights Reserved.

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

import {NgModule} from '@angular/core';
import {FilterDialog} from './filter_dialog';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {MatButtonModule} from '@angular/material/button';
import {MatCheckboxModule} from '@angular/material/checkbox';
import {RangeInputModule} from '../range_input/range_input_module';
import {FilterInputModule} from '../filter_input/filter_input_module';

@NgModule({
  declarations: [FilterDialog],
  imports: [
    CommonModule,
    MatButtonModule,
    MatCheckboxModule,
    FormsModule,
    FilterInputModule,
    RangeInputModule,
  ],
  exports: [FilterDialog],
})
export class FilterDialogModule {}
