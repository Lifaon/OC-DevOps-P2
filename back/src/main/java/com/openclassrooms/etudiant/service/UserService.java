package com.openclassrooms.etudiant.service;

import com.openclassrooms.etudiant.dto.UserRequestDTO;
import com.openclassrooms.etudiant.dto.UserResponseDTO;
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

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Slf4j
@Service
@Transactional
@RequiredArgsConstructor
public class UserService {
    private final UserRepository repo;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public User register(User user) {
        Assert.notNull(user, "User must not be null");

        if (repo.existsByLogin(user.getLogin())) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Login not available");
        }

        user.setPassword(passwordEncoder.encode(user.getPassword()));
		LocalDateTime now = LocalDateTime.now();
		user.setCreated_at(now);
		user.setUpdated_at(now);
        user = repo.save(user);
		log.debug("User {} created", user.getId());
		return user;
    }

    public String login(String login, String password) {
        Assert.notNull(login, "Login must not be null");
        Assert.notNull(password, "Password must not be null");
        Optional<User> user = repo.findByLogin(login);

		if (user.isPresent() && passwordEncoder.matches(password, user.get().getPassword())) {
			UserDetails userDetails = org.springframework.security.core.userdetails.User.builder()
					.username(login)
					.password(password)
					.build();
			return jwtService.generateToken(userDetails);
        } else {
			throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Bad credentials");
        }
    }

	public User get(Long id) {
		return repo.findById(id)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "No user found with given ID"));
	}

	public List<User> getAll() {
		return repo.findAll();
	}

	public User edit(Long id, UserRequestDTO dto) {
		User user = repo.findById(id)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "No user found with given ID"));

		String login = dto.getLogin();
		if (!login.isBlank()) {
			// Ensure login is available
			if (!user.getLogin().equals(login) && repo.existsByLogin(login)) {
				throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Login not available");
			}
			user.setLogin(login);
		}

		// Encode password if it's not already encoded
		String password = dto.getPassword();
		if (password != null && !passwordEncoder.matches(password, user.getPassword())) {
			user.setPassword(passwordEncoder.encode(password));
		}

		if (!dto.getFirstName().isBlank())
			user.setFirstName(dto.getFirstName());
		if (!dto.getLastName().isBlank())
			user.setLastName(dto.getLastName());

		user.setUpdated_at(LocalDateTime.now());

		user = repo.save(user);
		log.debug("User {} updated", id);

		return user;
	}

	public void delete(Long id) {
		if (!repo.existsById(id)) {
			throw new ResponseStatusException(HttpStatus.NOT_FOUND, "No user found with given ID");
		}
		repo.deleteById(id);
		log.debug("User {} deleted", id);
	}
}
