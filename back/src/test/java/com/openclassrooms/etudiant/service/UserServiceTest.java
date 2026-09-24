package com.openclassrooms.etudiant.service;

import com.openclassrooms.etudiant.dto.UserRequestDTO;
import com.openclassrooms.etudiant.entities.User;
import com.openclassrooms.etudiant.repository.UserRepository;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
public class UserServiceTest {
    private static final Long ID = 1L;
    private static final String FIRST_NAME = "John";
    private static final String LAST_NAME = "Doe";
    private static final String LOGIN = "LOGIN";
    private static final String PASSWORD = "PASSWORD";
    private static final String ENCODED_PASSWORD = "ENCODED_PASSWORD";
    private static final String TOKEN = "TOKEN";

    @Mock
    private UserRepository userRepository;
    @Mock
    private PasswordEncoder passwordEncoder;
    @Mock
    private JwtService jwtService;
    @InjectMocks
    private UserService userService;

    private User buildUser() {
        User user = new User();
        user.setFirstName(FIRST_NAME);
        user.setLastName(LAST_NAME);
        user.setLogin(LOGIN);
        user.setPassword(PASSWORD);
        return user;
    }

    private User buildSavedUser() {
        User user = buildUser();
        user.setId(ID);
        user.setPassword(ENCODED_PASSWORD);
        LocalDateTime date = LocalDateTime.of(2026, 1, 1, 0, 0);
        user.setCreated_at(date);
        user.setUpdated_at(date);
        return user;
    }

    private UserRequestDTO buildRequest(String firstName, String lastName, String login, String password) {
        UserRequestDTO dto = new UserRequestDTO();
        dto.setFirstName(firstName);
        dto.setLastName(lastName);
        dto.setLogin(login);
        dto.setPassword(password);
        return dto;
    }

    // ---------- register ----------

    @Test
    public void test_create_null_user_throws_IllegalArgumentException() {
        // GIVEN

        // THEN
        Assertions.assertThrows(IllegalArgumentException.class,
                () -> userService.register(null));
    }

    @Test
    public void test_create_already_exist_user_throws_bad_request() {
        // GIVEN
        User user = buildUser();
        when(userRepository.existsByLogin(LOGIN)).thenReturn(true);

        // WHEN
        ResponseStatusException exception = Assertions.assertThrows(ResponseStatusException.class,
                () -> userService.register(user));

        // THEN
        assertThat(exception.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        verify(userRepository, never()).save(any());
    }

    @Test
    public void test_create_user() {
        // GIVEN
        User user = buildUser();
        when(userRepository.existsByLogin(LOGIN)).thenReturn(false);
        when(passwordEncoder.encode(PASSWORD)).thenReturn(ENCODED_PASSWORD);
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // WHEN
        User result = userService.register(user);

        // THEN
        ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(userCaptor.capture());
        User savedUser = userCaptor.getValue();
        assertThat(savedUser).isEqualTo(user);
        assertThat(savedUser.getPassword()).isEqualTo(ENCODED_PASSWORD);
        assertThat(savedUser.getCreated_at()).isNotNull();
        assertThat(savedUser.getUpdated_at()).isEqualTo(savedUser.getCreated_at());
        assertThat(result).isEqualTo(savedUser);
    }

    // ---------- login ----------

    @Test
    public void test_login_with_null_login_throws_IllegalArgumentException() {
        // THEN
        Assertions.assertThrows(IllegalArgumentException.class,
                () -> userService.login(null, PASSWORD));
    }

    @Test
    public void test_login_with_null_password_throws_IllegalArgumentException() {
        // THEN
        Assertions.assertThrows(IllegalArgumentException.class,
                () -> userService.login(LOGIN, null));
    }

    @Test
    public void test_login_unknown_user_throws_unauthorized() {
        // GIVEN
        when(userRepository.findByLogin(LOGIN)).thenReturn(Optional.empty());

        // WHEN
        ResponseStatusException exception = Assertions.assertThrows(ResponseStatusException.class,
                () -> userService.login(LOGIN, PASSWORD));

        // THEN
        assertThat(exception.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
        verify(jwtService, never()).generateToken(any());
    }

    @Test
    public void test_login_wrong_password_throws_unauthorized() {
        // GIVEN
        when(userRepository.findByLogin(LOGIN)).thenReturn(Optional.of(buildSavedUser()));
        when(passwordEncoder.matches(PASSWORD, ENCODED_PASSWORD)).thenReturn(false);

        // WHEN
        ResponseStatusException exception = Assertions.assertThrows(ResponseStatusException.class,
                () -> userService.login(LOGIN, PASSWORD));

        // THEN
        assertThat(exception.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
        verify(jwtService, never()).generateToken(any());
    }

    @Test
    public void test_login_returns_token() {
        // GIVEN
        when(userRepository.findByLogin(LOGIN)).thenReturn(Optional.of(buildSavedUser()));
        when(passwordEncoder.matches(PASSWORD, ENCODED_PASSWORD)).thenReturn(true);
        when(jwtService.generateToken(any(UserDetails.class))).thenReturn(TOKEN);

        // WHEN
        String token = userService.login(LOGIN, PASSWORD);

        // THEN
        assertThat(token).isEqualTo(TOKEN);
        ArgumentCaptor<UserDetails> userDetailsCaptor = ArgumentCaptor.forClass(UserDetails.class);
        verify(jwtService).generateToken(userDetailsCaptor.capture());
        assertThat(userDetailsCaptor.getValue().getUsername()).isEqualTo(LOGIN);
    }

    // ---------- get / getAll ----------

    @Test
    public void test_get_user() {
        // GIVEN
        User user = buildSavedUser();
        when(userRepository.findById(ID)).thenReturn(Optional.of(user));

        // WHEN
        User result = userService.get(ID);

        // THEN
        assertThat(result).isEqualTo(user);
    }

    @Test
    public void test_get_unknown_user_throws_not_found() {
        // GIVEN
        when(userRepository.findById(ID)).thenReturn(Optional.empty());

        // WHEN
        ResponseStatusException exception = Assertions.assertThrows(ResponseStatusException.class,
                () -> userService.get(ID));

        // THEN
        assertThat(exception.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
    }

    @Test
    public void test_get_all_users() {
        // GIVEN
        User user = buildSavedUser();
        when(userRepository.findAll()).thenReturn(List.of(user));

        // WHEN
        List<User> result = userService.getAll();

        // THEN
        assertThat(result).containsExactly(user);
    }

    // ---------- edit ----------

    @Test
    public void test_edit_unknown_user_throws_not_found() {
        // GIVEN
        when(userRepository.findById(ID)).thenReturn(Optional.empty());
        UserRequestDTO dto = buildRequest(FIRST_NAME, LAST_NAME, LOGIN, null);

        // WHEN
        ResponseStatusException exception = Assertions.assertThrows(ResponseStatusException.class,
                () -> userService.edit(ID, dto));

        // THEN
        assertThat(exception.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
        verify(userRepository, never()).save(any());
    }

    @Test
    public void test_edit_with_unavailable_login_throws_bad_request() {
        // GIVEN
        String newLogin = "NEW_LOGIN";
        when(userRepository.findById(ID)).thenReturn(Optional.of(buildSavedUser()));
        when(userRepository.existsByLogin(newLogin)).thenReturn(true);
        UserRequestDTO dto = buildRequest(FIRST_NAME, LAST_NAME, newLogin, null);

        // WHEN
        ResponseStatusException exception = Assertions.assertThrows(ResponseStatusException.class,
                () -> userService.edit(ID, dto));

        // THEN
        assertThat(exception.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        verify(userRepository, never()).save(any());
    }

    @Test
    public void test_edit_user() {
        // GIVEN
        String newFirstName = "Jane";
        String newLastName = "Smith";
        String newLogin = "NEW_LOGIN";
        User user = buildSavedUser();
        LocalDateTime previousUpdate = user.getUpdated_at();
        when(userRepository.findById(ID)).thenReturn(Optional.of(user));
        when(userRepository.existsByLogin(newLogin)).thenReturn(false);
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));
        UserRequestDTO dto = buildRequest(newFirstName, newLastName, newLogin, null);

        // WHEN
        User result = userService.edit(ID, dto);

        // THEN
        assertThat(result.getFirstName()).isEqualTo(newFirstName);
        assertThat(result.getLastName()).isEqualTo(newLastName);
        assertThat(result.getLogin()).isEqualTo(newLogin);
        assertThat(result.getPassword()).isEqualTo(ENCODED_PASSWORD);
        assertThat(result.getUpdated_at()).isAfter(previousUpdate);
        verify(userRepository).save(user);
    }

    @Test
    public void test_edit_with_same_login_does_not_check_availability() {
        // GIVEN
        User user = buildSavedUser();
        when(userRepository.findById(ID)).thenReturn(Optional.of(user));
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));
        UserRequestDTO dto = buildRequest(FIRST_NAME, LAST_NAME, LOGIN, null);

        // WHEN
        User result = userService.edit(ID, dto);

        // THEN
        assertThat(result.getLogin()).isEqualTo(LOGIN);
        verify(userRepository, never()).existsByLogin(any());
    }

    @Test
    public void test_edit_with_blank_fields_keeps_current_values() {
        // GIVEN
        User user = buildSavedUser();
        when(userRepository.findById(ID)).thenReturn(Optional.of(user));
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));
        UserRequestDTO dto = buildRequest("", " ", "", null);

        // WHEN
        User result = userService.edit(ID, dto);

        // THEN
        assertThat(result.getFirstName()).isEqualTo(FIRST_NAME);
        assertThat(result.getLastName()).isEqualTo(LAST_NAME);
        assertThat(result.getLogin()).isEqualTo(LOGIN);
        assertThat(result.getPassword()).isEqualTo(ENCODED_PASSWORD);
        verify(userRepository, never()).existsByLogin(any());
        verify(passwordEncoder, never()).encode(any());
    }

    @Test
    public void test_edit_with_new_password_encodes_it() {
        // GIVEN
        String newPassword = "NEW_PASSWORD";
        String newEncodedPassword = "NEW_ENCODED_PASSWORD";
        User user = buildSavedUser();
        when(userRepository.findById(ID)).thenReturn(Optional.of(user));
        when(passwordEncoder.matches(newPassword, ENCODED_PASSWORD)).thenReturn(false);
        when(passwordEncoder.encode(newPassword)).thenReturn(newEncodedPassword);
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));
        UserRequestDTO dto = buildRequest(FIRST_NAME, LAST_NAME, LOGIN, newPassword);

        // WHEN
        User result = userService.edit(ID, dto);

        // THEN
        assertThat(result.getPassword()).isEqualTo(newEncodedPassword);
    }

    @Test
    public void test_edit_with_same_password_does_not_encode_it() {
        // GIVEN
        User user = buildSavedUser();
        when(userRepository.findById(ID)).thenReturn(Optional.of(user));
        when(passwordEncoder.matches(PASSWORD, ENCODED_PASSWORD)).thenReturn(true);
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));
        UserRequestDTO dto = buildRequest(FIRST_NAME, LAST_NAME, LOGIN, PASSWORD);

        // WHEN
        User result = userService.edit(ID, dto);

        // THEN
        assertThat(result.getPassword()).isEqualTo(ENCODED_PASSWORD);
        verify(passwordEncoder, never()).encode(any());
    }

    // ---------- delete ----------

    @Test
    public void test_delete_unknown_user_throws_not_found() {
        // GIVEN
        when(userRepository.existsById(ID)).thenReturn(false);

        // WHEN
        ResponseStatusException exception = Assertions.assertThrows(ResponseStatusException.class,
                () -> userService.delete(ID));

        // THEN
        assertThat(exception.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
        verify(userRepository, never()).deleteById(any());
    }

    @Test
    public void test_delete_user() {
        // GIVEN
        when(userRepository.existsById(ID)).thenReturn(true);

        // WHEN
        userService.delete(ID);

        // THEN
        verify(userRepository).deleteById(ID);
    }
}
