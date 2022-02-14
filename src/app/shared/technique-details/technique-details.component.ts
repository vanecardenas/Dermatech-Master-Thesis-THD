import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ConfirmationDialogComponent } from '../confirmation-dialog/confirmation-dialog.component';
import { DatabaseService } from '../database.service';

@Component({
  selector: 'app-technique-details',
  templateUrl: './technique-details.component.html',
  styleUrls: ['./technique-details.component.scss'],
})
export class TechniqueDetailsComponent {
  techniqueSteps: DatabaseTechniqueStep[] = [];
  techniqueStepsFetched = false;

  constructor(
    private databaseService: DatabaseService,
    public dialogRef: MatDialogRef<ConfirmationDialogComponent>,
    @Inject(MAT_DIALOG_DATA)
    public data: {
      technique: DatabaseTechnique;
    }
  ) {
    if (this.data.technique && this.data.technique.id) {
      this.databaseService
        .getTechniqueStepsFor(this.data.technique.id)
        .subscribe((techniqueSteps) => {
          this.techniqueSteps = techniqueSteps;
          this.techniqueStepsFetched = true;
        });
    }
  }

  close() {
    this.dialogRef.close();
  }
}
