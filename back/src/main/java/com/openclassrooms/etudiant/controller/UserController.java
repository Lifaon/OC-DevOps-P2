package com.openclassrooms.etudiant.controller;

import com.openclassrooms.etudiant.dto.LoginRequestDTO;
import com.openclassrooms.etudiant.dto.RegisterDTO;
import com.openclassrooms.etudiant.dto.UserResponseDTO;
import com.openclassrooms.etudiant.entities.User;
import com.openclassrooms.etudiant.mapper.UserDtoMapper;
import com.openclassrooms.etudiant.service.UserService;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.net.URI;
import java.util.List;

@RestController
@RequestMapping
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;
    private final UserDtoMapper userDtoMapper;

	@Value("${app.jwt-cookie-name}")
	private String cookieName;
	@Value("${app.jwt-period}")
	private Integer cookiePeriod;

    @PostMapping("/api/register")
    public ResponseEntity<?> register(@Valid @RequestBody RegisterDTO registerDTO) {

        userService.register(userDtoMapper.toEntity(registerDTO));
        return ResponseEntity.created(URI.create("/login")).build();
    }

    @PostMapping("/api/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequestDTO loginRequestDTO, HttpServletResponse response) {

		String jwtToken = userService.login(loginRequestDTO.getLogin(), loginRequestDTO.getPassword());

		ResponseCookie cookie = ResponseCookie.from(cookieName, jwtToken)
				.httpOnly(true)
				.secure(true)
				.sameSite("Strict")
				.path("/")
				.maxAge(cookiePeriod)
				.build();

		return ResponseEntity.ok()
				.header(HttpHeaders.SET_COOKIE, cookie.toString())
				.build();
    }

	@GetMapping("/api/user/read/")
	public ResponseEntity<?> readAll() {
		List<User> users = userService.findAll();
		List<UserResponseDTO> list = users.stream().map(UserResponseDTO::fromEntity).toList();
		return ResponseEntity.ok(list);
	}

	@GetMapping("/api/user/read/{id}")
	public ResponseEntity<?> read(@PathVariable Long id) {
		User user = userService.find(id)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
		return ResponseEntity.ok(UserResponseDTO.fromEntity(user));
	}
}
