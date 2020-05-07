import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SqNgCommonComponent } from './sq-ng-common.component';

describe('SqNgCommonComponent', () => {
  let component: SqNgCommonComponent;
  let fixture: ComponentFixture<SqNgCommonComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SqNgCommonComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SqNgCommonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
