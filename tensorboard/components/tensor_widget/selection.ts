/**
 * @license
 * Copyright 2019 Google LLC. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * =============================================================================
 */

import {size} from './shape-utils';
import {Shape, TensorViewSlicingSpec} from './types';

/**
 * The possible status of a selected cell.
 */
export enum CellSelectionStatus {
  SELECTED = 1,
  LEFT_EDGE,
  RIGHT_EDGE,
  TOP_EDGE,
  BOTTOM_EDGE,
}

export enum SelectionMoveDirection {
  UP = 1,
  DOWN,
  LEFT,
  RIGHT,
}

/**
 * The selection state within a n-dimensional tensor.
 */
export class TensorElementSelection {
  private sliceDims: number[];
  private sliceIndices: number[];
  private viewDims: number[];
  private rowStart: number;
  private colStart: number;
  private rowCount: number;
  private colCount: number;

  /** TODO(cais): Doc string. */
  constructor(
    private readonly shape: Shape,
    readonly slicingSpec: TensorViewSlicingSpec,
    rowStart?: number,
    colStart?: number,
    rowCount?: number,
    colCount?: number
  ) {
    if (size(this.shape) === 0) {
      throw new Error(
        `TensorElementSelection doesn't support tensor with zero elements.`
      );
    }

    this.sliceDims = slicingSpec.slicingDimsAndIndices.map(
      (dimAndIndex) => dimAndIndex.dim
    );
    this.sliceIndices = slicingSpec.slicingDimsAndIndices.map(
      (dimAndIndex) => dimAndIndex.index
    );

    // Sanity check the size of the the slicing dimensions.
    if (this.rank() > 0 && this.sliceDims.length >= this.rank()) {
      throw new Error(
        `Expected sliceDims to have a length less than rank ${this.rank}, ` +
          `but got length ${this.sliceDims.length}`
      );
    }

    // Determine the viewing dimensions.
    this.viewDims = [];
    for (let i = 0; i < this.rank(); ++i) {
      if (this.sliceDims.indexOf(i) === -1) {
        this.viewDims.push(i);
      }
    }

    if (this.viewDims.length > 2) {
      throw new Error(`Only selections in 1D and 2D are supported.`);
    }

    this.rowStart = rowStart == null ? 0 : rowStart;
    this.colStart = colStart == null ? 0 : colStart;
    this.rowCount = rowCount == null ? 1 : rowCount;
    this.colCount = colCount == null ? 1 : colCount;
  }

  private rank(): number {
    return this.shape.length;
  }

  /** TODO(cais): Doc string. */
  public getElementStatus(indices: number[]): CellSelectionStatus[] | null {
    if (indices.length !== this.rank()) {
      throw new Error(
        `Expected indices to have a rank of ${this.rank}, ` +
          `but got ${indices.length} ([${indices}])`
      );
    }

    // First, make sure that the indices belongs to a selected slice.
    for (let i = 0; i < indices.length; ++i) {
      if (this.sliceDims.indexOf(i) !== -1) {
        if (indices[i] !== this.sliceIndices[this.sliceDims.indexOf(i)]) {
          return null;
        }
      }
    }

    let status: CellSelectionStatus[] | null = null;

    const rowEnd = this.rowStart + this.rowCount;
    const colEnd = this.colStart + this.colCount;

    // Second, check the viewing dims.
    if (this.viewDims.length === 0) {
      if (indices.length === 0) {
        if (status == null) {
          status = [];
        }
        status.push(CellSelectionStatus.SELECTED);
        status.push(CellSelectionStatus.TOP_EDGE);
        status.push(CellSelectionStatus.BOTTOM_EDGE);
        status.push(CellSelectionStatus.LEFT_EDGE);
        status.push(CellSelectionStatus.RIGHT_EDGE);
      }
      return status;
    } else if (this.viewDims.length === 1) {
      const rowDim = this.viewDims[0];
      if (indices[rowDim] >= this.rowStart && indices[rowDim] < rowEnd) {
        if (status == null) {
          status = [];
        }
        status.push(CellSelectionStatus.SELECTED);
        if (indices[rowDim] === this.rowStart) {
          status.push(CellSelectionStatus.TOP_EDGE);
        }
        if (indices[rowDim] === rowEnd - 1) {
          status.push(CellSelectionStatus.BOTTOM_EDGE);
        }
        status.push(CellSelectionStatus.LEFT_EDGE);
        status.push(CellSelectionStatus.RIGHT_EDGE);
      }
      return status;
    } else if (this.viewDims.length === 2) {
      const rowDim = this.viewDims[0];
      const colDim = this.viewDims[1];
      if (
        indices[rowDim] >= this.rowStart &&
        indices[rowDim] < rowEnd &&
        indices[colDim] >= this.colStart &&
        indices[colDim] < colEnd
      ) {
        if (status == null) {
          status = [];
        }
        status.push(CellSelectionStatus.SELECTED);
        if (indices[rowDim] === this.rowStart) {
          status.push(CellSelectionStatus.TOP_EDGE);
        }
        if (indices[rowDim] === rowEnd - 1) {
          status.push(CellSelectionStatus.BOTTOM_EDGE);
        }
        if (indices[colDim] === this.colStart) {
          status.push(CellSelectionStatus.LEFT_EDGE);
        }
        if (indices[colDim] === colEnd - 1) {
          status.push(CellSelectionStatus.RIGHT_EDGE);
        }
      }
      return status;
    } else {
      throw new Error(`Unexpected length of viewDims: ${this.viewDims}`);
    }
  }

  public move(direction: SelectionMoveDirection): TensorViewSlicingSpec | null {
    let viewRangeChanged = false;
    if (direction === SelectionMoveDirection.UP) {
      if (this.rowStart > 0) {
        this.rowStart--;
        if (
          this.slicingSpec.verticalRange != null &&
          this.rowStart < this.slicingSpec.verticalRange[0]
        ) {
          this.slicingSpec.verticalRange[0]--;
          this.slicingSpec.verticalRange[1]--;
          viewRangeChanged = true;
        }
      }
    } else if (direction === SelectionMoveDirection.DOWN) {
      if (
        this.slicingSpec.viewingDims != null &&
        this.slicingSpec.viewingDims[0] != null &&
        this.rowStart < this.shape[this.slicingSpec.viewingDims[0]] - 1
      ) {
        this.rowStart++;
        if (
          this.slicingSpec.verticalRange != null &&
          this.rowStart >= this.slicingSpec.verticalRange[1]
        ) {
          const increment = 1;
          this.slicingSpec.verticalRange[0] += increment;
          this.slicingSpec.verticalRange[1] += increment;
          viewRangeChanged = true;
        }
      }
    } else if (direction === SelectionMoveDirection.LEFT) {
      if (this.colStart > 0) {
        this.colStart--;
        if (
          this.slicingSpec.horizontalRange != null &&
          this.colStart < this.slicingSpec.horizontalRange[0]
        ) {
          this.slicingSpec.horizontalRange[0]--;
          this.slicingSpec.horizontalRange[1]--;
          viewRangeChanged = true;
        }
      }
    } else if (direction === SelectionMoveDirection.RIGHT) {
      if (
        this.slicingSpec.viewingDims != null &&
        this.slicingSpec.viewingDims[1] != null &&
        this.colStart < this.shape[this.slicingSpec.viewingDims[1]] - 1
      ) {
        this.colStart++;
        if (
          this.slicingSpec.horizontalRange != null &&
          this.colStart >= this.slicingSpec.horizontalRange[1]
        ) {
          this.slicingSpec.horizontalRange[0]++;
          this.slicingSpec.horizontalRange[1]++;
          viewRangeChanged = true;
        }
      }
    }
    // Moving the selection causes the selection size to collapse to 1x1.
    this.rowCount = 1;
    this.colCount = 1;
    return viewRangeChanged ? this.slicingSpec : null;
  }
}
