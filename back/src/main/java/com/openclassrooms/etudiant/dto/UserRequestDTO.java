package com.openclassrooms.etudiant.dto;

import lombok.Data;

@Data
public class UserRequestDTO {
	private String firstName;
	private String lastName;
	private String login;
	private String password;
}
