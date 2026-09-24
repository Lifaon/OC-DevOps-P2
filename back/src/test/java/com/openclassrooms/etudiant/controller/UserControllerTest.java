package com.openclassrooms.etudiant.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.openclassrooms.etudiant.dto.LoginRequestDTO;
import com.openclassrooms.etudiant.dto.RegisterDTO;
import com.openclassrooms.etudiant.dto.UserRequestDTO;
import com.openclassrooms.etudiant.entities.User;
import com.openclassrooms.etudiant.repository.UserRepository;
import com.openclassrooms.etudiant.service.UserService;
import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders;
import org.springframework.test.web.servlet.result.MockMvcResultMatchers;
import org.testcontainers.containers.MySQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.result.MockMvcResultHandlers.print;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureMockMvc
@Testcontainers
public class UserControllerTest {

    private static final String URL = "/api/register";
    private static final String LOGIN_URL = "/api/login";
    private static final String CREATE_URL = "/api/user/create";
    private static final String READ_ALL_URL = "/api/user/read/";
    private static final String READ_URL = "/api/user/read/{id}";
    private static final String UPDATE_URL = "/api/user/update/{id}";
    private static final String DELETE_URL = "/api/user/delete/{id}";
    private static final Long UNKNOWN_ID = 999_999L;
    private static final String FIRST_NAME = "John";
    private static final String LAST_NAME = "Doe";
    private static final String LOGIN = "login";
    private static final String PASSWORD = "password";
    private static final String AUTH_LOGIN = "auth-login";
    private static final String AUTH_PASSWORD = "auth-password";


    @Container
    static MySQLContainer<?> mySQLContainer = new MySQLContainer<>("mysql:8.4");

    @Autowired
    private UserService userService;
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private PasswordEncoder passwordEncoder;
    @Autowired
    private ObjectMapper objectMapper;
    @Autowired
    private MockMvc mockMvc;

    @Value("${app.jwt-cookie-name}")
    private String cookieName;

    @DynamicPropertySource
    static void configureTestProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", () -> mySQLContainer.getJdbcUrl());
        registry.add("spring.datasource.username", () -> mySQLContainer.getUsername());
        registry.add("spring.datasource.password", () -> mySQLContainer.getPassword());
        registry.add("spring.jpa.hibernate.ddl-auto", () -> "create");

    }

    @AfterEach
    public void afterEach() {
        userRepository.deleteAll();
    }

    private User registerUser(String login, String password) {
        User user = new User();
        user.setFirstName(FIRST_NAME);
        user.setLastName(LAST_NAME);
        user.setLogin(login);
        user.setPassword(password);
        return userService.register(user);
    }

    private RegisterDTO buildRegisterDTO(String login) {
        RegisterDTO registerDTO = new RegisterDTO();
        registerDTO.setFirstName(FIRST_NAME);
        registerDTO.setLastName(LAST_NAME);
        registerDTO.setLogin(login);
        registerDTO.setPassword(PASSWORD);
        return registerDTO;
    }

    private UserRequestDTO buildUserRequestDTO(String firstName, String lastName, String login, String password) {
        UserRequestDTO dto = new UserRequestDTO();
        dto.setFirstName(firstName);
        dto.setLastName(lastName);
        dto.setLogin(login);
        dto.setPassword(password);
        return dto;
    }

    private LoginRequestDTO buildLoginRequestDTO(String login, String password) {
        LoginRequestDTO loginRequestDTO = new LoginRequestDTO();
        loginRequestDTO.setLogin(login);
        loginRequestDTO.setPassword(password);
        return loginRequestDTO;
    }

    /**
     * Registers a dedicated user and returns the JWT cookie obtained after login.
     */
    private Cookie authCookie() {
        registerUser(AUTH_LOGIN, AUTH_PASSWORD);
        return new Cookie(cookieName, userService.login(AUTH_LOGIN, AUTH_PASSWORD));
    }

    // ---------- /api/register ----------

    @Test
    public void registerUserWithoutRequiredData() throws Exception {
        // GIVEN
        RegisterDTO registerDTO = new RegisterDTO();

        // WHEN
        mockMvc.perform(MockMvcRequestBuilders.post(URL)
                        .content(objectMapper.writeValueAsString(registerDTO))
                        .contentType(MediaType.APPLICATION_JSON)
                        .accept(MediaType.APPLICATION_JSON))
                .andDo(print())
                .andExpect(MockMvcResultMatchers.status().isBadRequest());
    }

    @Test
    public void registerAlreadyExistUser() throws Exception {
        // GIVEN
        registerUser(LOGIN, PASSWORD);
        RegisterDTO registerDTO = buildRegisterDTO(LOGIN);

        // WHEN
        mockMvc.perform(MockMvcRequestBuilders.post(URL)
                        .content(objectMapper.writeValueAsString(registerDTO))
                        .contentType(MediaType.APPLICATION_JSON)
                        .accept(MediaType.APPLICATION_JSON))
                .andDo(print())
                .andExpect(MockMvcResultMatchers.status().isBadRequest());
    }

    @Test
    public void registerUserSuccessful() throws Exception {
        // GIVEN
        RegisterDTO registerDTO = buildRegisterDTO(LOGIN);

        // WHEN
        mockMvc.perform(MockMvcRequestBuilders.post(URL)
                        .content(objectMapper.writeValueAsString(registerDTO))
                        .contentType(MediaType.APPLICATION_JSON)
                        .accept(MediaType.APPLICATION_JSON))
                .andDo(print())
                .andExpect(MockMvcResultMatchers.status().isCreated())
                .andExpect(MockMvcResultMatchers.header().string(HttpHeaders.LOCATION, "/login"));

        // THEN
        User user = userRepository.findByLogin(LOGIN).orElseThrow();
        assertThat(user.getFirstName()).isEqualTo(FIRST_NAME);
        assertThat(user.getLastName()).isEqualTo(LAST_NAME);
        assertThat(user.getPassword()).isNotEqualTo(PASSWORD);
        assertThat(passwordEncoder.matches(PASSWORD, user.getPassword())).isTrue();
    }

    // ---------- /api/login ----------

    @Test
    public void loginWithoutRequiredData() throws Exception {
        // GIVEN
        LoginRequestDTO loginRequestDTO = new LoginRequestDTO();

        // WHEN
        mockMvc.perform(MockMvcRequestBuilders.post(LOGIN_URL)
                        .content(objectMapper.writeValueAsString(loginRequestDTO))
                        .contentType(MediaType.APPLICATION_JSON)
                        .accept(MediaType.APPLICATION_JSON))
                .andDo(print())
                .andExpect(MockMvcResultMatchers.status().isBadRequest());
    }

    @Test
    public void loginUnknownUser() throws Exception {
        // GIVEN
        LoginRequestDTO loginRequestDTO = buildLoginRequestDTO(LOGIN, PASSWORD);

        // WHEN
        mockMvc.perform(MockMvcRequestBuilders.post(LOGIN_URL)
                        .content(objectMapper.writeValueAsString(loginRequestDTO))
                        .contentType(MediaType.APPLICATION_JSON)
                        .accept(MediaType.APPLICATION_JSON))
                .andDo(print())
                .andExpect(MockMvcResultMatchers.status().isUnauthorized())
                .andExpect(MockMvcResultMatchers.header().doesNotExist(HttpHeaders.SET_COOKIE));
    }

    @Test
    public void loginWithWrongPassword() throws Exception {
        // GIVEN
        registerUser(LOGIN, PASSWORD);
        LoginRequestDTO loginRequestDTO = buildLoginRequestDTO(LOGIN, "wrong-password");

        // WHEN
        mockMvc.perform(MockMvcRequestBuilders.post(LOGIN_URL)
                        .content(objectMapper.writeValueAsString(loginRequestDTO))
                        .contentType(MediaType.APPLICATION_JSON)
                        .accept(MediaType.APPLICATION_JSON))
                .andDo(print())
                .andExpect(MockMvcResultMatchers.status().isUnauthorized())
                .andExpect(MockMvcResultMatchers.header().doesNotExist(HttpHeaders.SET_COOKIE));
    }

    @Test
    public void loginSuccessful() throws Exception {
        // GIVEN
        registerUser(LOGIN, PASSWORD);
        LoginRequestDTO loginRequestDTO = buildLoginRequestDTO(LOGIN, PASSWORD);

        // WHEN
        mockMvc.perform(MockMvcRequestBuilders.post(LOGIN_URL)
                        .content(objectMapper.writeValueAsString(loginRequestDTO))
                        .contentType(MediaType.APPLICATION_JSON)
                        .accept(MediaType.APPLICATION_JSON))
                .andDo(print())
                .andExpect(MockMvcResultMatchers.status().isOk())
                .andExpect(MockMvcResultMatchers.header().string(HttpHeaders.SET_COOKIE, containsString(cookieName + "=")))
                .andExpect(MockMvcResultMatchers.header().string(HttpHeaders.SET_COOKIE, containsString("HttpOnly")))
                .andExpect(MockMvcResultMatchers.header().string(HttpHeaders.SET_COOKIE, containsString("Secure")))
                .andExpect(MockMvcResultMatchers.header().string(HttpHeaders.SET_COOKIE, containsString("SameSite=Strict")));
    }

    // ---------- security ----------

    @Test
    public void accessSecuredEndpointWithoutToken() throws Exception {
        // WHEN
        mockMvc.perform(MockMvcRequestBuilders.get(READ_ALL_URL)
                        .accept(MediaType.APPLICATION_JSON))
                .andDo(print())
                .andExpect(MockMvcResultMatchers.status().isUnauthorized());
    }

    @Test
    public void accessSecuredEndpointWithInvalidToken() throws Exception {
        // WHEN
        mockMvc.perform(MockMvcRequestBuilders.get(READ_ALL_URL)
                        .cookie(new Cookie(cookieName, "invalid-token"))
                        .accept(MediaType.APPLICATION_JSON))
                .andDo(print())
                .andExpect(MockMvcResultMatchers.status().isUnauthorized());
    }

    @Test
    public void accessSecuredEndpointWithBearerHeader() throws Exception {
        // GIVEN
        Cookie cookie = authCookie();

        // WHEN
        mockMvc.perform(MockMvcRequestBuilders.get(READ_ALL_URL)
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + cookie.getValue())
                        .accept(MediaType.APPLICATION_JSON))
                .andDo(print())
                .andExpect(MockMvcResultMatchers.status().isOk());
    }

    // ---------- /api/user/create ----------

    @Test
    public void createUserWithoutToken() throws Exception {
        // GIVEN
        RegisterDTO registerDTO = buildRegisterDTO(LOGIN);

        // WHEN
        mockMvc.perform(MockMvcRequestBuilders.post(CREATE_URL)
                        .content(objectMapper.writeValueAsString(registerDTO))
                        .contentType(MediaType.APPLICATION_JSON)
                        .accept(MediaType.APPLICATION_JSON))
                .andDo(print())
                .andExpect(MockMvcResultMatchers.status().isUnauthorized());

        // THEN
        assertThat(userRepository.existsByLogin(LOGIN)).isFalse();
    }

    @Test
    public void createUserWithoutRequiredData() throws Exception {
        // GIVEN
        Cookie cookie = authCookie();
        RegisterDTO registerDTO = new RegisterDTO();

        // WHEN
        mockMvc.perform(MockMvcRequestBuilders.post(CREATE_URL)
                        .cookie(cookie)
                        .content(objectMapper.writeValueAsString(registerDTO))
                        .contentType(MediaType.APPLICATION_JSON)
                        .accept(MediaType.APPLICATION_JSON))
                .andDo(print())
                .andExpect(MockMvcResultMatchers.status().isBadRequest());
    }

    @Test
    public void createAlreadyExistUser() throws Exception {
        // GIVEN
        Cookie cookie = authCookie();
        registerUser(LOGIN, PASSWORD);
        RegisterDTO registerDTO = buildRegisterDTO(LOGIN);

        // WHEN
        mockMvc.perform(MockMvcRequestBuilders.post(CREATE_URL)
                        .cookie(cookie)
                        .content(objectMapper.writeValueAsString(registerDTO))
                        .contentType(MediaType.APPLICATION_JSON)
                        .accept(MediaType.APPLICATION_JSON))
                .andDo(print())
                .andExpect(MockMvcResultMatchers.status().isBadRequest());
    }

    @Test
    public void createUserSuccessful() throws Exception {
        // GIVEN
        Cookie cookie = authCookie();
        RegisterDTO registerDTO = buildRegisterDTO(LOGIN);

        // WHEN
        mockMvc.perform(MockMvcRequestBuilders.post(CREATE_URL)
                        .cookie(cookie)
                        .content(objectMapper.writeValueAsString(registerDTO))
                        .contentType(MediaType.APPLICATION_JSON)
                        .accept(MediaType.APPLICATION_JSON))
                .andDo(print())
                .andExpect(MockMvcResultMatchers.status().isOk())
                .andExpect(MockMvcResultMatchers.jsonPath("$.id").isNumber())
                .andExpect(MockMvcResultMatchers.jsonPath("$.firstName").value(FIRST_NAME))
                .andExpect(MockMvcResultMatchers.jsonPath("$.lastName").value(LAST_NAME))
                .andExpect(MockMvcResultMatchers.jsonPath("$.login").value(LOGIN))
                .andExpect(MockMvcResultMatchers.jsonPath("$.createdAt").exists())
                .andExpect(MockMvcResultMatchers.jsonPath("$.updatedAt").exists())
                .andExpect(MockMvcResultMatchers.jsonPath("$.password").doesNotExist());

        // THEN
        assertThat(userRepository.existsByLogin(LOGIN)).isTrue();
    }

    // ---------- /api/user/read ----------

    @Test
    public void readAllUsers() throws Exception {
        // GIVEN
        Cookie cookie = authCookie();
        registerUser(LOGIN, PASSWORD);

        // WHEN
        mockMvc.perform(MockMvcRequestBuilders.get(READ_ALL_URL)
                        .cookie(cookie)
                        .accept(MediaType.APPLICATION_JSON))
                .andDo(print())
                .andExpect(MockMvcResultMatchers.status().isOk())
                .andExpect(MockMvcResultMatchers.jsonPath("$", hasSize(2)))
                .andExpect(MockMvcResultMatchers.jsonPath("$[*].password").doesNotExist());
    }

    @Test
    public void readUserSuccessful() throws Exception {
        // GIVEN
        Cookie cookie = authCookie();
        User user = registerUser(LOGIN, PASSWORD);

        // WHEN
        mockMvc.perform(MockMvcRequestBuilders.get(READ_URL, user.getId())
                        .cookie(cookie)
                        .accept(MediaType.APPLICATION_JSON))
                .andDo(print())
                .andExpect(MockMvcResultMatchers.status().isOk())
                .andExpect(MockMvcResultMatchers.jsonPath("$.id").value(user.getId()))
                .andExpect(MockMvcResultMatchers.jsonPath("$.firstName").value(FIRST_NAME))
                .andExpect(MockMvcResultMatchers.jsonPath("$.lastName").value(LAST_NAME))
                .andExpect(MockMvcResultMatchers.jsonPath("$.login").value(LOGIN))
                .andExpect(MockMvcResultMatchers.jsonPath("$.password").doesNotExist());
    }

    @Test
    public void readUnknownUser() throws Exception {
        // GIVEN
        Cookie cookie = authCookie();

        // WHEN
        mockMvc.perform(MockMvcRequestBuilders.get(READ_URL, UNKNOWN_ID)
                        .cookie(cookie)
                        .accept(MediaType.APPLICATION_JSON))
                .andDo(print())
                .andExpect(MockMvcResultMatchers.status().isNotFound());
    }

    // ---------- /api/user/update ----------

    @Test
    public void updateUserSuccessful() throws Exception {
        // GIVEN
        Cookie cookie = authCookie();
        User user = registerUser(LOGIN, PASSWORD);
        String newFirstName = "Jane";
        String newLastName = "Smith";
        String newLogin = "new-login";
        String newPassword = "new-password";
        UserRequestDTO dto = buildUserRequestDTO(newFirstName, newLastName, newLogin, newPassword);

        // WHEN
        mockMvc.perform(MockMvcRequestBuilders.put(UPDATE_URL, user.getId())
                        .cookie(cookie)
                        .content(objectMapper.writeValueAsString(dto))
                        .contentType(MediaType.APPLICATION_JSON)
                        .accept(MediaType.APPLICATION_JSON))
                .andDo(print())
                .andExpect(MockMvcResultMatchers.status().isOk())
                .andExpect(MockMvcResultMatchers.jsonPath("$.id").value(user.getId()))
                .andExpect(MockMvcResultMatchers.jsonPath("$.firstName").value(newFirstName))
                .andExpect(MockMvcResultMatchers.jsonPath("$.lastName").value(newLastName))
                .andExpect(MockMvcResultMatchers.jsonPath("$.login").value(newLogin))
                .andExpect(MockMvcResultMatchers.jsonPath("$.password").doesNotExist());

        // THEN
        User updatedUser = userRepository.findById(user.getId()).orElseThrow();
        assertThat(updatedUser.getFirstName()).isEqualTo(newFirstName);
        assertThat(updatedUser.getLastName()).isEqualTo(newLastName);
        assertThat(updatedUser.getLogin()).isEqualTo(newLogin);
        assertThat(passwordEncoder.matches(newPassword, updatedUser.getPassword())).isTrue();
    }

    @Test
    public void updateUserWithBlankFieldsKeepsCurrentValues() throws Exception {
        // GIVEN
        Cookie cookie = authCookie();
        User user = registerUser(LOGIN, PASSWORD);
        UserRequestDTO dto = buildUserRequestDTO("", "", "", null);

        // WHEN
        mockMvc.perform(MockMvcRequestBuilders.put(UPDATE_URL, user.getId())
                        .cookie(cookie)
                        .content(objectMapper.writeValueAsString(dto))
                        .contentType(MediaType.APPLICATION_JSON)
                        .accept(MediaType.APPLICATION_JSON))
                .andDo(print())
                .andExpect(MockMvcResultMatchers.status().isOk())
                .andExpect(MockMvcResultMatchers.jsonPath("$.firstName").value(FIRST_NAME))
                .andExpect(MockMvcResultMatchers.jsonPath("$.lastName").value(LAST_NAME))
                .andExpect(MockMvcResultMatchers.jsonPath("$.login").value(LOGIN));

        // THEN
        User updatedUser = userRepository.findById(user.getId()).orElseThrow();
        assertThat(passwordEncoder.matches(PASSWORD, updatedUser.getPassword())).isTrue();
    }

    @Test
    public void updateUserWithUnavailableLogin() throws Exception {
        // GIVEN
        Cookie cookie = authCookie();
        User user = registerUser(LOGIN, PASSWORD);
        UserRequestDTO dto = buildUserRequestDTO(FIRST_NAME, LAST_NAME, AUTH_LOGIN, null);

        // WHEN
        mockMvc.perform(MockMvcRequestBuilders.put(UPDATE_URL, user.getId())
                        .cookie(cookie)
                        .content(objectMapper.writeValueAsString(dto))
                        .contentType(MediaType.APPLICATION_JSON)
                        .accept(MediaType.APPLICATION_JSON))
                .andDo(print())
                .andExpect(MockMvcResultMatchers.status().isBadRequest());

        // THEN
        assertThat(userRepository.findById(user.getId()).orElseThrow().getLogin()).isEqualTo(LOGIN);
    }

    @Test
    public void updateUnknownUser() throws Exception {
        // GIVEN
        Cookie cookie = authCookie();
        UserRequestDTO dto = buildUserRequestDTO(FIRST_NAME, LAST_NAME, LOGIN, null);

        // WHEN
        mockMvc.perform(MockMvcRequestBuilders.put(UPDATE_URL, UNKNOWN_ID)
                        .cookie(cookie)
                        .content(objectMapper.writeValueAsString(dto))
                        .contentType(MediaType.APPLICATION_JSON)
                        .accept(MediaType.APPLICATION_JSON))
                .andDo(print())
                .andExpect(MockMvcResultMatchers.status().isNotFound());
    }

    // ---------- /api/user/delete ----------

    @Test
    public void deleteUserSuccessful() throws Exception {
        // GIVEN
        Cookie cookie = authCookie();
        User user = registerUser(LOGIN, PASSWORD);

        // WHEN
        mockMvc.perform(MockMvcRequestBuilders.delete(DELETE_URL, user.getId())
                        .cookie(cookie))
                .andDo(print())
                .andExpect(MockMvcResultMatchers.status().isNoContent());

        // THEN
        assertThat(userRepository.existsById(user.getId())).isFalse();
    }

    @Test
    public void deleteUnknownUser() throws Exception {
        // GIVEN
        Cookie cookie = authCookie();

        // WHEN
        mockMvc.perform(MockMvcRequestBuilders.delete(DELETE_URL, UNKNOWN_ID)
                        .cookie(cookie))
                .andDo(print())
                .andExpect(MockMvcResultMatchers.status().isNotFound());
    }

    @Test
    public void deleteUserWithoutToken() throws Exception {
        // GIVEN
        User user = registerUser(LOGIN, PASSWORD);

        // WHEN
        mockMvc.perform(MockMvcRequestBuilders.delete(DELETE_URL, user.getId()))
                .andDo(print())
                .andExpect(MockMvcResultMatchers.status().isUnauthorized());

        // THEN
        assertThat(userRepository.existsById(user.getId())).isTrue();
    }
}
