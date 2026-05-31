import { Component, EventEmitter, Input, OnChanges, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { GraphApiService } from '../../services/graph-api.service';
import { GraphData, NodeId, ShortestPathResult } from '../../models/graph.models';

@Component({
  selector: 'app-path-finder',
  standalone: true,
  imports: [FormsModule],
  template: `
    <section class="panel">
      <h2>Smart Flight Finder</h2>
      <p class="hint">Cheapest route between two nodes (Dijkstra).</p>
      @if (!graph) {
        <p class="muted">Upload a graph first.</p>
      } @else {
        <label>
          Source
          <select [(ngModel)]="source" [disabled]="loading">
            @for (node of graph.nodes; track node) {
              <option [ngValue]="node">{{ node }}</option>
            }
          </select>
        </label>
        <label>
          Target
          <select [(ngModel)]="target" [disabled]="loading">
            @for (node of graph.nodes; track node) {
              <option [ngValue]="node">{{ node }}</option>
            }
          </select>
        </label>
        <button type="button" (click)="run()" [disabled]="loading">
          Find shortest path
        </button>
        @if (result) {
          <p class="result">
            Cost: <strong>{{ result.total_cost }}</strong> — Path:
            {{ result.path.join(' → ') }}
          </p>
        }
        @if (errorMessage) {
          <p class="error">{{ errorMessage }}</p>
        }
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
      }
      h2 {
        margin: 0 0 0.5rem;
        font-size: 1.1rem;
      }
      .hint,
      .muted {
        color: #57606a;
        font-size: 0.9rem;
      }
      label {
        display: block;
        margin-bottom: 0.5rem;
      }
      select {
        display: block;
        width: 100%;
        margin-top: 0.25rem;
      }
      button {
        margin-top: 0.5rem;
      }
      .result {
        margin-top: 0.75rem;
      }
      .error {
        color: #cf222e;
      }
    `,
  ],
})
export class PathFinderComponent implements OnChanges {
  @Input() graph: GraphData | null = null;
  @Output() pathFound = new EventEmitter<ShortestPathResult>();

  source: NodeId | null = null;
  target: NodeId | null = null;
  loading = false;
  errorMessage = '';
  result: ShortestPathResult | null = null;

  constructor(private readonly api: GraphApiService) {}

  ngOnChanges(): void {
    if (this.graph?.nodes.length) {
      this.source = this.graph.nodes[0];
      this.target = this.graph.nodes[Math.min(1, this.graph.nodes.length - 1)];
      this.result = null;
      this.errorMessage = '';
    }
  }

  run(): void {
    if (this.source == null || this.target == null) {
      return;
    }
    this.loading = true;
    this.errorMessage = '';
    this.api.findShortestPath(this.source, this.target).subscribe({
      next: (result) => {
        this.loading = false;
        this.result = result;
        this.pathFound.emit(result);
      },
      error: (err: Error) => {
        this.loading = false;
        this.errorMessage = err.message;
      },
    });
  }
}
