# ECharts Extension

This extension integrates [ECharts](https://github.com/apache/echarts) into Yank Note.

## Usage

~~~markdown
```js
// --echarts--
chart => chart.setOption({
  xAxis: {
    type: "category",
    data: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
  },
  yAxis: {
    type: "value"
  },
  series: [
    {
      data: [150, 230, 224, 218, 135, 147, 260],
      type: "line"
    }
  ]
}, true)
```
~~~

## Screenshots
![](https://user-images.githubusercontent.com/7115690/167867511-b79ddf47-b5b3-4db0-b108-e01b6c24954c.png)
