import { Component, ElementRef, inject, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import * as d3 from 'd3';
import {
  GraphData,
  GraphService,
  Link,
  Node,
} from '../../services/graph/graph.service';
import { GraphStateService } from '../../services/graph-state/graph-state.service';

type Point = [number, number];

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

  private nodeColors = new Map<string, string>();

  constructor() {
    effect(() => {
      const graph = this.graphService.graphData();
      if (!graph) return;
      this.initializeNodePositions(graph);
      this.renderGraph(graph);
    });

    effect(() => this.updateZoom(this.graphState.zoom));
    effect(() => this.updateNodeFill(this.graphState.randomColors));
    effect(() => this.updateNodeLabels(this.graphState.showNodeLabels));
  }

  public loadGraph(): void {
    this.graphService.fetchGraph();
  }

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

  private renderNodes(graph: GraphData): void {
    const lineGen = d3.line<Point>().curve(d3.curveCardinalClosed);
    const showLabels = this.graphState.showNodeLabels;
    const defaultFill = '#1f77b4';

    // Helper para decidir el color de relleno
    const getFill = (d: Node) =>
      this.graphState.randomColors ? this.getColorForNode(d.id) : defaultFill;

    // 1) Data‐join de los grupos <g.node>
    const nodes = this.zoomGroup
      .selectAll<SVGGElement, Node>('g.node')
      .data(graph.nodes, (d) => d.id)
      .join(
        (enter) =>
          enter.append('g').attr('class', 'node').call(this.setupDrag()),
        (update) => update,
        (exit) => exit.remove()
      )
      .attr('transform', (d) => `translate(${d.x},${d.y})`);

    // 2) Dibujamos las formas gruesas (paths)
    nodes
      .selectAll<SVGPathElement, Node>('path')
      .data((d) => [d]) // rebind each datum for the shape
      .join('path')
      .attr('d', (d) =>
        lineGen(this.buildThickPath(d.points, this.graphState.nodeWidth))
      )
      .attr('fill', getFill)
      .attr('stroke', '#333')
      .attr('stroke-width', 1);

    // 3) Dibujamos las etiquetas
    nodes
      .selectAll<SVGTextElement, Node>('text')
      .data((d) => [d])
      .join('text')
      .text((d) => d.id)
      .attr('x', 10)
      .attr('y', 4)
      .attr('font-size', '12px')
      .attr('visibility', showLabels ? 'visible' : 'hidden');
  }

  /** Guardamos anclajes relativos por linkKey = "source|target" */
  private linkAnchors = new Map<string, { srcRel: Point; dstRel: Point }>();

  private renderLinks(graph: GraphData): void {
    // Limpiamos los anclajes previos
    this.linkAnchors.clear()

    // 1) Preparamos el <g> de enlaces
    this.zoomGroup.selectAll('g.links').remove();
    const linksG = this.zoomGroup.append('g').attr('class', 'links');

    // 2) Mapa de nodos para acceso O(1)
    const nodeMap = new Map(graph.nodes.map((n) => [n.id, n]));

    // 3) Filtramos sólo los enlaces válidos
    const validLinks = graph.links.filter(
      ({ source, target }) => nodeMap.has(source) && nodeMap.has(target)
    );

    // 4) Para cada enlace, si no existe en linkAnchors lo calculamos
    validLinks.forEach((link) => {
      const key = `${link.source}|${link.target}`;
      if (!this.linkAnchors.has(key)) {
        const srcNode = nodeMap.get(link.source)!;
        const dstNode = nodeMap.get(link.target)!;

        // puntos absolutos de los vértices
        const sPts = this.absolutePoints(srcNode);
        const tPts = this.absolutePoints(dstNode);

        // buscamos solo UNA VEZ el par más cercano
        const [a, b] = this.findClosestPair(sPts, tPts);

        // convertimos a relativos al nodo
        const srcRel: Point = [a[0] - srcNode.x!, a[1] - srcNode.y!];
        const dstRel: Point = [b[0] - dstNode.x!, b[1] - dstNode.y!];

        this.linkAnchors.set(key, { srcRel, dstRel });
      }
    });

    // 5) Dibujamos cada path usando los anclajes almacenados
    linksG
      .selectAll<SVGPathElement, Link>('path')
      .data(validLinks, (l) => `${l.source}|${l.target}`)
      .join('path')
      .attr('stroke', '#999')
      .attr('stroke-width', 1)
      .attr('fill', 'none')
      .attr('d', (link) => {
        const key = `${link.source}|${link.target}`;
        const { srcRel, dstRel } = this.linkAnchors.get(key)!;
        const srcNode = nodeMap.get(link.source)!;
        const dstNode = nodeMap.get(link.target)!;

        // volvemos a coordenadas absolutas sumando la posición actual del nodo
        const A: Point = [srcNode.x! + srcRel[0], srcNode.y! + srcRel[1]];
        const B: Point = [dstNode.x! + dstRel[0], dstNode.y! + dstRel[1]];

        return `M${A[0]},${A[1]} L${B[0]},${B[1]}`;
      });
  }

  /** helper que tenías antes */
  private absolutePoints(node: Node): Point[] {
    const x0 = node.x ?? 0,
      y0 = node.y ?? 0;
    return node.points.map(([px, py]) => [px + x0, py + y0] as Point);
  }

  /** Busca el par (p∈A, q∈B) con distancia² mínima */
  private findClosestPair(A: Point[], B: Point[]): [Point, Point] {
    let minD2 = Infinity;
    let best: [Point, Point] = [A[0], B[0]];

    for (const p of A) {
      for (const q of B) {
        const d2 = (p[0] - q[0]) ** 2 + (p[1] - q[1]) ** 2;
        if (d2 < minD2) {
          minD2 = d2;
          best = [p, q];
        }
      }
    }
    return best;
  }

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

  private buildThickPath(points: Point[], thickness: number): Point[] {
    if (points.length < 2) return [];

    // 1) Calculamos una normal unitaria por vértice
    const normals = this.computeVertexNormals(points);

    // 2) Generamos las dos “polilíneas” offset
    const half = thickness / 2;
    const left = points.map((p, i) => this.offsetPoint(p, normals[i], half));
    const right = points.map((p, i) => this.offsetPoint(p, normals[i], -half));

    // 3) Concatenamos izquierda + derecha invertida
    return [...left, ...right.reverse()];
  }

  /**
   * Calcula una normal unitaria en cada vértice promediando las normales
   * de los segmentos adyacentes (o usando la única en los extremos)
   */
  private computeVertexNormals(points: Point[]): Point[] {
    const segNormals: Point[] = [];

    // Normales de cada segmento
    for (let i = 0; i < points.length - 1; i++) {
      segNormals[i] = this.segmentNormal(points[i], points[i + 1]);
    }

    const normals: Point[] = [];

    for (let i = 0; i < points.length; i++) {
      if (i === 0) {
        normals[i] = segNormals[0];
      } else if (i === points.length - 1) {
        normals[i] = segNormals[segNormals.length - 1];
      } else {
        // Promediar y normalizar
        const [nx1, ny1] = segNormals[i - 1];
        const [nx2, ny2] = segNormals[i];
        const avgX = nx1 + nx2;
        const avgY = ny1 + ny2;
        const len = Math.hypot(avgX, avgY) || 1;
        normals[i] = [avgX / len, avgY / len];
      }
    }

    return normals;
  }

  /** Normal unitario perpendicular al segmento AB */
  private segmentNormal(A: Point, B: Point): Point {
    const dx = B[0] - A[0];
    const dy = B[1] - A[1];
    const len = Math.hypot(dx, dy) || 1;
    // (-dy, dx) es perpendicular; luego normalizamos
    return [-dy / len, dx / len];
  }

  /** Desplaza el punto P en dirección N (normal unitario) por 'offset' */
  private offsetPoint(P: Point, N: Point, offset: number): Point {
    return [P[0] + N[0] * offset, P[1] + N[1] * offset];
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
