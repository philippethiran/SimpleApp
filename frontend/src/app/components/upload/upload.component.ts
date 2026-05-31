import { Component, EventEmitter, Output } from '@angular/core';

import { GraphApiService } from '../../services/graph-api.service';
import { GraphData } from '../../models/graph.models';

@Component({
  selector: 'app-upload',
  standalone: true,
  template: `
    <section class="panel">
      <h2>Upload graph</h2>
      <p class="hint">JSON file with nodes, edges, and optional directed flag.</p>
      <input type="file" accept=".json,application/json" (change)="onFileSelected($event)" />
      @if (loading) {
        <p class="status">Uploading…</p>
      }
      @if (errorMessage) {
        <p class="error">{{ errorMessage }}</p>
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
      .hint {
        margin: 0 0 0.75rem;
        color: #57606a;
        font-size: 0.9rem;
      }
      .status {
        color: #0969da;
      }
      .error {
        color: #cf222e;
      }
    `,
  ],
})
export class UploadComponent {
  @Output() graphLoaded = new EventEmitter<GraphData>();

  loading = false;
  errorMessage = '';

  constructor(private readonly api: GraphApiService) {}

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) {
      return;
    }
    this.loading = true;
    this.errorMessage = '';
    this.api.uploadGraph(file).subscribe({
      next: (graph) => {
        this.loading = false;
        this.graphLoaded.emit(graph);
        input.value = '';
      },
      error: (err: Error) => {
        this.loading = false;
        this.errorMessage = err.message;
        input.value = '';
      },
    });
  }
}
