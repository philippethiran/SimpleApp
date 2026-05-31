import { Component, EventEmitter, Input, OnChanges, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { GraphApiService } from '../../services/graph-api.service';
import {
  GraphData,
  NodeId,
  ShortestTourResult,
} from '../../models/graph.models';

@Component({
  selector: 'app-tour-optimizer',
  standalone: true,
  imports: [FormsModule],
  template: `
    <section class="panel">
      <h2>Tour Optimizer</h2>
      <p class="hint">Shortest tour visiting selected destinations (TSP).</p>
      @if (!graph) {
        <p class="muted">Upload a graph first.</p>
      } @else {
        <div class="destinations">
          @for (node of graph.nodes; track node) {
            <label class="chip">
              <input
                type="checkbox"
                [checked]="isSelected(node)"
                (change)="toggle(node, $event)"
                [disabled]="loading"
              />
              {{ node }}
            </label>
          }
        </div>
        <button type="button" (click)="run()" [disabled]="loading || selected.length < 2">
          Find shortest tour
        </button>
        @if (result) {
          <p class="result">
            Cost: <strong>{{ result.total_cost }}</strong> — Tour:
            {{ result.tour.join(' → ') }}
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
      .destinations {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
        margin-bottom: 0.75rem;
      }
      .chip {
        display: inline-flex;
        align-items: center;
        gap: 0.25rem;
        padding: 0.25rem 0.5rem;
        border: 1px solid #d0d7de;
        border-radius: 999px;
        font-size: 0.9rem;
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
export class TourOptimizerComponent implements OnChanges {
  @Input() graph: GraphData | null = null;
  @Output() tourFound = new EventEmitter<ShortestTourResult>();

  selected: NodeId[] = [];
  loading = false;
  errorMessage = '';
  result: ShortestTourResult | null = null;

  constructor(private readonly api: GraphApiService) {}

  ngOnChanges(): void {
    this.selected = [];
    this.result = null;
    this.errorMessage = '';
  }

  isSelected(node: NodeId): boolean {
    return this.selected.some((item) => String(item) === String(node));
  }

  toggle(node: NodeId, event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    if (checked) {
      this.selected = [...this.selected, node];
    } else {
      this.selected = this.selected.filter(
        (item) => String(item) !== String(node)
      );
    }
  }

  run(): void {
    this.loading = true;
    this.errorMessage = '';
    this.api.findShortestTour(this.selected).subscribe({
      next: (result) => {
        this.loading = false;
        this.result = result;
        this.tourFound.emit(result);
      },
      error: (err: Error) => {
        this.loading = false;
        this.errorMessage = err.message;
      },
    });
  }
}
