# CodeMirror Multi-Language Support Example

This document demonstrates the syntax highlighting capabilities for various languages within fenced code blocks.

## JavaScript Example

**script.js**

```javascript
// Print a message to the console
console.log("Hello, world!");

// Function to add two numbers
function add(a, b) {
  return a + b;
}

console.log(add(5, 3));
```

## HTML Example

**index.html**

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>HTML Example</title>
    <script>
      console.log("Embedded JavaScript in HTML");
    </script>
  </head>
  <body>
    <h1>Hello, HTML!</h1>
    <p>This is a sample HTML snippet.</p>
  </body>
</html>
```

## CSS Example

**styles.css**

```css
/* CSS for a simple button */
button {
  background-color: #4caf50;
  color: white;
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

button:hover {
  background-color: #45a049;
}
```

## Markdown Example

**README.md**

```markdown
# Markdown Example

Here is a list:

- Item 1
- Item 2
  - Subitem 2.1
  - Subitem 2.2

Here is some **bold text**, _italic text_, and `inline code`.

> This is a blockquote.

And a [link to CodeMirror's website](https://codemirror.net/).
```
