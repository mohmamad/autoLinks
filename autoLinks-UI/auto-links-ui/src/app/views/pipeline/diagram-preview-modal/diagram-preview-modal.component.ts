import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import mermaid from 'mermaid';
import { PipelineService } from '../../../common/pipeline/services/pipeline.backend.service';
import { ICreatePipelineRequest } from '../../../common/pipeline/interfaces';

@Component({
  selector: 'app-diagram-preview-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './diagram-preview-modal.component.html',
  styleUrl: './diagram-preview-modal.component.scss',
})
export class DiagramPreviewModalComponent implements OnInit {
  @Input({ required: true }) pipelineData!: ICreatePipelineRequest;
  @Output() close = new EventEmitter<void>();
  @Output() confirm = new EventEmitter<void>();

  loading = true;
  diagramSvg: SafeHtml = '';
  errorMessage = '';

  constructor(
    private sanitizer: DomSanitizer,
    private pipelineService: PipelineService,
  ) {
    mermaid.initialize({ startOnLoad: false, theme: 'default' });
  }

  ngOnInit(): void {
    const description = `${this.pipelineData.name}: ${this.pipelineData.description}`;
    this.pipelineService.createDiagram(description).subscribe({
      next: (diagram) => {
        const cleaned = diagram?.replace(/^"|"$/g, '')
          ?.replace(/\\n/g, '\n');
        this.renderDiagram(cleaned);
      },
      error: () => {
        this.loading = false;
        this.errorMessage = 'Failed to generate diagram preview.';
      },
    });
  }

  onClose(): void {
    this.close.emit();
  }

  onConfirm(): void {
    this.confirm.emit();
  }

  private async renderDiagram(code: string): Promise<void> {
    try {
      const { svg } = await mermaid.render('diagram-svg', code);
      this.diagramSvg = this.sanitizer.bypassSecurityTrustHtml(svg);
    } catch {
      this.errorMessage = 'Failed to render the diagram.';
    } finally {
      this.loading = false;
    }
  }
}
