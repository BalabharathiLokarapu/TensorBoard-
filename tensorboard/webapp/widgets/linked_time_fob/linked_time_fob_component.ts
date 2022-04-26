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
  ElementRef,
  EventEmitter,
  Input,
  Output,
  SimpleChanges,
  ViewChild,
} from '@angular/core';

@Component({
  selector: 'linked-time-fob',
  templateUrl: 'linked_time_fob_component.ng.html',
  styleUrls: ['linked_time_fob_component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LinkedTimeFobComponent {
  @ViewChild('stepSpan', {static: true, read: ElementRef})
  private readonly stepSpan!: ElementRef<HTMLInputElement>;

  @Input() step!: number;

  @Output() stepChange = new EventEmitter<number>();
  @Output() stepRemoved = new EventEmitter();

  ngOnChanges(changes: SimpleChanges) {
    if (changes['step']) {
      this.stepSpan.nativeElement.innerHTML = `${this.step}`;
    }
  }

  validateStep(event: KeyboardEvent) {
    const charcode = String.fromCharCode(event.which);
    // Handles space separately because the charcode is 32, which is converted to 0 in Number().
    if (event.key === ' ' || isNaN(Number(charcode))) event.preventDefault();
  }

  stepTyped(event: InputEvent) {
    event.preventDefault();
    const stepString = (event.target! as HTMLInputElement).innerText;

    if (stepString === '') {
      this.stepRemoved.emit();
      return;
    }
    this.stepChange.emit(Number(stepString));
  }
}
