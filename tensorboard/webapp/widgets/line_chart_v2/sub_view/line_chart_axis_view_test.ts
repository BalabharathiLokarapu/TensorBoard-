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

import {CommonModule} from '@angular/common';
import {Component, DebugElement, Input} from '@angular/core';
import {TestBed} from '@angular/core/testing';
import {By} from '@angular/platform-browser';

import {createScale} from '../lib/scale';
import {Extent, Scale, ScaleType} from '../lib/public_types';
import {LineChartAxisComponent} from './line_chart_axis_view';

@Component({
  selector: 'testable-comp',
  template: `
    <line-chart-axis
      class="test"
      axis="x"
      [axisExtent]="viewBox.x"
      [scale]="scale"
      [gridCount]="10"
      [domDim]="domDim"
    ></line-chart-axis>
    <line-chart-axis
      class="test"
      axis="y"
      [axisExtent]="viewBox.y"
      [scale]="scale"
      [gridCount]="5"
      [domDim]="domDim"
    ></line-chart-axis>
  `,
})
class TestableComponent {
  @Input()
  scale: Scale = createScale(ScaleType.LINEAR);

  @Input()
  viewBox: Extent = {
    x: [100, 300],
    y: [-1, 1],
  };

  @Input()
  domDim = {
    width: 100,
    height: 200,
  };
}

describe('line_chart_v2/sub_view/axis test', () => {
  const ByCss = {
    X_AXIS_LABEL: By.css('line-chart-axis .x-axis .minor text'),
    X_AXIS_MAJOR_TICK_LABEL: By.css('line-chart-axis .x-axis .major text'),
    Y_AXIS_LABEL: By.css('line-chart-axis .y-axis text'),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [TestableComponent, LineChartAxisComponent],
      imports: [CommonModule],
    }).compileComponents();
  });

  function assertLabels(debugElements: DebugElement[], axisLabels: string[]) {
    const actualLabels = debugElements.map((el) =>
      el.nativeElement.textContent.trim()
    );
    expect(actualLabels).toEqual(axisLabels);
  }

  function assertLabelLoc(
    debugElements: DebugElement[],
    expectedLocs: Array<{x: number; y: number}>
  ) {
    const expected = expectedLocs.map((loc) => ({
      x: String(loc.x),
      y: String(loc.y),
    }));
    const actuals = debugElements.map((el) => ({
      x: String(el.attributes['x']),
      y: String(el.attributes['y']),
    }));

    expect(expected).toEqual(actuals);
  }

  it('renders tick in human readable format', () => {
    const fixture = TestBed.createComponent(TestableComponent);
    fixture.detectChanges();

    assertLabels(fixture.debugElement.queryAll(ByCss.X_AXIS_LABEL), [
      '100',
      '200',
      '300',
    ]);

    assertLabels(fixture.debugElement.queryAll(ByCss.Y_AXIS_LABEL), [
      '-1',
      '-0.5',
      '0',
      '0.5',
      '1',
    ]);
  });

  it('updates to viewBox changes', () => {
    const fixture = TestBed.createComponent(TestableComponent);
    fixture.detectChanges();

    fixture.componentInstance.viewBox = {x: [1e6, 5e6], y: [0, 1]};
    fixture.detectChanges();

    assertLabels(fixture.debugElement.queryAll(ByCss.X_AXIS_LABEL), [
      '2e+6',
      '4e+6',
    ]);

    assertLabels(fixture.debugElement.queryAll(ByCss.Y_AXIS_LABEL), [
      '0',
      '0.2',
      '0.4',
      '0.6',
      '0.8',
      '1',
    ]);
  });

  it('aligns y axis to the right edge of its dom', () => {
    const fixture = TestBed.createComponent(TestableComponent);
    fixture.detectChanges();

    assertLabelLoc(fixture.debugElement.queryAll(ByCss.Y_AXIS_LABEL), [
      // -1 is at the bottom of the DOM
      {x: 95, y: 200},
      {x: 95, y: 150},
      {x: 95, y: 100},
      {x: 95, y: 50},
      // 1 is at the top.
      {x: 95, y: 0},
    ]);
  });

  it('aligns x axis to the top edge of its dom', () => {
    const fixture = TestBed.createComponent(TestableComponent);
    fixture.detectChanges();

    assertLabelLoc(fixture.debugElement.queryAll(ByCss.X_AXIS_LABEL), [
      {x: 0, y: 5},
      {x: 50, y: 5},
      {x: 100, y: 5},
    ]);
  });

  describe('temporal axis', () => {
    function createComponent(minDate: Date, maxDate: Date) {
      const fixture = TestBed.createComponent(TestableComponent);
      fixture.componentInstance.scale = createScale(ScaleType.TIME);
      fixture.componentInstance.domDim = {width: 500, height: 100};
      fixture.componentInstance.viewBox = {
        x: [minDate.getTime(), maxDate.getTime()],
        y: [0, 1],
      };
      fixture.detectChanges();
      return fixture;
    }

    it('shows tick in milliseconds', () => {
      const fixture = createComponent(
        new Date('2020-01-05 13:23:01.030'),
        new Date('2020-01-05 13:23:01.084')
      );

      assertLabels(fixture.debugElement.queryAll(ByCss.X_AXIS_LABEL), [
        '.030',
        '.035',
        '.040',
        '.045',
        '.050',
        '.055',
        '.060',
        '.065',
        '.070',
        '.075',
        '.080',
      ]);
      assertLabels(
        fixture.debugElement.queryAll(ByCss.X_AXIS_MAJOR_TICK_LABEL),
        []
      );
    });

    it('shows tick in seconds', () => {
      const fixture = createComponent(
        new Date('2020-01-05 13:23:01'),
        new Date('2020-01-05 13:23:54')
      );

      assertLabels(fixture.debugElement.queryAll(ByCss.X_AXIS_LABEL), [
        ':05',
        ':10',
        ':15',
        ':20',
        ':25',
        ':30',
        ':35',
        ':40',
        ':45',
        ':50',
      ]);
      assertLabels(
        fixture.debugElement.queryAll(ByCss.X_AXIS_MAJOR_TICK_LABEL),
        ['Jan 5, 2020, 1:23:30 PM']
      );
    });

    it('shows tick in hours', () => {
      const fixture = createComponent(
        new Date('2020-01-05 13:23:01'),
        new Date('2020-01-05 16:23:54')
      );

      assertLabels(fixture.debugElement.queryAll(ByCss.X_AXIS_LABEL), [
        '01:30',
        '01:45',
        '02 PM',
        '02:15',
        '02:30',
        '02:45',
        '03 PM',
        '03:15',
        '03:30',
        '03:45',
        '04 PM',
        '04:15',
      ]);
      assertLabels(
        fixture.debugElement.queryAll(ByCss.X_AXIS_MAJOR_TICK_LABEL),
        []
      );
    });

    it('shows tick in hours (wider diff)', () => {
      const fixture = createComponent(
        new Date('2020-01-05 13:23:01'),
        new Date('2020-01-05 20:23:54')
      );

      assertLabels(fixture.debugElement.queryAll(ByCss.X_AXIS_LABEL), [
        '01:30',
        '02 PM',
        '02:30',
        '03 PM',
        '03:30',
        '04 PM',
        '04:30',
        '05 PM',
        '05:30',
        '06 PM',
        '06:30',
        '07 PM',
        '07:30',
        '08 PM',
      ]);
      assertLabels(
        fixture.debugElement.queryAll(ByCss.X_AXIS_MAJOR_TICK_LABEL),
        ['Jan 5, 2020, 3:00:00 PM', 'Jan 5, 2020, 6:00:00 PM']
      );
    });

    it('shows tick in months', () => {
      const fixture = createComponent(
        new Date('2020-01-05 13:23:01'),
        new Date('2020-06-23 20:23:54')
      );

      assertLabels(fixture.debugElement.queryAll(ByCss.X_AXIS_LABEL), [
        'February',
        'March',
        'April',
        'May',
        'June',
      ]);
      assertLabels(
        fixture.debugElement.queryAll(ByCss.X_AXIS_MAJOR_TICK_LABEL),
        []
      );
    });

    it('shows tick in years', () => {
      const fixture = createComponent(
        new Date('2020-01-05 13:23:01'),
        new Date('2025-01-03 05:01:02')
      );

      assertLabels(fixture.debugElement.queryAll(ByCss.X_AXIS_LABEL), [
        '2021',
        '2022',
        '2023',
        '2024',
        '2025',
      ]);
      assertLabels(
        fixture.debugElement.queryAll(ByCss.X_AXIS_MAJOR_TICK_LABEL),
        []
      );
    });
  });
});
