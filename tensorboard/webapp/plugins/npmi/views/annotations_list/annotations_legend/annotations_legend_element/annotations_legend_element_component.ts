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
import {
  ChangeDetectionStrategy,
  Component,
  Input,
  AfterViewInit,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import * as d3 from 'd3';

@Component({
  selector: 'npmi-annotations-legend-element',
  templateUrl: './annotations_legend_element_component.ng.html',
  styleUrls: ['./annotations_legend_element_component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AnnotationsLegendElementComponent
  implements AfterViewInit, OnChanges {
  @Input() text!: string;
  @Input() color!: string;
  @Input() shape!: string;
  // Drawing containers
  private svg: any;
  private mainContainer: any;

  ngOnChanges(changes: SimpleChanges) {
    this.redraw();
  }

  ngAfterViewInit(): void {
    this.svg = d3.select(
      `#annotations-legend-element-glyph-${CSS.escape(this.text)}`
    );
    this.mainContainer = this.svg.append('g');
    this.redraw();
  }

  private redraw() {
    if (this.initialized()) {
      this.draw();
    }
  }

  private initialized() {
    if (this.svg === undefined) {
      return false;
    }
    return true;
  }

  private draw() {
    if (this.shape == 'circle') {
      this.mainContainer
        .append('circle')
        .attr('fill', this.color)
        .attr('stroke', 'black')
        .attr('cx', 5)
        .attr('cy', 5)
        .attr('r', 5);
    } else if (this.shape == 'bar') {
      this.mainContainer
        .append('rect')
        .attr('fill', this.color)
        .attr('x', 0)
        .attr('y', 0)
        .attr('width', 10)
        .attr('height', 10);
    } else if (this.shape == 'runIndicator') {
      this.mainContainer
        .append('g')
        .append('path')
        .attr('fill', this.color)
        .attr('stroke', 'black')
        .attr('d', 'M 2 0 L 10 0 L 7 5 L 10 10 L 2 10 Z');
    }
  }
}
