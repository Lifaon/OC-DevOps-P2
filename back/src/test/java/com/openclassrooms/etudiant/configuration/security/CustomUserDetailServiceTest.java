package com.openclassrooms.etudiant.configuration.security;

import com.openclassrooms.etudiant.entities.User;
import com.openclassrooms.etudiant.repository.UserRepository;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
public class CustomUserDetailServiceTest {
    private static final String LOGIN = "LOGIN";
    private static final String PASSWORD = "PASSWORD";

    @Mock
    private UserRepository userRepository;
    @InjectMocks
    private CustomUserDetailService customUserDetailService;

    @Test
    public void test_load_existing_user() {
        // GIVEN
        User user = new User();
        user.setLogin(LOGIN);
        user.setPassword(PASSWORD);
        when(userRepository.findByLogin(LOGIN)).thenReturn(Optional.of(user));

        // WHEN
        UserDetails userDetails = customUserDetailService.loadUserByUsername(LOGIN);

        // THEN
        assertThat(userDetails.getUsername()).isEqualTo(LOGIN);
        assertThat(userDetails.getPassword()).isEqualTo(PASSWORD);
        assertThat(userDetails.isEnabled()).isTrue();
    }

    @Test
    public void test_load_unknown_user_throws_UsernameNotFoundException() {
        // GIVEN
        when(userRepository.findByLogin(LOGIN)).thenReturn(Optional.empty());

        // THEN
        Assertions.assertThrows(UsernameNotFoundException.class,
                () -> customUserDetailService.loadUserByUsername(LOGIN));
    }
}
