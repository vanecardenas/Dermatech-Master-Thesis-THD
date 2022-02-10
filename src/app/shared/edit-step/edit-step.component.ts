import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'app-edit-step',
  templateUrl: './edit-step.component.html',
  styleUrls: ['./edit-step.component.scss'],
})
export class EditStepComponent {
  editedStep: DatabaseTechniqueStep;

  constructor(
    public dialogRef: MatDialogRef<EditStepComponent>,
    @Inject(MAT_DIALOG_DATA)
    public data: {
      step: DatabaseTechniqueStep;
    }
  ) {
    this.editedStep = { ...this.data.step };
  }

  saveStep() {
    this.dialogRef.close(this.editedStep);
  }

  cancel() {
    this.dialogRef.close(null);
  }
}
