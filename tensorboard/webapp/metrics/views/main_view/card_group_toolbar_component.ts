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
import {ChangeDetectionStrategy, Component, EventEmitter, Input, Output} from '@angular/core';

@Component({
  selector: 'metrics-card-group-toolbar-component',
  template: `
    <div class="group-toolbar"
         (click)="groupExpansionToggled.emit()">
      <span>
        <span
          class="group-title"
          aria-role="heading"
          aria-level="3"
          title="{{ groupName }}"
          >{{ groupName }}</span
        >
        <span *ngIf="numberOfCards > 1" class="group-card-count"
          >{{ numberOfCards | number }} cards</span
        >
      </span>
      <button
        class="expand-group-button"
        mat-icon-button
        i18n-aria-label="A button that allows user to expand a tag group."
        aria-label="Expand group"
      >
        <mat-icon
          *ngIf="isGroupExpanded; else expandMore"
          svgIcon="expand_less_24px"
        ></mat-icon>
        <ng-template #expandMore>
          <mat-icon svgIcon="expand_more_24px"></mat-icon>
        </ng-template>
      </button>
    </div>
  `,
  styleUrls: [`card_groups_component.css`],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CardGroupToolBarComponent {
  @Input() groupName!: string | null;
  @Input() numberOfCards!: number;
  @Input() isGroupExpanded!: boolean;

  @Output() groupExpansionToggled = new EventEmitter<void>();
}
