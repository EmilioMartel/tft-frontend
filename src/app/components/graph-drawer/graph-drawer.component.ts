import { Component, ElementRef, EventEmitter, Output, effect, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GraphData, GraphService } from '../../services/graph/graph.service';
import { GraphStateService } from '../../services/graph-state/graph-state.service';
import * as d3 from 'd3';

@Component({
  selector: 'app-graph-drawer',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './graph-drawer.component.html',
  styleUrls: ['./graph-drawer.component.css'],
})
export class GraphDrawerComponent {
  private graphState = inject(GraphStateService);
  public graphService = inject(GraphService);
  private elementRef = inject(ElementRef);
  private svg!: d3.Selection<SVGSVGElement, unknown, null, undefined>;
  private zoomGroup!: d3.Selection<SVGGElement, unknown, null, undefined>;
  private zoomBehavior!: d3.ZoomBehavior<SVGSVGElement, unknown>;
  private readonly nodeThickness = 10;

  @Output() graphInfo = new EventEmitter<{ nodes: number; links: number }>();

  constructor() {
    effect(() => {
      const { zoom, nodeWidth, randomColors, showNodeLabels } = this.graphState;
      if (this.svg) {
        this.updateGraphDisplay(zoom, nodeWidth, randomColors, showNodeLabels);
      }
    });

    effect(() => {
      const graph = this.graphService.graphData();
      if (graph) {
        this.graphInfo.emit({ nodes: graph.nodes.length, links: graph.links.length });
        this.renderInteractiveGraph(graph);
      }
    });
  }

  private renderInteractiveGraph(graph: GraphData): void {
    const element = this.elementRef.nativeElement;
    d3.select(element).select('svg').remove();

    this.graphInfo.emit({ nodes: graph.nodes.length, links: graph.links.length });

    const svg = d3.select(element).append('svg')
      .attr('width', '100%')
      .attr('height', '100%')
      .style('background-color', '#f4f4f4');

    this.svg = svg;
    this.zoomGroup = svg.append('g');

    this.zoomBehavior = d3.zoom<SVGSVGElement, unknown>()
      .on('zoom', (event) => this.zoomGroup.attr('transform', event.transform));

    svg.call(this.zoomBehavior);
    svg.call(this.zoomBehavior.transform, d3.zoomIdentity.scale(this.graphState.zoom));

    const pathGenerator = d3.line<[number, number]>()
      .curve(d3.curveCardinalClosed);

    const nodeMap = new Map(graph.nodes.map(n => [n.id, n]));

    const nodePaths = this.zoomGroup.append('g')
      .attr('class', 'nodes')
      .selectAll('path')
      .data(graph.nodes)
      .join('path')
      .attr('d', d => pathGenerator(this.buildThickPath(d.points, this.nodeThickness)))
      .attr('fill', () => this.graphState.randomColors ? this.getRandomColor() : '#1f77b4')
      .attr('stroke', '#333')
      .attr('stroke-width', 1)
      .call(
        d3.drag<any, any>()
          .on('start', (event, d) => svg.on('.zoom', null))
          .on('drag', (event, d) => {
            d.points = d.points.map(([x, y]: [number, number]) => [x + event.dx, y + event.dy]);
            d3.select(event.sourceEvent.target).attr('d', pathGenerator(this.buildThickPath(d.points, this.nodeThickness)));
            this.zoomGroup.selectAll('.labels text')
              .filter((n: any) => n.id === d.id)
              .attr('x', d3.polygonCentroid(d.points)[0] + 10)
              .attr('y', d3.polygonCentroid(d.points)[1] + 4);
            this.updateLinks(graph, nodeMap);
          })
          .on('end', () => svg.call(this.zoomBehavior))
      );

    this.zoomGroup.append('g')
      .attr('class', 'labels')
      .selectAll('text')
      .data(graph.nodes)
      .join('text')
      .text(d => d.id)
      .attr('font-size', '12px')
      .attr('fill', '#000')
      .attr('x', d => d3.polygonCentroid(d.points)[0] + 10)
      .attr('y', d => d3.polygonCentroid(d.points)[1] + 4)
      .attr('visibility', this.graphState.showNodeLabels ? 'visible' : 'hidden');

    this.updateLinks(graph, nodeMap);
  }

  private updateLinks(graph: GraphData, nodeMap: Map<string, any>): void {
    const links = graph.links.map(link => {
      const source = nodeMap.get(link.source.toString())!;
      const target = nodeMap.get(link.target.toString())!;
      const centroidSource = d3.polygonCentroid(source.points);
      const centroidTarget = d3.polygonCentroid(target.points);
      return {
        source: this.getClosestEdgePoint(source.points, centroidTarget),
        target: this.getClosestEdgePoint(target.points, centroidSource)
      };
    });

    this.zoomGroup.selectAll('g.links').remove();

    this.zoomGroup.append('g')
      .attr('class', 'links')
      .selectAll('line')
      .data(links)
      .join('line')
      .attr('stroke', '#999')
      .attr('stroke-opacity', 0.6)
      .attr('stroke-width', 1)
      .attr('x1', d => d.source[0])
      .attr('y1', d => d.source[1])
      .attr('x2', d => d.target[0])
      .attr('y2', d => d.target[1]);
  }

  private buildThickPath(points: [number, number][], thickness: number): [number, number][] {
    const left: [number, number][] = [];
    const right: [number, number][] = [];

    for (let i = 0; i < points.length - 1; i++) {
      const [x1, y1] = points[i];
      const [x2, y2] = points[i + 1];
      const dx = x2 - x1;
      const dy = y2 - y1;
      const len = Math.hypot(dx, dy);
      const nx = -dy / len;
      const ny = dx / len;
      const offsetX = (thickness / 2) * nx;
      const offsetY = (thickness / 2) * ny;
      left.push([x1 + offsetX, y1 + offsetY]);
      right.push([x1 - offsetX, y1 - offsetY]);
    }

    const [xEnd, yEnd] = points[points.length - 1];
    const [xLast, yLast] = points[points.length - 2];
    const dxEnd = xEnd - xLast;
    const dyEnd = yEnd - yLast;
    const lenEnd = Math.hypot(dxEnd, dyEnd);
    const nxEnd = -dyEnd / lenEnd;
    const nyEnd = dxEnd / lenEnd;
    const offsetXEnd = (thickness / 2) * nxEnd;
    const offsetYEnd = (thickness / 2) * nyEnd;
    left.push([xEnd + offsetXEnd, yEnd + offsetYEnd]);
    right.push([xEnd - offsetXEnd, yEnd - offsetYEnd]);

    return [...left, ...right.reverse()];
  }

  private getClosestEdgePoint(points: [number, number][], target: [number, number]): [number, number] {
    let minDist = Infinity;
    let closestPoint: [number, number] = points[0];
    for (const [x, y] of points) {
      const dx = x - target[0];
      const dy = y - target[1];
      const dist = dx * dx + dy * dy;
      if (dist < minDist) {
        minDist = dist;
        closestPoint = [x, y];
      }
    }
    return closestPoint;
  }

  private updateGraphDisplay(
    zoom: number,
    nodeWidth: number,
    randomColors: boolean,
    showNodeLabels: boolean
  ): void {
    if (this.svg) {
      this.svg.transition().duration(500).call(this.zoomBehavior.transform, d3.zoomIdentity.scale(zoom));
    }

    this.zoomGroup.selectAll('.nodes path')
      .attr('fill', () => randomColors ? this.getRandomColor() : '#1f77b4');

    this.zoomGroup.selectAll('.labels text')
      .attr('visibility', showNodeLabels ? 'visible' : 'hidden');
  }

  private getRandomColor(): string {
    return `#${Math.floor(Math.random() * 16777215).toString(16)}`;
  }
}
