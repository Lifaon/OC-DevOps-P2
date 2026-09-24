import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { MaterialModule } from '../../shared/material.module';
import { UserFormComponent } from '../../shared/components/user-form/user-form.component';
import { UserService } from '../../core/service/user.service';
import { UserResponse } from '../../core/models/UserResponse';
import { UserCreate } from '../../core/models/UserCreate';
import { UserUpdate } from '../../core/models/UserUpdate';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-user',
  imports: [CommonModule, MaterialModule, UserFormComponent],
  templateUrl: './user.component.html',
  standalone: true,
  styleUrl: './user.component.css'
})
export class UserComponent implements OnInit {
  private userService = inject(UserService);
  private destroyRef = inject(DestroyRef);
  users: UserResponse[] = [];
  showForm: boolean = false;
  editedUser: UserResponse | null = null;
  errorMessage: string | null = null;

  ngOnInit() {
    this.loadUsers();
  }

  loadUsers(): void {
    this.userService.readAll()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (users: UserResponse[]) => {
          this.users = users;
        },
        error: (error: HttpErrorResponse) => this.handleError('Unable to load users', error)
      });
  }

  onCreate(): void {
    this.errorMessage = null;
    this.editedUser = null;
    this.showForm = true;
  }

  onEdit(user: UserResponse): void {
    this.errorMessage = null;
    this.editedUser = user;
    this.showForm = true;
  }

  onCancel(): void {
    this.errorMessage = null;
    this.editedUser = null;
    this.showForm = false;
  }

  onDelete(user: UserResponse): void {
    if (!confirm(`Delete user ${user.login}?`)) {
      return;
    }
    this.errorMessage = null;
    this.userService.delete(user.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          if (this.editedUser?.id === user.id) {
            this.onCancel();
          }
          this.loadUsers();
        },
        error: (error: HttpErrorResponse) => this.handleError('Unable to delete user', error)
      });
  }

  createUser(newUser: UserCreate): void {
    this.errorMessage = null;
    this.userService.create(newUser)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.onCancel();
          this.loadUsers();
        },
        error: (error: HttpErrorResponse) => this.handleError('Unable to create user', error)
      });
  }

  updateUser(updatedUser: UserUpdate): void {
    if (!this.editedUser) {
      return;
    }
    this.errorMessage = null;
    this.userService.update(this.editedUser.id, updatedUser)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.onCancel();
          this.loadUsers();
        },
        error: (error: HttpErrorResponse) => this.handleError('Unable to update user', error)
      });
  }

  private handleError(context: string, error: HttpErrorResponse): void {
    if (error.status === 0) {
      this.errorMessage = `${context}: server unreachable`;
      return;
    }
    // The back-end answers "<status>: <title>\n<reason>" as plain text
    const reason = typeof error.error === 'string' && error.error.trim()
      ? error.error.trim().split('\n').pop()
      : error.statusText;
    this.errorMessage = `${context}: ${reason}`;
  }
}
