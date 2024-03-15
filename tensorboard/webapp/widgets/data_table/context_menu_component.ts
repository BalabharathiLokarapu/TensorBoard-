/* Copyright 2024 The TensorFlow Authors. All Rights Reserved.

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
import {ColumnHeader, Side, SortingInfo, SortingOrder} from './types';

@Component({
  selector: 'tb-data-table-context-menu',
  templateUrl: 'context_menu_component.ng.html',
  styleUrls: ['context_menu_component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContextMenuComponent {
  @Input() contextMenuHeader: ColumnHeader | undefined = undefined;
  @Input() selectableColumns?: ColumnHeader[];
  @Input() sortingInfo!: SortingInfo;

  @Output() removeColumn = new EventEmitter<ColumnHeader>();
  @Output() sortByHeader = new EventEmitter<string>();
  @Output() openFilterMenu = new EventEmitter<MouseEvent>();
  @Output() openColumnSelector = new EventEmitter<{event: MouseEvent, insertTo: Side, isSubmenu: boolean}>;

  readonly Side = Side;
  readonly SortingOrder = SortingOrder;

  isContextMenuEmpty() {
    return (
      !this.contextMenuHeader?.removable &&
      !this.contextMenuHeader?.sortable &&
      !this.canContextMenuInsert() &&
      !this.contextMenuHeader?.filterable
    );
  }

  canContextMenuInsert() {
    return (
      this.selectableColumns?.length &&
      this.contextMenuHeader?.movable &&
      this.contextMenuHeader?.type === 'HPARAM'
    );
  }

  contextMenuRemoveColumn() {
    if (this.contextMenuHeader === undefined) {
      return;
    }
    this.removeColumn.emit(this.contextMenuHeader);
  }
}
