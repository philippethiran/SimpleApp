import {
  Component,
  ElementRef,
  HostListener,
  Input,
  OnChanges,
  ViewChild,
} from '@angular/core';

import { GraphData, NodeId } from '../../models/graph.models';

interface NodePosition {
  node: NodeId;
  x: number;
  y: number;
}

interface EdgeSegment {
  from: NodeId;
  to: NodeId;
  weight: number;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

@Component({
  selector: 'app-graph-view',
  standalone: true,
  template: `
    <section class="panel">
      <div class="toolbar">
        <h2>Graph visualization</h2>
        <div class="controls">
          <button type="button" (click)="zoomIn()">Zoom in</button>
          <button type="button" (click)="zoomOut()">Zoom out</button>
          <button type="button" (click)="resetView()">Reset</button>
        </div>
      </div>
      @if (!graph) {
        <p class="muted">Upload a graph to visualize it. Drag to pan, scroll to zoom.</p>
      } @else {
        <div class="canvas-wrap" #canvasWrap>
          <svg
            #svgRoot
            [attr.width]="width"
            [attr.height]="height"
            (mousedown)="onPanStart($event)"
            (wheel)="onWheel($event)"
          >
            <g [attr.transform]="transform">
              @for (edge of edgeSegments; track edgeKey(edge)) {
                <line
                  [attr.x1]="edge.x1"
                  [attr.y1]="edge.y1"
                  [attr.x2]="edge.x2"
                  [attr.y2]="edge.y2"
                  [class.highlight]="isEdgeHighlighted(edge)"
                />
                <text
                  [attr.x]="(edge.x1 + edge.x2) / 2"
                  [attr.y]="(edge.y1 + edge.y2) / 2 - 4"
                  class="weight"
                >
                  {{ edge.weight }}
                </text>
              }
              @for (pos of nodePositions; track pos.node) {
                <g>
                  <circle
                    [attr.cx]="pos.x"
                    [attr.cy]="pos.y"
                    r="18"
                    [class.highlight-node]="isNodeHighlighted(pos.node)"
                  />
                  <text [attr.x]="pos.x" [attr.y]="pos.y + 5" class="label">
                    {{ pos.node }}
                  </text>
                </g>
              }
            </g>
          </svg>
        </div>
      }
    </section>
  `,
  styles: [
    `
      .panel {
        padding: 1rem;
        border: 1px solid #d0d7de;
        border-radius: 8px;
        background: #fff;
        min-height: 420px;
      }
      .toolbar {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 1rem;
        margin-bottom: 0.75rem;
      }
      h2 {
        margin: 0;
        font-size: 1.1rem;
      }
      .controls {
        display: flex;
        gap: 0.5rem;
      }
      .muted {
        color: #57606a;
      }
      .canvas-wrap {
        overflow: hidden;
        border: 1px solid #eaeef2;
        border-radius: 8px;
        background: #f6f8fa;
        cursor: grab;
      }
      .canvas-wrap:active {
        cursor: grabbing;
      }
      line {
        stroke: #8c959f;
        stroke-width: 2;
      }
      line.highlight {
        stroke: #0969da;
        stroke-width: 4;
      }
      circle {
        fill: #fff;
        stroke: #24292f;
        stroke-width: 2;
      }
      circle.highlight-node {
        fill: #ddf4ff;
        stroke: #0969da;
        stroke-width: 3;
      }
      .label,
      .weight {
        text-anchor: middle;
        font-size: 12px;
        fill: #24292f;
        pointer-events: none;
      }
      .weight {
        font-size: 10px;
        fill: #57606a;
      }
    `,
  ],
})
export class GraphViewComponent implements OnChanges {
  @Input() graph: GraphData | null = null;
  @Input() highlightedPaths: NodeId[][] = [];
  @Input() highlightedNodes: NodeId[] = [];

  @ViewChild('svgRoot') svgRoot?: ElementRef<SVGSVGElement>;

  width = 720;
  height = 480;
  scale = 1;
  translateX = 0;
  translateY = 0;
  nodePositions: NodePosition[] = [];
  edgeSegments: EdgeSegment[] = [];
  private panning = false;
  private panStartX = 0;
  private panStartY = 0;

  get transform(): string {
    return `translate(${this.translateX}, ${this.translateY}) scale(${this.scale})`;
  }

  ngOnChanges(): void {
    this.buildLayout();
    this.resetView();
  }

  edgeKey(edge: EdgeSegment): string {
    return `${edge.from}-${edge.to}-${edge.weight}`;
  }

  isNodeHighlighted(node: NodeId): boolean {
    return this.highlightedNodes.some((item) => String(item) === String(node));
  }

  isEdgeHighlighted(edge: EdgeSegment): boolean {
    for (const path of this.highlightedPaths) {
      for (let i = 0; i < path.length - 1; i += 1) {
        const from = path[i];
        const to = path[i + 1];
        const forward =
          String(from) === String(edge.from) && String(to) === String(edge.to);
        const reverse =
          String(from) === String(edge.to) && String(to) === String(edge.from);
        if (forward || reverse) {
          return true;
        }
      }
    }
    return false;
  }

  zoomIn(): void {
    this.scale = Math.min(this.scale * 1.2, 4);
  }

  zoomOut(): void {
    this.scale = Math.max(this.scale / 1.2, 0.3);
  }

  resetView(): void {
    this.scale = 1;
    this.translateX = 0;
    this.translateY = 0;
  }

  onWheel(event: WheelEvent): void {
    event.preventDefault();
    const delta = event.deltaY < 0 ? 1.1 : 0.9;
    this.scale = Math.min(Math.max(this.scale * delta, 0.3), 4);
  }

  onPanStart(event: MouseEvent): void {
    this.panning = true;
    this.panStartX = event.clientX - this.translateX;
    this.panStartY = event.clientY - this.translateY;
  }

  @HostListener('window:mouseup')
  onPanEnd(): void {
    this.panning = false;
  }

  @HostListener('window:mousemove', ['$event'])
  onPanMove(event: MouseEvent): void {
    if (!this.panning) {
      return;
    }
    this.translateX = event.clientX - this.panStartX;
    this.translateY = event.clientY - this.panStartY;
  }

  private buildLayout(): void {
    if (!this.graph) {
      this.nodePositions = [];
      this.edgeSegments = [];
      return;
    }

    const radius = Math.min(this.width, this.height) * 0.32;
    const centerX = this.width / 2;
    const centerY = this.height / 2;
    const count = this.graph.nodes.length;

    this.nodePositions = this.graph.nodes.map((node, index) => {
      const angle = (2 * Math.PI * index) / count - Math.PI / 2;
      return {
        node,
        x: centerX + radius * Math.cos(angle),
        y: centerY + radius * Math.sin(angle),
      };
    });

    const positionMap = new Map<string, NodePosition>();
    for (const pos of this.nodePositions) {
      positionMap.set(String(pos.node), pos);
    }

    this.edgeSegments = this.graph.edges
      .map((edge) => {
        const fromPos = positionMap.get(String(edge.from));
        const toPos = positionMap.get(String(edge.to));
        if (!fromPos || !toPos) {
          return null;
        }
        return {
          from: edge.from,
          to: edge.to,
          weight: edge.weight,
          x1: fromPos.x,
          y1: fromPos.y,
          x2: toPos.x,
          y2: toPos.y,
        };
      })
      .filter((edge): edge is EdgeSegment => edge !== null);
  }
}
