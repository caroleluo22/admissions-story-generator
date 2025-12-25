import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { TopicBubble } from '../../types/trend';

interface TopicBubbleChartProps {
    data: TopicBubble[];
    onTopicClick?: (topic: TopicBubble) => void;
}

const TopicBubbleChart: React.FC<TopicBubbleChartProps> = ({ data, onTopicClick }) => {
    const svgRef = useRef<SVGSVGElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!data || !svgRef.current || !containerRef.current) return;

        // Clear previous render
        d3.select(svgRef.current).selectAll("*").remove();

        const width = containerRef.current.clientWidth;
        const height = 400;

        const svg = d3.select(svgRef.current)
            .attr("width", width)
            .attr("height", height)
            .style("overflow", "visible");

        // Color scale
        const color = d3.scaleOrdinal(d3.schemeTableau10);

        // Pack layout
        const pack = d3.pack<{ name: string; value: number; category: string }>()
            .size([width, height])
            .padding(5);

        // Hierarchy
        const root = d3.hierarchy({ children: data } as any)
            .sum((d: any) => d.value);

        const nodes = pack(root).leaves();

        // Groups for bubbles
        const node = svg.selectAll("g")
            .data(nodes)
            .join("g")
            .attr("transform", d => `translate(${d.x},${d.y})`)
            .style("cursor", "pointer")
            .on("click", (event, d: any) => {
                if (onTopicClick) {
                    onTopicClick(d.data);
                }
            })
            .on("mouseover", function () {
                d3.select(this).select("circle").attr("stroke", "white").attr("stroke-width", 3);
            })
            .on("mouseout", function () {
                d3.select(this).select("circle").attr("stroke", "#1e293b").attr("stroke-width", 2);
            });

        // Circles
        node.append("circle")
            .attr("r", d => 0) // Start at 0 for animation
            .attr("fill", (d: any) => color(d.data.category))
            .attr("opacity", 0.8)
            .attr("stroke", "#1e293b")
            .attr("stroke-width", 2)
            .transition().duration(800).ease(d3.easeBackOut)
            .attr("r", d => d.r);

        // Labels
        node.append("text")
            .attr("text-anchor", "middle")
            .attr("dy", "0.3em")
            .attr("fill", "white")
            .style("font-size", d => `${Math.min(d.r / 2, 12)}px`)
            .style("font-weight", "bold")
            .style("pointer-events", "none")
            .style("opacity", 0)
            .text((d: any) => d.data.name.substring(0, d.r / 3)) // Simple truncation
            .transition().delay(500).duration(500)
            .style("opacity", 1);

        // Tooltips (simple title attribute for now, could be custom HTML)
        node.append("title")
            .text((d: any) => `${d.data.name}: ${d.data.value} (${d.data.category})\nClick to view popular posts`);

    }, [data, onTopicClick]);

    return (
        <div ref={containerRef} className="w-full h-[400px] bg-slate-900 rounded-xl shadow-inner border border-slate-800 relative overflow-hidden">
            <div className="absolute top-4 left-4 z-10 pointer-events-none">
                <h3 className="text-slate-400 text-sm uppercase tracking-wider font-semibold">Discussion Hotspots</h3>
                <p className="text-xs text-slate-500 mt-1">Click a bubble to see popular posts</p>
            </div>
            <svg ref={svgRef} className="w-full h-full block" />
        </div>
    );
};

export default TopicBubbleChart;
