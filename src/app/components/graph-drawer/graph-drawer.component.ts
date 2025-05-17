import {
  Component,
  ElementRef,
  EventEmitter,
  Output,
  effect,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import * as d3 from 'd3';
import { GraphData, GraphService } from '../../services/graph/graph.service';
import { GraphStateService } from '../../services/graph-state/graph-state.service';

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

  private fixedLinks: {
    source: string;
    target: string;
    sourceAnchor: [number, number];
    targetAnchor: [number, number];
  }[] = [];

  @Output() graphInfo = new EventEmitter<{ nodes: number; links: number }>();

  constructor() {
    effect(() => {
      const graph = this.graphService.graphData();
      if (!graph) return;

      const shouldRecalculateLinks = this.fixedLinks.length === 0;

      this.initializeNodePositions(graph);
      this.graphInfo.emit({ nodes: graph.nodes.length, links: 0 });

      if (shouldRecalculateLinks) {
        this.fixedLinks = this.calculateInitialLinks(graph);
      }

      this.renderGraph(graph);
      this.updateGraphAppearance();
    });
  }

  private initializeNodePositions(graph: GraphData): void {
    for (const node of graph.nodes) {
      if (node.x == null || node.y == null) {
        const centroid = this.safeCentroid(node.points);
        if (centroid) {
          node.x = centroid[0];
          node.y = centroid[1];
          node.points = node.points.map(([x, y]) => [x - node.x, y - node.y]);
        } else {
          node.x = 0;
          node.y = 0;
        }
      }
    }
  }

  private renderGraph(graph: GraphData): void {
    const element = this.elementRef.nativeElement;
    d3.select(element).select('svg').remove();

    const bounds = element.getBoundingClientRect();

    this.svg = d3
      .select(element)
      .append('svg')
      .attr('width', '100vw')
      .attr('height', '100vh')
      .style('background-color', '#f4f4f4');

    this.zoomGroup = this.svg.append('g');

    this.zoomBehavior = d3
      .zoom<SVGSVGElement, unknown>()
      .extent([
        [0, 0],
        [bounds.width, bounds.height],
      ])
      .on('zoom', (event) => {
        this.zoomGroup.attr('transform', event.transform);
      });

    this.svg.call(this.zoomBehavior);
    this.svg.call(
      this.zoomBehavior.transform,
      d3.zoomIdentity.scale(this.graphState.zoom)
    );

    this.renderNodes(graph);
    this.renderLinks(graph);
  }

  private renderNodes(graph: GraphData): void {
    const pathGen = d3.line<[number, number]>().curve(d3.curveCardinalClosed);

    const nodeGroup = this.zoomGroup
      .append('g')
      .attr('class', 'nodes')
      .selectAll('g')
      .data(graph.nodes, (d: any) => d.id)
      .join('g')
      .attr('class', 'node')
      .attr('transform', (d) => `translate(${d.x}, ${d.y})`)
      .call(this.setupDrag());

    nodeGroup
      .append('path')
      .attr('d', (d) =>
        pathGen(this.buildThickPath(d.points, this.nodeThickness))
      )
      .attr('fill', () =>
        this.graphState.randomColors ? this.getRandomColor() : '#1f77b4'
      )
      .attr('stroke', '#333')
      .attr('stroke-width', 1);

    nodeGroup
      .append('text')
      .text((d) => d.id)
      .attr('font-size', '12px')
      .attr('fill', '#000')
      .attr('x', 10)
      .attr('y', 4)
      .attr(
        'visibility',
        this.graphState.showNodeLabels ? 'visible' : 'hidden'
      );
  }

  private setupDrag() {
    const self = this;

    return d3
      .drag<any, any>()
      .on('start', function () {
        d3.select('svg').on('.zoom', null);
      })
      .on('drag', function (event, d) {
        d.x += event.dx;
        d.y += event.dy;

        d3.select<SVGGElement, any>(this).attr(
          'transform',
          `translate(${d.x}, ${d.y})`
        );

        self.renderLinks(self.graphService.graphData()!);
      })
      .on('end', function () {
        d3.select<SVGSVGElement, unknown>('svg').call(self.zoomBehavior);
      });
  }

  private renderLinks(graph: GraphData): void {
    this.zoomGroup.selectAll('g.links').remove();

    const linkPaths = this.fixedLinks
      .map((link) => {
        const source = graph.nodes.find((n) => n.id === link.source);
        const target = graph.nodes.find((n) => n.id === link.target);
        if (!source || !target) return null;

        return {
          source: [
            source.x + link.sourceAnchor[0],
            source.y + link.sourceAnchor[1],
          ] as [number, number],
          target: [
            target.x + link.targetAnchor[0],
            target.y + link.targetAnchor[1],
          ] as [number, number],
        };
      })
      .filter(
        (d): d is { source: [number, number]; target: [number, number] } =>
          d !== null
      );

    this.zoomGroup
      .append('g')
      .attr('class', 'links')
      .selectAll('path')
      .data(linkPaths)
      .join('path')
      .attr('stroke', '#999')
      .attr('stroke-opacity', 0.6)
      .attr('stroke-width', 1)
      .attr('fill', 'none')
      .attr('d', ({ source, target }) => {
        const [x1, y1] = source;
        const [x2, y2] = target;
        return `M${x1},${y1} L${x2},${y2}`;
      });
  }

  private calculateInitialLinks(
    graph: GraphData
  ): {
    source: string;
    target: string;
    sourceAnchor: [number, number];
    targetAnchor: [number, number];
  }[] {
    const seen = new Set<string>();
    const links: {
      source: string;
      target: string;
      sourceAnchor: [number, number];
      targetAnchor: [number, number];
    }[] = [];

    for (const source of graph.nodes) {
      const nearest = [...graph.nodes]
        .filter((t) => t.id !== source.id)
        .map((t) => {
          const dx = t.x - source.x;
          const dy = t.y - source.y;
          return {
            node: t,
            dist: dx * dx + dy * dy,
          };
        })
        .sort((a, b) => a.dist - b.dist)
        .slice(0, 2);

      for (const { node: target } of nearest) {
        const key = [source.id, target.id].sort().join('-');
        if (seen.has(key)) continue;
        seen.add(key);

        const sourceGlobal: [number, number][] = source.points.map(([x, y]) => [
          x + source.x,
          y + source.y,
        ]);
        const targetGlobal: [number, number][] = target.points.map(([x, y]) => [
          x + target.x,
          y + target.y,
        ]);

        const c1 = this.safeCentroid(sourceGlobal);
        const c2 = this.safeCentroid(targetGlobal);
        if (!c1 || !c2) continue;

        links.push({
          source: source.id,
          target: target.id,
          sourceAnchor: this.getClosestEdgePoint(
            source.points,
            [c2[0] - source.x, c2[1] - source.y]
          ),
          targetAnchor: this.getClosestEdgePoint(
            target.points,
            [c1[0] - target.x, c1[1] - target.y]
          ),
        });
      }
    }

    return links;
  }

  private buildThickPath(
    points: [number, number][],
    thickness: number
  ): [number, number][] {
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
      left.push([x1 + (nx * thickness) / 2, y1 + (ny * thickness) / 2]);
      right.push([x1 - (nx * thickness) / 2, y1 - (ny * thickness) / 2]);
    }

    const [x1, y1] = points[points.length - 2];
    const [x2, y2] = points[points.length - 1];
    const dx = x2 - x1;
    const dy = y2 - y1;
    const len = Math.hypot(dx, dy);
    const nx = -dy / len;
    const ny = dx / len;

    left.push([x2 + (nx * thickness) / 2, y2 + (ny * thickness) / 2]);
    right.push([x2 - (nx * thickness) / 2, y2 - (ny * thickness) / 2]);

    return [...left, ...right.reverse()];
  }

  private getClosestEdgePoint(
    points: [number, number][],
    target: [number, number]
  ): [number, number] {
    return points.reduce(
      (closest, point) => {
        const dist = (point[0] - target[0]) ** 2 +
                     (point[1] - target[1]) ** 2;
        return dist < closest.dist ? { point, dist } : closest;
      },
      {
        point: points[0],
        dist:
          (points[0][0] - target[0]) ** 2 +
          (points[0][1] - target[1]) ** 2,
      }
    ).point;
  }

  private safeCentroid(points: [number, number][]): [number, number] | null {
    const centroid = d3.polygonCentroid(points);
    return centroid.some((v) => !Number.isFinite(v)) ? null : centroid;
  }

  private updateGraphAppearance(): void {
    this.svg
      .transition()
      .duration(500)
      .call(
        this.zoomBehavior.transform,
        d3.zoomIdentity.scale(this.graphState.zoom)
      );

    this.zoomGroup
      .selectAll('.nodes path')
      .attr('fill', () =>
        this.graphState.randomColors ? this.getRandomColor() : '#1f77b4'
      );

    this.zoomGroup
      .selectAll('.node text')
      .attr(
        'visibility',
        this.graphState.showNodeLabels ? 'visible' : 'hidden'
      );
  }

  private getRandomColor(): string {
    return `#${Math.floor(Math.random() * 16777215).toString(16)}`;
  }
}
