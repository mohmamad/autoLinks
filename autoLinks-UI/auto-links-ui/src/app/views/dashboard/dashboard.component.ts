import { Component, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { PipelineService } from '../../common/pipeline/services/pipeline.backend.service';
import { IPipeline } from '../../common/pipeline/interfaces';
import { EditPipelineModalComponent } from '../pipeline/edit-pipeline-modal/edit-pipeline-modal.component';
import { DeletePipelineModalComponent } from '../pipeline/delete-pipeline-modal/delete-pipeline-modal.component';
import { PipelineJobsModalComponent } from '../pipeline/pipeline-jobs-modal/pipeline-jobs-modal.component';

@Component({
  selector: 'app-dashboard',
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    EditPipelineModalComponent,
    DeletePipelineModalComponent,
    PipelineJobsModalComponent,
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent implements OnInit {
  searchTerm = signal('');
  pipelines = signal<IPipeline[]>([]);
  loading = false;
  editingPipeline = signal<IPipeline | null>(null);
  deletingPipeline = signal<IPipeline | null>(null);
  jobsPipeline = signal<IPipeline | null>(null);

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

  openEditModal(pipeline: IPipeline): void {
    this.editingPipeline.set(pipeline);
  }

  closeEditModal(): void {
    this.editingPipeline.set(null);
  }

  openDeleteModal(pipeline: IPipeline): void {
    this.deletingPipeline.set(pipeline);
  }

  closeDeleteModal(): void {
    this.deletingPipeline.set(null);
  }

  openJobsModal(pipeline: IPipeline): void {
    this.jobsPipeline.set(pipeline);
  }

  closeJobsModal(): void {
    this.jobsPipeline.set(null);
  }

  handlePipelineUpdated(): void {
    this.closeEditModal();
    this.loadPipelines();
  }

  handlePipelineDeleted(): void {
    this.closeDeleteModal();
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
