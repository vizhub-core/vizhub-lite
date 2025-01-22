---
layout: ../../layouts/BlogPost.astro
title: "Clickable Circles"
date: "2025-01-23"
description: "Introduction to state management for interactive graphics"
---

One of the strong points of D3.js is that it enables you to create arbitrarily complex and custom _interactions_. D3 provides low-level primitives for dealing with interaction events and rendering updates, but _does not_ prescribe a particular way to manage state. This is a good thing, because it allows you to use the state management approach that is most appropriate for your particular application. In this article, I'll show you how to create a simple example of clickable circles using D3.js, using my own personal favorite state management pattern: unidirectional data flow. This example will serve as a foundation for future articles that explore more complex interactions and state management patterns.

<iframe src="/examples/clickable-circles/index.html" width="100%" height="400px" style="border: none; border-radius: 4px;"></iframe>

[source code](https://github.com/curran/currankelleher.com/tree/main/public/examples/clickable-circles)

## State Management Setup

The state management pattern I like to use is a unidirectional data flow pattern. This pattern is similar to the one used in React, Redux, and Elm. The idea is that you have a single source of truth for the state of the application, and you pass that state down to components via functions. When a component needs to update the state, it calls a function that updates the state and then re-renders the component. This pattern is simple, predictable, and easy to reason about. It's also very flexible, and can be used to build complex applications with minimal boilerplate.

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
    <script type="module">
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
    </script>
  </body>
</html>
```

Here is an implementation of unidirectional data flow that is extremly small and simple, yet powerful enough for us to get started. The `index.html` file is the entry point for the application. It imports the `main` function from the `index.js` file, and then sets up the state management logic. The imported `main` function is then called with the container element (as in the [previous post](../d3-basics)), but this time with a second argument that contains the `state` and `setState` functions.

The `state` object is used to store the state of the application (initially an empty object), and the `setState` function is used to update the state and re-render the application. The `render` function is called to render the application for the first time, and then the `main` function is called to render the application, passing in the latest state. This pattern of calling `main` with the latest state and `setState` function is what enables the unidirectional data flow pattern.

To update the state, we can call `setState`, passing a _function_ that takes as input the previous version of the state and returns as output the next version of the state. This type of function is often called a _reducer_ function, and it is responsible for updating the state in response to events. The `setState` function then updates the state with the new state returned by the reducer function, and re-renders the application. This pattern enables updating multiple state properties at once in a single call, and also enables deriving new state properties from existing state properties.

## Passing State to Components

To give nested functions / components access to the current state and the ability to update state, we can simply pass the `state` and `setState` functions as arguments to the nested functions. This is what we do in the `main` function.

**index.js**

```javascript
import { data } from "./data.js";
import { renderSVG } from "./renderSVG.js";
import { clickableCircles } from "./clickableCircles.js";

export const main = (container, { state, setState }) => {
  const svg = renderSVG(container);
  clickableCircles(svg, { data, state, setState });
};
```

The `main` function takes a `container` DOM element as an argument, and an object that contains the `state` and `setState` functions. The `main` function then calls the `renderSVG` function with the `container` element to create an SVG element, and then calls the `clickableCircles` function with the SVG element, the `data` array, and the `state` and `setState` functions to render circles on the SVG. This is how we can give access to the state and the ability to update the state to nested functions.

## Making Circles Clickable

The goal is to make it so when you click on a circle, it becomes highlighted. There are several steps to make this happen:

- Add an affordance to the circles to indicate they are clickable
- Add an event listener to the circles to respond to click events
- Update the state when a circle is clicked
- Update the rendering logic to highlight the clicked circle

**renderCircles.js**

```javascript
export const renderCircles = (svg, { data, state, setState }) =>
  svg
    .selectAll("circle")
    .data(data)
    .join("circle")
    .attr("cx", (d) => d.x)
    .attr("cy", (d) => d.y)
    .attr("r", (d) => d.r)
    .attr("fill", (d) => d.fill)
    .attr("opacity", 700 / 1000);
```

The `renderCircles` function from the [previous post](../d3-basics) remains unchanged. It is shown here for reference. Note that it returns the selection implicitly, which allows us to work with it in downstream code.

**clickableCircles.js**

```javascript
import { renderCircles } from "./renderCircles.js";
export const clickableCircles = (svg, { data, state, setState }) => {
  renderCircles(svg, { data })
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

The `clickableCircles` function calls the previously defined `renderCircles` function to render the circles on the SVG. Since that function returns a selection of the circles, we can further chain calls onto it. The first thing we do is set `.attr("cursor", "pointer")` to indicate that the circles are clickable. This makes it so that when you hover over it, the cursor changes to indicate it is clickable. This is called an "affordance" of interaction. It's very important to do this so users know the element is clickable.

Next, we add an event listener to the `"click"` event using the `on` method of D3 Selections. This lets us pass a callback function that gets invoked when the user actually clicks on the circle. The first argument to the callback is the DOM Event object (which we don't need to use here), and the second argument is the data bound to the clicked circle. We take the approach of setting `state.selectedDatum` to be the actual row object from the `data` array that corresponds to the clicked circle.

In the click event listener callback, we use the "functional update" pattern to update the state. This pattern involves passing a function to `setState` that takes the previous state as input and returns the next state as output. In this case, we use the spread operator to copy the previous state into a new object, and then add a new property `selectedDatum` to the new object. Even though `selectedDatum` is the only property on the state object for now, I like to use the spread operator here as a "best practice" to preserve other state properties that may be added in the future.

The last few lines here implement the rendering logic for making a given circle appear to be selected. We begin by re-setting all circles to have `.attr("stroke", "none")`, which removes any stroke that may have been set previously. We then use the `.filter` method to filter the selection of circles to only include the one that matches `state.selectedDatum`. Then on that one circle, we then set the stroke color to black, the stroke width to 5, and raise the circle to the top of the SVG so it appears on top of the other circles. This is one way to implement rendering logic for making a given circle appear to be selected.

## Conclusion

In this article, we covered the basics of state management for interactive graphics using D3.js. We implemented a simple example of clickable circles, and showed how to use unidirectional data flow to manage the state of the application. We also showed how to pass the state and setState functions to nested functions, and how to update the state in response to events. We also showed how to update the rendering logic to respond to changes in the state. This example serves as a foundation for future articles that explore more complex interactions and state management patterns. I hope you enjoyed this article, and I look forward to sharing more with you in the future!

<details>
<summary>Full code listing</summary>

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

**renderSVG.js**

```javascript
import { select } from "d3";

export const renderSVG = (container) =>
  select(container)
    .selectAll("svg")
    .data([null])
    .join("svg")
    .attr("width", container.clientWidth)
    .attr("height", container.clientHeight)
    .style("background", "#F0FFF4");
```

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

</details>
