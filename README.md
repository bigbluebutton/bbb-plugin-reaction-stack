# Repository of a plugin for BigBlueButton

## Description

A brief description of the plugin including a screenshot and/or a short video.

## Theming

Other plugins (e.g. a theme plugin) can restyle the stack without depending on generated class names.

CSS variables, set on `:root` or any ancestor:

| Variable | Default | Controls |
|---|---|---|
| `--reaction-stack-radius` | `1.7rem` | Corner radius of each reaction pill and of the `+N` pill |
| `--reaction-stack-emoji-radius` | `50%` | Corner radius of the tinted disc behind the emoji |

```css
:root {
  --reaction-stack-radius: 0.5rem;
  --reaction-stack-emoji-radius: 0.375rem;
}
```

Stable class names, for anything else:

| Class | Element |
|---|---|
| `.bbb-reaction-stack` | The list that holds the reactions |
| `.bbb-reaction-stack__item` | One reaction pill |
| `.bbb-reaction-stack__emoji` | The emoji and its tinted disc |
| `.bbb-reaction-stack__name` | The user name |
| `.bbb-reaction-stack__overflow` | The `+N` pill shown when there are more than 6 reactions |

Prefix selectors with the list class (e.g. `.bbb-reaction-stack .bbb-reaction-stack__item`) so they win over the plugin's own styles.

## Building the Plugin

To build the plugin for production use, follow these steps:

```bash
cd $HOME/src/bbb-plugin-reaction-stack
npm ci
npm run build-bundle
```

The above command will generate the `dist` folder, containing the bundled JavaScript file named `BbbPluginReactionStack.js`. This file can be hosted on any HTTPS server along with its `manifest.json`.

If you install the Plugin separated to the manifest, remember to change the `javascriptEntrypointUrl` in the `manifest.json` to the correct endpoint.

To use the plugin in BigBlueButton, send this parameter along in create call:

```
pluginManifests=[{"url":"<your-domain>/path/to/manifest.json"}]
```

Or additionally, you can add this same configuration in the `.properties` file from `bbb-web` in `/usr/share/bbb-web/WEB-INF/classes/bigbluebutton.properties`


## Development mode

As for development mode (running this plugin from source), please, refer back to https://github.com/bigbluebutton/bigbluebutton-html-plugin-sdk section `Running the Plugin from Source`
