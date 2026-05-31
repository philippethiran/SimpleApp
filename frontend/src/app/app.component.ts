import { Component } from '@angular/core';

import { GraphData, NodeId, ShortestPathResult, ShortestTourResult } from './models/graph.models';
import { GraphViewComponent } from './components/graph-view/graph-view.component';
import { PathFinderComponent } from './components/path-finder/path-finder.component';
import { TourOptimizerComponent } from './components/tour-optimizer/tour-optimizer.component';
import { UploadComponent } from './components/upload/upload.component';

@Component({
  selector: 'app-root',
  imports: [
    UploadComponent,
    GraphViewComponent,
    PathFinderComponent,
    TourOptimizerComponent,
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent {
  graph: GraphData | null = null;
  highlightedPaths: NodeId[][] = [];
  highlightedNodes: NodeId[] = [];

  onGraphLoaded(graph: GraphData): void {
    this.graph = graph;
    this.clearHighlights();
  }

  onPathFound(result: ShortestPathResult): void {
    this.highlightedPaths = [result.path];
    this.highlightedNodes = result.path;
  }

  onTourFound(result: ShortestTourResult): void {
    this.highlightedPaths = result.segments;
    this.highlightedNodes = result.tour;
  }

  private clearHighlights(): void {
    this.highlightedPaths = [];
    this.highlightedNodes = [];
  }
}
