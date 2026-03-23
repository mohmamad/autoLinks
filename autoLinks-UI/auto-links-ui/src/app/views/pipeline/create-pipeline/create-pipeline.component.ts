import { Component, OnInit, DestroyRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DiagramPreviewModalComponent } from '../diagram-preview-modal/diagram-preview-modal.component';
import { SuccessModalComponent } from '../success-modal/success-modal.component';
import { PipelineService } from '../../../common/pipeline/services/pipeline.backend.service';
import { SubscriberType } from '../../../common/pipeline/enums';
import { ICreatePipelineRequest } from '../../../common/pipeline/interfaces';

@Component({
  selector: 'app-create-pipeline',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    DiagramPreviewModalComponent,
    SuccessModalComponent,
  ],
  templateUrl: './create-pipeline.component.html',
  styleUrl: './create-pipeline.component.scss',
})
export class CreatePipelineComponent implements OnInit {
  pipelineForm!: FormGroup;
  loading = false;
  errorMessage = '';

  showPreviewModal = false;
  showSuccessModal = false;
  webhookUrl = '';
  pipelineData!: ICreatePipelineRequest;

  readonly SubscriberType = SubscriberType;

  private destroyRef = inject(DestroyRef);

  constructor(
    private fb: FormBuilder,
    private pipelineService: PipelineService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.pipelineForm = this.fb.group({
      name: ['', [Validators.required]],
      description: ['', [Validators.required]],
      subscribers: this.fb.array([]),
    });

    this.addSubscriber();
  }

  get subscribers(): FormArray {
    return this.pipelineForm.get('subscribers') as FormArray;
  }

  addSubscriber(): void {
    const sub = this.fb.group({
      type: [SubscriberType.HttpRequest, [Validators.required]],
      config: this.buildConfigGroup(SubscriberType.HttpRequest),
    });

    sub
      .get('type')
      ?.valueChanges.pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((type) => {
        if (type) {
          sub.setControl('config', this.buildConfigGroup(type as SubscriberType));
        }
      });

    this.subscribers.push(sub);
  }

  removeSubscriber(index: number): void {
    this.subscribers.removeAt(index);
  }

  getSubscriberType(index: number): SubscriberType {
    return this.subscribers.at(index).get('type')?.value;
  }

  getConfigGroup(index: number): FormGroup {
    return this.subscribers.at(index).get('config') as FormGroup;
  }

  generatePreview(): void {
    if (this.pipelineForm.invalid) {
      this.pipelineForm.markAllAsTouched();
      return;
    }

    this.pipelineData = this.getCleanFormValue();
    this.showPreviewModal = true;
  }

  closePreview(): void {
    this.showPreviewModal = false;
  }

  confirmFromPreview(): void {
    this.showPreviewModal = false;
    this.confirmAndCreate();
  }

  /**
   * Confirms and creates the pipeline.
   */
  confirmAndCreate(): void {
    if (this.pipelineForm.invalid) {
      this.pipelineForm.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    const payload = this.getCleanFormValue();
    this.pipelineService.createPipeline(payload).subscribe({
      next: (webhookUrl) => {
        this.loading = false;
        this.webhookUrl = webhookUrl;
        this.showSuccessModal = true;
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = err.error?.error || 'Failed to create pipeline.';
      },
    });
  }

  goToDashboard(): void {
    this.router.navigate(['/dashboard']);
  }

  /**
   * Builds a config group for a subscriber.
   * @param type - The type of subscriber.
   * @returns - The config group for the subscriber.
   */
  private getCleanFormValue(): ICreatePipelineRequest {
    const { name, description, subscribers } = this.pipelineForm.value;
    const cleanSubscribers = subscribers.map(
      (sub: { type: SubscriberType; config: Record<string, string> }) => ({
        type: sub.type,
        config: Object.fromEntries(
          Object.entries(sub.config).filter(([, v]) => v !== '' && v !== null && v !== undefined),
        ),
      }),
    );
    return { name, description, subscribers: cleanSubscribers };
  }

  private buildConfigGroup(type: SubscriberType): FormGroup {
    switch (type) {
      case SubscriberType.HttpRequest:
        return this.fb.group({
          url: ['', [Validators.required]],
          method: ['POST', [Validators.required]],
          headers: [''],
        });
      case SubscriberType.Email:
        return this.fb.group({
          to: ['', [Validators.required, Validators.email]],
          subject: [''],
          cc: [''],
          bcc: [''],
        });
      case SubscriberType.Slack:
        return this.fb.group({
          webhookUrl: ['', [Validators.required]],
        });
    }
  }
}
