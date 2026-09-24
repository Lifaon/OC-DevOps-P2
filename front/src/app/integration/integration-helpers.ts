import { ComponentFixture } from '@angular/core/testing';

// DOM helpers shared by the integration tests: they drive the components like a user would

export function typeIn(fixture: ComponentFixture<unknown>, controlName: string, value: string): void {
  const input: HTMLInputElement = fixture.nativeElement.querySelector(`input[formcontrolname="${controlName}"]`);
  input.value = value;
  input.dispatchEvent(new Event('input'));
}

export function inputValue(fixture: ComponentFixture<unknown>, controlName: string): string {
  return fixture.nativeElement.querySelector(`input[formcontrolname="${controlName}"]`).value;
}

export function submitForm(fixture: ComponentFixture<unknown>): void {
  fixture.nativeElement.querySelector('form').dispatchEvent(new Event('submit'));
  fixture.detectChanges();
}

export function clickButton(fixture: ComponentFixture<unknown>, label: string, container?: Element): void {
  const root: Element = container ?? fixture.nativeElement;
  const button = Array.from(root.querySelectorAll('button'))
    .find(b => b.textContent?.trim() === label);
  if (!button) {
    throw new Error(`No button labelled "${label}"`);
  }
  button.click();
  fixture.detectChanges();
}

export function tableRows(fixture: ComponentFixture<unknown>): HTMLTableRowElement[] {
  return Array.from(fixture.nativeElement.querySelectorAll('tbody tr'));
}
