import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';
import { EntityModel } from '../enums/entity-model.enum';

@Injectable()
export class ParseEntityModelPipe
  implements PipeTransform<string, EntityModel>
{
  transform(value: string): EntityModel {
    const lowerCaseValue = value.toLowerCase();

    // Make it singular if it's plural
    const singularValue = lowerCaseValue.endsWith('s')
      ? lowerCaseValue.slice(0, -1)
      : lowerCaseValue;

    switch (singularValue) {
      case 'product':
        return EntityModel.PRODUCT;
      case 'user':
        return EntityModel.USER;
      default:
        throw new BadRequestException(
          `'${value}' is not a valid entity model.`,
        );
    }
  }
}
