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
    var checkChart = false;
    if (!show) {
        checkChart = document.getElementById("check-chart").checked;
    }

    var documents = [1, 0, 0, 0];
    documents[0] = document.getElementById("check-34").checked;
    documents[1] = document.getElementById("check-71").checked;
    documents[2] = document.getElementById("check-125").checked;
    documents[3] = document.getElementById("check-213").checked;

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

//show graph with d3
var graphShow = function(jsonString) {

    $("#pic").html("");

    $("#pic").append(
        "<svg style='display:block; width:100%; height:100%;'>" +
        "</svg>"
    );

    var zoom = d3.zoom();

    //fish eye unfortunately not working
    var fisheye = d3.fisheye()
        .radius(100)
        .power(3);
    //defining display window
    var svg = d3.select("svg"),
        width = +svg.attr("width"),
        height = +svg.attr("height"),
        //make svg zoomable
        transform = d3.zoomIdentity;;

    //select svg to container for better zooming functionality
    var container = svg.append("g")
        .attr("class", "container");

    //function for generating different colors depending on the word cluster
    var color = d3.scaleOrdinal(d3.schemeCategory20);

    //defining the standard radius of the nodes 
    var radius = d3.scaleSqrt()
        .range([0, 6]);


    //simulation of the nodes and links: What kind of forces exists between them; force of attration or the colliding
    var simulation = d3.forceSimulation()
        .force("link",
            d3.forceLink().id(function(d) { return d.word; })
            .distance(function(d) { return radius(d.source.quantity / 2) + radius(d.target.quantity / 2); })
            .strength(function(d) { return 0.2; })
        )
        .force("charge", d3.forceManyBody().strength(-500))
        .force("collide", d3.forceCollide().radius(function(d) { return radius(d.quantity / 2) + 20; }))
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
        //assign the attribute strength(JSON) to the width of a link
        .attr("stroke-width", function(d) { return d.strength; })
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
        //defining which function run if a node is dragged
        .call(d3.drag()
            .on("drag", dragged));

    //assign the attribute quantity(JSON) to the radius of the node
    node.append('circle')
        .attr("r", function(d) { return radius(d.quantity / 4); })

    node.append("text")
        .attr("dy", ".35em")
        .attr("text-anchor", "middle")
        //define the text that is displayed (word out if the JSON file)
        .text(function(d) { return d.word; })
        //define the color of the text (cluster out if the JSON file)
        .attr("fill", function(d) { return color(d.cluster); });

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
    var margin = { top: 20, right: 100, bottom: 30, left: 60 };
    var divWidth = document.getElementById("pic").offsetWidth;
    var legendHolder = container.append('g')
        .attr('transform', "translate(" + (margin.left + divWidth * 2) + ",0)")

    var legend = legendHolder.selectAll(".legend")
        .data(color.domain())
        .enter().append("g")
        .attr("class", "legend")
        .attr("transform", function(d, i) { return "translate(0," + i * 20 + ")"; });

    legend.append("rect")
        .attr("x", 0)
        .attr("width", 100)
        .attr("height", 100)
        .style("fill", color);

    legend.append("text")
        .attr("x", 0)
        .attr("y", 9)
        .attr("dy", ".35em")
        .style("text-anchor", "end")
        .text(function(d) { return d; });

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
        });

        node.attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });
    }

    function dragged(d) {
        d3.select(this).attr("cx", d.x = d3.event.x).attr("cy", d.y = d3.event.y);
        container.attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });
    }

    container.on("mousemove", function() {

        fisheye.center(d3.mouse(this));
    });

    window.scrollTo(($(document).width() - $(window).width()) / 2, 0);
}

var chartShow = function(jsonString) {

    //load the data
    jsonData = JSON.parse(jsonString);
    var data = jsonData.nodes;

    var length = Object.keys(data).length;

    var margin = { top: 20, right: 200, bottom: 100, left: 40 },
        width = document.getElementById("pic").clientWidth * (length / 18) - margin.left - margin.right,
        height = 300 - margin.top - margin.bottom;

    $("#pic").html("");

    //design x-Axis
    var x = d3.scaleBand()
        .rangeRound([0, width])
        .padding(.1)
        .paddingOuter(.1)
        //set distance in percent between y axis and first bar --maybe do it not in percent but in px or something in the future?
        .align(0.1);

    //design y-Axis
    var y = d3.scaleLinear()
        .range([height, 0]);

    var xAxis = d3
        .axisBottom(x)

    var yAxis = d3
        .axisLeft(y)
        .ticks(10);

    //select div in which svg should be created
    d3.select("#pic").attr("style", "overflow-x: scroll;");

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

    x.domain(data.map(function(d) { return d.word; }));
    y.domain([0, d3.max(data, function(d) { return d.quantity; })]);

    svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + height + ")")
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
        .attr("y", 6)
        .attr("dy", ".71em")
        .style("text-anchor", "end")
        .text("quantity");

    svg.selectAll()
        .data(data)
        .enter().append("rect")
        .attr("class", "bar")
        .attr("x", function(d) { return x(d.word); })
        .attr("width", x.bandwidth())
        .attr("y", function(d) { return y(d.quantity); })
        .attr("height", function(d) { return height - y(d.quantity); })

    d3.select("input").on("change", change);

    var sortTimeout = setTimeout(function() {
        d3.select("input").property("checked", true).each(change);
    }, 2000);

    //sorting chart after creating it
    function change() {
        clearTimeout(sortTimeout);

        // Copy-on-write since tweens are evaluated after a delay.
        var x0 = x.domain(data.sort(this.checked ?

                    function(a, b) { return b.quantity - a.quantity; } :
                    function(a, b) { return d3.ascending(a.word, b.word); })
                .map(function(d) { return d.word; }))
            .copy();

        svg.selectAll(".bar")
            .sort(function(a, b) { return x0(a.word) - x0(b.word); });

        var transition = svg.transition().duration(750),
            delay = function(d, i) { return i * 50; };

        transition.selectAll(".bar")
            .delay(delay)
            .attr("x", function(d) { return x0(d.word); });

        transition.select(".x.axis")
            .call(xAxis)
            .selectAll("g")
            .delay(delay);
    }
}