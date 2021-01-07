# Copyright 2021 The TensorFlow Authors. All Rights Reserved.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
"""JavaScript related TensorBoard build rules."""

load("@build_bazel_rules_nodejs//:providers.bzl", "JSNamedModuleInfo", "NpmPackageInfo", "node_modules_aspect")

def _tf_dev_js_binary_impl(ctx):
    files_depsets = []

    bootstrap_and_deps = ctx.attr._ambient_deps + ctx.attr.deps
    for dep in bootstrap_and_deps:
        if JSNamedModuleInfo in dep:
            # Collect UMD modules compiled by tf_ts_library
            files_depsets.append(dep[JSNamedModuleInfo].sources)
        elif not NpmPackageInfo in dep and hasattr(dep, "files"):
            # Collect Bazel's File or UMD modules from a MPM package
            files_depsets.append(dep.files)

    for target in ctx.attr._anonymous_umd_deps:
        file = target.files.to_list()[0]
        module_name = ctx.attr._anonymous_umd_deps[target]
        named_file = ctx.actions.declare_file(file.path + ".named_umd.js")

        # Patch anonymous umd modules to have named in their declarations.
        ctx.actions.expand_template(
            template = file,
            output = named_file,
            substitutions = {
                # d3 and three
                "define(['exports']": "define('%s', ['exports']" % module_name,
                # Lodash
                "define(function()": "define('%s', function()" % module_name,
                # Zone.js
                "define(factory": "define('%s', factory" % module_name,
            },
            is_executable = False,
        )
        files_depsets.append(depset([named_file]))

    files = depset(transitive = files_depsets)

    # files can contain package.json that is not even runnable under require.js. Prune it
    # out.
    js_files = [
        f
        for f in files.to_list()
        if f.path.endswith(".js")
    ]

    ctx.actions.write(
        output = ctx.outputs.manifest,
        content = "\n".join([file.path for file in js_files]),
        is_executable = False,
    )

    entry_point_module_name = ctx.workspace_name + "/" + _remove_ext(ctx.file.entry_point.short_path)

    concat_command = ";".join(
        [
            "awk 'BEGINFILE {print \"// file: \"FILENAME}{print}' * " + " ".join([file.path for file in js_files]) + " >" + ctx.outputs.js.path,
            # `require` the entry module name so it is evaluated.
            "echo ';require([\"%s\"]);' >>" % entry_point_module_name + ctx.outputs.js.path,
        ],
    )

    ctx.actions.run_shell(
        mnemonic = "ConcatJs",
        progress_message = "concatenating JavaScript files from dependencies",
        inputs = js_files,
        outputs = [ctx.outputs.js],
        command = concat_command,
    )

def _remove_ext(path):
    ext_ind = path.rfind(".")
    return path[:ext_ind]

tf_dev_js_binary = rule(
    _tf_dev_js_binary_impl,
    attrs = {
        "deps": attr.label_list(
            aspects = [node_modules_aspect],
            doc = """Targets that produce JavaScript, such as tf_ts_library, are
            dependencies of the application.""",
            mandatory = True,
        ),
        "entry_point": attr.label(
            allow_single_file = [".ts"],
            doc = """A module that should be executed as script gets parsed. Generally
            entry to the application.""",
            mandatory = True,
        ),
        # Due to the nature of Angular and certain libraries, they assume presence of
        # library in the bundle. Dependencies appearing in `_ambient_deps` are loaded
        # before the `deps`.
        "_ambient_deps": attr.label_list(
            default = [
                ":common_umd_lib",
                "@npm//:node_modules/reflect-metadata/Reflect.js",
                "@npm//:node_modules/@angular/localize/bundles/localize-init.umd.js",
            ],
            allow_files = True,
        ),
        # Libraries like d3 and lodash export UMD compatible bundled in their node_modules
        # but they are using "anonymous module" of requirejs. Anonymous module is where
        # you define a module without a name (e.g., `define(factory) or
        # `define([dep1], factory)`). They are often intended to be loaded via
        # `<script src="<path_to_lib>.js" data-requiremodule="<lib-name>"`. This is a bit
        # cumbersome in our bundling strategy so it gets monkey patched to use named
        # modules instead.
        "_anonymous_umd_deps": attr.label_keyed_string_dict(
            default = {
                "@npm//:node_modules/lodash/lodash.js": "lodash",
                "@npm//:node_modules/d3/dist/d3.js": "d3",
                "@npm//:node_modules/three/build/three.js": "three",
                "@npm//:node_modules/zone.js/dist/zone.js": "zone.js/dist/zone.js",
            },
            allow_files = True,
        ),
    },
    outputs = {
        "js": "%{name}.js",
        "manifest": "%{name}.MF",
    },
    doc = """`tf_dev_js_binary` is a development only js_binary replacement that simply
    contenates modules using UMD/requirejs.""",
)
