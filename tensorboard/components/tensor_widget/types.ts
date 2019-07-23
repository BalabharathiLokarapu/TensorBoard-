/* Copyright 2019 The TensorFlow Authors. All Rights Reserved.

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

import {BaseTensorHealthPill} from "./health-pill-types";

/**
 * The specs for deferred view into a tensor.
 *
 * A tensor is a typed, multi-dimensional array.
 * This interface abstracts away the backing storage of the tensor value.
 * It allows on-demand retrieval into any element or sub-array of the tensor.
 */
export interface TensorView {
  /** Data type of the underlying tensor. */
  dtype: string;

  /** Shape of the underlying tensor. */
  shape: number[];

  /**
   * Get a specific element.
   * @param indices Coordinates of the element. n indices (length-n array of
   * number) is required to specify an element in an n-dimensional tensor, n
   * being a non-negative integer.
   * @return The value of the element at the specified indices.
   */
  get: (...indices: number[]) => Promise<boolean|number|string>;

  /**
   * Get a view of the underlying tensor with the specified
   * slicing and viewing dimensions, as well as the ranges
   * within the viewing dimensions.
   */
  view: (navigation: TensorViewSlicingSpec) => Promise<SlicedValues>;

  /** Get the health pill of the underlying tensor. */
  getHealthPill: () => Promise<BaseTensorHealthPill>;
}

/**
 * Represents the primitive values from slicing a multi-dimensional
 * tensor.
 */
export type SlicedValues =
    boolean|boolean[]|boolean[][]|boolean[][][]|
    number|number[]|number[][]|number[][][]|
    string|string[]|string[][]|string[][][];

/**
 * A data structure that keeps track of how an n-dimensional array (tensor)
 * is sliced down to a smaller number of dimensions for visualization
 * in the tensor widget.
 *
 * For example, suppose there is a 4D tensor of shape [16, 128, 128, 3]
 * representing a NHWC image batch. If you'd like to get the 4-by-3 top-left
 * corner of the first image of the last color channel  displayed in the tensor
 * widget, this interface should have the following concrete value:
 *
 * ```
 * {
 *   slicingDimsAndIndices: [{
 *     dim: 0,
 *     index: 0
 *   }, {
 *     dim: 3,
 *     index: 2
 *   }],
 *   viewingDims: [1, 2],
 *   verticalRange: [0, 4],
 *   horizontalRange: [0, 3]
 * }
 * ```
 */
export interface TensorViewSlicingSpec {
  /**
   * Which dimensions of the tensor are sliced down to a slice of 1.
   *
   * - The `dim` field is the 0-based dimension index.
   * - The `index` is the 0-based index for the selected slice.
   */
  slicingDimsAndIndices: Array<{dim: number, index: number}>;

  /**
   * Which dimensions are used for viewing (i.e., rendered in the
   * tensor widget, as a table, by default.)
   *
   * Possible lengths of this array field:
   * - 0 for scalar tensors.
   * - 1 for 1D tensors.
   * - 2 for 2D+ tensors.
   */
  viewingDims: number[];

  /**
   * The indices from the first viewing dimension, which are shown as rows.
   *
   * The two numbers are beginning index (inclusive) and ending index
   * (exclusive).
   */
  verticalRange: [number, number];

  /**
   * The indices from the second viewing dimension, which are shown as columns.
   *
   * The two numbers are beginning index (inclusive) and ending index
   * (exclusive).
   */
  horizontalRange?: [number, number];

  /**
   * Optional dimension for depth.
   *
   * This supports visualization that requires a depth dimension, e.g.,
   * color channels.
   */
  depthDim?: number;
}

/** Options used during the creation of a single-tensor tensor widget. */
export interface TensorWidgetOptions {
  /** Name of the tensor (optional). */
  name?: string;

  /**
   * Whether the health-pill portion of the tensor widget is to be
   * included
   *
   * Defaults to `true`.
   */
  includeHealthPill?: boolean;

  /** Defaults to `true`. */
  includeMenu?: boolean;

  /**
   * How many decimal places to display the values in.
   *
   * The values of the tensor may be displaced in the decimal notation, or
   * the engineering notation, depending automatically by the tensor-widget
   * library based on the maximum absolute value of the elements of the tensor.
   */
  decimalPlaces?: number;

  /** TODO(cais): Add support for custom tensor renderers. */
}

/**
 * A TensorWidget that interactively visualizes a single tensor.
 */
export interface TensorWidget {
  /**
   * Renders the GUI of the tensor widget.
   *
   * This method should be called only once after the tensor widget is
   * instantiated, or when the content of the underlying tensor has
   * changed.
   */
  render: () => Promise<void>;

  /**
   * Scroll along the horizontal dimension.
   *
   * I.e., whichever dimension that's selected as the horizontal viewing
   * dimension at the current time.
   *
   * `offset` will become the first element in the view, regardless of
   * whether the element is already in the view.
   */
  scrollHorizontally: (offset: number) => Promise<void>;

  /**
   * Scroll along the vertical dimension.
   *
   * I.e., whichever dimension that's selected as the vertical viewing
   * dimension at the current time.
   *
   * `offset` will become the first element in the view, regardless of
   * whether the element is already in the view.
   */
  scrollVertically: (offset: number) => Promise<void>;

  /**
   * Navigate to specified indices.
   *
   * This is for the case in which the user wants to bring a specific
   * element of  given indices into the view, without the potentially tedious
   * process of selecting the slices and scrolling. Yes, this automatically
   * changes the scroll position and `slicingDimsAndIndices`.
   *
   * Throws Error if indices is out of bounds.
   */
  navigateToIndices: (indices: number[]) => Promise<void>;

  // TODO(cais): Add API for programmatically changing navigation status.
  // TODO(cais): Add event listeners for navigation status changes.
}
