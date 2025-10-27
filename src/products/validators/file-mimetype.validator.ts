// src/products/validators/file-mimetype.validator.ts
import { FileValidator } from '@nestjs/common';
import { IFile } from '@nestjs/common/pipes/file/interfaces';

export class FileMimeTypeValidator extends FileValidator<{
  mimeType: string[];
}> {
  constructor(
    protected readonly validationOptions: {
      mimeType: string[];
    },
  ) {
    super(validationOptions);
  }

  public isValid(file: IFile): boolean {
    // Check if the file's mimetype is included in our allowed list
    return this.validationOptions.mimeType.includes(file.mimetype);
  }

  public buildErrorMessage(): string {
    return `Validation failed: Invalid file type. Allowed types are: ${this.validationOptions.mimeType.join(
      ', ',
    )}`;
  }
}
