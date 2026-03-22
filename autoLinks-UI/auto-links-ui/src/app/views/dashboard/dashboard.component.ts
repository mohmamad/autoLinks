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
    const term = this.searchTerm().trim().toLowerCase();
    const all = this.pipelines();
    if (!term) return all;
    return all.filter((p) => {
      const name = p.name?.toLowerCase() ?? '';
      const description = p.description?.toLowerCase() ?? '';
      return name.includes(term) || description.includes(term);
    });
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

  private loadPipelines(): void {
    this.loading = true;
    this.pipelineService.getUserPipelines().subscribe({
      next: (data) => {
        this.pipelines.set(data);
        this.loading = false;
      },
      error: () => this.loading = false,
    });
  }
}
