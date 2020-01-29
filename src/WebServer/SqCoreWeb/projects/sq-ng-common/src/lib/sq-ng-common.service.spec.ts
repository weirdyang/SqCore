import { TestBed } from '@angular/core/testing';

import { SqNgCommonService } from './sq-ng-common.service';

describe('SqNgCommonService', () => {
  let service: SqNgCommonService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SqNgCommonService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
