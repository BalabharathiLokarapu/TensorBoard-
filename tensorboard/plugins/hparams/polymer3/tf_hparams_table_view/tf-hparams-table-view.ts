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
import {customElement, observe, property} from '@polymer/decorators';
import * as PolymerDom from '@polymer/polymer/lib/legacy/polymer.dom.js';
import '@vaadin/vaadin-grid';

import '../tf-hparams-session-group-details/tf-hparams-session-group-details';
import * as tf_hparams_utils from '../tf_hparams_utils/tf-hparams-utils';
import {LegacyElementMixin} from '../../../../components_polymer3/polymer/legacy_element_mixin';

'use strict';
@customElement('tf-hparams-table-view')
class TfHparamsTableView extends LegacyElementMixin(PolymerElement) {
  static readonly template = html`
    <vaadin-grid
      class="session-group-table"
      id="sessionGroupsTable"
      column-reordering-allowed=""
      items="[[sessionGroups]]"
    >
      <vaadin-grid-column flex-grow="0" width="10em" resizable="">
        <template class="header">
          <div class="table-header table-cell">Trial ID</div>
        </template>
        <template>
          <div class="table-cell">[[item.name]]</div>
        </template>
      </vaadin-grid-column>
      <template is="dom-if" if="[[enableShowMetrics]]">
        <vaadin-grid-column flex-grow="0" width="5em" resizable="">
          <template class="header">
            <div class="table-header table-cell">Show Metrics</div>
          </template>
          <template>
            <paper-checkbox class="table-cell" checked="{{expanded}}">
            </paper-checkbox>
          </template>
        </vaadin-grid-column>
      </template>
      <template
        is="dom-repeat"
        items="[[visibleSchema.hparamInfos]]"
        as="hparamInfo"
        index-as="hparamIndex"
      >
        <vaadin-grid-column flex-grow="2" width="10em" resizable="">
          <template class="header">
            <div class="table-header table-cell">
              [[_hparamName(hparamInfo)]]
            </div>
          </template>
          <template>
            <div class="table-cell">
              [[_sessionGroupHParam(item, hparamInfo.name)]]
            </div>
          </template>
        </vaadin-grid-column>
      </template>
      <template
        is="dom-repeat"
        items="{{visibleSchema.metricInfos}}"
        as="metricInfo"
        index-as="metricIndex"
      >
        <vaadin-grid-column flex-grow="2" width="10em" resizable="">
          <template class="header">
            <div class="table-header table-cell">
              [[_metricName(metricInfo)]]
            </div>
          </template>
          <template>
            <div class="table-cell">
              [[_sessionGroupMetric(item, metricInfo.name)]]
            </div>
          </template>
        </vaadin-grid-column>
      </template>
      <template class="row-details">
        <tf-hparams-session-group-details
          backend="[[backend]]"
          experiment-name="[[experimentName]]"
          session-group="[[item]]"
          visible-schema="[[visibleSchema]]"
          class="session-group-details"
        >
        </tf-hparams-session-group-details>
      </template>
    </vaadin-grid>

    <style>
      :host {
        display: block;
      }
      .table-cell {
        white-space: nowrap;
        text-overflow: ellipsis;
        overflow: hidden;
      }
      .table-header {
        /* line-break overflowing column headers */
        white-space: normal;
        overflow-wrap: break-word;
      }
      .session-group-table {
        height: 100%;
      }
      .session-group-details {
        height: 360px;
        overflow-y: auto;
      }
    </style>
  `;
  // See comment for the property in tf-hparams-query-pane.
  @property({type: Object})
  visibleSchema: object;
  // See comment for the property in tf-hparams-query-pane.
  @property({type: Array})
  sessionGroups: unknown[];
  // Whether to enable the "show-metrics" column that allows expanding
  // a row to see its details.
  @property({type: Boolean})
  enableShowMetrics: boolean;
  // An object for making HParams API requests to the backend.
  // This is used only when a row is expanded to call the backend to
  // get metric values. It can be omitted if enableShowMetrics is false.
  @property({type: Object})
  backend: object;
  // The experiment name to use when calling the backend to get
  // the metric values. Can be omitted if enableShowMetrics is false.
  @property({type: String})
  experimentName: string;
  @observe('visibleSchema.*', 'sessionGroups.*')
  _visibleSchemaOrSessionGroupsChanged() {
    // Vaadin-grid removes 'row-details' if the visibleSchema changes
    // and doesn't update 'expandedItems'. So we first close the
    // expanded items, call Polymer.dom.flush() to update the grid,
    // and then re-open the groups that were open before.
    const expandedItems = (this.$.sessionGroupsTable as any).get(
      'expandedItems'
    );
    (this.$.sessionGroupsTable as any).set('expandedItems', []);
    PolymerDom.dom.flush();
    // Index sessionGroups by name.
    const sessionGroupsByName = new Map();
    this.sessionGroups.forEach((sg: any) => {
      sessionGroupsByName.set(sg.name, sg);
    });
    (this.$.sessionGroupsTable as any).set(
      'expandedItems',
      expandedItems
        .map((sg) => sessionGroupsByName.get(sg.name))
        .filter(Boolean)
    );
  }
  _hparamName = tf_hparams_utils.hparamName;
  _metricName = tf_hparams_utils.metricName;
  _sessionGroupHParam(sessionGroup, hparam) {
    if (
      sessionGroup == null ||
      !Object.prototype.hasOwnProperty.call(sessionGroup.hparams, hparam)
    ) {
      return '';
    }
    return tf_hparams_utils.prettyPrint(sessionGroup.hparams[hparam]);
  }
  // Returns the metric value of the given sessionGroup. The value is
  // returned as a string suitable for display.
  _sessionGroupMetric(sessionGroup, metricName) {
    if (sessionGroup == null) {
      return null;
    }
    for (let i = 0; i < sessionGroup.metricValues.length; ++i) {
      let metricVal = sessionGroup.metricValues[i];
      if (
        metricVal.name.group === metricName.group &&
        metricVal.name.tag == metricName.tag
      ) {
        return tf_hparams_utils.prettyPrint(metricVal.value);
      }
    }
    return '';
  }
  _rowNumber(rowIndex) {
    return rowIndex + 1;
  }
}
