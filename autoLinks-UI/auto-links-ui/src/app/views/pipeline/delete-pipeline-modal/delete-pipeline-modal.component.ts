import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IPipeline } from '../../../common/pipeline/interfaces';
import { PipelineService } from '../../../common/pipeline/services/pipeline.backend.service';

@Component({
  selector: 'app-delete-pipeline-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './delete-pipeline-modal.component.html',
  styleUrl: './delete-pipeline-modal.component.scss',
})
export class DeletePipelineModalComponent {
  @Input({ required: true }) pipeline!: IPipeline;
  @Output() close = new EventEmitter<void>();
  @Output() deleted = new EventEmitter<void>();

  loading = false;
  errorMessage = '';

  constructor(private pipelineService: PipelineService) {}

  onCancel(): void {
    this.close.emit();
  }

  onConfirmDelete(): void {
    if (!this.pipeline) {
      return;
    }
    this.loading = true;
    this.errorMessage = '';
    this.pipelineService.deletePipeline(this.pipeline.id).subscribe({
      next: () => {
        this.loading = false;
        this.deleted.emit();
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = err.error?.error || 'Failed to delete pipeline.';
      },
    });
  }
}
