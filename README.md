# @webry/clone

A deno cli to clone a repo anonymously while preserving commit & file type statistics. Files and code are randomly generated and no real data
is copied.

## Install

```bash
deno install --global --allow-run="git" --allow-env --allow-read --allow-write --name webry-clone jsr:@webry/clone
```

## Usage

```bash
webry-clone -f ./from-gitlab-repo -t ./to-github-repo
```

Example: ![webry-clone](demo.png)
