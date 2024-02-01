# Copyright 2016 The TensorFlow Authors. All Rights Reserved.
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
"""External-only delegates for various BUILD rules."""

load("@bazel_skylib//rules:copy_file.bzl", "copy_file")
load("@io_bazel_rules_sass//:defs.bzl", "npm_sass_library", "sass_binary", "sass_library")
load("@npm//@angular/build-tooling/bazel/app-bundling:index.bzl", "app_bundle")
load("@npm//@angular/build-tooling/bazel/spec-bundling:index.bzl", "spec_bundle")
load("@npm//@angular/build-tooling/bazel:extract_js_module_output.bzl", "extract_js_module_output")
load("@npm//@bazel/concatjs:index.bzl", "karma_web_test_suite", "ts_library")
load("@npm//@bazel/esbuild:index.bzl", "esbuild")
load("@npm//@bazel/typescript:index.bzl", "ts_config")


def tensorboard_webcomponent_library(**kwargs):
    """Rules referencing this will be deleted from the codebase soon."""
    pass

def tf_js_binary(
        name,
        compile,
        visibility = None,
        dev_mode_only = False,
        includes_polymer = False,
        **kwargs):
    """Rule for creating a JavaScript bundle.

    This uses esbuild() directly and is generally used for any bundle that is
    non-Angular or non-Prod. It is faster than tf_ng_prod_js_binary.

    Angular apps that use this rule will have to be run with the Angular JIT
    compiler as this rule does not support Angular AOT compilation.

    Args:
        name: Name of the target.
        compile: whether to compile when bundling. Only used internally.
        visibility: visibility of the target.
        dev_mode_only: whether the binary is for development. When True, it will
          omit the minification step.
        includes_polymer: whether this binary contains Polymer. Only used
          internally.
        **kwargs: Other keyword arguments to esbuild(). Typically used for
          entry_point and deps. Please refer to https://esbuild.github.io/api/
          for more details.
    """

    # esbuild is a fast JavaScript bundler[1] appropriate for both production
    # and development builds.
    #
    # Bazel documents[2] how to use esbuild bundling with ts_project but we use
    # the not-quite-deprecated ts_library rule instead of ts_project. We've
    # managed to get esbuild working with ts_library but its long-term support
    # is unknown.
    #
    # [1]: https://esbuild.github.io/
    # [2]: https://www.npmjs.com/package/@bazel/esbuild
    esbuild(
        name = name,
        visibility = visibility,
        # Use "iife" format instead of "esm" because "esm" writes symbols at
        # the global level and tends to overwrite `window` functions. "iife" is
        # just a thin wrapper around "esm" (it adds 11 bytes) and doesn't
        # suffer from the same overwriting problem.
        format="iife",
        minify= False if dev_mode_only else True,
        args = {
            # Must specify that 'mjs' extensions are preferred, since that is
            # the extension that is used for es2015/esm code generated by
            # ts_library.
            # https://github.com/bazelbuild/rules_nodejs/issues/2691#issuecomment-846429871
            "resolveExtensions": [".mjs", ".js"],
            # The reasoning for these particular mainFields values are lost to
            # history. These come from the old rollup bundler configuration.
            # We do know that the esbuild default values for mainFields do not
            # work for us. In particular we ran into problems with
            # esbuild pulling in "node"-specific versions of some libraries that
            # are incompatible with browsers.
            "mainFields": ["browser", "es2015", "module", "jsnext:main", "main"],
        },
        **kwargs
    )


def tf_ng_prod_js_binary(
        name,
        compile,
        **kwargs):
    """Rule for creating a prod-optimized JavaScript bundle for an Angular app.

    This uses the Angular team's internal toolchain for creating these bundles:
    app_bundle(). This toolchain is not officially supported. We use it at our
    own risk.

    The bundles allow for Angular AOT compilation and are further optimized to
    reduce size. However, the bundle times are significantly slower than those
    for tf_js_binary().

    Args:
        name: Name of the target.
        compile: Whether to compile when bundling. Only used internally.
        **kwargs: Other keyword arguments to app_bundle() and esbuild(). Typically
          used for entry_point and deps. Please refer to
          https://esbuild.github.io/api/ for more details.
    """

    app_bundle_name = '%s_app_bundle' % name
    app_bundle(
        name = app_bundle_name,
        **kwargs
    )

    # app_bundle() generates several outputs. We copy the one that has gone
    # through a terser pass to be the output of this rule.
    copy_file(
        name = name,
        src = '%s.min.js' % app_bundle_name,
        out = '%s.js' % name,
    )

def tf_ts_config(**kwargs):
    """TensorBoard wrapper for the rule for a TypeScript configuration."""

    ts_config(**kwargs)

def tf_ts_library(srcs = [], strict_checks = True, **kwargs):
    """TensorBoard wrapper for the rule for a TypeScript library.

    Args:
      strict_checks: whether to enable stricter type checking. Default is True.
          Please use `strict_checks = False` for only Polymer based targets.
      **kwargs: keyword arguments to ts_library build rule.
    """
    tsconfig = "//:tsconfig.json"

    if strict_checks == False:
        tsconfig = "//:tsconfig-lax"
    kwargs.setdefault("deps", []).extend(["@npm//tslib", "//tensorboard/defs:strict_types"])

    new_srcs = []
    # Find test.ts and testbed.ts files and rename to test.spec.ts to be
    # compatible with spec_bundle() tooling.
    for s in srcs:
      if s.endswith("_test.ts") or s.endswith("-test.ts") or s.endswith("_testbed.ts"):
        # Make a copy of the file with name .spec.ts and switch to that as
        # the src file.
        new_src = s[0:s.rindex('.ts')] + ".spec.ts"
        copy_file(
            name = new_src + '_spec_copy',
            src = s,
            out = new_src,
            allow_symlink = True)
        new_srcs.append(new_src)
      else:
        # Not a test file. Nothing to do here.
        new_srcs.append(s)

    ts_library(
        srcs = new_srcs,
        tsconfig = tsconfig,
        supports_workers = True,
        # Override prodmode_target, devmode_target, and devmode_module to be
        # compatible with extract_js_module_output() and spec_bundle() tooling.
        # See the angular/components example:
        # https://github.com/angular/components/blob/871f8f231a7a86a7a0778e345f4d517109c9a357/tools/defaults.bzl#L114-L121
        prodmode_target = "es2020",
        devmode_target = "es2020",
        devmode_module = "esnext",
        **kwargs)

def tf_ng_web_test_suite(name, deps = [], **kwargs):
    """TensorBoard wrapper for the rule for a Karma web test suite.

    This uses the Angular team's internal toolchain for bundling
    Angular-compatible tests: extract_js_module_output() and spec_bundle().
    This toolchain is not officially supported. We use it at our own risk.
    """

    # Call extract_js_module_output() to prepare proper input for spec_bundle()
    # tooling.
    # See the angular/components example:
    # https://github.com/angular/components/blob/871f8f231a7a86a7a0778e345f4d517109c9a357/tools/defaults.bzl#L427
    extract_js_module_output(
        name = "%s_devmode_deps" % name,
        deps = [
            # initialize_testbed must be the first dep for the tests to run
            # properly.
            "//tensorboard/webapp/testing:initialize_testbed",
        ] + deps,
        provider = "JSModuleInfo",
        forward_linker_mappings = True,
        include_external_npm_packages = True,
        include_default_files = False,
        include_declarations = False,
        testonly = True,
    )

    # Create an esbuild bundle with all source and dependencies. It provides a
    # clean way to bundle non-CommonJS dependencies without the use of hacks
    # and shims that are typically necessary for working with
    # karma_web_test_suite().
    # See the angular/components example:
    # https://github.com/angular/components/blob/871f8f231a7a86a7a0778e345f4d517109c9a357/tools/defaults.bzl#L438
    spec_bundle(
        name = "%s_bundle" % name,
        deps = ["%s_devmode_deps" % name],
        workspace_name = "org_tensorflow_tensorboard",
        run_angular_linker = False,
        platform = "browser",
    )

    karma_web_test_suite(
        name = name,
        bootstrap =
            [
                "@npm//:node_modules/zone.js/dist/zone-evergreen.js",
                "@npm//:node_modules/zone.js/dist/zone-testing.js",
                "@npm//:node_modules/reflect-metadata/Reflect.js",
            ],
        # The only dependency is the esbuild bundle from spec_bundle().
        # karma_web_test_suite() will rebundle it along with the test framework
        # in a CommonJS bundle.
        deps = [
          "%s_bundle" % name,
        ],
    )

def tf_svg_bundle(name, srcs, out):
    native.genrule(
        name = name,
        srcs = srcs,
        outs = [out],
        cmd = "$(execpath //tensorboard/tools:mat_bundle_icon_svg) $(SRCS) > $@",
        tools = [
            "//tensorboard/tools:mat_bundle_icon_svg",
        ],
    )

def tf_sass_binary(deps = [], include_paths = [], **kwargs):
    """TensorBoard wrap for declaring SASS binary.

    It adds dependency on theme by default then add include Angular material
    theme library paths for better node_modules library resolution.
    """
    sass_binary(
        deps = deps,
        include_paths = include_paths + [
            "external/npm/node_modules",
        ],
        sourcemap = False,
        **kwargs
    )

def tf_sass_library(**kwargs):
    """TensorBoard wrap for declaring SASS library.

    It re-exports the sass_libray symbol so users do not have to depend on
    "@io_bazel_rules_sass//:defs.bzl".
    """
    sass_library(
        **kwargs
    )

def tf_external_sass_libray(**kwargs):
    """TensorBoard wrapper for declaring external SASS dependency.

    When an external (NPM) package have SASS files that has `import` statements,
    TensorBoard has to depdend on them very specifically. This rule allows SASS
    modules in NPM packages to be built properly.
    """
    npm_sass_library(
        **kwargs
    )

def tf_ng_module(assets = [], **kwargs):
    """TensorBoard wrapper for Angular modules."""
    tf_ts_library(
        compiler = "//tensorboard/defs:tsc_wrapped_with_angular",
        use_angular_plugin = True,
        angular_assets = assets,
        **kwargs
    )

def tf_inline_pngs(name, html_template, images, out):
    """Inline png images in html.

    Replaces %<file_basename>.png% in the input `html_template` with a data URI
    containing the base64-encoded image content of the corresopnding .png files
    in the `images` input.

    In case there is a collision in the base file name, the first instance will
    take precedence over the others.

    Example:
    # In html_template:
    <img src="%my_file.png%" />

    # In BUILD:
    tf_inline_pngs(
        name = "my_rule",
        html_template = "path_to_my_template.html",
        images = [
            "path_to/my_file.png",
        ] + glob("some_folder/*.png"),
        out = "my_filename.html",
    )

   Args:
     name: Name of the rule.
     html_template: Name of the uninlined .html file.
     images: .png `images` input to be inlined.
     out: Name of the output (inlined) .html file.
    """
    native.genrule(
        name = name,
        srcs = [html_template] + images,
        outs = [out],
        cmd = "$(execpath //tensorboard/defs:inline_images) $(SRCS) >'$@'",
        tools = ["//tensorboard/defs:inline_images"],
    )
