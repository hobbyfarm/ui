import { Injectable } from '@angular/core';
import { map, tap } from 'rxjs/operators';
import {
  extractResponseContent,
  GargantuaClientFactory,
} from './gargantua.service';
import { of } from 'rxjs';

export class PreparedSettings {
  name: string;
  value: any;
  scope: string;
  group: string;
  // Following is corresponding to property.Property
  dataType: 'string' | 'integer' | 'float' | 'boolean';
  valueType: 'scalar' | 'array' | 'map';
  displayName?: string;
  // Following represents SettingValidation
}

export class PreparedScope {
  name: string;
  displayName: string;
}

export enum TypedInputType {
  STRING,
  INTEGER,
  FLOAT,
  BOOLEAN,
  // COLOR or other possible custom input types
}

export enum TypedInputRepresentation {
  SCALAR,
  ARRAY,
  MAP,
}

export enum FormGroupType {
  LIST, // Display all settings in a grouped list
  TABS, // Group form inputs, display groups in horizontal tabs (default)
  TABS_VERTICAL, // Group form inputs, display groups in vertical tabs
}

export class TypedInput {
  id: string; // id as of the metadata.name
  name: string; // Display name of the input
  category: string; // Category e.g. General, Provisioning etc.
  type: TypedInputType;
  representation: TypedInputRepresentation;
  value: any;
}

@Injectable()
export class TypedSettingsService {
  constructor(private gcf: GargantuaClientFactory) {}
  private garg = this.gcf.scopedClient('/setting');
  private scopeGarg = this.gcf.scopedClient('/scope');

  private cachedTypedInputList: Map<string, Map<string, TypedInput>> =
    new Map();

  // Maps TypedInput representation to corresponding string
  private typedInputRepresentationList: TypedInputRepresentation[] = [
    TypedInputRepresentation.ARRAY,
    TypedInputRepresentation.MAP,
    TypedInputRepresentation.SCALAR,
  ];
  private typedInputRepresentationStringList: string[] = [
    'array',
    'map',
    'scalar',
  ];

  // Maps TypedInput type to corresponding string
  private typedInputDataTypeList: TypedInputType[] = [
    TypedInputType.STRING,
    TypedInputType.BOOLEAN,
    TypedInputType.FLOAT,
    TypedInputType.INTEGER,
  ];
  private typedInputDataTypeStringList: string[] = [
    'string',
    'boolean',
    'float',
    'integer',
  ];

  public get(scope: string, setting: string) {
    if (this.cachedTypedInputList && this.cachedTypedInputList.has(scope)) {
      const scopedSettings = this.cachedTypedInputList.get(scope);
      if (scopedSettings && scopedSettings.has(setting)) {
        return of(scopedSettings.get(setting) ?? ({} as TypedInput));
      } else {
        return of({} as TypedInput);
      }
    } else {
      return this.list(scope).pipe(
        tap((typedInputs: TypedInput[]) => {
          const m: Map<string, TypedInput> = new Map();
          typedInputs.forEach((typedSetting) => {
            m.set(typedSetting.id, typedSetting);
          });
          this.cachedTypedInputList.set(scope, m);
        }),
        map((typedInputs) => {
          return (
            typedInputs.find((typedInput) => {
              return typedInput.id === setting;
            }) ?? ({} as TypedInput)
          );
        }),
      );
    }
  }

  public list(scope: string) {
    return this.garg.get('/list/' + scope).pipe(
      map(extractResponseContent),
      map((pList: PreparedSettings[]) => {
        if (!pList) {
          return [];
        }
        return this.buildTypedInputList(pList);
      }),
    );
  }

  public listScopes() {
    return this.scopeGarg.get('/list').pipe(
      map(extractResponseContent),
      map((pList: PreparedScope[]) => {
        return pList ?? [];
      }),
    );
  }

  private buildTypedInputList(pList: PreparedSettings[]) {
    const settings: TypedInput[] = [];

    pList.forEach((preparedSetting: PreparedSettings) => {
      const typedInputRepresentationIndex =
        this.typedInputRepresentationStringList.indexOf(
          preparedSetting.valueType,
        );
      const representation: TypedInputRepresentation =
        this.typedInputRepresentationList[
          typedInputRepresentationIndex == -1
            ? 0
            : typedInputRepresentationIndex
        ];

      const typedInputTypeIndex = this.typedInputDataTypeStringList.indexOf(
        preparedSetting.dataType,
      );
      const inputType: TypedInputType =
        this.typedInputDataTypeList[
          typedInputTypeIndex == -1 ? 0 : typedInputTypeIndex
        ];

      const setting = {
        id: preparedSetting.name,
        name:
          preparedSetting.displayName == ''
            ? preparedSetting.name
            : preparedSetting.displayName,
        category: preparedSetting.group,
        representation: representation,
        type: inputType,
        value: preparedSetting.value,
      } as TypedInput;

      settings.push(setting);
    });
    return settings;
  }
}
