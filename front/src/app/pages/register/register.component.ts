import { Component, DestroyRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MaterialModule } from '../../shared/material.module';
import { UserFormComponent } from '../../shared/components/user-form/user-form.component';
import { UserService } from '../../core/service/user.service';
import { UserCreate } from '../../core/models/UserCreate';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-register',
  imports: [CommonModule, MaterialModule, UserFormComponent],
  templateUrl: './register.component.html',
  standalone: true,
  styleUrl: './register.component.css'
})
export class RegisterComponent {
  private userService = inject(UserService);
  private destroyRef = inject(DestroyRef);

  onRegister(registerUser: UserCreate): void {
    this.userService.register(registerUser)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(
      () => {
        alert('SUCCESS!! :-)');
        // TODO : router l'utilisateur vers la page de login
      },
    );
  }
}
