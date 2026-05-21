import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AntrisiaPage } from './antrisia.page';

describe('AntrisiaPage', () => {
  let component: AntrisiaPage;
  let fixture: ComponentFixture<AntrisiaPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(AntrisiaPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
