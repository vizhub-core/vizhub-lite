---
layout: ../../layouts/BlogPost.astro
title: "Getting Started with D3.js"
date: "2024-01-16"
description: "A brief introduction to D3.js and Web Technologies"
---

D3.js is a powerful JavaScript library for interactive data visualizaion. It's a great tool for creating custom visualizations that are not possible with off-the-shelf charting libraries. D3.js is a low-level library that provides a set of primitives for creating visualizations. It's not a charting library like Chart.js or Highcharts. Instead, D3.js provides a set of building blocks that you can use to create custom visualizations. In this post, I'll show you one way to get started with D3.js.

<iframe src="../examples/d3-basics/index.html" width="100%" height="500px"></iframe>

## Setting up a Development Environment

There are many ways to start a JavaScript project. Since my focus is on teaching D3 and visualization to a wide audience who may not be familiar with the JavaScript ecosystem, I prefer to use Vanilla JS and a simple HTML file to get started. Even within that paradigm, there are various ways to include the D3 library. My preference is to fully leverage the latest version of JavaScript modules called ES Modules. That way, you can write code that lives in multiple files, and you can import and export functions between those files. Here's how you can set up a simple project with D3.js using ES Modules.

**index.html**

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>D3 Example</title>
    <link rel="stylesheet" href="styles.css" />
    <script type="importmap">
      { "imports": { "d3": "https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm" } }
    </script>
  </head>
  <body>
    <div id="viz-container"></div>
    <script type="module">
      import { main } from "./index.js";
      main(document.getElementById("viz-container"));
    </script>
  </body>
</html>
```

The `index.html` file is the entry point that defines the Web page. In order to view this page, you'll need to start a local HTTP server. That can be done with the following command (assuming you have Node.js installed):

```bash
npx http-server
```

In this particular `index.html`, the things leading up to `<title>` are just standard HTML boilerplate that makes the page "valid HTML" and makes it work consistently across devices. The `<link>` tag is used to include a CSS (Cascading Style Sheets) file called `styles.css`, whose main purpose is to create a space for us to use that fills the screen. The `<script type="importmap">` tag is used to define an import map that maps the package name `d3` to the URL of the D3.js library. This lets us import things from the D3 package using ES Module syntax. The `<script type="module">` tag is used to import the `main` function from the `index.js` file and call it with the `#viz-container` DOM element.

## Filling the Entire Page

We want to occupy the full width and height of the page. Here's one way to do that with CSS:

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

The content of `styles.css` is some CSS that makes the `#viz-container` element fill the screen. This is a common pattern in D3.js visualizations, where you create a container element that fills the screen and then append SVG elements to that container. This setup works well for embeds and responsive design. The `html, body` CSS rules remove the default margin and padding from the page, and the `height: 100%; overflow: hidden;` rules make the page fill the screen and prevent scrolling. The `#viz-container` CSS rule makes the container element fill the screen. This gives us a nice "blank slate" to work with from the JavaScript entry point defined in `index.js`.

## Orchestrating the Rendering Logic

We need to orchestrate and connect the following:

- The data
- The top-level SVG element
- The circles to render within that element

**index.js**

```javascript
import { data } from "./data.js";
import { renderSVG } from "./renderSVG.js";
import { renderCircles } from "./renderCircles.js";

export const main = (container) => {
  const svg = renderSVG(container);
  renderCircles(svg, { data });
};
```

The `index.js` file is the entry point for the JavaScript code. It serves to orchestrate the entire flow of the application and connect all the pieces together. This module imports the `data` array from the `data.js` file, the `renderSVG` function from the `renderSVG.js` file, and the `renderCircles` function from the `renderCircles.js` file. It then exports a `main` function that takes a `container` DOM element as an argument. The `main` function calls the `renderSVG` function with the `container` element to create an SVG element, and then calls the `renderCircles` function with the SVG element and the `data` array to render circles on the SVG.

## The Top-Level SVG Element

To use SVG, we need to define a single element that will contain all the other elements, namely the circles.

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

The `renderSVG` function is responsible for setting our top-level Scalable Vector Graphics (SVG) element. It uses the `select` function from D3 to select the `container` element, then uses the `selectAll` function to select all `svg` elements inside the `container`. The `data` function is used to bind the `null` data to the selection, and the `join` function is used to create an `svg` element for each data item. This incantation of `selectAll`, `data`, and `join` is a common pattern in D3.js for creating elements based on data.

This data join pattern ensures "idempotent rendering", meaning that the rendering code can be called multiple times without duplicating elements. This is not an important property for this first simple example that just renders some circles, but as we start layering on interactivity and dynamic state, this idempotent property of the rendering logic will become absolutely critical. This is why I like to start with this pattern from the very beginning, making all rendering logic robust to multiple invocations.

The `attr` function is used to set the `width` and `height` attributes of the SVG element to the width and height of the `container` element. The `clientWidth` and `clientHeight` properties of the `container` element provide the correct dimensions due to the CSS rules defined in `styles.css`. I like to use this approach to measure the container size because it also works in situations where you don't use the entire screen, but rather have D3 rendering logic invoked from within a component. While this is not "responsive" in that it just measures the size once, it's a first step towards responsive design.

Finhally, the `style` function is used to set the `background` style of the SVG element to a light green color. While the `attr` function sets DOM attributes, the `style` function sets CSS styles. Specifically, it sets "inline styles" that live in the `style` attribute of the element. This is a common pattern in D3.js for setting styles that are not defined in a CSS file. Personal preference comes into play when it comes to where styles like this _should_ be defined. My personal preference for developing examples is to always use inline styles, so that the example is as portable as possible. This way, you can copy and paste the example into a new context and it will work as expected.

## Defining the Data

The data for this example is defined as an array of objects that represent circles to render on the SVG.

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

The module defined in `data.js` exports an array of objects that represent circles to be rendered on the SVG. Each object has `x`, `y`, `r`, and `fill` properties that define the position, radius, and fill color of the circle. While this example has a direct correspondence to the circles to render, in a real-world application, the data would likely come from an external source, such as a CSV file or an API, and would then be transformed to pixel coordinates and colors using D3 scales. In any case, the most common pattern in D3.js is to represent data as an array of objects, where each object represents a "data point" or "row in a table".

## Rendering Circles

The final piece of the puzzle is the rendering logic that creates the circles on the SVG.

**renderCircles.js**

```javascript
export const renderCircles = (svg, { data }) =>
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

After all that setup, we can finally express the core rendering logic that creates our circles! The `renderCircles` function is responsible for rendering circle elements within the SVG element. Once inside a top-level `<svg>` element, there are various element types that only make sense within that context, such as the `<circle>` element used here. Other common elements include `<rect>` for rectangles, `<text>` for text labels, and `<path>` for lines and shapes. This is how SVG graphics work in general. You have a top-level SVG element, and then you nest other elements inside it to create a visual scene.

Note the function signature of the `renderCircles` function. This is representative of a "functional" pattern that I personally have come to use all the time for decomposing D3 rendering logic into isolated parts. Namely the first argument is a D3 selection of some sort of containing element. In this case it's the top-level SVG, but as complexity grows, we can use `<g>` group elements to organize our scene into layers. The second argument is an object that contains all the data needed to render the circles, analogous to DOM attributes or React props. This is a pattern that I find very useful for organizing D3 rendering logic, as it makes it easy to see what data is needed for a particular rendering function.

Again we use the data join incantation of `selectAll`, `data`, and `join` to create a `circle` element for each data item. The `attr` function is used to set the `cx`, `cy`, `r`, `fill`, and `opacity` attributes of the `circle` elements based on the data. Note that these are defined as functions, where each data element is passed into the function to compute the attribute value for each element separately. This functional syntax for expressing the mapping from data to DOM attributes is one of the things that makes D3 uniquely suited for data visualization applications. Some have called this "declarative" programming, where you declare the desired state of the DOM based on the data, and D3 takes care of the rest. This is in contrast to "imperative" programming, where you would manually create and update DOM elements with constructs such as for loops.

The `cx` and `cy` attributes define the center of the circle, the `r` attribute defines the radius of the circle, and the `fill` attribute defines the fill color of the circle. The `opacity` attribute defines the opacity of the circle as a constant. The `opacity` attribute is set to `700 / 1000` to make the circles slightly transparent. Making the shapes semi-transparent like this gives more visibility into overlaps and density. It's a technique I like to use often.

The value `700 / 1000` is odd, I know. It's like that so that in VizHub, you can use the VZCode "interactive widgets" feature to hold Alt + drag on the `700` to manipulate it smoothly with instant feedback based on hot reloading. I personally think that's the coolest thing ever - the ability to get truly instant feedback when tweaking visual parameters like opacity. The fraction approach is a bit of a workaround for the fact that you only get integer resolution when dragging the number. Adjusting the number of zeros in the fraction is a way to get more or less precision when dragging the number. It's a bit of a hack, but it works well in practice.

## Takeaways

My point with this article is to express my strongly opinionated view on how to approach interactive visualization development with D3. My opinions are:

- Embrace Web Standards
- Use ES Modules for code organization
- Avoid quirky frameworks for core functionality
- Always write idempotent rendering logic
- Use functional patterns for rendering logic
- Use inline styles for maximum portability

This is to lay the foundation for what's coming next: a series of articles that build on this foundation to create more complex and interactive visualizations. I hope you find this approach useful and that it helps you get started with D3.js. Stay tuned for more articles on D3.js and Web technologies!
