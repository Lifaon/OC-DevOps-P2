package com.openclassrooms.etudiant.service;

import com.nimbusds.jose.JWSAlgorithm;
import com.nimbusds.jose.jwk.JWKSet;
import com.nimbusds.jose.jwk.OctetSequenceKey;
import com.nimbusds.jose.jwk.source.ImmutableJWKSet;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtException;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.security.oauth2.jwt.NimbusJwtEncoder;
import org.springframework.test.util.ReflectionTestUtils;

import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.time.Duration;

import static org.assertj.core.api.Assertions.assertThat;

public class JwtServiceTest {
    private static final String SECRET = "a-test-secret-key-that-is-long-enough-for-hs256";
    private static final String OTHER_SECRET = "another-test-secret-key-long-enough-for-hs256";
    private static final Integer PERIOD = 3_600_000;
    private static final String LOGIN = "LOGIN";
    private static final String PASSWORD = "PASSWORD";

    private JwtService jwtService;

    private static SecretKey buildKey(String secret) {
        return new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
    }

    private static JwtDecoder buildDecoder(String secret) {
        return NimbusJwtDecoder.withSecretKey(buildKey(secret))
                .macAlgorithm(MacAlgorithm.HS256)
                .build();
    }

    @BeforeEach
    public void beforeEach() {
        OctetSequenceKey jwk = new OctetSequenceKey.Builder(buildKey(SECRET))
                .algorithm(JWSAlgorithm.HS256)
                .build();
        jwtService = new JwtService(new NimbusJwtEncoder(new ImmutableJWKSet<>(new JWKSet(jwk))));
        ReflectionTestUtils.setField(jwtService, "period", PERIOD);
    }

    private UserDetails buildUserDetails() {
        return User.withUsername(LOGIN).password(PASSWORD).build();
    }

    @Test
    public void test_generate_token_contains_subject_and_expiration() {
        // WHEN
        String token = jwtService.generateToken(buildUserDetails());

        // THEN
        Jwt jwt = buildDecoder(SECRET).decode(token);
        assertThat(jwt.getSubject()).isEqualTo(LOGIN);
        assertThat(jwt.getIssuedAt()).isNotNull();
        assertThat(jwt.getExpiresAt()).isNotNull();
        assertThat(Duration.between(jwt.getIssuedAt(), jwt.getExpiresAt()))
                .isEqualTo(Duration.ofMillis(PERIOD));
    }

    @Test
    public void test_generate_token_does_not_contain_password() {
        // WHEN
        String token = jwtService.generateToken(buildUserDetails());

        // THEN
        Jwt jwt = buildDecoder(SECRET).decode(token);
        assertThat(jwt.getClaims().values()).doesNotContain(PASSWORD);
    }

    @Test
    public void test_token_signed_with_other_key_is_rejected() {
        // GIVEN
        String token = jwtService.generateToken(buildUserDetails());

        // THEN
        Assertions.assertThrows(JwtException.class,
                () -> buildDecoder(OTHER_SECRET).decode(token));
    }
}
