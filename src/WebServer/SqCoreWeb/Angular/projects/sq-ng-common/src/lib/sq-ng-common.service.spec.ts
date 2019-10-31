import { TestBed } from '@angular/core/testing';

import { SqNgCommonService } from './sq-ng-common.service';

describe('SqNgCommonService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: SqNgCommonService = TestBed.get(SqNgCommonService);
    expect(service).toBeTruthy();
  });
});
