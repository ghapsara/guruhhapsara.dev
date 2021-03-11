---
kind: post
published: false
title: title
date: 2020-09-23T15:53:56.574Z
path: /sample
tags:
  - rxjs
  - animation
description: >-
  the description goes here
background: "#7fc7af"
color: white
cover: "./cover.png"
coverAuthor: ""
coverUrl: ""
---

This is my first Gatsby post written in Markdown!

<!-- ![image](./cover-1.jpg) -->

### Bash

```bash
ENV=PRODUCTION
echo $ENV
```

some texts here

### Javascript

```javascript
import { useThree } from "react-three-fiber"
import { lerp } from "canvas-sketch-util/math"

a
// comments here comments here comments here
export function useY(h, t) {
  const {
    viewport: { height },
  } = useThree()

  const y0 = height * 0.5
  const y1 = height * (h - 0.5)

  const y = lerp(-y0, y1, t) * -1

  return y
}
```

`draggable` is, as you’d expect, the attribute that makes a DOM node draggable. We simply set the attribute of the component, and handle the `dragStart` event to get the content of the component. Unfortunately, the HTML5 API does not allow for draggables to transfer JavaScript, so we’ll have to perform a workaround.

### Using the components in our application

One thing to note is that we can’t transfer actual objects or records through the API, so when we include the component into our template, we have to set its content to the record’s ID.

Here’s a simple example of an interface for adding users to a new ‘team’ record we want to save:

```handlebars
<div class="selected-users">
  {{#draggable-dropzone dropped="addUser"}}
    <ul class="selected-users-list">
      {{#each user in selectedUsers}}
        <li>{{user.fullName}}</li>
      {{/each}}
    </ul>
  {{/draggable-dropzone}}
</div>

<div class="available-users">
  {{#each user in users}}
    {{#draggable-item content=user.id}}
      <span>{{user.fullName}}</span>
    {{/draggable-item}}
  {{/each}}
</div>
```

If you recall, we sent an action on `drop` in the `draggable-dropzone` component:
