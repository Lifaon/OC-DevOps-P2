package com.openclassrooms.etudiant.dto;

import com.openclassrooms.etudiant.entities.User;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class UserResponseDTO {
	private Long id;
	private String firstName;
	private String lastName;
	private String login;
	private LocalDateTime createdAt;
	private LocalDateTime updatedAt;

	public static UserResponseDTO fromEntity(User user) {
		return UserResponseDTO.builder()
				.id(user.getId())
				.firstName(user.getFirstName())
				.lastName(user.getLastName())
				.login(user.getLogin())
				.createdAt(user.getCreated_at())
				.updatedAt(user.getUpdated_at())
				.build();
	}
}
