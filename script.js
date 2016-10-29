var width = 960,
    height = 500,
    padding = 0

var projection = d3.geoMercator()
    .translate([width / 2, height / 2])

var path = d3.geoPath()
    .projection(projection)

// Font size scale
var size = d3.scaleLinear()
    .range([9, 16])

var color = d3.scaleThreshold()
    .domain([-0.16, -0.12, -0.1, -0.08, -0.06, -0.04, -0.02, 0, 0.02])
    .range(['#0c2c84','#225ea8','#1d91c0','#41b6c4','#7fcdbb','#c7e9b4','#edf8b1','#ffffd9', "#fee0d2", "#fcbba1"])

var svg = d3.select('body').append('svg')
    .attr("width", width)
    .attr("height", height)

d3.json('pais_vasco.json', function(err, data) {

    projection.fitSize([width, height], topojson.feature(data, data.objects.municipios))

    // NORMAL MAP FOR COMPARISON
    svg.append('path')
        .attr("class", "land")
        .datum(topojson.feature(data, data.objects.municipios))
        .attr('d', path)

    // CARTOGRAM
    // 1. Features we are painting
    mun = topojson.feature(data, data.objects.municipios).features

    // 2. Create on each feature the centroid and the positions
    mun.forEach(function(d) {
        d.pos = projection(d3.geoCentroid(d))
        d.x = d.pos[0]
        d.y = d.pos[1]
        d.area = d3.geoArea(d)
        d.s = d.area * 12000000 // Magic number to scale the rects
    })

    //size.domain(d3.extent(data, function(d) {return d.area }))

    // 3. Collide force
    var simulation = d3.forceSimulation(mun)
        .force("x", d3.forceX(function(d) { return d.pos[0] }).strength(.1))
        .force("y", d3.forceY(function(d) { return d.pos[1] }).strength(.1))
        .force('collide', collide)

    // 4. Number of simulations
    for (var i = 0; i < 1; ++i) simulation.tick()

    svg = d3.select('body').append('svg').at({width, height})

    // 5. Paint the cartogram
    svg.selectAll("rect")
        .data(mun)
        .enter()
        .append("rect")
        .each(function(d) {
            d3.select(this)
              .at({width: d.s, height: d.s, x: -d.s / 2, y: -d.s / 2})
              .translate([d.x, d.y])
              .at({fill: color(d.properties.dif_2012), stroke: "white"})
          })

    /*svg.appendMany(flCounties, 'text').each(function(d){
    d3.select(this)
        .at({"text-anchor": "middle"})
        .translate([d.x, d.y + 5])
        .text(d.id)
        .style("font-size", size(d.area) + "px")
        .style("font-family", "Helvetica Neue")
    })*/
})

// From http://bl.ocks.org/mbostock/4055889
function collide() {
  for (var k = 0, iterations = 4, strength = 0.5; k < iterations; ++k) {
    for (var i = 0, n = mun.length; i < n; ++i) {
      for (var a = mun[i], j = i + 1; j < n; ++j) {
        var b = mun[j],
            x = a.x + a.vx - b.x - b.vx,
            y = a.y + a.vy - b.y - b.vy,
            lx = Math.abs(x),
            ly = Math.abs(y),
            r = a.s/2 + b.s/2 + padding;
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
