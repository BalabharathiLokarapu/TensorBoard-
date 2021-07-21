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
import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
} from '@angular/core';
import {MatDialogRef} from '@angular/material/dialog';
import {Run} from '../../store/runs_types';

const INPUT_CHANGE_DEBOUNCE_INTERVAL_MS = 500;

function debounce(func: Function, timeout = INPUT_CHANGE_DEBOUNCE_INTERVAL_MS){
  let timer: number;
  return () => {
    clearTimeout(timer);
    timer = setTimeout(() => { func(); }, timeout);
  };
}

@Component({
  selector: 'regex-edit-dialog-component',
  templateUrl: 'regex_edit_dialog.ng.html',
  styleUrls: ['regex_edit_dialog_component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RegexEditDialogComponent {
  @Input() regexString!: string;
  @Input() colorRunsMap!: [string, Run[]][];

  @Output() onSave = new EventEmitter<string>();
  @Output() regexInputOnChange = new EventEmitter<string>();

  constructor(
    public readonly dialogRef: MatDialogRef<RegexEditDialogComponent>
  ) {}

  onEnter(regexString: string) {
    this.onSaveClick(regexString);
    this.dialogRef.close();
  }

  onSaveClick(regexString: string) {
    this.onSave.emit(regexString);
  }

  fillExample(regexExample: string): void {
    this.regexString = regexExample;
  }

  regexInputChange(regexString: string) {
    debounce(() => this.regexInputOnChange.emit(regexString))();
  }
}
