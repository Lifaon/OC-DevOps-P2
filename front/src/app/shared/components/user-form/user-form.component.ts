import { Component, EventEmitter, inject, Input, OnChanges, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MaterialModule } from '../../material.module';
import { UserResponse } from '../../../core/models/UserResponse';
import { UserCreate } from '../../../core/models/UserCreate';
import { UserUpdate } from '../../../core/models/UserUpdate';

@Component({
  selector: 'app-user-form',
  imports: [CommonModule, MaterialModule],
  templateUrl: './user-form.component.html',
  standalone: true,
  styleUrl: './user-form.component.css'
})
export class UserFormComponent implements OnChanges {
  private formBuilder = inject(FormBuilder);

  // User to edit; when null the form creates a new user
  @Input() user: UserResponse | null = null;
  @Input() title: string = 'Create User';
  @Input() submitLabel: string = 'Create';
  @Output() created = new EventEmitter<UserCreate>();
  @Output() updated = new EventEmitter<UserUpdate>();
  @Output() cancelled = new EventEmitter<void>();

  userForm: FormGroup = this.formBuilder.group(
    {
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      login: ['', Validators.required],
      password: ['', Validators.required]
    },
  );
  submitted: boolean = false;

  ngOnChanges() {
    this.submitted = false;
    this.userForm.reset();
    if (this.user) {
      this.userForm.patchValue({
        firstName: this.user.firstName,
        lastName: this.user.lastName,
        login: this.user.login
      });
      // Password is optional when editing: left empty, it is not changed
      this.form['password'].clearValidators();
    } else {
      this.form['password'].setValidators(Validators.required);
    }
    this.form['password'].updateValueAndValidity();
  }

  get form() {
    return this.userForm.controls;
  }

  onSubmit(): void {
    this.submitted = true;
    if (this.userForm.invalid) {
      return;
    }
    if (this.user) {
      this.updated.emit({
        firstName: this.userForm.get('firstName')?.value,
        lastName: this.userForm.get('lastName')?.value,
        login: this.userForm.get('login')?.value,
        // The back-end ignores a null password but would save an empty one
        password: this.userForm.get('password')?.value || null
      });
    } else {
      this.created.emit({
        firstName: this.userForm.get('firstName')?.value,
        lastName: this.userForm.get('lastName')?.value,
        login: this.userForm.get('login')?.value,
        password: this.userForm.get('password')?.value
      });
    }
  }

  onReset(): void {
    this.submitted = false;
    this.userForm.reset();
    this.cancelled.emit();
  }
}
