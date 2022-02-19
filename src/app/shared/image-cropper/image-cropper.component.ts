import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import {
  base64ToFile,
  ImageCroppedEvent,
  ImageTransform,
} from 'ngx-image-cropper';
import { ConfirmationDialogComponent } from '../confirmation-dialog/confirmation-dialog.component';

@Component({
  selector: 'app-image-cropper',
  templateUrl: './image-cropper.component.html',
  styleUrls: ['./image-cropper.component.scss'],
})
export class ImageCropperComponent {
  croppedImage: any = '';
  canvasRotation = 0;
  rotation = 0;
  scale = 1;
  transform: ImageTransform = {};
  imageLoaded = false;

  constructor(
    public dialogRef: MatDialogRef<ConfirmationDialogComponent>,
    @Inject(MAT_DIALOG_DATA)
    public data: {
      imageData: string;
      onSave: Function;
    }
  ) {}

  setImageLoaded() {
    console.log('Image loaded');
    this.imageLoaded = true;
  }

  imageCropped(event: ImageCroppedEvent) {
    if (event.base64) {
      this.croppedImage = base64ToFile(event.base64);
    }
  }

  loadImageFailed() {
    console.log('Load failed');
  }

  rotateLeft() {
    this.canvasRotation--;
    this.flipAfterRotate();
  }

  rotateRight() {
    this.canvasRotation++;
    this.flipAfterRotate();
  }

  private flipAfterRotate() {
    const flippedH = this.transform.flipH;
    const flippedV = this.transform.flipV;
    this.transform = {
      ...this.transform,
      flipH: flippedV,
      flipV: flippedH,
    };
  }

  flipHorizontal() {
    this.transform = {
      ...this.transform,
      flipH: !this.transform.flipH,
    };
  }

  flipVertical() {
    this.transform = {
      ...this.transform,
      flipV: !this.transform.flipV,
    };
  }

  resetImage() {
    this.scale = 1;
    this.rotation = 0;
    this.canvasRotation = 0;
    this.transform = {};
  }

  zoomOut() {
    this.scale -= 0.1;
    this.transform = {
      ...this.transform,
      scale: this.scale,
    };
  }

  zoomIn() {
    this.scale += 0.1;
    this.transform = {
      ...this.transform,
      scale: this.scale,
    };
  }

  updateRotation() {
    this.transform = {
      ...this.transform,
      rotate: this.rotation,
    };
  }

  onSave() {
    this.data.onSave(this.croppedImage);
    this.dialogRef.close();
  }
}
