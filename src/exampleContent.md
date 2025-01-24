---
layout: ../../layouts/BlogPost.astro
title: "Responsive Graphics"
date: "2025-01-24"
description: "How to create graphics that respond to resize and work on mobile"
---

Responsiveness is table stakes.

In today's era, you never know what device someone will be using to view your page or product, or how they set their browser zoom. It's important to make sure your graphics look good and work well on all devices, which the [previous example](../clickable-circles) does not. In order to do this, I usually turn to the [ResizeObserver API](https://developer.mozilla.org/en-US/docs/Web/API/ResizeObserver) to detect changes in the size of the container element, and then update the graphics accordingly. This is a powerful API that allows you to detect changes in the size of an element, and respond to those changes in a performant way. In this article, I'll show you one way to use the ResizeObserver API and [D3 Scales](https://d3js.org/d3-scale) to create responsive graphics that work well on all devices.

**[open full screen and resize](/examples/responsive-graphics/index.html) to try it out!**

<iframe src="/examples/responsive-graphics/index.html" width="100%" height="400px" style="border: none; border-radius: 4px;"></iframe>

[source code](https://github.com/curran/currankelleher.com/tree/main/public/examples/responsive-graphics)

## The Problem Statement

I like to phrase problems as user stories like this:

> As a developer of interactive data visualizations, I want to be able to use the latest `width` and `height` of the visualization container, so that I can develop rendering logic that is responsive to resize and works well on mobile.

How can we do that? Well, in broad strokes, we can use `ResizeObserver` to get notified of changes in width and height, then use `setState` to set `state.width` and `state.height` when those things change. In general, the idea is to derive a definition of `width` and `height` that downstream code can use, such that it's always accurate, and triggers a re-render when the size of the container changes.

## Observing Dimensions

Let's observe dimensions by defining a new function `observeDimensions`! We need to do some housekeeping to get there, relative to the code as it was in the [previous example](../clickable-circles), which we're building on top of here. Namelu:

- Modify `renderSVG` so it doesn't measure the dimensions
- Set up the `main` function to orchestrate the flow of measured dimensions

**renderSVG.js**

```javascript
import { select } from "d3";

export const renderSVG = (container, { width, height }) =>
  select(container)
    .selectAll("svg")
    .data([null])
    .join("svg")
    .attr("width", width)
    .attr("height", height)
    .style("background", "#F0FFF4");
```

Firstly, we modify our `renderSVG` function to accept width and height passed in from the outside rather than measure it internally (as it did previously). This makes the function more "dumb" and shifts the responsibility of knowing the dimensions to the caller, namely `main` defined in `index.js`, paving the way for `main` to use the new `observeDimensions` function.

**index.js**

```javascript
import { data } from "./data.js";
import { observeDimensions } from "./observeDimensions.js";
import { renderSVG } from "./renderSVG.js";
import { renderCircles } from "./renderCircles.js";
import { clickableCircles } from "./clickableCircles.js";

export const main = (container, { state, setState }) => {
  const dimensions = observeDimensions(container, { state, setState });
  if (!dimensions) return;
  const { width, height } = dimensions;
  const svg = renderSVG(container, { width, height });
  const circles = renderCircles(svg, { data, width, height });
  clickableCircles(circles, { data, state, setState, dimensions });
};
```

Here, we invoke `observeDimensions`, which is responsible for:

- Setting up the `ResizeObserver` _only once_
- Ensuring the application re-renders when resized
- Returning the measured dimensions

In our wacky and wonderful world of "unidirectional data flow", we can use the **early return pattern** to bail out of the control flow when downstream code needs to wait for something. In this case, `observeDimensions` may return `null`, which signifies that downstream code should hold off on running for the time being. This is a pattern that makes it "safe" for functions to synchronously invoke `setState` without needing to worry about potential extra renders or infinite loops.

Additionally, we then change around how `renderCircles` and `clickableCircles` relate to one another, calling them both from `main`. This allows us to make it very clear which functions depend on what values. We now are passing `width` and `height` into `renderCircles` so that the circle positions can be derived from the measured dimensions. We then pass the circles selection into `clickableCircles`, which remains pretty much the same as it was before.

**observeDimensions.js**

```javascript
export const observeDimensions = (container, { state, setState }) => {
  if (!state.dimensions) {
    new ResizeObserver(() => {
      const dimensions = {
        width: container.clientWidth,
        height: container.clientHeight,
      };
      setState((state) => ({ ...state, dimensions }));
    }).observe(container);
    return null;
  }
  return state.dimensions;
};
```

Here's the main character: the `observeDimensions` function. This function is responsible for setting up the resize observer. Since our `main` function is _idempotent_, meaning it can run multiple times, we want to only set up the resize observer on the first render. We can know that it's the first render by checking if `state.dimensions` is defined. If `state.dimensions` is _not_ defined, then we know it's the first render and we need to set up the resize observer.

Setting up the resize observer involves constructing a new `ResizeObserver` instance with a callback function, then calling `.observe(container)` to attach it to the given DOM element. The callback function is invoked once immediately, and again and again each time the container is resized. In order to handle the immediate invocation case, the return value from `observeDimensions` is `null` at the time the observer is set up. This is a signal to the caller to return early, which avoids extra renders.

The callback function itself does two things: measure the dimensions, and update the state. Measuring the dimensions could in theory be done by accessing the confusing `entries` data structure passed into it which is documented in the [MDN docs](https://developer.mozilla.org/en-US/docs/Web/API/ResizeObserver#examples)). However, I figure it's a lot simpler to use `clientWidth` and `clientHeight` on the DOM element, since we already have access to that and it works well for giving up-to-date dimensions.

Updating the state in the callback function assigns a new value to `state.dimensions` using the functional update pattern. Note that in this specific example, it's important to use `...state` to copy over the other state fields to the new state because otherwise we would lose track of `state.selectedDatum` on every resize.

## Dynamic Circle Positioning

The circles themselves should be re-positioned to fit nicely within the container. We can do this using D3 Scales.

**data.js**

```javascript
export const data = [
  { x: 155, y: 382, r: 20, fill: "#D4089D" },
  { x: 340, y: 238, r: 52, fill: "#FF0AAE" },
  { x: 531, y: 59, r: 20, fill: "#00FF88" },
  { x: 482, y: 275, r: 147, fill: "#7300FF" },
  { x: 781, y: 303, r: 61, fill: "#0FFB33" },
  { x: 668, y: 229, r: 64, fill: "#D400FF" },
  { x: 316, y: 396, r: 85, fill: "#0FF0FF" },
];
```

The coordinates for the circles defined within `data.js` are hardcoded. These coordinates were optimized for the viz dimensions of `{ width: 960, height: 500 }`, as was the default in the venerable and now defunct `bl.ocks.org` (but still visible in the open source clone [blocks.roadtolarissa.com](https://blocks.roadtolarissa.com/)) and is currently the default in [VizHub](https://vizhub.com/), a playground for dataviz development and learning. In order to re-position the circles to fit nicely within the container, let's leverage D3 Scales, namely `scaleLinear` which performs [linear_interpolation](https://en.wikipedia.org/wiki/Linear_interpolation).

**renderCircles.js**

```javascript
import { scaleLinear } from "d3";
const xScale = scaleLinear().domain([0, 960]);
const yScale = scaleLinear().domain([0, 500]);
export const renderCircles = (svg, { data, width, height }) => {
  xScale.range([0, width]);
  yScale.range([0, height]);

  return svg
    .selectAll("circle")
    .data(data)
    .join("circle")
    .attr("cx", (d) => xScale(d.x))
    .attr("cy", (d) => yScale(d.y))
    .attr("r", (d) => d.r)
    .attr("fill", (d) => d.fill)
    .attr("opacity", 700 / 1000);
};
```

Here we define two instances of `scaleLinear`: `xScale` and `yScale`. Both have a fixed _domain_, which is the space of data values passed in. The _range_ represents the coordinate space to project into, which is set dynamically based on the passed in `width` and `height`. When the `cx` and `xy` attributes are set, we pass the raw data values through the scales as functions, which projects them from the domain to the range using linear interpolation.

See also [Svelte + D3: Scales and responsive visualizations](https://www.youtube.com/watch?v=FxIl_o48sJo&list=PLNvnDrMLMSipfbxSp1Z4v9Ydu2ud5i9V8&index=2), an excellent tutorial by [Dr. Matthias Stahl](https://www.higsch.com/about/) that inspired the design of this example.

**clickableCircles.js**

```javascript
import { renderCircles } from "./renderCircles.js";
export const clickableCircles = (circles, { data, state, setState }) => {
  circles
    .attr("cursor", "pointer")
    .on("click", (event, selectedDatum) => {
      setState((state) => ({ ...state, selectedDatum }));
    })
    .attr("stroke", "none")
    .filter((d) => d === state.selectedDatum)
    .attr("stroke", "black")
    .attr("stroke-width", 5)
    .raise();
};
```

Furthermore, note that the `clickableCircles` function remains mostly the same as it was in the [previous example](../clickable-circles), just slightly altered so that it accepts the `circles` selection as input. Now that we have `state.dimensions` in the mix, it's _absolutely critical_ that we use the `...state` pattern to copy over the other state fields to the new state, otherwise we would lose track of `state.dimensions` every time we selected a new circle!

## Conclusion

To test out the whole setup, you can resize the page and observe that the circles get closer and farther apart, spreading out to fill the container. Verify that clicking to select and resizing are both working at the same time. If you wanted to take it even further, you could scale the radius as well. I'll leave that as an "exercise for the reader".

This is just a toy example to demonstrate the concept of responsive graphics using D3 Scales and the ResizeObserver API. In real-world data visualizations, there are many more considerations to take into account, such as axis labels, legends, and tooltips. In general, once you get basic responsiveness working, simply propagating the measured dimensions to your scales is not enough. You'll need to test for specific use cases and iterate to make it really work for the specific case at hand. The beauty of this approach is that once you have dimensions available in code, you can use them to make all sorts of decisions about how to render your visualization.

In this article, we've seen how to use the ResizeObserver API and D3 Scales to create responsive graphics that work well on all devices and respond to resize. We've also seen how to structure the code in a way that makes it easy to reason about and maintain. This lays the foundation for future examples that use more advanced types of responsive design for visualizations such as density-based tick marks and dynamic label alternatives based on size. I hope you found this article helpful, and I look forward to seeing what you build with it!

<details>
<summary>Full code listing</summary>

**setup.js**

```javascript
import { main } from "./index.js";
const container = document.getElementById("viz-container");

let state = {};

const setState = (next) => {
  state = next(state);
  render();
};

const render = () => {
  main(container, { state, setState });
};

render();
```

**index.html**

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Clickable Circles</title>
    <link rel="stylesheet" href="styles.css" />
    <script type="importmap">
      { "imports": { "d3": "https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm" } }
    </script>
  </head>
  <body>
    <div id="viz-container"></div>
    <script type="module" src="./setup.js"></script>
  </body>
</html>
```

**styles.css**

```css
html,
body {
  margin: 0;
  padding: 0;
  height: 100%;
  overflow: hidden;
}

#viz-container {
  width: 100%;
  height: 100%;
}
```

</details>
