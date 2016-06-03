var color = d3plus.color.scale;
var offset = 5;

/**
 */
function BubbleChart(options) {
    this.initialize(options);
}

/**
 *
 */
BubbleChart.prototype.initialize = function (options) {
    this.config = {};
    for (var attr in options) {
        this.config[attr] = options[attr];
    }
}

/**
 *
 */
BubbleChart.prototype.builder = function (data) {
    var thiz = this;
    var format = {
        text: function (text, key) {
            return d3plus.string.title(text);
        },
        number: function (number, data) {
            return d3plus.number.format(number)
        }
    };
    this.config.scope = this.config.container.replace("#", "");
    this.config.format = this.config.format ? this.config.format : {};
    this.config.format = d3plus.object.merge(format, this.config.format);

    var diameter = $(this.config.container).height();
    var width = $(this.config.container).width();
    diameter = diameter < 700 ? 700 : diameter;

    var bubble = d3.layout.pack()
        .sort(function (a, b) {
            return a.value - b.value;
        })
        .size([width, diameter])
        .padding(1.5);

    var svg = d3.select(this.config.container).append("svg")
        .attr("width", width)
        .attr("height", diameter)
        .attr("class", "bubble");

    var node = svg.selectAll(".node")
        .data(bubble.nodes(this.buildNodes(data))
            .filter(function (d) {
                return !d.children;
            }))
        .enter().append("g")
        .attr("class", "node")
        .on('mouseover', function (d) {
            thiz.createTooltip(d);
        })
        .on('mouseout', function (d) {
            d3plus.tooltip.remove(thiz.config.scope + "_visualization_focus");
        })
        .attr("transform", function (d) {
            return "translate(" + d.x + "," + d.y + ")";
        });

    var gnode = node.append("g");
    var main = this.circle(gnode);

    if (this.config.percentage) {
        this.circle(gnode, {
            "class": "main-shape"
        });
        this.circle(gnode, {
                offset: offset
            })
            .style("stroke", "#FFF")
            .style("stroke-width", "2px");

        this.buildGauge(node);

    } else {
        this.circle(gnode);
        this.text(gnode);
    }

    d3.select(self.frameElement).style("height", diameter + "px");
}

/**
 * Build a svg text node.
 */
BubbleChart.prototype.text = function (node, options) {
    var thiz = this;
    return node.append("text")
        .attr("class", "wrap")
        .style("fill", function (d) {
            var c = color(d[thiz.config.label]);
            return d3plus.color.text(c);
        })
        .text(function (d) {
            return thiz.config.format.text(d[thiz.config.label]);
        });
}

/**
 * Build a svg circle node.
 */
BubbleChart.prototype.circle = function (node, options) {
    var thiz = this;
    options = typeof options == "undefined" ? {} : options;
    options.offset = typeof options.offset == "undefined" ? 0 : options.offset;
    options.class = typeof options.class == "undefined" ? "shape" : options.class;

    return node.append("circle")
        .attr("r", function (d) {
            if (d.r < options.offset) {
                return 0;
            }
            return d.r - options.offset;
        })
        .attr("class", options.class)
        .style("fill", function (d) {
            if (typeof options.fill != "undefined") {
                return options.fill;
            }
            return color(d[thiz.config.label]);
        });
}

/**
 *
 */
BubbleChart.prototype.data = function (data) {
    this.builder(data)
    this.wrapText();
}

/**
 *
 */
BubbleChart.prototype.wrapText = function () {
    $(this.config.container).find(".wrap").each(function () {
        d3plus.textwrap()
            .container(d3.select(this))
            .resize(true)
            .align("middle")
            .valign("middle")
            .draw();
    })
}

/**
 *
 */
BubbleChart.prototype.buildGauge = function (node) {
    var g = node.append("g");
    var thiz = this;

    g.append("clipPath")
        .attr("id", function (d) {
            return "g-clip-" + d3plus.string.strip(d[thiz.config.label]);
        })
        .append("rect")
        .attr("id", function (d) {
            return "g-clip-rect" + d3plus.string.strip(d[thiz.config.label]);
        })
        .attr("y", function (d) {
            return -d.r + offset;
        })
        .attr("x", function (d) {
            return -d.r + offset;
        })
        .attr("width", function (d) {
            if (2 * d.r < offset) {
                return 0;
            }
            return 2 * d.r - offset;
        })
        .attr("height", function (d) {
            if (2 * d.r < offset) {
                return 0;
            }
            var p = thiz.config.percentage(d);
            p = parseInt(p);
            return p < 0 ? 0 : p;
        });


    this.circle(g, {
            offset: offset,
            fill: "#FFF"
        })
        .attr("clip-path", function (d) {
            return "url(#" + "g-clip-" + d3plus.string.strip(d[thiz.config.label]) + ")";
        });

    this.text(g)
        .style("stroke", function (d) {
            var c = color(d[thiz.config.label]);
            return c;
        });
}

/**
 * This methdod build the tooltip.
 */
BubbleChart.prototype.createTooltip = function (d) {
    var thiz = this;
    var data = [{
        "value": thiz.config.format.number(d[thiz.config.size]),
        "name": d3plus.string.title(thiz.config.size)
    }];

    data = this.config.tooltip ? this.config.tooltip(d) : data;

    var config = {
        "id": thiz.config.scope + "_visualization_focus",
        "x": d.x,
        "y": d.y + d.r,
        "allColors": true,
        "size": "small",
        "color": color(d[thiz.config.label]),
        "fontsize": "15px",
        "data": data,
        "width": "219px",
        "mouseevents": true,
        "arrow": true,
        "anchor": "top left",
        "title": d3plus.string.title(d[thiz.config.label]),
    }
    d3plus.tooltip.create(config);
}

/**
 * This method prepare the data for the visualization.
 */
BubbleChart.prototype.buildNodes = function (data) {
    var thiz = this;
    for (var i = 0; i < data.length; i++) {
        data[i].value = data[i][thiz.config.size];
    }
    return {
        children: data
    };
}
