# bud-embedded

An extension for [Bud](https://bud.js.org/learn/getting-started) to aid in building web applications for embedded systems.

This extension configures Bud to build compressed, inline SFSPAs (single file, single page applications) which can be statically linked into firmware binaries without the need for a filesystem. Use the power of Bud, but emit assets targeted for compilation on small, low-resource microprocessors.

The primary use case is on-chip web applications for eg. a device administration panel.

Bud does the web juggling, `bud-embedded` does the packing for firmware, and it's down to you to compile your binary however your choose.

**This is a very early release, and was put together in a weekend. It does work though, and I'm using it as part of my toolchain for [CANtastic](https://github.com/talss89/CANtastic) on the ESP32.**

## Features

- **Zero-configuration** setup. Install the extension, and you have a single file ready to be flashed to your chip.
- **Hot Reloading** - plays nicely with Bud's dev server and HMR
- **Output ASM** - Generate assembler instructions - then pass the generated asset to your compiler and linker.
- **Build-time Compression** - Optionally gzip, deflate or brotli compress your final application
- **Cross Define** - Share symbols between Javascript and C / C++, by defining them in a manifest.
- **[KConfig](https://www.kernel.org/doc/html/next/kbuild/kconfig-language.html) / [Sdkconfig](https://docs.espressif.com/projects/esp-idf/en/latest/esp32/api-reference/kconfig.html) Loader** - Load your `kconfig` files straight into Javascript

## Getting Started

**This extension has been tested on Bud 6.16.1.**

Start a new Bud app with `npx create-bud-app`, or use an existing Bud project.

### Install - NPM

`npm install bud-embedded --save-dev`

### Install - Yarn

`yarn add bud-embedded -D`

### Build your project

`npm run dev` or `yarn bud dev`. You'll see your application at `dist-embedded/index.html`, with assembler code at `dist-embedded/external/build/index.html.S`. Or, fire up your web browser and visit the dev server URL.

```
@talss89 ➜ /workspaces/sandbox $ yarn bud dev
yarn run v1.22.19
$ /workspaces/sandbox/node_modules/.bin/bud dev

╭ bud-sandbox [1/2] [a553285186ba10c9]                                                  ./dist
│
│ app
│  ◯ js/runtime.js                                                                    43.83 kB
│  ◯ js/app.js                                                                        83.25 kB
│
│ assets
│  ◯ logo.svg                                                                          1.21 kB
│  ◯ index.html                                                                      383 bytes
│  ◯ external/src/simple.h                                                           339 bytes
│  … 4 additional assets not shown
│
╰ 248ms 27 modules [27/27 modules cached]

╭ ☰ bud-sandbox (embedded) [2/2] [c129908b55232ae8a331]                        ./dist-embedded
│
│ app
│  ◉ css/app.css                                                                   ✔ 645 bytes
│  ◉ app.js                                                                          ✔ 1.89 kB
│
│ assets
│  ◉ external/build/index.html.gz.S                                                   10.18 kB
│  ◉ index.html                                                                        2.85 kB
│  ◉ external/build/index.html.gz                                                      1.57 kB
│  ◉ external/src/simple.h                                                           339 bytes
│  … 4 additional assets not shown
│
╰ 400ms 3 modules [3/3 modules cached]

Network

 › Dev    ┄ http://0.0.0.0:3000/
          ┄ http://172.16.5.4:3000/
```

## What, why and how

When writing code for embedded systems, we're often constrained by resources. Whether that be RAM, ROM, flash space or CPU cycles, we have a lot to think about that higher-level programmers don't need to bother with. If we want to build in a web app and server to our device, to implement a control panel for example, a seemingly simple requirement can quickly become fraught with gotchas and complexity.

Although adding a full filesystem to serve a web app from firmware is 'easy' ([SPIFFS](https://docs.espressif.com/projects/esp-idf/en/latest/esp32/api-reference/storage/spiffs.html) for example), the driver code takes up flash space, and stack space, and the flash storage has to be partitioned in such a way to support the filesystem. It's overkill if all we want to do is serve a single page web application. We could just store our HTML app as a single string, but inlining and managing assets by hand is slow and error-prone.

This is where this extension comes in - `bud-embedded` will compress and concatenate your web app in its entirety into a single file (or single *string*), which you can compile straight into your app. To serve the app from your embedded device, all you need to do is compile in a tiny HTTP server, and then just respond with that string. The browser will make no other requests for assets (except, perhaps, a favicon). In addition to saving flash space, you've also saved CPU cycles from having to respond to multiple requests for assets.

`bud-embedded` actually splits your project in two. You'll notice that instead of a single `dist` directory, you now have an additional `dist-embedded` directory. There's an important distinction between the two: `dist` contains a normal web build, and `dist-embedded` contains assets built specifically for inclusion in firmware. See the FAQ for why we have two parallel builds.

Your embedded-ready app lives at `dist-embedded/index.html`. You can include this in your firmware via a method of your choice ([In ESP-IDF, we use EMBED_FILES](https://docs.espressif.com/projects/esp-idf/en/latest/esp32/api-guides/build-system.html#embedding-binary-data)).

The extension also supports compressing and generating an assembler code version of your app. You can pass this ASM that's been generated at `dist-embedded/external/build/index.html.S` to your toolchain. [You can even drop assembler into an Arduino sketch](https://forum.arduino.cc/t/how-to-use-assembler-together-with-arduino-libraries/470783).

**There is a now a basic Arduino / ESP32 example in [`bud-embedded-examples`](https://github.com/talss89/bud-embedded-examples). I will be adding other examples in time.**

That's the general gist of `bud-embedded`, but there are a number of other useful features, so be sure to read on.

## `bud.config.js` examples

### Add HTML to `<body>`

The extension needs to build your HTML for you, but you can add HTML to the final file by specifying a file to include in the `<body>` tag.

You can set header tag values via `bud.html()` as normal, but do not override the template.

```js
export default async (bud: Bud) => {

    bud.embedded.set('body', bud.path('@src/app.html'))

}
```

### Compress with gzip

Compress your embedded app at build-time using `gzip` (or `deflate`, or `brotli`). This can significantly reduce file size (plus, we don't need to use the device CPU to compress on the fly), and most browsers can decode compressed formats. Just make sure you send a `Content-Encoding: <type>` header in response!

```js
export default async (bud: Bud) => {

    bud.embedded.set('compress', 'gzip')

}
```

### Proxy to a real device under test

I imagine your app uses AJAX or Websockets. Using the Bud HMR is great, until you need to access an API endpoint hosted on the embedded device itself.

If you configure your device to join your network, and assign itself an IP, you can use `bud.setProxyUrl()` to pass requests upstream to the device. You then have the best of both worlds: hot-reloading and real hardware to interact with.

```js

export default async (bud: Bud) => {

    bud.setProxyUrl(`http://your-device-ip-or-hostname`)

}

```

### Don't generate assembler

By default `bud-embedded` generates an assembler (ASM) version of your asset at `/dist-embedded/external/build/index.html.s`. Disable this as follows:

```js
export default async (bud: Bud) => {

    bud.embedded.set('emitAssembler', false)

}
```

## How to reference the `index.html` asset from C / C++

> **:warning: The app bundle 'string' is not null-terminated. Always use use the `index_html_length` symbol, or calculate the length using the `_binary_index_html_start` and `_binary_index_html_end` symbols.**

To get a reference to your application bundle (which can be sent to the browser as HTML), compile your firmware, and include the `./dist-embedded/external/build/index.html.S` file. This is an Assembler (ASM) file containing your app.

In C, or C++, you can get a pointer to this string in RAM, and its length using the following syntax:

```c
extern const char index_html_start[] asm("_binary_index_html_start"); // A pointer to our web app index.html
extern const uint32_t index_html_len asm("index_html_length"); // The length of the index.html page
```

> :interrobang: If using compression (`bud.embedded.set('compress', 'gzip')`), the filename of your assembler source will change, as well as the symbol definitions. `gzip` will add a `.gz` suffix, and the symbols will need to be referenced like so: `_binary_index_html_gz_start`

## Bridge JS and C - Cross-define symbols

Cross definitons are symbols which are defined in a JSON manifest, but are then available both in the web application via `import` or `require()` and the embedded firmware binary via C header / `typedef enum`. They are really powerful, and can save a huge amount of manual work.

I need to expand the documentation here, but more info and an [example manifest](https://github.com/talss89/cross-def/blob/main/example/manifest.json) is available at https://github.com/talss89/cross-def

A cross definition manifest should have the extension `.xd.json`. Loading these files via `import` or `require` will allow you to access the symbol values. When the project is built, C code is generated containing `typedef enum` declarations for the symbols.

### Example

A manifest containing types of fruit and vegetables (`./src/fruit_veg.xd.json`):

```json
{
    "config": {
        "lang": {
            "c": {}
        }
    },
    "define": [
        {
            "lang": {
                "c": {
                    "type": "typedef enum",
                    "name": "fruit_t"
                },
                "json": {
                    "type": "map",
                    "name": "fruit"
                }
            },
            "symbols": [
                "ORANGE",
                "APPLE",
                "LEMON",
                "LIME"
            ]
        },
        {
            "lang": {
                "c": {
                    "type": "typedef enum",
                    "name": "veg_t"
                },
                "json": {
                    "type": "map",
                    "name": "veg"
                }
            },
            "symbols": [
                "BROCCOLI",
                "CARROT",
                "POTATO",
                "CAULIFLOWER"
            ]
        }
    ]
}
```

This can then be accessed in JS by importing it:

```js
import boxOfFood from 'fruit_veg.xd.json';

console.log(boxOfFood.fruit.ORANGE); // Outputs 0
console.log(boxOfFood.fruit.LIME); // Outputs 3
console.log(boxOfFood.veg.POTATO); // Outputs 2
```

But if we configure Bud via `bud.config.js` to export these symbols to C:

```js
export default async (bud: Bud) => {

    bud.embedded.crossDefine({
        manifest: bud.path('@src/fruit_veg.xd.json'),
        langs: ['c']
    })

}
```

We then get a C header file emitted as an asset at `./dist-embedded/external/src/fruit_veg.h`:

```c
/* This file is generated automatically. DO NOT EDIT. */

#pragma once

#ifdef __cplusplus
extern "C" {
#endif

typedef enum {
    ORANGE = 0x0,
    APPLE = 0x1,
    LEMON = 0x2,
    LIME = 0x3,
} fruit_t;

typedef enum {
    BROCCOLI = 0x0,
    CARROT = 0x1,
    POTATO = 0x2,
    CAULIFLOWER = 0x3,
} veg_t;

#ifdef __cplusplus
}
#endif
```

Now your fruit and veg IDs are consistent across C and Javascript. Cross defs also support string labels, and will produce a corresponding `const char*` array in C for easy use within firmware.

## FAQ

### Why split the bud context into `dist` and `dist-embedded`? Do you realise we already have development and production mode?

Believe me, I didn't want to do this. But there is a method to this madness.

We often want to flash code to devices, even in development, but we don't want to bloat our binary size with HMR code, and we also want everything minimized. That sounds a lot like production mode, doesn't it? ...but we **do** actually want file watching and hot-reloading. Just hosted on our local machine. Splitting the compiler into non-embedded (`dist`) and embedded (`dist-embedded`) instances allows us to watch, and hot-reload our web app as normal, but also produce compressed firmware-ready assets ready to be flashed to our development device as and when we need.

For actual production builds (like flashing for mass manufacture), we use `bud build production`.

### What is with the templating a template for a template deal with `html-webpack-plugin`?

Ugh. This took me ages.

If you look at the source for this extension, you'll see a lodash template is being constructed from an interpolated lodash template to be used as a template for the main app HTML.

Essentially, `html-webpack-plugin` doesn't give us enough flexibility in terms of a hook API to set up module and asset dependencies for inlining emitted assets in the HTML template. `require()` inside the template will set up dependencies perfectly, but it can only accept string literals, not variables, so I've taken the approach of writing a template to `@os-cache` which references each emitted JS and CSS asset with `require()`, as a literal.

If anyone has a better solution, I'm all ears.

---

*Thank you to my amazing partner Rachel, who fed and watered me, and walked my dog Rosie whilst I sessioned this over the hottest day of the year, and last weekend of summer. I'm sorry :heart:.*
