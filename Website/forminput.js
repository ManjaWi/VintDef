var definitions = function() {
    $.ajax({
        type: "GET",
        url: "http://localhost:3000/test",
        success: function(data) {
            document.getElementById("definitions").innerHTML = data;
        }
    });
}

//when loading the website validate rangeout of slider and appearance of checkbox
$(document).ready(function() {
    document.getElementById("rangeout").value = "[" + document.getElementById("numberrange").value + "]";
    var box = document.getElementById("check-chart");
    if (document.getElementById("customControlValidation3").checked == true) {
        box.style.display = 'block';
        $('label[for="check-chart"]').show();
    } else {
        box.style.display = 'none';
        $('label[for="check-chart"]').hide();
    }
});

//change appearance of checkbox
function resetradio(checkbox) {
    var box = document.getElementById("check-chart");
    var radio = document.getElementById("customControlValidation3");
    if (radio.checked == true) {
        box.style.display = 'block';
        $('label[for="check-chart"]').show();
    } else {
        box.style.display = 'none';
        $('label[for="check-chart"]').hide();
    }
}

//after clicking show select parameter data and send it to server
var server = function() {
    //get input from user in form
    var show = document.getElementById("customControlValidation2").checked;
    var show2 = document.getElementById("customControlValidation3").checked;
    
    var documents = [0, 0, 0, 0];
        documents[0] = document.getElementById("check-34").checked;
        documents[1] = document.getElementById("check-71").checked;
        documents[2] = document.getElementById("check-125").checked;
        documents[3] = document.getElementById("check-213").checked;

    //check if obligatory input is filled
    if ((!show & !show2) || (!documents[0] & !documents[1] & !documents[3] & !documents[4])) {
        alert("Check your input!");       
    } 
    else {
        var checkChart = false;
        if (!show) {
            checkChart = document.getElementById("check-chart").checked;
        }

        var count = document.getElementById("numberrange").value;

        var words = [0, 0, 0];
        words[0] = document.getElementById("check-nouns").checked;
        words[1] = document.getElementById("check-verbs").checked;
        words[2] = document.getElementById("check-adjectives").checked;

        var data = [0, 0, 0, 0, 0];
        data[0] = show;
        data[1] = checkChart;
        data[2] = documents;
        data[3] = count;
        data[4] = words;

        //send parameter to server
        $.ajax({
            url: "http://localhost:3000/",
            type: "POST",
            data: JSON.stringify(data),
            dataType: "json",
            contentType: "application/json",
            success: function(data) {
                $("#pic").html("");

                $("#pic").append(
                    "<div class='loader'>" +
                    "</div>"
                );
                console.log('finished ajax request');
            }
        })

        //check if preprocessing script is already finished
        var check = setInterval(function() {
            $.ajax({
                type: "GET",
                url: "http://localhost:3000/",
                success: function(data) {
                    //select what should be shown
                    if (data != false) {
                        if (show == true) { graphShow(data) } else { chartShow(data) }
                        //stop checking if preprocessing script is finished
                        clearInterval(check);
                        return;
                    }
                }
            });

        }, 2000);
    }
}

//show graph with d3
var graphShow = function(jsonString) {

    $("#pic").html("");

    $("#pic").append(
        "<svg style='width:100%; height:100%;'>" +
        "</svg>"
    );

    var zoom = d3.zoom();


    //defining display window
    var svg = d3.select("svg"),
        width = document.getElementById("pic").clientWidth,
        height = document.getElementById("pic").clientHeight
        //make svg zoomable
    transform = d3.zoomIdentity;

    //select svg to container for better zooming functionality
    var container = svg.append("g")
        .attr("class", "container");

    //function for generating different colors depending on the word cluster
    var color = d3.scaleOrdinal(d3.schemeCategory20c);

    //defining the standard radius of the nodes 
    var radius = d3.scaleSqrt()
        .range([0, 6]);


    //simulation of the nodes and links: What kind of forces exists between them; force of attraction or the colliding
    var simulation = d3.forceSimulation()
        .force("link",
            d3.forceLink().id(function(d) { return d.word; })
            .distance(function(d) { return radius(d.source.quantity / 2) + radius(d.target.quantity / 2); })
            .strength(function(d) { return 0.2; })
        )
        .force("charge", d3.forceManyBody().strength(-500))
        .force("center", d3.forceCenter(width / 3 * 2, height / 3 * 2))
        .force("collide", d3.forceCollide(function(d) { return d.quantity * 2 }));

    //reading the JSON file that inludes the nodes and links
    graph = JSON.parse(jsonString);

    //defining a link
    var link = container.append("g")
        .attr("class", "links")
        .selectAll("path")
        .data(graph.links)
        .enter().append("svg:path")
        //defining the style of a link
    link.style('fill', 'none')
        .style('stroke', 'gray')
        .style("stroke-width", function(d) { return d.strength; })

    //defining a node
    var node = container.append("g")
        .attr("class", "nodes")
        .selectAll("g")
        .data(graph.nodes)
        .enter().append("g")
        .style('transform-origin', '20% 20%')
        .on("mouseover", function(d) { mouseover_node(d); })
        .on("mouseout", function(d) { mouseout_node(d) })
        //defining which function run if a node is dragged
        .call(d3.drag()
            .on("start", dragstarted)
            .on("drag", dragged)
            .on("end", dragended));


    //assign the attribute quantity(JSON) to the radius of the node
    var circles = node.append("circle")
        .attr("r", function(d) { return radius(d.quantity / 2); })
        .attr("fill", function(d) { return color(d.cluster); })
        .attr("transperancy", "50%");

    var labels = node.append("text")
        .attr("dy", ".35em")
        .attr("text-anchor", "middle")
        //define the text that is displayed (word out of the JSON file)
        .text(function(d) { return d.word; })
        //define the color of the text (cluster out of the JSON file)
        .attr("fill", "black");

    simulation
        .nodes(graph.nodes)
        .on("tick", ticked);

    simulation.force("link")
        .links(graph.links);

    //select what is standard zoom and what to do on zoom
    svg.call(d3.zoom()
        .scaleExtent([1 / 8, 8])
        .on("zoom", zoomed));

    //Legende
    var margin = { top: 10, right: 10, bottom: 10, left: 10 };
    var divWidth = document.getElementById("pic").offsetWidth;
    var legendHolder = container.append('g')
        .attr('transform', "translate(10,30)")

    var legend = legendHolder.selectAll(".legend")
        .data(color.domain())
        .enter().append("g")
        .attr("class", "legend")
        .attr("transform", function(d, i) { return "translate(0," + i * 20 + ")"; });

    legend.append("circle")
        .attr("cx", 0)
        .attr("cy", 0)
        .attr("r", 9)
        .style("fill", color);

    legend.append("text")
        .attr("x", 12)
        .attr("y", 0)
        .attr("dy", ".35em")
        .attr("stroke", "black")
        .style("text-anchor", "start")
        .text(function(d) {
            if (d == "nn") {
                return "noun, singular"
            } else if (d == "nns") {
                return "noun, plural"
            } else if (d == "vbg") {
                return "verb, gerund"
            } else if (d == "vbz") {
                return "verb, present tense, third person singular"
            } else if (d == "vbn") {
                return "verb past participle"
            } else if (d == "vbp") {
                return "verb, present tense, not third person singular"
            } else if (d == "jjr") {
                return "adjective, comparative"
            } else if (d == "md") {
                return "modal"
            } else if (d == "prp") {
                return "personal pronoun"
            } else if (d == "rbr") {
                return "adverb, comparative"
            } else if (d == "rb") {
                return "adverb"
            } else if (d == "pdt") {
                return "predeterminer"
            } else if (d == "jj") {
                return "adjective"
            } else if (d == "vbd") {
                return "verb, past tense"
            } else if (d == "fw") {
                return "foreign word"
            } else if (d == "vb") {
                return "verb"
            } else if (d == "jjs") {
                return "adjectiv, superlative"
            } else if (d == "cc") {
                return "coordinating conjunction"
            } else if (d == "dt") {
                return "determiner"
            } else if (d == "rp") {
                return "particle"
            } else if (d == "in") {
                return "preposition/subordinating conjunction"
            } else if (d == "cd") {
                return "cardinal digit"
            } else return d

        });

    function zoomed() {
        var g = d3.selectAll(".container");
        g.attr("transform", d3.event.transform);
    }

    function ticked() {
        link.attr("d", function(d) {
                var dx = d.target.x - d.source.x,
                    dy = d.target.y - d.source.y,
                    dr = Math.sqrt(dx * dx + dy * dy);
                return "M" +
                    d.source.x + "," +
                    d.source.y + "A" +
                    dr + "," + dr + " 0 0,1 " +
                    d.target.x + "," +
                    d.target.y;
            })
            .attr("x1", function(d) { return d.source.x; })
            .attr("y1", function(d) { return d.source.y; })
            .attr("x2", function(d) { return d.target.x; })
            .attr("y2", function(d) { return d.target.y; });

        node
            .attr("transform", function(d) { return "translate(" + d.x + ", " + d.y + ")"; });

        edgepaths.attr('d', function(d) {
            return 'M ' + d.source.x + ' ' + d.source.y + ' L ' + d.target.x + ' ' + d.target.y;
        });
    }

    function dragstarted(d) {
        if (!d3.event.active) simulation.alphaTarget(0.3).restart()
        d.fx = d.x;
        d.fy = d.y;
    }

    function dragged(d) {
        d.fx = d3.event.x;
        d.fy = d3.event.y;
    }

    function dragended(d) {
        if (!d3.event.active) simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
    }
    var mouseover_node = function(z) {

        var neighbors = {};
        neighbors[z.index] = true;

        link.filter(function(d) {
                if (d.source == z) {
                    neighbors[d.target.index] = true
                    return true
                } else if (d.target == z) {
                    neighbors[d.source.index] = true
                    return true
                } else {
                    return false
                }
            })
            .style("stroke-opacity", 1);

        node.filter(function(d) { return neighbors[d.index] })
            .style("stroke-width", 3);

        label.filter(function(d) { return !neighbors[d.index] })
            .style("fill-opacity", 0.2);

        label.filter(function(d) { return neighbors[d.index] })
            .attr("font-size", 16)

    };

    var mouseout_node = function(z) {
        link
            .style("stroke-opacity", 0.2);

        node
            .style("stroke-width", 1)

        label
            .attr("font-size", 10)
            .style("fill-opacity", 1)

    };
    window.scrollTo(($(document).width() - $(window).width()) / 2, 0);


}

var chartShow = function(jsonString) {

    //load the data
    jsonData = JSON.parse(jsonString);
    var data = jsonData.nodes;

    var length = Object.keys(data).length;

    var margin = { top: 50, right: 100, bottom: 100, left: 200 },
        width = document.getElementById("pic").clientWidth - margin.left - margin.right,
        height = document.getElementById("pic").clientHeight * (length / 18) - margin.top - margin.bottom;

    $("#pic").html("");

    //design x-Axis
    var x = d3.scaleLinear()
        .range([0, width]);

    //design y-Axis
    var y = d3.scaleBand()
        .rangeRound([0, height])
        .padding(.1)
        .paddingOuter(.1)
        //set distance in percent between y axis and first bar --maybe do it not in percent but in px or something in the future?
        .align(0.1);

    var xAxis = d3
        .axisTop(x)

    var yAxis = d3
        .axisLeft(y)

    //select div in which svg should be created
    d3.select("#pic").attr("style", "overflow-y: scroll; margin-top:15px;");
    //design svg
    var svg = d3.select("#pic").append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
    //map data
    Object.keys(data).forEach(function(d) {
        d.word = d.word;
        d.quantity = +d.quantity;
    });

    x.domain([0, d3.max(data, function(d) { return d.quantity; })]);
    y.domain(data.map(function(d) { return d.word; }));

    svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0,0)")
        .call(xAxis)
        .append("text")
        .style("text-anchor", "end")
        .attr("dx", "-.8em")
        .attr("dy", "-.55em")
        .attr("transform", "rotate(-180)");

    svg.append("g")
        .attr("class", "y axis")
        .call(yAxis)
        .append("text")
        .attr("transform", "rotate(-90)")
        .style("text-anchor", "end")
        .text("quantity");

    svg.append('g')
        .attr('class', 'grid')
        .attr('transform', 'translate(0, ${height})')
        .call(d3.axisBottom()
            .scale(x)
            .tickSize(height, 0, 0)
            .tickFormat(''))

    const barGroups = svg.selectAll()
        .data(data)
        .enter()
        .append('g')

    barGroups
        .append('rect')
        .attr('class', 'bar')
        .attr('y', function(d) { return y(d.word); })
        .attr('x', 0)
        .attr('height', y.bandwidth())
        .attr('width', function(d) { return x(d.quantity); })
        .on('mouseenter', function(actual, i) {
            d3.selectAll('.quantity')
                .attr('opacity', 0)

            d3.select(this)
                .transition()
                .duration(300)
                .attr('opacity', 0.6)
                .attr('y', (d) => y(d.word) - 2)
                .attr('height', y.bandwidth() + 4)
        })
        .on('mouseleave', function() {
            d3.selectAll('.quantity')
                .attr('opacity', 1)

            d3.select(this)
                .transition()
                .duration(300)
                .attr('opacity', 1)
                .attr('y', (d) => y(d.word))
                .attr('height', y.bandwidth())

            svg.selectAll('#limit').remove()
        })

    barGroups
        .append('text')
        .attr('class', 'value')
        .attr('y', (d) => y(d.word) + y.bandwidth() / 2)
        .attr('x', (d) => x(d.quantity + 0.2))
        .attr('text-anchor', 'start')
        .text((d) => d.quantity);
    //labels
    svg.append('text')
        .attr('class', 'title')
        .attr('x', -margin.left + 20)
        .attr('y', -margin.top + 20)
        .attr('text-anchor', 'start')
        .text('Number of occurences per word')

    svg.append('text')
        .attr('x', -height / 2)
        .attr('y', -margin.left + 30)
        .attr('transform', 'rotate(-90)')
        .attr('text-anchor', 'middle')
        .text('Words')

    svg.append('text')
        .attr('x', width / 2)
        .attr('y', -margin.top + 20)
        .attr('text-anchor', 'middle')
        .text('Nummber of occurences')

    d3.select("input").on("change", change);

    var sortTimeout = setTimeout(function() {
        d3.select("input").property("checked", true).each(change);
    }, 2000);

    //sorting chart after creating it
    function change() {
        clearTimeout(sortTimeout);

        // Copy-on-write since tweens are evaluated after a delay.
        var y0 = y.domain(data.sort(this.checked ?

                    function(a, b) { return b.quantity - a.quantity; } :
                    function(a, b) { return d3.ascending(a.word, b.word); })
                .map(function(d) { return d.word; }))
            .copy();

        svg.selectAll(".bar")
            .sort(function(a, b) { return y0(a.word) - y0(b.word); });

        svg.selectAll(".value")
            .sort(function(a, b) { return y0(a.quantity) - y0(b.quantity); });

        var transition = svg.transition().duration(750),
            delay = function(d, i) { return i * 50; };

        transition.selectAll(".bar")
            .delay(delay)
            .attr("y", function(d) { return y0(d.word); });

        transition.selectAll(".value")
            .delay(delay)
            .attr("y", function(d) { return y0(d.word) + 18; });

        transition.select(".y.axis")
            .call(yAxis)
            .selectAll("g")
            .delay(delay);
    }
}