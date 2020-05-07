import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CatalystSnifferComponent } from './catalyst-sniffer.component';

describe('CatalystSnifferComponent', () => {
  let component: CatalystSnifferComponent;
  let fixture: ComponentFixture<CatalystSnifferComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CatalystSnifferComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CatalystSnifferComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
