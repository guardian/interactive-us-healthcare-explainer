import * as d3 from 'd3'

let prevScroll = 0;
let prevCutOff = 0;
let prevScrollDepth = 0;
const interactiveChartEl = document.querySelector(".interactive-chart");

const el = d3.select(interactiveChartEl);

const screenWidth = window.innerWidth;
const isMobile = screenWidth < 740;

const width = el.node().clientWidth;
const height = interactiveChartEl.querySelector("svg").clientHeight - 36;

const xScale = d3.scaleLinear().domain([1900, 2016]).range([0, width]); // change to 1912
const yScale = d3.scaleLinear().domain([1050000000, 0]).range([0, height]);
const xAxis = d3.axisBottom(xScale).tickFormat(d3.format("d")).ticks((isMobile) ? 5 : 12);

const countryLine = d3.line()
    .x((d, i) => xScale(1900 + i))
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
    .x((d, i) => xScale(1900 + i))
    .y0(d => yScale(0))
    .y1(d => yScale(d.total))
    .curve(d3.curveStepAfter)

function render(data) {
    const healthcareData = data.sheets.healthcare;

    const elHeight = height * 3;

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

    // stackData.forEach((d) => {
    //     svg.append("path")
    //         .datum(d)
    //         .style("stroke", "#ffffff")
    //         .style("stroke-width", "0.5px")
    //         // .style("stroke-dasharray", "2, 2")
    //         .style("fill", "none")
    //         .attr("d", countryLine);

    //     // barsG.append("path")
    //     //     .datum(d)
    //     //     .style("fill", "#dcdcdc")
    //     //     .attr("d", healthcareArea)
    //     //     .style("opacity", 1)
    // });

    barsG.append("g").html(`<g>
		<g>	
			<text transform="matrix(1 0 0 1 25.0609 72.6699)"><tspan x="0" y="0" style="font-family:'Guardian Text Sans Web'; font-size:16;">More people</tspan><tspan x="0" y="19.2" style="font-family:'Guardian Text Sans Web'; font-size:16;">insured</tspan></text>
			<line style="fill:none;stroke:#000000;stroke-width:2;" x1="10.061" y1="145.34" x2="10.061" y2="2.405"/>
			<g>
				<path d="M19.661,16.074c-0.465,0.297-1.084,0.158-1.381-0.309L10.061,2.861L1.842,15.766c-0.297,0.467-0.916,0.605-1.381,0.309
					c-0.465-0.297-0.6-0.92-0.307-1.383L9.217,0.463C9.401,0.176,9.719,0,10.061,0s0.66,0.176,0.844,0.463l9.063,14.229
					c0.105,0.168,0.156,0.354,0.156,0.537C20.123,15.559,19.959,15.883,19.661,16.074z"/>
			</g>
		</g>
	</g>`)
	.attr("transform", "translate(10," + (isMobile ? yScale(1000000000) : height/2) + ")");

    // solid block of population insured
    barsG.append("path")
        .datum(healthcarePopulationData)
        .style("fill", "#f6f6f6")
        .attr("d", healthcareArea2)
        .style("opacity", 1)

    barsG.append("text")
        .text("Population insured")
        .attr("x", xScale(1980))
        .attr("y", yScale(200000000))
        .classed("insured-label", true)
        .attr("stroke", "#dcdcdc")
        .attr("stroke-width", "4px")

    barsG.append("text")
        .text("Population insured")
        .attr("x", xScale(1980))
        .attr("y", yScale(200000000))
        .classed("insured-label", true)

    const healthcareLineEl = svg.append("path")
        .datum([])
        .style("stroke", "#ff9b0b")
        .style("stroke-width", "2px")
        .style("fill", "none")
        .attr("d", healthcareLine);

    document.querySelector("#hidden-svg path").setAttribute("d", healthcareLine(healthcarePopulationData));

    const lineLength = document.querySelector("#hidden-svg path").getTotalLength();

    svg.append("g")
    	.classed("x-axis", true)
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis);

    healthcareLineEl
        .style("stroke-dasharray", lineLength)
        .style("stroke-dashoffset", lineLength);

    checkScroll(healthcareLineEl, elHeight, lineLength, healthcarePopulationData, healthcareLine, healthcareData, svg, stackData, barsG);

}

function checkScroll(healthcareLineEl, elHeight, lineLength, healthcarePopulationData, healthcareLine, healthcareData, svg, stackData, barsG) {
    window.requestAnimationFrame(() => {
        const scroll = window.scrollY;
        if (scroll !== prevScroll) {
            const elOffset = interactiveChartEl.getBoundingClientRect().top + scroll;

            prevScroll = scroll;

            const scrollToUse = scroll - elOffset;
            const scrollDepth = scrollToUse / elHeight;
            console.log(scrollToUse, elHeight)

            doScrollEvent(healthcareLineEl, scrollDepth, lineLength, healthcarePopulationData, healthcareLine, healthcareData, svg, stackData, barsG);
        }

        checkScroll(healthcareLineEl, elHeight, lineLength, healthcarePopulationData, healthcareLine, healthcareData, svg, stackData, barsG);
    });
}

function doScrollEvent(healthcareLineEl, scrollDepth, lineLength, healthcarePopulationData, healthcareLine, healthcareData, svg, stackData, barsG) {
    if (scrollDepth < 0) {
        scrollDepth = 0
    }

    if (scrollDepth > 1) {
        scrollDepth = 1;
    }

    if (scrollDepth < prevScrollDepth) {
        return;
    }

    console.log(scrollDepth)

    const depthChange = Math.abs(scrollDepth - prevScrollDepth);

    const cutOff = Math.ceil(healthcarePopulationData.length * scrollDepth);

    healthcareLineEl
        .attr("d", healthcareLine(healthcarePopulationData.filter((d, i) => i <= cutOff)))
        .transition().duration(2500 * depthChange).style("stroke-dashoffset", lineLength - (lineLength * scrollDepth))

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
                    //  	.duration(1000)
                    //  	.attr("height", 36)
                    //  	.attr("width", 36)
                    //  	.attr("x", xScale(Number(d.start)) - 18)
                    //         .attr("y", yScale(stack[0][1]) - 18)
                    //  	.transition()
                    //  	.duration(1000)
                    //  	.attr("height", 18)
                    //  	.attr("width", 18)
                    //  	.attr("x", xScale(Number(d.start)) - 9)
                    //         .attr("y", yScale(stack[0][1]) - 9)

                    if (d.highlight === "yes") {
                        svg.append("text")
                            .text(d.country)
                            .attr("x", xScale(Number(d.start)))
                            .attr("y", yScale(stack[0][1]))
                            .classed("country-label", true)
                            .style("text-anchor", "end")
                            .attr("dy", 3)
                            .attr("dx", -8)

                        svg.append("circle")
                            .attr("cx", xScale(Number(d.start)))
                            .attr("cy", yScale(stack[0][1]))
                            .attr("r", 0)
                            .style("fill", "#ff9b0b")
                            .style("stroke", "none")
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
                    //     	.duration(250)
                    //     	.style("opacity", "0.25");

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

d3.json("https://interactive.guim.co.uk/docsdata-test/1tShBzjbsgHmYeGwqROaJa-JkypJlAtwxOF-C-L0XPTo.json", (data) => {render(data); lifeExpectancyChart(data)});

function totalPopWithHealthCare(healthcareData) {
    const years = Array(2016 - 1900).fill().map((d, i) => 1900 + i);

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
    const years = Array(2016 - 1900).fill().map((d, i) => 1900 + i);

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

function lifeExpectancyChart(data) {
    const lineEl = d3.select(".interactive-chart-2");

    lineEl.append("svg")
        .attr("width", width)
        .attr("height", height);
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
//     	const totalForYear = d3.sum(healthcareData, (d) => d[year]);
//     	return {
//     		"year": year,
//     		"total": d3.sum(healthcareData.filter((d) => Number(d.start) <= year), (a) => a[year])
//     	};
//     });

//     return popWithHealthCare;
// }

// function transposeHealthcareData(healthcareData) {
// 	const years = Object.keys(healthcareData[0]).filter(d => Number(d) >= 1960 && Number(d) <= 2016);

// 	let transposedHealthcareData = [];

// 	return years.map((year) => {
// 		let yearData = {"year": year};

// 		const totalForYear = d3.sum(healthcareData, (d) => d[year]);

// 		healthcareData.forEach((d) => {
// 			yearData[d.country] = d[year];
// 		});

// 		return yearData;
// 	});

// }