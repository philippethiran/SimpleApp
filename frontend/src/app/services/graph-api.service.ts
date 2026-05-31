import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

import {
  GraphData,
  NodeId,
  ShortestPathResult,
  ShortestTourResult,
} from '../models/graph.models';

@Injectable({ providedIn: 'root' })
export class GraphApiService {
  private readonly baseUrl = 'http://localhost:8000/api';

  constructor(private readonly http: HttpClient) {}

  uploadGraph(file: File): Observable<GraphData> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http
      .post<GraphData>(`${this.baseUrl}/graph/upload`, formData)
      .pipe(catchError(this.handleError));
  }

  getGraph(): Observable<GraphData> {
    return this.http
      .get<GraphData>(`${this.baseUrl}/graph`)
      .pipe(catchError(this.handleError));
  }

  findShortestPath(
    source: NodeId,
    target: NodeId
  ): Observable<ShortestPathResult> {
    return this.http
      .post<ShortestPathResult>(`${this.baseUrl}/path/shortest`, {
        source,
        target,
      })
      .pipe(catchError(this.handleError));
  }

  findShortestTour(
    destinations: NodeId[]
  ): Observable<ShortestTourResult> {
    return this.http
      .post<ShortestTourResult>(`${this.baseUrl}/tour/shortest`, {
        destinations,
      })
      .pipe(catchError(this.handleError));
  }

  private handleError(error: HttpErrorResponse) {
    const detail =
      typeof error.error?.detail === 'string'
        ? error.error.detail
        : error.message;
    return throwError(() => new Error(detail));
  }
}
