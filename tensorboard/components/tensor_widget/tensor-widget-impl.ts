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

import {drawHealthPill} from "./health-pill";
import {getDefaultSlicingSpec} from "./shape-helper";
import {TensorWidget, TensorWidgetOptions, TensorView, TensorViewSlicingSpec} from "./types";

const DEFAULT_DECIMAL_PLACES = 2;

/**
 * TODO(cais): Doc string.
 */
export class TensorWidgetImpl implements TensorWidget {
  private options: TensorWidgetOptions;
  private readonly rank: number;
  private readonly slicingSpec: TensorViewSlicingSpec;
  private decimalPlaces: number;

  // UI elements.
  private header: HTMLDivElement;
  private infoControl: HTMLDivElement;
  private healthPillDiv: HTMLDivElement;

  constructor(
      private readonly rootElement: HTMLDivElement,
      private readonly tensorView: TensorView,
      options?: TensorWidgetOptions) {
    this.rank = this.tensorView.spec.shape.length;
    this.options = options || {};
    console.log(`rank: ${this.rank}`);  // DEBUG

    this.slicingSpec = getDefaultSlicingSpec(this.tensorView.spec.shape);
    console.log(`slicingSpec = ${this.slicingSpec}`);  // DEBUG

    if (this.tensorView.spec.dtype.match(/float(\d+)/)) {
      this.decimalPlaces =
          this.options.decimalPlaces == null ?
          DEFAULT_DECIMAL_PLACES : this.options.decimalPlaces;
    }
    console.log(`decimalPlaces = ${this.decimalPlaces}`);  // DEBUG
  }

  async render(): Promise<void> {
    this.rootElement.classList.add('tensor-widget');
    this.createHeader();
  }

  async scrollVertically(index: number): Promise<void> {
    throw new Error('Not implemented');
  }

  async scrollHorizontally(index: number): Promise<void> {
    throw new Error('Not implemented');
  }

  async navigateToIndices(indices: number[]): Promise<void> {
    throw new Error('Not implemented');
  }

  private async createHeader() {
    if (this.header == null) {
      this.header = document.createElement('div');
      this.header.classList.add('tensor-widget-header');
      this.rootElement.appendChild(this.header);
    }
    this.createInfoControl();

    // Create div for health pill.
    this.healthPillDiv = document.createElement('div') as HTMLDivElement;
    this.healthPillDiv.classList.add('health-pill-div');
    this.header.appendChild(this.healthPillDiv);
    drawHealthPill(this.healthPillDiv, await this.tensorView.getHealthPill());

    // this.createInitialMenu();
  }

  private createInfoControl() {
    if (this.infoControl == null) {
      this.infoControl = document.createElement('div');
      this.infoControl.classList.add('tensor-widget-info-control');
      this.header.appendChild(this.infoControl);
    }

    // Clear the info control.
    while (this.infoControl.firstChild) {
      this.infoControl.removeChild(this.infoControl.firstChild);
    }

    // Create name control.
    if (this.options.name != null && this.options.name.length > 0) {
      const nameTagDiv = document.createElement('div');
      nameTagDiv.classList.add('tensor-widget-tensor-name');
      // TODO(cais): Cut off long names.
      nameTagDiv.textContent = this.options.name;
      this.infoControl.appendChild(nameTagDiv);
    }

    this.createDTypeTag();
    this.createShapeTag();
  }

  private createDTypeTag() {
    // Create the dtype tag.
    const dTypeControl = document.createElement('div');
    dTypeControl.classList.add('tensor-widget-dtype-tag');

    const dTypeLabel = document.createElement('span');
    dTypeLabel.classList.add('tensor-widget-dtype-tag-label');
    dTypeLabel.textContent = 'dtype:';
    dTypeControl.appendChild(dTypeLabel);

    const dTypeValue = document.createElement('span');
    dTypeValue.textContent = this.tensorView.spec.dtype;
    dTypeControl.appendChild(dTypeValue);

    this.infoControl.appendChild(dTypeControl);
  }

  private createShapeTag() {
    // Create the shape tag.
    const shapeTagDiv = document.createElement('div');
    shapeTagDiv.classList.add('tensor-widget-shape-tag');
    const shapeTagLabel = document.createElement('div');
    shapeTagLabel.classList.add('tensor-widget-shape-tag-label');
    shapeTagLabel.textContent = `shape:`;
    shapeTagDiv.appendChild(shapeTagLabel);
    const shapeTagValue = document.createElement('div');
    shapeTagValue.classList.add('tensor-widget-shape-tag-value');
    shapeTagValue.textContent = `[${this.tensorView.spec.shape}]`;
    shapeTagDiv.appendChild(shapeTagValue);
    this.infoControl.appendChild(shapeTagDiv);
  }
}
