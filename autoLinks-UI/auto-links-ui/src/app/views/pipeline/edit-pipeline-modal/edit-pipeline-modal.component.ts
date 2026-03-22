import {
  Component,
  DestroyRef,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormArray,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { SubscriberType } from '../../../common/pipeline/enums';
import {
  ICreatePipelineRequest,
  IPipeline,
  ISubscriber,
} from '../../../common/pipeline/interfaces';
import { PipelineService } from '../../../common/pipeline/services/pipeline.backend.service';

type EditableSubscriber = {
  type: SubscriberType;
  config: Record<string, any>;
};

@Component({
  selector: 'app-edit-pipeline-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './edit-pipeline-modal.component.html',
  styleUrl: './edit-pipeline-modal.component.scss',
})

export class EditPipelineModalComponent implements OnChanges {
  @Input({ required: true }) pipeline!: IPipeline;
  @Output() close = new EventEmitter<void>();
  @Output() saved = new EventEmitter<void>();

  readonly SubscriberType = SubscriberType;

  form: FormGroup;
  loading = false;
  errorMessage = '';

  private destroyRef = inject(DestroyRef);

  constructor(
    private fb: FormBuilder,
    private pipelineService: PipelineService,
  ) {
    this.form = this.buildForm();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['pipeline'] && this.pipeline) {
      this.resetFormWithPipeline();
    }
  }

  get subscribers(): FormArray {
    return this.form.get('subscribers') as FormArray;
  }

  addSubscriber(): void {
    const group = this.buildSubscriberGroup({
      type: SubscriberType.HttpRequest,
      config: {},
    });
    this.subscribers.push(group);
  }

  removeSubscriber(index: number): void {
    this.subscribers.removeAt(index);
  }

  getConfigGroup(index: number): FormGroup {
    return this.subscribers.at(index).get('config') as FormGroup;
  }

  getSubscriberType(index: number): SubscriberType {
    return this.subscribers.at(index).get('type')?.value;
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    const payload = this.buildRequestPayload();

    this.pipelineService
      .updatePipeline(this.pipeline.id, payload)
      .subscribe({
        next: () => {
          this.loading = false;
          this.saved.emit();
        },
        error: (err) => {
          this.loading = false;
          this.errorMessage = err.error?.error || 'Failed to update pipeline.';
        },
      });
  }

  onClose(): void {
    this.close.emit();
  }

  private buildForm(): FormGroup {
    return this.fb.group({
      name: ['', [Validators.required]],
      description: ['', [Validators.required]],
      subscribers: this.fb.array([]),
    });
  }

  private resetFormWithPipeline(): void {
    this.form.reset({
      name: this.pipeline.name,
      description: this.pipeline.description,
    });

    const subsArray = this.form.get('subscribers') as FormArray;
    subsArray.clear();

    const subscribers = this.pipeline.subscribers?.length
      ? this.pipeline.subscribers
      : [
          {
            type: SubscriberType.HttpRequest,
            config: { url: '', method: 'POST' },
          } as ISubscriber,
        ];

    for (const subscriber of subscribers) {
      subsArray.push(
        this.buildSubscriberGroup({
          type: subscriber.type,
          config: subscriber.config as Record<string, any>,
        }),
      );
    }
  }

  private buildSubscriberGroup(subscriber: EditableSubscriber): FormGroup {
    const group = this.fb.group({
      type: [subscriber.type, [Validators.required]],
      config: this.buildConfigGroup(subscriber.type, subscriber.config),
    });

    group
      .get('type')
      ?.valueChanges.pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((type: SubscriberType | null) => {
        if (!type) return;
        group.setControl('config', this.buildConfigGroup(type, {}));
      });

    return group;
  }

  private buildConfigGroup(
    type: SubscriberType,
    config: Record<string, unknown>,
  ): FormGroup {
    switch (type) {
      case SubscriberType.HttpRequest:
        return this.fb.group({
          url: [config['url'] ?? '', [Validators.required]],
          method: [config['method'] ?? 'POST', [Validators.required]],
        });
      case SubscriberType.Email:
        return this.fb.group({
          to: [config['to'] ?? '', [Validators.required, Validators.email]],
          subject: [config['subject'] ?? ''],
          cc: [this.normalizeEmailField(config['cc'])],
          bcc: [this.normalizeEmailField(config['bcc'])],
        });
      case SubscriberType.Slack:
        return this.fb.group({
          webhookUrl: [config['webhookUrl'] ?? '', [Validators.required]],
        });
    }
  }

  private normalizeEmailField(value: unknown): string {
    if (Array.isArray(value)) {
      return value.join(', ');
    }
    return typeof value === 'string' ? value : '';
  }

  private buildRequestPayload(): ICreatePipelineRequest {
    const name = this.form.get('name')?.value;
    const description = this.form.get('description')?.value;
    const cleanSubscribers: ISubscriber[] = this.subscribers.controls.map(
      (control) => {
        const type = control.get('type')?.value as SubscriberType;
        const cfg = control.get('config')?.value ?? {};
        return {
          type,
          config: this.prepareConfig(type, cfg),
        } as ISubscriber;
      },
    );

    return {
      name,
      description,
      subscribers: cleanSubscribers,
    };
  }

  private prepareConfig(type: SubscriberType, config: Record<string, any>) {
    const cleaned = Object.fromEntries(
      Object.entries(config).filter(
        ([, value]) => value !== '' && value !== null && value !== undefined,
      ),
    );

    switch (type) {
      case SubscriberType.HttpRequest:
        return {
          url: cleaned['url'],
          method: cleaned['method'],
        };
      case SubscriberType.Email:
        return {
          to: cleaned['to'],
          subject: cleaned['subject'],
          cc: cleaned['cc'],
          bcc: cleaned['bcc'],
        };
      case SubscriberType.Slack:
        return {
          webhookUrl: cleaned['webhookUrl'],
        };
    }
  }
}
