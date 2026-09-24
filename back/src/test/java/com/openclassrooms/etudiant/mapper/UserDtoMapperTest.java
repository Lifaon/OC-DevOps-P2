package com.openclassrooms.etudiant.mapper;

import com.openclassrooms.etudiant.dto.RegisterDTO;
import com.openclassrooms.etudiant.dto.UserResponseDTO;
import com.openclassrooms.etudiant.entities.User;
import org.junit.jupiter.api.Test;
import org.mapstruct.factory.Mappers;

import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;

public class UserDtoMapperTest {
    private static final Long ID = 1L;
    private static final String FIRST_NAME = "John";
    private static final String LAST_NAME = "Doe";
    private static final String LOGIN = "LOGIN";
    private static final String PASSWORD = "PASSWORD";

    private final UserDtoMapper userDtoMapper = Mappers.getMapper(UserDtoMapper.class);

    @Test
    public void test_register_dto_to_entity() {
        // GIVEN
        RegisterDTO registerDTO = new RegisterDTO();
        registerDTO.setFirstName(FIRST_NAME);
        registerDTO.setLastName(LAST_NAME);
        registerDTO.setLogin(LOGIN);
        registerDTO.setPassword(PASSWORD);

        // WHEN
        User user = userDtoMapper.toEntity(registerDTO);

        // THEN
        assertThat(user.getId()).isNull();
        assertThat(user.getFirstName()).isEqualTo(FIRST_NAME);
        assertThat(user.getLastName()).isEqualTo(LAST_NAME);
        assertThat(user.getLogin()).isEqualTo(LOGIN);
        assertThat(user.getPassword()).isEqualTo(PASSWORD);
        assertThat(user.getCreated_at()).isNull();
        assertThat(user.getUpdated_at()).isNull();
    }

    @Test
    public void test_null_register_dto_to_entity() {
        // THEN
        assertThat(userDtoMapper.toEntity(null)).isNull();
    }

    @Test
    public void test_entity_to_response_dto() {
        // GIVEN
        LocalDateTime createdAt = LocalDateTime.of(2026, 1, 1, 10, 0);
        LocalDateTime updatedAt = LocalDateTime.of(2026, 2, 1, 10, 0);
        User user = new User(ID, FIRST_NAME, LAST_NAME, LOGIN, PASSWORD, createdAt, updatedAt);

        // WHEN
        UserResponseDTO dto = UserResponseDTO.fromEntity(user);

        // THEN
        assertThat(dto.getId()).isEqualTo(ID);
        assertThat(dto.getFirstName()).isEqualTo(FIRST_NAME);
        assertThat(dto.getLastName()).isEqualTo(LAST_NAME);
        assertThat(dto.getLogin()).isEqualTo(LOGIN);
        assertThat(dto.getCreatedAt()).isEqualTo(createdAt);
        assertThat(dto.getUpdatedAt()).isEqualTo(updatedAt);
    }
}
