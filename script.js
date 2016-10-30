var width = 960,
    height = 660,
    padding = 4

var projection = d3.geoConicConformalSpain()
    .translate([width / 2, height / 2])
    .scale(3500)

var path = d3.geoPath()
    .projection(projection)

// Rectangle size
var rectSize = d3.scaleLog()
    .range([14, 80])

// Font size scale
var fontSize = d3.scaleLinear()
    .range([8, 16])

var color = d3.scaleQuantile()
    .domain([8, 35])
    .range(['#2166ac', '#4393c3', '#92c5de', '#d1e5f0', '#fddbc7', '#f4a582', '#d6604d', '#b2182b'])

var svg = d3.select('body').append('svg')
    .attr("width", width)
    .attr("height", height)

d3.json('provincias.json', function(err, data) {
    // 1. Features we are painting
    prov = topojson.feature(data, data.objects.provincias).features

    // Rect size scale
    rectSize.domain(d3.extent(prov, function(d) {return d.properties.pop }))

    // 2. Create on each feature the centroid and the positions
    prov.forEach(function(d) {
        d.pos = projection(d3.geoCentroid(d))
        d.x = d.pos[0]
        d.y = d.pos[1]
        d.area = rectSize(d.properties.pop) // How we scale
    })

    // Font size scale
    fontSize.domain(d3.extent(prov, function(d) {return d.area }))

    // 3. Collide force
    var simulation = d3.forceSimulation(prov)
        .force("x", d3.forceX(function(d) { return d.pos[0] }).strength(.1))
        .force("y", d3.forceY(function(d) { return d.pos[1] }).strength(.1))
        .force('collide', collide)

    // 4. Number of simulations
    for (var i = 0; i < 100; ++i) simulation.tick()

    // 5. Paint the cartogram
    var rect = svg.selectAll("g")
        .data(prov)
        .enter()
        .append("g")
        .attr("class", function(d) { return "prov " + d.properties.code })
        .attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")" })

    rect.append("rect")
        .each(function(d) {
            d3.select(this)
              .at({width: d.area, height: d.area, x: -d.area / 2, y: -d.area / 2})
              .at({fill: color(d.properties.paro), stroke: "white"})
          })

    rect.append("text")
        .each(function(d) {
            d3.select(this)
                .at({"text-anchor": "middle", "dy": 3})
                .text(d.properties.code)
                .style("font-size", fontSize(d.area) + "px")
                .style("font-family", "Helvetica Neue")
        })

    // Canary islands path
    svg.append("path")
        .style("fill","none")
        .style("stroke","black")
        .attr("d", projection.getCompositionBorders())
})

// From http://bl.ocks.org/mbostock/4055889
function collide() {
  for (var k = 0, iterations = 4, strength = 0.5; k < iterations; ++k) {
    for (var i = 0, n = prov.length; i < n; ++i) {
      for (var a = prov[i], j = i + 1; j < n; ++j) {
        var b = prov[j],
            x = a.x + a.vx - b.x - b.vx,
            y = a.y + a.vy - b.y - b.vy,
            lx = Math.abs(x),
            ly = Math.abs(y),
            r = a.area/2 + b.area/2 + padding;
        if (lx < r && ly < r) {
          if (lx > ly) {
            lx = (lx - r) * (x < 0 ? -strength : strength);
            a.vx -= lx, b.vx += lx;
          } else {
            ly = (ly - r) * (y < 0 ? -strength : strength);
            a.vy -= ly, b.vy += ly;
          }
        }
      }
    }
  }
}
