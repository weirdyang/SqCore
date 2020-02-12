import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TooltipSandpitComponent } from './tooltip-sandpit.component';

describe('TooltipSandpitComponent', () => {
  let component: TooltipSandpitComponent;
  let fixture: ComponentFixture<TooltipSandpitComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TooltipSandpitComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TooltipSandpitComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
