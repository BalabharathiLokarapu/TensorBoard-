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
  NgModule,
  Component,
  Type,
  ModuleWithProviders,
  Inject,
  Optional,
} from '@angular/core';
import {PluginConfig, PLUGIN_CONFIG_TOKEN} from './plugin_registry_types';

const pluginNameToComponent = new Map<string, Type<Component>>();

@NgModule({})
export class PluginRegistryModule {
  constructor(
    @Optional() @Inject(PLUGIN_CONFIG_TOKEN) configs: PluginConfig[]
  ) {
    if (!configs) {
      return;
    }
    const configSet = new Set(configs);
    console.assert(
      configSet.size === configs.length,
      'Cannot register the same plugin multiple times.'
    );

    for (const config of configs) {
      const {pluginName, componentClass} = config;
      pluginNameToComponent.set(pluginName, componentClass as Type<Component>);
    }
  }

  /**
   * Registers a plugin name to an Angular component. Modules can register a
   * Component with a plugin like so:
   * @NgModule({
   *   imports: [
   *     PluginRegistryModule.forPlugin('scalars', ScalarsDashboard), ...
   *   ],
   *   ...
   * })
   */
  static forPlugin(
    pluginName: string,
    componentClass: any
  ): ModuleWithProviders<PluginRegistryModule> {
    return {
      ngModule: PluginRegistryModule,
      providers: [
        {
          provide: PLUGIN_CONFIG_TOKEN,
          multi: true,
          useValue: {pluginName, componentClass},
        },
      ],
    };
  }

  getComponent(pluginName: string): Type<Component> | null {
    return pluginNameToComponent.get(pluginName) || null;
  }
}
