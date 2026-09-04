import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MaterialModule } from '../../shared/material.module';
import { UserService } from '../../core/service/user.service';
import { Register } from '../../core/models/Register';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-read',
  imports: [CommonModule, MaterialModule],
  templateUrl: './read.component.html',
  standalone: true,
  styleUrl: './read.component.css'
})
export class ReadComponent implements OnInit {
  private userService = inject(UserService);
  private formBuilder = inject(FormBuilder);
  private destroyRef = inject(DestroyRef);

  ngOnInit() {
    console.log("Read inited")
    this.userService.read()
      // .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(
      () => {
        alert('SUCCESS!! :-)');
      })
  }
}
