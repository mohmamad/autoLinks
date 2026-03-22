import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-success-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './success-modal.component.html',
  styleUrl: './success-modal.component.scss',
})
export class SuccessModalComponent {
  @Input({ required: true }) webhookUrl!: string;
  @Output() goToDashboard = new EventEmitter<void>();

  copyUrl(): void {
    navigator.clipboard.writeText(this.webhookUrl);
  }

  onGoToDashboard(): void {
    this.goToDashboard.emit();
  }
}
