fastlane documentation
----

# Installation

Make sure you have the latest version of the Xcode command line tools installed:

```sh
xcode-select --install
```

For _fastlane_ installation instructions, see [Installing _fastlane_](https://docs.fastlane.tools/#installing-fastlane)

# Available Actions

## iOS

### ios build

```sh
[bundle exec] fastlane ios build
```

Build a signed App Store .ipa (-> ./build/coco.ipa)

### ios beta

```sh
[bundle exec] fastlane ios beta
```

Upload the existing build/coco.ipa to TestFlight

### ios release

```sh
[bundle exec] fastlane ios release
```

Build a signed .ipa and upload it to TestFlight

----


## Android

### android build

```sh
[bundle exec] fastlane android build
```

Build a signed release .aab (-> ./build/coco.aab)

### android internal

```sh
[bundle exec] fastlane android internal
```

Upload the existing build/coco.aab to the Play internal track

### android release

```sh
[bundle exec] fastlane android release
```

Build a signed .aab and upload it to the Play internal track

----

This README.md is auto-generated and will be re-generated every time [_fastlane_](https://fastlane.tools) is run.

More information about _fastlane_ can be found on [fastlane.tools](https://fastlane.tools).

The documentation of _fastlane_ can be found on [docs.fastlane.tools](https://docs.fastlane.tools).
