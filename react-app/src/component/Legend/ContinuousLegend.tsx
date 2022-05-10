import * as React from "react";
import { useRef } from "react";
import { RGBToHex, colorsArray } from "../Utils/legendCommonFunction";
import { select, scaleLinear, scaleSequential, axisBottom, axisRight } from "d3";
import { colorTablesArray } from "../colorTableTypes";
import { d3ColorScales } from "../Utils/d3ColorScale";
import { color } from "d3-color";
import { range } from "d3";

declare type legendProps = {
    min: number;
    max: number;
    dataObjectName: string;
    position?: number[] | null;
    colorName: string;
    colorTables: colorTablesArray | string;
    horizontal?: boolean | null;
    updateLegend?: any;
}

declare type ItemColor = {
    color: string;
    offset: number;
}

export const ContinuousLegend: React.FC<legendProps> = ({
    min,
    max,
    dataObjectName,
    position,
    colorName,
    colorTables,
    horizontal,
    updateLegend,
}: legendProps) => {
    const divRef = useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        if (divRef.current) {
            continuousLegend();
        };
        return function cleanup() {
            select(divRef.current).select("div").remove();
            select(divRef.current).select("svg").remove();
        };
    }, [min, max, colorName, colorTables, horizontal, updateLegend]);

    async function continuousLegend() {
        const itemColor: ItemColor[] = [];
        let dataSet;

        try {
            // fix for dash wrapper
            if (typeof colorTables === "string") {
                const res = await fetch(colorTables);
                dataSet = await res.json()
            }
            //Return the matched colors array from color.tables.json file
            let legendColors = typeof colorTables === "string" ? 
                colorsArray(colorName, dataSet)
                :
                colorsArray(colorName, colorTables);  

            // Update color of legend based on color selector scales
            // data is passed on click upon color scales
            if (updateLegend && Object.keys(updateLegend).length > 0) {
                // legend using color table data
                if (updateLegend.color) {
                    legendColors = updateLegend.color;
                } 
                // legend using d3 data
                else if (updateLegend.arrayData) {
                    legendColors = updateLegend.arrayData;
                }
            } 
            // main continuous legend for colortable colors
            if (legendColors.length > 0) {
                legendColors = legendColors
            }
            // main continuous legend for d3 colors
            else {
                    const arrayData: any = []
                    const d3ColorArrays = colorsArray(colorName, d3ColorScales)
                    const data = range(10).map((d) => ({color: d3ColorArrays(d / 10)}));
                    data.forEach((colorsObject: any, index: number) => {
                        arrayData.push([0 + "." + index, color(colorsObject.color)?.rgb().r, color(colorsObject.color)?.rgb().g, color(colorsObject.color)?.rgb().b])
                    });
                    legendColors = arrayData
            }

            legendColors.forEach((value: [number, number, number, number]) => {
                // return the color and offset needed to draw the legend
                itemColor.push({
                    offset: RGBToHex(value).offset,
                    color: RGBToHex(value).color,
                });
            });

            const colorScale = scaleSequential().domain([min, max]);
            // append a defs (for definition) element to your SVG
            const svgLegend = select(divRef.current)
                .append("svg")
                .style("background-color", "#ffffffcc")
                .style("border-radius", "5px");

            const defs = svgLegend.append("defs");
            let linearGradient;
                svgLegend
                    .attr("width", horizontal ? "190" : "80")
                    .attr("height", horizontal ? "90" : "190");
                // append a linearGradient element to the defs and give it a unique id
                linearGradient = defs
                    .append("linearGradient")
                    .attr("id", "linear-gradient")
                    .attr("x1", "0%")
                    .attr("x2", horizontal ? "100%" : "0%")
                    .attr("y1", "0%")
                    .attr("y2", horizontal ? "0%" : "100%"); //since it's a vertical linear gradient

            // append multiple color stops by using D3's data/enter step
            linearGradient
                .selectAll("stop")
                .data(itemColor)
                .enter()
                .append("stop")
                .attr("offset", function (data) {
                    return data.offset + "%";
                })
                .attr("stop-color", function (data) {
                    return data.color;
                });

                // draw the rectangle and fill with gradient
                svgLegend
                    .append("rect")
                    .attr("x", 25)
                    .attr("y", 30)
                    .attr("width", horizontal ? "149" : 20)
                    .attr("height", horizontal ? 20 : "149")
                    .style("fill", "url(#linear-gradient)");

                // append title
                svgLegend
                .append("text")
                .attr("x", horizontal ? 25 : -180)
                .attr("y", horizontal ? 20 : 15)
                .style("text-anchor", "left")
                .style("transform", horizontal ? "none" : "left")
                .style("transform", horizontal ? "none" : "rotate(270deg)")
                .style("color", "grey")
                .style("font-size", "small")
                .text(dataObjectName);

            // create tick marks
            // range varies the size of the axis
            const xLeg = scaleLinear().domain([min, max]).range([10, 158]);
            const yLeg = scaleLinear().domain([min, max]).range([10, 158]);

            const horizontalAxisLeg = axisBottom(xLeg).tickValues(
                colorScale.domain()
            );
            const VerticalAxisLeg = axisRight(yLeg)
                .tickSize(20)
                .tickValues(colorScale.domain());

                svgLegend
                    .attr("class", "axis")
                    .append("g")
                    .attr("transform", horizontal ? "translate(16, 50)" : "translate(25, 20)")
                    .style("font-size", "10px")
                    .style("font-weight", "700")
                    .call(horizontal ? horizontalAxisLeg : VerticalAxisLeg)
                    .style("height", 15);
        } catch (error) {
            console.error(error);
        }
    }

    return (
        <div
            style={{
                position: "absolute",
                right: position ? position[0] : " ",
                top: position ? position[1] : " ",
                zIndex: 999,
            }}
        >
            <div id="legend" ref={divRef}></div>
        </div>
    );
};

ContinuousLegend.defaultProps = {
    position: [5, 10],
};
