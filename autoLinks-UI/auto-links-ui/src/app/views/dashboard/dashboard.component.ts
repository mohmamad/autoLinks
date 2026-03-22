import { Component, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { PipelineService } from '../../common/pipeline/services/pipeline.backend.service';
import { IPipeline } from '../../common/pipeline/interfaces';

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent implements OnInit {
  searchTerm = signal('');
  pipelines = signal<IPipeline[]>([]);
  loading = false;

  filteredPipelines = computed(() => {
    const term = this.searchTerm().toLowerCase();
    const all = this.pipelines();
    if (!term) return all;
    return all.filter(
      (p) =>
        p.name.toLowerCase().includes(term) ||
        p.description.toLowerCase().includes(term),
    );
  });

  constructor(private pipelineService: PipelineService) {}

  ngOnInit(): void {
    this.loadPipelines();
  }

  onSearch(value: string): void {
    this.searchTerm.set(value);
  }

  refresh(): void {
    this.searchTerm.set('');
    this.loadPipelines();
  }

  /**
   * Returns the CSS class for the status badge based on the status.
   * @param status - The status of the pipeline.
   * @returns - The CSS class for the status badge.
   */
  statusBadgeClass(status: string): string {
    switch (status) {
      case 'active':
        return 'bg-success';
      case 'inactive':
        return 'bg-secondary';
      case 'error':
        return 'bg-danger';
      default:
        return 'bg-info';
    }
  }

  private loadPipelines(): void {
    this.loading = true;
    this.pipelineService.getAllPipelines().subscribe({
      next: (data) => {
        this.pipelines.set(data);
        this.loading = false;
      },
      error: () => this.loading = false,
    });
  }
}
