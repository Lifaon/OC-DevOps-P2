package com.openclassrooms.etudiant.service;

import com.openclassrooms.etudiant.entities.User;
import com.openclassrooms.etudiant.repository.UserRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.util.Assert;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Optional;

@Slf4j
@Service
@Transactional
@RequiredArgsConstructor
public class UserService {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public void register(User user) {
        Assert.notNull(user, "User must not be null");
        log.info("Registering new user");

        Optional<User> optionalUser = userRepository.findByLogin(user.getLogin());
        if (optionalUser.isPresent()) {
            throw new IllegalArgumentException("User with login " + user.getLogin() + " already exists");
        }
        user.setPassword(passwordEncoder.encode(user.getPassword()));
        userRepository.save(user);
    }

    public String login(String login, String password) {
        Assert.notNull(login, "Login must not be null");
        Assert.notNull(password, "Password must not be null");
        Optional<User> user = userRepository.findByLogin(login);

		if (user.isPresent() && passwordEncoder.matches(password, user.get().getPassword())) {
			UserDetails userDetails = org.springframework.security.core.userdetails.User.builder()
					.username(login)
					.password(password)
					.build();
			return jwtService.generateToken(userDetails);
        } else {
            throw new IllegalArgumentException("Invalid credentials");
        }
    }

	public Optional<User> findByLogin(String login) {
		return userRepository.findByLogin(login);
	}

	public Optional<User> find(Long id) {
		return userRepository.findById(id);
	}

	public List<User> findAll() {
		return userRepository.findAll();
	}

}
