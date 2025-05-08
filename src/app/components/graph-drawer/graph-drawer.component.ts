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
        // Inicializa coordenadas x/y si no existen
        graph.nodes.forEach(n => {
          if (n.x === undefined || n.y === undefined) {
            const centroid = this.safeCentroid(n.points);
            if (centroid) {
              n.x = centroid[0];
              n.y = centroid[1];
              n.points = n.points.map(([x, y]) => [x - n.x, y - n.y]);
            } else {
              n.x = 0;
              n.y = 0;
            }
          }
        });

        this.graphInfo.emit({ nodes: graph.nodes.length, links: graph.links.length });
        this.renderInteractiveGraph(graph);
      }
    });
  }

  private renderInteractiveGraph(graph: GraphData): void {
    const element = this.elementRef.nativeElement;
    d3.select(element).select('svg').remove();

    const boundingRect = element.getBoundingClientRect();

    this.svg = d3.select(element).append('svg')
      .attr('width', boundingRect.width)
      .attr('height', boundingRect.height)
      .style('background-color', '#f4f4f4');

    this.zoomGroup = this.svg.append('g');

    this.zoomBehavior = d3.zoom<SVGSVGElement, unknown>()
      .extent([[0, 0], [boundingRect.width, boundingRect.height]])
      .on('zoom', (event) => this.zoomGroup.attr('transform', event.transform));

    this.svg.call(this.zoomBehavior);
    this.svg.call(this.zoomBehavior.transform, d3.zoomIdentity.scale(this.graphState.zoom));

    const pathGenerator = d3.line<[number, number]>().curve(d3.curveCardinalClosed);
    const nodeMap = new Map(graph.nodes.map(n => [n.id, n]));
    const self = this;
    const nodeGroup = this.zoomGroup.append('g')
      .attr('class', 'nodes')
      .selectAll('g')
      .data(graph.nodes, (d: any) => d.id)
      .join('g')
      .attr('class', 'node')
      .attr('transform', d => `translate(${d.x}, ${d.y})`)
      .call(
        d3.drag<any, any>()
          .on('start', function () {
            d3.select('svg').on('.zoom', null); // desactiva zoom al arrastrar
          })
          .on('drag', function (event, d) {
            d.x += event.dx;
            d.y += event.dy;
      
            d3.select<SVGGElement, any>(this)
              .attr('transform', `translate(${d.x}, ${d.y})`);
      
            self.updateLinks(
              self.graphService.graphData()!,
              new Map(self.graphService.graphData()!.nodes.map((n: { id: any; }) => [n.id, n]))
            );
          })
          .on('end', function () {
            d3.select<SVGSVGElement, unknown>('svg').call(self.zoomBehavior); // reactiva zoom
          })
      )
      

    nodeGroup.append('path')
      .attr('d', d => pathGenerator(this.buildThickPath(d.points, this.nodeThickness)) || '')
      .attr('fill', () => this.graphState.randomColors ? this.getRandomColor() : '#1f77b4')
      .attr('stroke', '#333')
      .attr('stroke-width', 1);

    nodeGroup.append('text')
      .text(d => d.id)
      .attr('font-size', '12px')
      .attr('fill', '#000')
      .attr('x', 10)
      .attr('y', 4)
      .attr('visibility', this.graphState.showNodeLabels ? 'visible' : 'hidden');

    this.updateLinks(graph, nodeMap);
  }

  private updateLinks(graph: GraphData, nodeMap: Map<string, any>): void {
    const links = graph.links.map(link => {
      const source = nodeMap.get(link.source);
      const target = nodeMap.get(link.target);
      if (!source || !target) return null;

      const sourceGlobal = source.points.map(([x, y]: [number, number]) => [x + source.x, y + source.y]);
      const targetGlobal = target.points.map(([x, y]: [number, number]) => [x + target.x, y + target.y]);

      const centroidTarget = this.safeCentroid(targetGlobal);
      const centroidSource = this.safeCentroid(sourceGlobal);
      if (!centroidSource || !centroidTarget) return null;

      return {
        source: this.getClosestEdgePoint(sourceGlobal, centroidTarget),
        target: this.getClosestEdgePoint(targetGlobal, centroidSource)
      };
    }).filter((l): l is { source: [number, number]; target: [number, number] } => l !== null);

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
      if (len === 0) continue;
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
    const offsetXEnd = (this.nodeThickness / 2) * nxEnd;
    const offsetYEnd = (this.nodeThickness / 2) * nyEnd;
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

  private safeCentroid(points: [number, number][]): [number, number] | null {
    if (!Array.isArray(points) || points.length < 3) return null;
    const centroid = d3.polygonCentroid(points);
    if (centroid.some(v => !Number.isFinite(v))) return null;
    return centroid;
  }

  private updateGraphDisplay(
    zoom: number,
    _nodeWidth: number,
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
