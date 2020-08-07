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

import {PolymerElement, html} from '@polymer/polymer';
import {customElement, property} from '@polymer/decorators';
import '@polymer/iron-icon';
import '@polymer/paper-button';
import '@polymer/paper-listbox';
import '@polymer/paper-input';
import {DO_NOT_SUBMIT} from '../tf-imports/polymer.html';
import {DO_NOT_SUBMIT} from '../tf-backend/tf-backend.html';
import {DO_NOT_SUBMIT} from '../tf-categorization-utils/tf-categorization-utils.html';
import {DO_NOT_SUBMIT} from '../tf-color-scale/tf-color-scale.html';
import {DO_NOT_SUBMIT} from '../tf-dashboard-common/dashboard-style.html';
import {DO_NOT_SUBMIT} from '../tf-dashboard-common/tf-dashboard-layout.html';
import {DO_NOT_SUBMIT} from '../tf-dashboard-common/tf-option-selector.html';
import {DO_NOT_SUBMIT} from '../tf-paginated-view/tf-category-paginated-view.html';
import {DO_NOT_SUBMIT} from '../tf-runs-selector/tf-runs-selector.html';
import {DO_NOT_SUBMIT} from '../tf-scalar-dashboard/tf-smoothing-input.html';
import {DO_NOT_SUBMIT} from '../tf-tensorboard/registry.html';
import {DO_NOT_SUBMIT} from '../tf-utils/tf-utils.html';
import {DO_NOT_SUBMIT} from 'tf-custom-scalar-margin-chart-card.html';
import {DO_NOT_SUBMIT} from 'tf-custom-scalar-multi-line-chart-card.html';
import '@polymer/iron-icon';
import '@polymer/paper-button';
import '@polymer/paper-listbox';
import '@polymer/paper-input';
import {DO_NOT_SUBMIT} from '../tf-imports/polymer.html';
import {DO_NOT_SUBMIT} from '../tf-backend/tf-backend.html';
import {DO_NOT_SUBMIT} from '../tf-categorization-utils/tf-categorization-utils.html';
import {DO_NOT_SUBMIT} from '../tf-color-scale/tf-color-scale.html';
import {DO_NOT_SUBMIT} from '../tf-dashboard-common/dashboard-style.html';
import {DO_NOT_SUBMIT} from '../tf-dashboard-common/tf-dashboard-layout.html';
import {DO_NOT_SUBMIT} from '../tf-dashboard-common/tf-option-selector.html';
import {DO_NOT_SUBMIT} from '../tf-paginated-view/tf-category-paginated-view.html';
import {DO_NOT_SUBMIT} from '../tf-runs-selector/tf-runs-selector.html';
import {DO_NOT_SUBMIT} from '../tf-scalar-dashboard/tf-smoothing-input.html';
import {DO_NOT_SUBMIT} from '../tf-tensorboard/registry.html';
import {DO_NOT_SUBMIT} from '../tf-utils/tf-utils.html';
import {DO_NOT_SUBMIT} from 'tf-custom-scalar-margin-chart-card.html';
import {DO_NOT_SUBMIT} from 'tf-custom-scalar-multi-line-chart-card.html';
'use strict';
@customElement('tf-custom-scalar-dashboard')
class TfCustomScalarDashboard extends PolymerElement {
  static readonly template = html`
    <tf-dashboard-layout>
      <div class="sidebar" slot="sidebar">
        <div class="settings">
          <div class="sidebar-section">
            <div class="line-item">
              <paper-checkbox checked="{{_showDownloadLinks}}"
                >Show data download links</paper-checkbox
              >
            </div>
            <div class="line-item">
              <paper-checkbox checked="{{_ignoreYOutliers}}"
                >Ignore outliers in chart scaling</paper-checkbox
              >
            </div>
            <div id="tooltip-sorting">
              <div id="tooltip-sorting-label">Tooltip sorting method:</div>
              <paper-dropdown-menu
                no-label-float=""
                selected-item-label="{{_tooltipSortingMethod}}"
              >
                <paper-listbox
                  class="dropdown-content"
                  selected="0"
                  slot="dropdown-content"
                >
                  <paper-item>default</paper-item>
                  <paper-item>descending</paper-item>
                  <paper-item>ascending</paper-item>
                  <paper-item>nearest</paper-item>
                </paper-listbox>
              </paper-dropdown-menu>
            </div>
          </div>
          <div class="sidebar-section">
            <tf-smoothing-input
              weight="{{_smoothingWeight}}"
              step="0.001"
              min="0"
              max="1"
            ></tf-smoothing-input>
          </div>
          <div class="sidebar-section">
            <tf-option-selector
              id="x-type-selector"
              name="Horizontal Axis"
              selected-id="{{_xType}}"
            >
              <paper-button id="step">step</paper-button
              ><!--
            --><paper-button id="relative">relative</paper-button
              ><!--
            --><paper-button id="wall_time">wall</paper-button>
            </tf-option-selector>
          </div>
        </div>
        <div class="sidebar-section runs-selector">
          <tf-runs-selector selected-runs="{{_selectedRuns}}">
          </tf-runs-selector>
        </div>
      </div>
      <div class="center" slot="center" id="categories-container">
        <template is="dom-if" if="[[_dataNotFound]]">
          <div class="no-data-warning">
            <h3>The custom scalars dashboard is inactive.</h3>
            <p>Probable causes:</p>
            <ol>
              <li>You haven't laid out the dashboard.</li>
              <li>You haven’t written any scalar data to your event files.</li>
            </ol>

            <p>
              To lay out the dashboard, pass a <code>Layout</code> protobuffer
              to the <code>set_layout</code> method. For example,
            </p>
            <pre>
from tensorboard import summary
from tensorboard.plugins.custom_scalar import layout_pb2
...
# This action does not have to be performed at every step, so the action is not
# taken care of by an op in the graph. We only need to specify the layout once
# (instead of per step).
layout_summary = summary_lib.custom_scalar_pb(layout_pb2.Layout(
  category=[
    layout_pb2.Category(
      title='losses',
      chart=[
          layout_pb2.Chart(
              title='losses',
              multiline=layout_pb2.MultilineChartContent(
                tag=[r'loss.*'],
              )),
          layout_pb2.Chart(
              title='baz',
              margin=layout_pb2.MarginChartContent(
                series=[
                  layout_pb2.MarginChartContent.Series(
                    value='loss/baz/scalar_summary',
                    lower='baz_lower/baz/scalar_summary',
                    upper='baz_upper/baz/scalar_summary'),
                ],
              )),
      ]),
    layout_pb2.Category(
      title='trig functions',
      chart=[
          layout_pb2.Chart(
              title='wave trig functions',
              multiline=layout_pb2.MultilineChartContent(
                tag=[r'trigFunctions/cosine', r'trigFunctions/sine'],
              )),
          # The range of tangent is different. Let's give it its own chart.
          layout_pb2.Chart(
              title='tan',
              multiline=layout_pb2.MultilineChartContent(
                tag=[r'trigFunctions/tangent'],
              )),
      ],
      # This category we care less about. Let's make it initially closed.
      closed=True),
  ]))
writer.add_summary(layout_summary)
</pre
            >
            <p>
              If you’re new to using TensorBoard, and want to find out how to
              add data and set up your event files, check out the
              <a
                href="https://github.com/tensorflow/tensorboard/blob/master/README.md"
                >README</a
              >
              and perhaps the
              <a
                href="https://www.tensorflow.org/get_started/summaries_and_tensorboard"
                >TensorBoard tutorial</a
              >.
            </p>
          </div>
        </template>
        <template is="dom-if" if="[[!_dataNotFound]]">
          <template is="dom-repeat" items="[[_categories]]" as="category">
            <tf-category-paginated-view
              as="chart"
              category="[[category]]"
              disable-pagination=""
              initial-opened="[[category.metadata.opened]]"
            >
              <template>
                <template is="dom-if" if="[[chart.multiline]]">
                  <tf-custom-scalar-multi-line-chart-card
                    active="[[active]]"
                    request-manager="[[_requestManager]]"
                    runs="[[_selectedRuns]]"
                    title="[[chart.title]]"
                    x-type="[[_xType]]"
                    smoothing-enabled="[[_smoothingEnabled]]"
                    smoothing-weight="[[_smoothingWeight]]"
                    tooltip-sorting-method="[[tooltipSortingMethod]]"
                    ignore-y-outliers="[[_ignoreYOutliers]]"
                    show-download-links="[[_showDownloadLinks]]"
                    tag-regexes="[[chart.multiline.tag]]"
                  ></tf-custom-scalar-multi-line-chart-card>
                </template>
                <template is="dom-if" if="[[chart.margin]]">
                  <tf-custom-scalar-margin-chart-card
                    active="[[active]]"
                    request-manager="[[_requestManager]]"
                    runs="[[_selectedRuns]]"
                    title="[[chart.title]]"
                    x-type="[[_xType]]"
                    tooltip-sorting-method="[[tooltipSortingMethod]]"
                    ignore-y-outliers="[[_ignoreYOutliers]]"
                    show-download-links="[[_showDownloadLinks]]"
                    margin-chart-series="[[chart.margin.series]]"
                  ></tf-custom-scalar-margin-chart-card>
                </template>
              </template>
            </tf-category-paginated-view>
          </template>
        </template>
      </div>
    </tf-dashboard-layout>

    <style include="dashboard-style"></style>
    <style>
      #tooltip-sorting {
        align-items: center;
        display: flex;
        font-size: 14px;
        margin-top: 15px;
      }
      #tooltip-sorting paper-dropdown-menu {
        margin-left: 10px;
        --paper-input-container-focus-color: var(--tb-orange-strong);
        width: 105px;
      }
      .line-item {
        display: block;
        padding-top: 5px;
      }
      .no-data-warning {
        max-width: 540px;
        margin: 80px auto 0 auto;
      }
    </style>
  `;
  @property({
    type: Object,
  })
  _requestManager: object = () => new tf_backend.RequestManager(50);
  @property({
    type: Object,
  })
  _canceller: object = () => new tf_backend.Canceller();
  @property({type: Array})
  _selectedRuns: unknown[];
  @property({
    type: Boolean,
    notify: true,
    observer: '_showDownloadLinksObserver',
  })
  _showDownloadLinks: boolean = tf_storage.getBooleanInitializer(
    '_showDownloadLinks',
    {
      defaultValue: false,
      useLocalStorage: true,
    }
  );
  @property({
    type: Number,
    notify: true,
    observer: '_smoothingWeightObserver',
  })
  _smoothingWeight: number = tf_storage.getNumberInitializer(
    '_smoothingWeight',
    {
      defaultValue: 0.6,
    }
  );
  @property({
    type: Boolean,
    observer: '_ignoreYOutliersObserver',
  })
  _ignoreYOutliers: boolean = tf_storage.getBooleanInitializer(
    '_ignoreYOutliers',
    {
      defaultValue: true,
      useLocalStorage: true,
    }
  );
  @property({
    type: String,
  })
  _xType: string = 'step';
  @property({type: Object})
  _layout: object;
  @property({type: Boolean})
  _dataNotFound: boolean;
  @property({
    type: Object,
  })
  _openedCategories: object;
  @property({
    type: Boolean,
    readOnly: true,
  })
  _active: boolean = true;
  @property({
    type: Boolean,
  })
  reloadOnReady: boolean = true;
  ready() {
    if (this.reloadOnReady) this.reload();
  }
  reload() {
    const url = tf_backend.getRouter().pluginsListing();
    const handlePluginsListingResponse = this._canceller.cancellable(
      (result) => {
        if (result.cancelled) {
          return;
        }
        this.set('_dataNotFound', !result.value['custom_scalars']);
        if (this._dataNotFound) {
          return;
        }
        this._retrieveLayoutAndData();
      }
    );
    this._requestManager.request(url).then(handlePluginsListingResponse);
  }
  _reloadCharts() {
    const charts = this.root.querySelectorAll(
      'tf-custom-scalar-margin-chart-card, ' +
        'tf-custom-scalar-multi-line-chart-card'
    );
    charts.forEach((chart) => {
      chart.reload();
    });
  }
  _retrieveLayoutAndData() {
    const url = tf_backend.getRouter().pluginRoute('custom_scalars', '/layout');
    const update = this._canceller.cancellable((result) => {
      if (result.cancelled) {
        return;
      }
      // This plugin is only active if data is available.
      this.set('_layout', result.value);
      if (!this._dataNotFound) {
        this._reloadCharts();
      }
    });
    this._requestManager.request(url).then(update);
  }
  _showDownloadLinksObserver = tf_storage.getBooleanObserver(
    '_showDownloadLinks',
    {defaultValue: false, useLocalStorage: true}
  );
  _smoothingWeightObserver = tf_storage.getNumberObserver('_smoothingWeight', {
    defaultValue: 0.6,
  });
  _ignoreYOutliersObserver = tf_storage.getBooleanObserver('_ignoreYOutliers', {
    defaultValue: true,
    useLocalStorage: true,
  });
  @computed('_smoothingWeight')
  get _smoothingEnabled(): boolean {
    var _smoothingWeight = this._smoothingWeight;
    return _smoothingWeight > 0;
  }
  @computed('_layout')
  get _categories(): unknown[] {
    var layout = this._layout;
    if (!layout.category) {
      return [];
    }
    let firstTimeLoad = false;
    if (!this._openedCategories) {
      // This is the first time the user loads the categories. Start storing
      // which categories are open.
      firstTimeLoad = true;
      this._openedCategories = {};
    }
    const categories = layout.category.map((category) => {
      if (firstTimeLoad && !category.closed) {
        // Remember whether this category is currently open.
        this._openedCategories[category.title] = true;
      }
      return {
        name: category.title,
        items: category.chart,
        metadata: {
          opened: !!this._openedCategories[category.title],
        },
      };
    });
    return categories;
  }
  _categoryOpenedToggled(event) {
    const pane = event.target;
    if (pane.opened) {
      this._openedCategories[pane.category.name] = true;
    } else {
      delete this._openedCategories[pane.category.name];
    }
  }
}
