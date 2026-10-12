# Contributing to Vertical Tabs

Thanks for helping out. Bug reports, ideas and pull requests are all welcome.

## Before you start

Please search existing [issues](https://github.com/oxdc/obsidian-vertical-tabs/issues?q=is%3Aissue) and [discussions](https://github.com/oxdc/obsidian-vertical-tabs/discussions) first. If you have an idea for a new feature, open it in [ideas](https://github.com/oxdc/obsidian-vertical-tabs/discussions/categories/ideas) before writing any code so we can agree on the design. Feature PRs that skip this step may be declined. Bug fixes can go straight to a PR, but please leave a comment on the issue first if the fix is not trivial.

## Reporting bugs

Use one of the [issue forms](https://github.com/oxdc/obsidian-vertical-tabs/issues/new/choose) and fill in what it asks for. Please check that the bug still happens with other plugins disabled and on the latest version. You can find **Show debug info** and **Copy plugin settings** under *Settings → Vertical Tabs → Show debugging tools*. If group names, colors or other customizations are not being saved, run **Diagnose IndexedDB** in the same place and paste the log into your report.

## AI-assisted contributions

You can use AI to help write your code, as long as you fully understand the code and the context around it. PRs generated purely by AI will be closed. In your PR, say whether you used AI, what it helped with, and how you reviewed and tested the result.

Large or complex changes need to be discussed and agreed on first, and they should fit the design and goals of Vertical Tabs. Otherwise they will be closed.

Whoever submits a PR is responsible for it, so please don't list an AI as an author or co-author anywhere in your commits.

## Development setup

You will need Git, Node.js 20 or newer, and a separate vault for development. Please don't use your main vault.

First, fork this repository on GitHub. Then clone your fork and build it:

```bash
git clone https://github.com/<you>/obsidian-vertical-tabs.git
cd obsidian-vertical-tabs
npm ci
npm run build
```

Copy `main.js`, `styles.css` and `manifest.json` from the repo root into `<dev-vault>/.obsidian/plugins/vertical-tabs/` and enable the plugin. Every time you change the code, run `npm run build` again, copy the files over, and reload Obsidian.

Run `npm run lint` before you open a PR. You can ignore `env.example` and the signing scripts, since they are only used for beta releases.

## Code guidelines

Please follow Obsidian's [plugin guidelines](https://docs.obsidian.md/Plugins/Releasing/Plugin+guidelines) and [developer policies](https://docs.obsidian.md/community-directory/developer-policies). The ones that come up most often here:

- Don't use `innerHTML`. Build elements with React or `createEl`.
- Wrap every listener and patch in `register`, `registerEvent` or `registerDomEvent` so the plugin cleans up when it is disabled.
- Use `activeDocument` and `activeWindow` so popout windows keep working.
- Avoid layout reads or store updates on every keystroke or editor change.
- Don't add network requests.

The plugin also runs on mobile, so Node and Electron APIs must stay behind `Platform.isDesktopApp`.

If you use a private Obsidian API, take its types from `obsidian-typings`. If you need to extend an Obsidian API with your own properties or methods, declare them in `src/types/`. In both cases, handle the case where the API is missing and mention it in your PR.

Before you submit, check your change on desktop, in mobile emulation (`this.app.emulateMobile(true)` in the console), and in a popout window.

## Pull requests

Branch from `master` and open your PR against `master`. **Never base a PR on the `beta` branch.** It is not used for development, and PRs built on it will be closed.

Keep each PR to one topic, and leave version numbers, `versions.json` and `NEWS.md` alone because releases are handled by the maintainer. In the description, explain what changed and why, link the issue, say how you tested it, and add a screenshot or GIF if the change affects the UI.

## License and forks

Vertical Tabs is released under the [MIT License](LICENSE), and by contributing you agree that your work is released under it too.

You are free to fork and modify the public code in this repository. **However, submitting a fork to Obsidian's Community Directory is not allowed. Rebranding the plugin or publishing it under the same or a confusingly similar name is not allowed either.**

Code from beta builds is only available to [Beta Program](https://vertical-tabs-docs.oxdc.dev/Beta-Versions/beta-program) subscribers and is **not covered by the MIT License**. Modifying it, building on top of it or redistributing it violates the [Beta Program Terms](https://vertical-tabs-docs.oxdc.dev/Beta-Versions/terms). If you are a subscriber, please follow those terms.
