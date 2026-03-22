import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
} from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { IPipeline, IPipelineJob } from '../../../common/pipeline/interfaces';
import { PipelineService } from '../../../common/pipeline/services/pipeline.backend.service';

@Component({
  selector: 'app-pipeline-jobs-modal',
  standalone: true,
  imports: [CommonModule, DatePipe],
  templateUrl: './pipeline-jobs-modal.component.html',
  styleUrl: './pipeline-jobs-modal.component.scss',
})
export class PipelineJobsModalComponent implements OnChanges {
  @Input({ required: true }) pipeline!: IPipeline;
  @Output() close = new EventEmitter<void>();

  jobs: IPipelineJob[] = [];
  loading = false;
  errorMessage = '';

  constructor(private pipelineService: PipelineService) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['pipeline'] && this.pipeline) {
      this.fetchJobs();
    }
  }

  onClose(): void {
    this.close.emit();
  }

  refreshJobs(): void {
    this.fetchJobs();
  }

  formatPayload(payload: string | null): string {
    if (!payload) {
      return '{}';
    }
    try {
      const parsed = JSON.parse(payload);
      return JSON.stringify(parsed, null, 2);
    } catch {
      return payload;
    }
  }

  private fetchJobs(): void {
    this.loading = true;
    this.errorMessage = '';
    this.pipelineService.getPipelineJobs(this.pipeline.id).subscribe({
      next: (jobs) => {
        this.jobs = jobs;
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = err.error?.error || 'Failed to load jobs.';
      },
    });
  }
}
