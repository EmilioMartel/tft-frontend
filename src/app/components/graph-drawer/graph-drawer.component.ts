import {
  Component,
  ElementRef,
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

  private readonly linkThreshold = 15;

  private fixedLinks: {
    source: string;
    target: string;
    sourceAnchor: [number, number];
    targetAnchor: [number, number];
  }[] = [];

  constructor() {
    effect(() => {
      const graph = this.graphService.graphData();
      if (!graph) return;

      const shouldRecalculateLinks = this.fixedLinks.length === 0;

      this.initializeNodePositions(graph);

      if (shouldRecalculateLinks) {
        this.fixedLinks = this.inferLinksByExtremes(graph);
      }

      this.renderGraph(graph);
    });

    effect(() => {
      this.updateZoom(this.graphState.zoom);
    });

    effect(() => {
      this.updateNodeFill(this.graphState.randomColors);
    });

    effect(() => {
      this.updateNodeLabels(this.graphState.showNodeLabels);
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

  private inferLinksByExtremes(graph: GraphData): {
    source: string;
    target: string;
    sourceAnchor: [number, number];
    targetAnchor: [number, number];
  }[] {
    const extremes = graph.nodes.map((node) => {
      const start = node.points[0];
      const end = node.points[node.points.length - 1];
      return {
        id: node.id,
        plus: [end[0] + node.x!, end[1] + node.y!] as [number, number],
        minus: [start[0] + node.x!, start[1] + node.y!] as [number, number],
      };
    });

    const parent = new Map<string, string>();
    const find = (x: string): string => {
      if (!parent.has(x)) parent.set(x, x);
      if (parent.get(x) !== x) parent.set(x, find(parent.get(x)!));
      return parent.get(x)!;
    };
    const union = (x: string, y: string): boolean => {
      const rootX = find(x);
      const rootY = find(y);
      if (rootX === rootY) return false;
      parent.set(rootX, rootY);
      return true;
    };

    const candidates: {
      a: (typeof extremes)[0];
      b: (typeof extremes)[0];
      dirA: 'plus' | 'minus';
      dirB: 'plus' | 'minus';
      dist: number;
    }[] = [];

    for (const a of extremes) {
      for (const b of extremes) {
        if (a.id === b.id) continue;

        for (const dirA of ['plus', 'minus'] as const) {
          for (const dirB of ['plus', 'minus'] as const) {
            const pA = a[dirA];
            const pB = b[dirB];
            const dx = pA[0] - pB[0];
            const dy = pA[1] - pB[1];
            const dist = dx * dx + dy * dy;

            if (dist < this.linkThreshold ** 2) {
              candidates.push({ a, b, dirA, dirB, dist });
            }
          }
        }
      }
    }

    candidates.sort((a, b) => a.dist - b.dist);

    const links: {
      source: string;
      target: string;
      sourceAnchor: [number, number];
      targetAnchor: [number, number];
    }[] = [];

    for (const { a, b, dirA, dirB } of candidates) {
      if (!union(a.id, b.id)) continue;

      const pA = a[dirA];
      const pB = b[dirB];
      const sourceNode = graph.nodes.find((n) => n.id === a.id)!;
      const targetNode = graph.nodes.find((n) => n.id === b.id)!;

      links.push({
        source: a.id,
        target: b.id,
        sourceAnchor: [pA[0] - sourceNode.x!, pA[1] - sourceNode.y!],
        targetAnchor: [pB[0] - targetNode.x!, pB[1] - targetNode.y!],
      });
    }

    return links;
  }

  private renderGraph(graph: GraphData): void {
    const element = this.elementRef.nativeElement;

    const prevTransform = this.svg ? d3.zoomTransform(this.svg.node()!) : null;

    d3.select(element).select('svg').remove();

    this.svg = d3
      .select(element)
      .append('svg')
      .attr('width', '100vw')
      .attr('height', '100vh')
      .style('background-color', '#f4f4f4');

    this.zoomGroup = this.svg.append('g');

    this.zoomBehavior = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 10])
      .on('zoom', (event) => {
        this.zoomGroup.attr('transform', event.transform);
      });

    this.svg.call(this.zoomBehavior);

    if (prevTransform) {
      this.svg.call(this.zoomBehavior.transform, prevTransform);
    }

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
        pathGen(this.buildThickPath(d.points, this.graphState.nodeWidth))
      )
      .attr('fill', (d) =>
        this.graphState.randomColors ? this.getColorForNode(d.id) : '#1f77b4'
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

  private safeCentroid(points: [number, number][]): [number, number] | null {
    const centroid = d3.polygonCentroid(points);
    return centroid.some((v) => !Number.isFinite(v)) ? null : centroid;
  }

  private updateZoom(zoom: number): void {
    if (!this.svg) return;
    this.svg
      .transition()
      .duration(500)
      .call(this.zoomBehavior.transform, d3.zoomIdentity.scale(zoom));
  }

  private updateNodeFill(useRandom: boolean): void {
    if (!this.zoomGroup) return;

    this.zoomGroup
      .selectAll<SVGPathElement, { id: string }>('.nodes path')
      .attr('fill', (d: { id: any }) => {
        return useRandom ? this.getColorForNode(d.id) : '#1f77b4';
      });
  }

  private updateNodeLabels(visible: boolean): void {
    if (!this.zoomGroup) return;
    this.zoomGroup
      .selectAll('.node text')
      .attr('visibility', visible ? 'visible' : 'hidden');
  }

  private nodeColors = new Map<string, string>();

  private getColorForNode(id: string): string {
    if (!this.nodeColors.has(id)) {
      const color = `#${Math.floor(Math.random() * 16777215).toString(16)}`;
      this.nodeColors.set(id, color);
    }
    return this.nodeColors.get(id)!;
  }
}
