/* Copyright 2022 The TensorFlow Authors. All Rights Reserved.

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
  ViewChild,
} from '@angular/core';
import {ScaleLinear, ScaleTime} from '../../third_party/d3';
import {FobCardAdapter} from './types';
import {LinkedTime} from './linked_time_types';

export enum AxisDirection {
  HORIZONTAL,
  VERTICAL,
}

export enum Fob {
  NONE,
  START,
  END,
}

type TemporalScale = ScaleLinear<number, number> | ScaleTime<number, number>;
@Component({
  selector: 'linked-time-fob-controller',
  templateUrl: 'linked_time_fob_controller_component.ng.html',
  styleUrls: ['linked_time_fob_controller_component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LinkedTimeFobControllerComponent {
  @ViewChild('axisOverlay') private readonly axisOverlay!: ElementRef;
  @ViewChild('startFobWrapper') readonly startFobWrapper!: ElementRef;
  @ViewChild('endFobWrapper') readonly endFobWrapper!: ElementRef;
  @Input() axisDirection!: AxisDirection;
  @Input() linkedTime!: LinkedTime;
  @Input() cardAdapter!: FobCardAdapter;
  @Output() onSelectTimeChanged = new EventEmitter<LinkedTime>();

  private currentDraggingFob: Fob = Fob.NONE;

  // Helper function to check enum in template.
  public FobType(): typeof Fob {
    return Fob;
  }

  getCssTranslatePx(step: number): string {
    if (this.axisDirection === AxisDirection.VERTICAL) {
      return `translate(0px, ${this.cardAdapter.stepToPixel(step, [
        0,
        this.axisOverlay?.nativeElement.getBoundingClientRect().height || 10,
      ])}px)`;
    }

    return `translate(${this.cardAdapter.stepToPixel(step, [
      0,
      this.axisOverlay?.nativeElement.getBoundingClientRect().width || 10,
    ])}px, 0px)`;
  }

  startDrag(fob: Fob) {
    this.currentDraggingFob = fob;

    if (this.currentDraggingFob === Fob.START && this.linkedTime.end !== null) {
      this.cardAdapter.setBounds({higherOverride: this.linkedTime.end.step});
    }

    if (this.currentDraggingFob === Fob.END) {
      this.cardAdapter.setBounds({lowerOverride: this.linkedTime.start.step});
    }
  }

  stopDrag() {
    this.currentDraggingFob = Fob.NONE;
    this.cardAdapter.setBounds({});
  }

  mouseMove(event: MouseEvent) {
    if (this.currentDraggingFob === Fob.NONE) return;

    let newLinkedTime = this.linkedTime;
    let newStep: number;
    if (this.isDraggingHigher(event.clientY, event.movementY)) {
      newStep = this.cardAdapter.getStepHigherThanMousePosition(event.clientY);
    } else if (this.isDraggingLower(event.clientY, event.movementY)) {
      newStep = this.cardAdapter.getStepLowerThanMousePosition(event.clientY);
    } else {
      return;
    }

    if (this.currentDraggingFob === Fob.END) {
      newLinkedTime.end!.step = newStep;
    } else {
      newLinkedTime.start.step = newStep;
    }
    this.onSelectTimeChanged.emit(newLinkedTime);
  }

  isDraggingLower(position: number, movement: number): boolean {
    return (
      position < this.getDraggingFobTop() &&
      movement < 0 &&
      this.getDraggingFobStep() > this.cardAdapter.lowerBound
    );
  }

  isDraggingHigher(position: number, movement: number): boolean {
    return (
      position > this.getDraggingFobTop() &&
      movement > 0 &&
      this.getDraggingFobStep() < this.cardAdapter.upperBound
    );
  }

  getDraggingFobTop(): number {
    return this.currentDraggingFob !== Fob.END
      ? this.startFobWrapper.nativeElement.getBoundingClientRect().top
      : this.endFobWrapper.nativeElement.getBoundingClientRect().top;
  }

  getDraggingFobStep(): number {
    return this.currentDraggingFob !== Fob.END
      ? this.linkedTime!.start.step
      : this.linkedTime!.end!.step;
  }

  stepTyped(fob: Fob, step: number) {
    let newLinkedTime = {...this.linkedTime};
    if (fob === Fob.START) {
      newLinkedTime.start = {step};
    } else if (fob === Fob.END) {
      newLinkedTime.end = {step};
    }

    if (
      newLinkedTime.end !== null &&
      newLinkedTime.start.step > newLinkedTime.end.step
    ) {
      // The Start Step is now greater than the End Step - flip them.
      newLinkedTime = {
        start: newLinkedTime.end,
        end: newLinkedTime.start,
      };
    }

    this.onSelectTimeChanged.emit(newLinkedTime);
  }
}
