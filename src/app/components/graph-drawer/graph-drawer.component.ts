import { Component, ElementRef, inject, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import * as d3 from 'd3';
import {
  GraphData,
  GraphService,
  Link,
} from '../../services/graph/graph.service';
import { GraphStateService } from '../../services/graph-state/graph-state.service';

@Component({
  selector: 'app-graph-drawer',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './graph-drawer.component.html',
  styleUrls: ['./graph-drawer.component.css'],
})
export class GraphDrawerComponent {
  public graphService = inject(GraphService);
  private graphState = inject(GraphStateService);
  private elementRef = inject(ElementRef);

  private svg!: d3.Selection<SVGSVGElement, unknown, null, undefined>;
  private zoomGroup!: d3.Selection<SVGGElement, unknown, null, undefined>;
  private zoomBehavior!: d3.ZoomBehavior<SVGSVGElement, unknown>;

  // Genera y memoiza un color por nodo
  private nodeColors = new Map<string, string>();

  constructor() {
    // Sólo reaccionamos cuando el usuario haya llamado a loadGraph()
    effect(() => {
      const graph = this.graphService.graphData();
      if (!graph) return;
      this.initializeNodePositions(graph);
      this.renderGraph(graph);
    });

    // Reactividad de zoom, color y etiquetas
    effect(() => this.updateZoom(this.graphState.zoom));
    effect(() => this.updateNodeFill(this.graphState.randomColors));
    effect(() => this.updateNodeLabels(this.graphState.showNodeLabels));
  }

  /** Llamar manualmente (p.e. al click de un botón) para cargar el grafo */
  public loadGraph(): void {
    this.graphService.fetchGraph();
  }

  /** Centra cada nodo en su centroide si no tiene posición */
  private initializeNodePositions(graph: GraphData): void {
    for (const node of graph.nodes) {
      if (node.x == null || node.y == null) {
        const c = d3.polygonCentroid(node.points);
        node.x = Number.isFinite(c[0]) ? c[0] : 0;
        node.y = Number.isFinite(c[1]) ? c[1] : 0;
        node.points = node.points.map(([px, py]) => [
          px - node.x!,
          py - node.y!,
        ]) as [number, number][];
      }
    }
  }

  /** Prepara SVG, zoom y llama a dibujar nodos y enlaces */
  private renderGraph(graph: GraphData): void {
    const el = this.elementRef.nativeElement;
    const prev = this.svg ? d3.zoomTransform(this.svg.node()!) : null;

    d3.select(el).select('svg').remove();
    this.svg = d3
      .select(el)
      .append('svg')
      .attr('width', '100vw')
      .attr('height', '100vh')
      .style('background-color', '#f4f4f4');

    this.zoomGroup = this.svg.append('g');
    this.zoomBehavior = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 10])
      .on('zoom', (evt) => this.zoomGroup.attr('transform', evt.transform));
    this.svg.call(this.zoomBehavior);
    if (prev) this.svg.call(this.zoomBehavior.transform, prev);

    this.renderNodes(graph);
    this.renderLinks(graph);
  }

  /** Dibuja los contornos gruesos de los nodos y sus etiquetas */
  private renderNodes(graph: GraphData): void {
    const lineGen = d3.line<[number, number]>().curve(d3.curveCardinalClosed);

    const nodesG = this.zoomGroup
      .append('g')
      .attr('class', 'nodes')
      .selectAll<SVGGElement, any>('g')
      .data(graph.nodes, (d: any) => d.id)
      .join('g')
      .attr('class', 'node')
      .attr('transform', (d) => `translate(${d.x},${d.y})`)
      .call(this.setupDrag());

    nodesG
      .append('path')
      .attr('d', (d) =>
        lineGen(this.buildThickPath(d.points, this.graphState.nodeWidth))
      )
      .attr('fill', (d) =>
        this.graphState.randomColors ? this.getColorForNode(d.id) : '#1f77b4'
      )
      .attr('stroke', '#333')
      .attr('stroke-width', 1);

    nodesG
      .append('text')
      .text((d) => d.id)
      .attr('x', 10)
      .attr('y', 4)
      .attr('font-size', '12px')
      .attr(
        'visibility',
        this.graphState.showNodeLabels ? 'visible' : 'hidden'
      );
  }

 private renderLinks(graph: GraphData): void {
  this.zoomGroup.selectAll('g.links').remove();
  const g = this.zoomGroup.append('g').attr('class', 'links');

  // 1) Filtrar solo enlaces válidos
  const valid = graph.links.filter(
    l =>
      graph.nodes.some(n => n.id === l.source) &&
      graph.nodes.some(n => n.id === l.target)
  );

  console.log('[GraphDrawer] total links=', graph.links.length, ' valid=', valid.length);

  g.selectAll<SVGPathElement, any>('path')
    .data(valid)
    .join('path')
    .attr('stroke', '#999')
    .attr('stroke-width', 1)
    .attr('fill', 'none')
    .attr('d', l => {
      const sNode = graph.nodes.find(n => n.id === l.source)!;
      const tNode = graph.nodes.find(n => n.id === l.target)!;

      // 2) Convertimos puntos relativos a coordenadas absolutas
      const sPts = sNode.points.map(([px, py]) =>
        [px + sNode.x!, py + sNode.y!] as [number, number]
      );
      const tPts = tNode.points.map(([px, py]) =>
        [px + tNode.x!, py + tNode.y!] as [number, number]
      );

      // 3) Buscamos el par de vértices (uno en sPts, otro en tPts) con menor distancia²
      let minD = Infinity;
      let anchorS: [number, number] = sPts[0];
      let anchorT: [number, number] = tPts[0];

      for (const pS of sPts) {
        for (const pT of tPts) {
          const dx = pS[0] - pT[0];
          const dy = pS[1] - pT[1];
          const d2 = dx * dx + dy * dy;
          if (d2 < minD) {
            minD = d2;
            anchorS = pS;
            anchorT = pT;
          }
        }
      }

      // 4) Dibujamos la línea entre esos dos áncoras
      return `M${anchorS[0]},${anchorS[1]} L${anchorT[0]},${anchorT[1]}`;
    });
}


  /** Drag & drop: desactiva zoom y mueve nodo */
  private setupDrag() {
    const self = this;
    return d3
      .drag<SVGGElement, any>()
      .on('start', function () {
        d3.select('svg').on('.zoom', null);
      })
      .on('drag', function (evt, d: any) {
        d.x += evt.dx;
        d.y += evt.dy;
        d3.select(this).attr('transform', `translate(${d.x},${d.y})`);

        self.renderLinks(self.graphService.graphData()!);
      })
      .on('end', function () {
        return d3.select<SVGSVGElement, unknown>('svg').call(self.zoomBehavior);
      });
  }

  /** Crea un polígono offset para grosor */
  private buildThickPath(
    points: [number, number][],
    thickness: number
  ): [number, number][] {
    const left: [number, number][] = [];
    const right: [number, number][] = [];
    for (let i = 0; i < points.length - 1; i++) {
      const [x1, y1] = points[i];
      const [x2, y2] = points[i + 1];
      const dx = x2 - x1,
        dy = y2 - y1;
      const len = Math.hypot(dx, dy) || 1;
      const nx = -dy / len,
        ny = dx / len;
      left.push([x1 + (nx * thickness) / 2, y1 + (ny * thickness) / 2]);
      right.push([x1 - (nx * thickness) / 2, y1 - (ny * thickness) / 2]);
    }
    const last = points[points.length - 1];
    const prev = points[points.length - 2] || last;
    const dx = last[0] - prev[0],
      dy = last[1] - prev[1];
    const len = Math.hypot(dx, dy) || 1;
    const nx = -dy / len,
      ny = dx / len;
    left.push([last[0] + (nx * thickness) / 2, last[1] + (ny * thickness) / 2]);
    right.push([
      last[0] - (nx * thickness) / 2,
      last[1] - (ny * thickness) / 2,
    ]);
    return [...left, ...right.reverse()];
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
      .selectAll<SVGPathElement, any>('.nodes path')
      .attr('fill', (d) =>
        useRandom ? this.getColorForNode(d.id) : '#1f77b4'
      );
  }

  private updateNodeLabels(visible: boolean): void {
    if (!this.zoomGroup) return;
    this.zoomGroup
      .selectAll('.node text')
      .attr('visibility', visible ? 'visible' : 'hidden');
  }

  private getColorForNode(id: string): string {
    if (!this.nodeColors.has(id)) {
      const color = `#${Math.floor(Math.random() * 0xffffff)
        .toString(16)
        .padStart(6, '0')}`;
      this.nodeColors.set(id, color);
    }
    return this.nodeColors.get(id)!;
  }
}
