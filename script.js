var width = 960,
    height = 500,
    padding = 0

var projection = d3.geoAlbersUsa()
    .translate([width / 2, height / 2])

var path = d3.geoPath()
    .projection(projection)

var color = d3.scaleQuantile()
    .domain([8000, 3000000])
    .range(['#feebe2','#fbb4b9','#f768a1','#c51b8a','#7a0177'])

var size = d3.scaleLinear()
    .range([9, 16])

var ƒ = d3.f

d3.loadData(['us.json', 'county-pop.csv'], function(err, res) {
  us = res[0]
  pops = res[1]

  var svg = d3.select('body').html('').append('svg')
      .at({width, height})

  fipsToPop = {}

  pops.forEach(function(d){ return fipsToPop[d.fips] = +d.population2014 })

  function isFL(d){ return Math.floor(d.id / 1000) == 12 }

  counties = topojson.feature(us, us.objects.counties).features

  counties.forEach(function(d){
    d.pop = fipsToPop[d.id]
  })

  flCounties = counties.filter(isFL)

  flState = topojson.feature(us, {
    type: "GeometryCollection",
    geometries: us.objects.states.geometries.filter(function(d){ return d.id == 12 })
  })

  projection.fitSize([width, height], flState)

  svg.appendMany(flCounties, 'path.county')
    .attr('d', path)
    .at({opacity: opacity})

  // Start
  flCounties.forEach(function(d){
    d.pos = projection(d3.geoCentroid(d))
    d.x = d.pos[0]
    d.y = d.pos[1]
    d.area = d3.geoArea(d)
    d.s = d.area * 450000 // Magic number to scale the rects
  })

  size.domain(d3.extent(flCounties, function(d) {return d.area }))

  // Collide force
  var simulation = d3.forceSimulation(flCounties)
    .force('x', d3.forceX(ƒ('pos', 0)).strength(.1))
    .force('y', d3.forceY(ƒ('pos', 1)).strength(.1))
    .force('collide', collide)

  for (var i = 0; i < 100; ++i) simulation.tick()

  var svg = d3.select('body').append('svg').at({width, height})

  svg.appendMany(flCounties, 'rect').each(function(d){
    d3.select(this)
      .at({width: d.s, height: d.s, x: -d.s/2, y: -d.s/2})
      .translate([d.x, d.y])
      .at({fill: color(d.pop), stroke: 'white'})
  })

  svg.appendMany(flCounties, 'text').each(function(d){
    d3.select(this)
      .at({"text-anchor": "middle"})
      .translate([d.x, d.y + 5])
      .text(d.id)
      .style("font-size", size(d.area) + "px")
      .style("font-family", "Helvetica Neue")
  })
})

function opacity(d){
  return d.pop / 500000 + .05
}

//From http://bl.ocks.org/mbostock/4055889
function collide() {
  for (var k = 0, iterations = 4, strength = 0.5; k < iterations; ++k) {
    for (var i = 0, n = flCounties.length; i < n; ++i) {
      for (var a = flCounties[i], j = i + 1; j < n; ++j) {
        var b = flCounties[j],
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
