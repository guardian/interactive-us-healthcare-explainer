import * as d3Scale from 'd3-scale'
import * as d3Array from 'd3-array'
import * as d3Axis from 'd3-axis'
import * as d3Collection from 'd3-collection'
import * as d3Format from 'd3-format'
// import * as d3Path from 'd3-path'
import * as d3Select from 'd3-selection'
import * as d3Shape from 'd3-shape'
import * as d3Transition from 'd3-transition'
import * as d3Request from 'd3-request'

const d3 = Object.assign({}, d3Scale, d3Array, d3Axis, d3Collection, d3Format, d3Scale, d3Select, d3Shape, d3Transition, d3Request)

let prevScroll = 0;
let prevCutOff = 0;
let prevScrollDepth = 0;
const interactiveChartEl = document.querySelector(".interactive-chart");

const el = d3.select(interactiveChartEl);

const screenWidth = window.innerWidth;
const isMobile = screenWidth < 740;

const isiOS = document.body.classList.contains("ios");
const isAndroid = document.body.classList.contains("android");

const isApp = isiOS || isAndroid;

const startYear = 1850;

const width = el.node().clientWidth;
const svgEl = interactiveChartEl.querySelector("svg");
const svgClientRect = svgEl.getBoundingClientRect();
const height = (!isiOS) ? svgClientRect.height - 36 : svgClientRect.height - 108;
const elHeight = (!isiOS) ? interactiveChartEl.clientHeight : interactiveChartEl.clientHeight - 96;

const xScale = d3.scaleLinear().domain([startYear, 2015]).range([0, width]); // change to 1912
const yScale = d3.scaleLinear().domain([1150000000, 0]).range([0, height]);
const xAxis = d3.axisBottom(xScale).tickFormat(d3.format("d")).ticks((isMobile) ? 5 : 12);

const formatNumber = d3.format(".0f"),
    formatBillion = function(x) { return formatNumber(x / 1e9) + " billion people"; },
    formatMillion = function(x) { return formatNumber(x / 1e6) + " million"; },
    formatThousand = function(x) { return formatNumber(x / 1e3) + " thousand"; };

function formatAbbreviation(x) {
  var v = Math.abs(x);
  return (v >= .9995e9 ? formatBillion
      : v >= .9995e6 ? formatMillion
      : formatThousand)(x);
}

const yAxis = d3.axisLeft(yScale).ticks(2).tickFormat(formatAbbreviation);

const countryLine = d3.line()
    .x((d, i) => xScale(startYear + i))
    .y((d) => yScale(d[1]))
    .curve(d3.curveStepAfter)

const healthcareLine = d3.line()
    .x((d, i) => xScale(d.year))
    .y((d) => yScale(d.total))
    .curve(d3.curveStepAfter)

const healthcareArea = d3.area()
    .x((d, i) => xScale(Number(d.data.year)))
    .y0(d => yScale(d[0]))
    .y1(d => yScale(d[1]))
    .curve(d3.curveStepAfter)

const healthcareArea2 = d3.area()
    .x((d, i) => xScale(startYear + i))
    .y0(d => yScale(0))
    .y1(d => yScale(d.total))
    .curve(d3.curveStepAfter)

function render(data) {
    const healthcareData = data.sheets["oecd-countries"];

    const svg = el.select("svg")
        .attr("height", height)
        .attr("width", width);

    const barsG = svg.append("g");

    const transposedHealthcareData = transposeHealthcareData(healthcareData);

    const countries = healthcareData.map((r) => r.country);

    const stack = d3.stack()
        .keys(countries)
        .order(d3.stackOrderNone)
        .offset(d3.stackOffsetNone);

    const stackData = stack(transposedHealthcareData);

    const healthcarePopulationData = totalPopWithHealthCare(healthcareData);

    barsG.append("g").html(`<g>
        <g> 
            <text transform="matrix(1 0 0 1 25.0609 72.6699)"><tspan x="0" y="0" style="font-family:'Guardian Text Sans Web'; font-size:16;">More people</tspan><tspan x="0" y="19.2" style="font-family:'Guardian Text Sans Web'; font-size:16;">with healthcare</tspan></text>
            <line style="fill:none;stroke:#000000;stroke-width:2;" x1="10.061" y1="145.34" x2="10.061" y2="2.405"/>
            <g>
                <path d="M19.661,16.074c-0.465,0.297-1.084,0.158-1.381-0.309L10.061,2.861L1.842,15.766c-0.297,0.467-0.916,0.605-1.381,0.309
                    c-0.465-0.297-0.6-0.92-0.307-1.383L9.217,0.463C9.401,0.176,9.719,0,10.061,0s0.66,0.176,0.844,0.463l9.063,14.229
                    c0.105,0.168,0.156,0.354,0.156,0.537C20.123,15.559,19.959,15.883,19.661,16.074z"/>
            </g>
        </g>
    </g>`)
        .attr("transform", "translate(10," + (isMobile ? yScale(1000000000) : height * (2/3)) + ")");

    // solid block of population insured
    barsG.append("path")
        .datum(healthcarePopulationData)
        .style("fill", "#f6f6f6")
        .attr("d", healthcareArea2)
        .style("opacity", 1)

    // barsG.append("text")
    //     .text("Population insured")
    //     .attr("x", xScale(1980))
    //     .attr("y", yScale(200000000))
    //     .classed("insured-label", true)
    //     .attr("stroke", "#dcdcdc")
    //     .attr("stroke-width", "4px")

    // barsG.append("text")
    //     .text("Population insured")
    //     .attr("x", xScale(1980))
    //     .attr("y", yScale(200000000))
    //     .classed("insured-label", true)

    const healthcareLineEl = svg.append("path")
        .datum([])
        .style("stroke", "#69d1ca")
        .style("stroke-width", "2.5px")
        .style("fill", "none")
        .attr("d", healthcareLine);

    const healthcareLineElDashed = svg.append("path")
        .datum([])
        .style("stroke", "#69d1ca")
        .style("stroke-width", "2px")
        .style("fill", "none")
        .attr("d", healthcareLine)
        .style("stroke-dasharray", "2,2");

    document.querySelector("#hidden-svg path").setAttribute("d", healthcareLine(healthcarePopulationData));

    const lineLength = document.querySelector("#hidden-svg path").getTotalLength();

    svg.append("g")
        .classed("x-axis", true)
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis);

    svg.append("g")
        .classed("y-axis", true)
        // .attr("transform", "translate(0," + height + ")")
        .call(yAxis);

    svg.selectAll(".y-axis .tick line")
        .attr("x2", 0)
        .attr("x1", width);

    svg.selectAll(".y-axis .tick text")
        .attr("dy", -6)
        .attr("dx", 10)
        .style("text-anchor", "start")

    svg.select(".y-axis .domain").remove();

    svg.select(".y-axis").node().lastChild.innerHTML = "";

    healthcareLineEl
        .style("stroke-dasharray", lineLength)
        .style("stroke-dashoffset", lineLength);

    checkScroll(healthcareLineEl, elHeight, lineLength, healthcarePopulationData, healthcareLine, healthcareLineElDashed, healthcareData, svg, stackData, barsG);

}

function checkScroll(healthcareLineEl, elHeight, lineLength, healthcarePopulationData, healthcareLine, healthcareLineElDashed, healthcareData, svg, stackData, barsG) {
    window.requestAnimationFrame(() => {
        const scroll = window.scrollY;
        if (scroll !== prevScroll) {
            const elOffset = interactiveChartEl.getBoundingClientRect().top + scroll;
            if (!featureTest('position', 'sticky') && !featureTest('position', '-webkit-sticky')) {
                const offset = interactiveChartEl.getBoundingClientRect().top + scroll;

                if (offset + elHeight - window.innerHeight <= scroll) {
                    svgEl.style.position = "absolute";
                    svgEl.style.bottom = "0px";
                    svgEl.style.top = "auto";
                } else if (offset <= scroll) {
                    svgEl.style.position = "fixed";
                    svgEl.style.bottom = "";
                    svgEl.style.top = "";
                } else {
                    svgEl.style.position = "";
                }
            }

            prevScroll = scroll;

            const scrollToUse = scroll - elOffset;
            const scrollDepth = 1.1*(scrollToUse / (elHeight - height));

            doScrollEvent(healthcareLineEl, scrollDepth, lineLength, healthcarePopulationData, healthcareLine, healthcareLineElDashed, healthcareData, svg, stackData, barsG);
        }

        checkScroll(healthcareLineEl, elHeight, lineLength, healthcarePopulationData, healthcareLine, healthcareLineElDashed, healthcareData, svg, stackData, barsG);
    });
}

function doScrollEvent(healthcareLineEl, scrollDepth, lineLength, healthcarePopulationData, healthcareLine, healthcareLineElDashed, healthcareData, svg, stackData, barsG) {
    if (scrollDepth < 0) {
        scrollDepth = 0
    }

    if (scrollDepth > 1) {
        scrollDepth = 1;
    }

    if (scrollDepth < prevScrollDepth) {
        return;
    }

    // console.log(scrollDepth)

    const depthChange = Math.abs(scrollDepth - prevScrollDepth);
    // console.log(healthcarePopulationData)
    const cutOff = Math.min(165, Math.floor(healthcarePopulationData.length * scrollDepth));
    // console.log(healthcarePopulationData.length, cutOff)
    // console.log(cutOff, Math.floor(healthcarePopulationData.length * scrollDepth))

    healthcareLineElDashed
        .attr("d", healthcareLine(healthcarePopulationData.filter((d, i) => i <= cutOff)))

    healthcareLineEl
        .attr("d", healthcareLine(healthcarePopulationData.filter((d, i) => { return Number(d.year) < 2014 && i <= cutOff; })))
        .transition().duration(2500 * depthChange).style("stroke-dashoffset", lineLength - (lineLength * scrollDepth))

    // .transition().duration(2500 * depthChange).style("stroke-dashoffset", lineLength - (lineLength * scrollDepth))

    if (prevCutOff !== cutOff) {
        try {
            const yearBoundaries = [healthcarePopulationData[prevCutOff], healthcarePopulationData[cutOff]];

            const newCountriesWithHealthcare = healthcareData.filter((d) => Number(d.start) > yearBoundaries[0].year && Number(d.start) <= yearBoundaries[1].year);

            if (newCountriesWithHealthcare.length > 0) {
                newCountriesWithHealthcare.forEach((d) => {
                    let stack = stackData.find((e) => e.key === d.country);
                    // console.log(stack);

                    // svg.append("image")
                    //         .attr("xlink:href", d.flag)
                    //         .attr("x", xScale(Number(d.start)) - 0)
                    //         .attr("y", yScale(stack[0][1]) - 0)
                    //         .attr("height", 0)
                    //         .attr("width", 0)
                    //         .transition()
                    //      .duration(1000)
                    //      .attr("height", 36)
                    //      .attr("width", 36)
                    //      .attr("x", xScale(Number(d.start)) - 18)
                    //         .attr("y", yScale(stack[0][1]) - 18)
                    //      .transition()
                    //      .duration(1000)
                    //      .attr("height", 18)
                    //      .attr("width", 18)
                    //      .attr("x", xScale(Number(d.start)) - 9)
                    //         .attr("y", yScale(stack[0][1]) - 9)

                    if(d["mega-highlight"] === "yes") {
                        svg.append("circle")
                            .attr("cx", xScale(Number(d.start)))
                            .attr("cy", yScale(stack[0][1]))
                            .attr("r", 0)
                            .style("fill", "#69d1ca")
                            .style("stroke", "none")
                            .classed("pulsing", true)
                    }

                    if (d.highlight === "yes") {
                        svg.append("text")
                            .text(d.country)
                            .attr("x", xScale(Number(d.start)))
                            .attr("y", yScale(stack[0][1]))
                            .classed("country-label", true)
                            .style("text-anchor", "end")
                            .attr("dy", 3)
                            .attr("dx", -8)
                            .style("font-weight", (d["mega-highlight"] === "yes") ? "900" : "normal")
                            .style("fill", (d["mega-highlight"] === "yes") ? "#000" : "#767676")

                        svg.append("circle")
                            .attr("cx", xScale(Number(d.start)))
                            .attr("cy", yScale(stack[0][1]))
                            .attr("r", 0)
                            .style("stroke", "#69d1ca")
                            .style("stroke-width", "1.5px")
                            .style("fill", (d["mega-highlight"] === "yes") ? "#69d1ca" : "#fff")
                            .transition()
                            .duration(250)
                            .attr("r", 4)
                            .transition()
                            .duration(250)
                            .attr("r", 3)
                    }

                    let fullData = healthcareData.filter((a) => stack.key === a.country)[0];

                    stack = stack.filter((a) => !(Number(fullData.start) > Number(a.data.year)));

                    // barsG.append("path")
                    //     .datum(stack)
                    //     .style("fill", "#dcdcdc")
                    //     .attr("d", healthcareArea)
                    //     .style("opacity", 0)
                    //     .transition()
                    //      .duration(250)
                    //      .style("opacity", "0.25");

                    // for (var i = 0; i < Math.floor(Math.random() * 1) + 1; i++) {
                    //     const randomNumber = 0 //Math.floor((Math.random() < 0.5 ? -1 : 1) * 25);
                    //     const randomNumber2 = Math.floor((Math.random() < 0.5 ? -1 : 1) * 25);

                    //     svg.append("image")
                    //         .attr("xlink:href", d.flag)
                    //         .attr("x", xScale(Number(d.start)))
                    //         .attr("y", yScale(stack[0][1]))
                    //         .attr("height", 24)
                    //         .attr("width", 24)
                    //         .style("opacity", "1")
                    //         .transition()
                    //         .duration(1500)
                    //         .attr('transform', 'translate(' + randomNumber + ',' + randomNumber2 + ')')
                    //         .style("opacity", 0)
                    //         .on("end", function() {
                    //             const element = d3.select(this);

                    //             element.remove();
                    //         });
                    // }



                });
            }
        } catch (err) {
            console.log(err)
        }
    }

    prevScrollDepth = scrollDepth;
    prevCutOff = cutOff;
}

d3.json("https://interactive.guim.co.uk/docsdata-test/1tShBzjbsgHmYeGwqROaJa-JkypJlAtwxOF-C-L0XPTo.json", (data) => {
    render(data);
    // lifeExpectancyChart(data)
});

function totalPopWithHealthCare(healthcareData) {
    const years = Array(2016 - startYear).fill().map((d, i) => startYear + i);

    const popWithHealthCare = years.map((year) => {
        const totalForYear = d3.sum(healthcareData, (d) => d[2016]);
        return {
            "year": year,
            "total": d3.sum(healthcareData.filter((d) => Number(d.start) <= year), (a) => a[2016])
        };
    });

    return popWithHealthCare;
}

function transposeHealthcareData(healthcareData) {
    const years = Array(2016 - startYear).fill().map((d, i) => startYear + i);

    let transposedHealthcareData = [];

    return years.map((year) => {
        let yearData = { "year": year };

        const totalForYear = d3.sum(healthcareData, (d) => d[2016]);

        healthcareData.forEach((d) => {
            yearData[d.country] = d[2016];
        });

        return yearData;
    });

}

// function lifeExpectancyChart(data) {
//     const lineWidth = 620;
//     const lineHeight = 480;

//     const lineEl = d3.select(".interactive-chart-2");

//     const lineSvg = lineEl.append("svg")
//         .attr("width", lineWidth)
//         .attr("height", lineHeight);

//     const lineData = data.sheets.lifeexpectancy;

//     const nestedLineData = d3.nest()
//         .key(d => d.country)
//         .entries(lineData);

//     const lineXScale = d3.scaleLinear().domain([0, 9000]).range([0, lineWidth]);
//     const lineYScale = d3.scaleLinear().domain([70, 85]).range([lineHeight, 0]);

//     const lineLine = d3.line()
//         .x((d, i) => lineXScale(d.healthexpenditure))
//         .y((d) => lineYScale(d.lifeexpectancy))

//     const lineXAxis = d3.axisBottom(lineXScale);
//     const lineYAxis = d3.axisLeft(lineYScale).ticks(3);

//     lineSvg.append("g").classed("y-axis", true).call(lineYAxis);
//     lineSvg.append("g").attr("transform", "translate(0," + (lineHeight) + ")").call(lineXAxis);

//     lineSvg.selectAll(".y-axis .tick line")
//         .attr("x2", 0)
//         .attr("x1", lineWidth);

//     lineSvg.selectAll(".y-axis .tick text")
//         .attr("dy", -6)
//         .attr("dx", 8)
//         .style("text-anchor", "start")

//     lineSvg.append("defs").html(`<marker id="marker_arrow" markerHeight="6" markerWidth="6" markerUnits="strokeWidth" orient="auto" refX="2.5" refY="0" viewBox="-5 -5 10 10"><path d="M 0,0 m -5,-5 L 5,0 L -5,5 Z" fill="#bdbdbd"></path></marker><marker id="marker_arrow_orange" markerHeight="6" markerWidth="6" markerUnits="strokeWidth" orient="auto" refX="2.5" refY="0" viewBox="-5 -5 10 10"><path d="M 0,0 m -5,-5 L 5,0 L -5,5 Z" fill="#69d1ca"></path></marker>`);

//     const lineG = lineSvg.append("g");

//     nestedLineData.forEach((country) => {

//         //"United Kingdom", "Japan", "South Korea", "Israel", "Luxembourg"
//         if (["Norway", "Australia", "Switzerland", "Germany", "Denmark", "Singapore", "Netherlands", "Ireland", "Iceland", "Canada", "United States", "Hong Kong", "New Zealand", "Sweden", "Liechtenstein", "United Kingdom", "Japan"].indexOf(country.key) !== -1) {
//             lineG.append("path")
//                 .datum(country.values)
//                 .attr("d", lineLine)
//                 .style("stroke", (country.key === "United States") ? "#69d1ca" : "#bdbdbd")
//                 .style("stroke-width", (country.key === "United States") ? "2px" : "1px")
//                 .style("fill", "none")
//                 .attr("data-country", country.key)
//             // .attr("marker-end", (country.key === "United States") ? "url(#marker_arrow_orange)" : "url(#marker_arrow)");

//             const penPoint = country.values.slice(-2)[0];
//             const lastPoint = country.values.slice(-1)[0];

//             lineSvg.append("text")
//                 .text(country.key)
//                 .attr("x", lineXScale(lastPoint.healthexpenditure))
//                 .attr("y", lineYScale(lastPoint.lifeexpectancy))
//                 .style("fill", "#ffffff")
//                 .style("stroke", "#ffffff")
//                 .style("stroke-width", "2px")
//                 .classed("year-label", true)
//                 .attr("dy", 2)
//                 .attr("dx", (penPoint.healthexpenditure > lastPoint.healthexpenditure) ? -3 : 5)
//                 .style("text-anchor", (penPoint.healthexpenditure > lastPoint.healthexpenditure) ? "end" : "start");

//             lineSvg.append("text")
//                 .text(country.key)
//                 .attr("x", lineXScale(lastPoint.healthexpenditure))
//                 .attr("y", lineYScale(lastPoint.lifeexpectancy))
//                 .style("fill", (country.key === "United States") ? "#69d1ca" : "#bdbdbd")
//                 .classed("year-label", true)
//                 .attr("dy", 2)
//                 .attr("dx", (penPoint.healthexpenditure > lastPoint.healthexpenditure) ? -3 : 5)
//                 .style("text-anchor", (penPoint.healthexpenditure > lastPoint.healthexpenditure) ? "end" : "start");
//         }
//     });

//     const us = nestedLineData.find((d) => d.key === "United States");

//     us.values.forEach((p, i) => {
//         // conso
//         if (i === 0) {
//             lineSvg.append("circle")
//                 .attr("cx", lineXScale(p.healthexpenditure))
//                 .attr("cy", lineYScale(p.lifeexpectancy))
//                 .attr("r", 3)
//                 .style("fill", "#69d1ca");
//         }

//         lineSvg.append("text")
//             .text(p.year)
//             .attr("x", lineXScale(p.healthexpenditure))
//             .attr("y", lineYScale(p.lifeexpectancy))
//             .style("fill", "#767676")
//             .classed("year-label", true)
//             .attr("dy", (i === 0) ? 14 : -10)
//             .attr("dx", (i === 0) ? -28 : 5)
//     });
// }

function featureTest(property, value, noPrefixes) {
    var prop = property + ':',
        el = document.createElement('test'),
        mStyle = el.style;

    if (!noPrefixes) {
        mStyle.cssText = prop + ['-webkit-', '-moz-', '-ms-', '-o-', ''].join(value + ';' + prop) + value + ';';
    } else {
        mStyle.cssText = prop + value;
    }
    return mStyle[property];
}

// function cleanLineData(lineData) {
//     const years = Object.keys(lineData).filter(d => Number(d) >= 1960 && Number(d) <= 2016);

//     let yearsData = years.map(function(d) { return { "year": Number(d), "population": Number(lineData[d]) } });

//     for(let i = 1912; i < 1960; i++) {
//         yearsData.unshift({ "year": i, "population": yearsData[0].population });
//     };

//     return yearsData; 
// }

// function totalPopWithHealthCare(healthcareData) {
//     const years = Object.keys(healthcareData[0]).filter(d => Number(d) >= 1960 && Number(d) <= 2016);

//     const popWithHealthCare = years.map((year) => {
//      const totalForYear = d3.sum(healthcareData, (d) => d[year]);
//      return {
//          "year": year,
//          "total": d3.sum(healthcareData.filter((d) => Number(d.start) <= year), (a) => a[year])
//      };
//     });

//     return popWithHealthCare;
// }

// function transposeHealthcareData(healthcareData) {
//  const years = Object.keys(healthcareData[0]).filter(d => Number(d) >= 1960 && Number(d) <= 2016);

//  let transposedHealthcareData = [];

//  return years.map((year) => {
//      let yearData = {"year": year};

//      const totalForYear = d3.sum(healthcareData, (d) => d[year]);

//      healthcareData.forEach((d) => {
//          yearData[d.country] = d[year];
//      });

//      return yearData;
//  });

// }

const table = document.querySelector(".element-embed iframe");
const tableHtml = table.getAttribute("srcdoc");
table.parentNode.innerHTML = tableHtml;