package com.openclassrooms.etudiant.configuration.security;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpHeaders;
import org.springframework.mock.web.MockFilterChain;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

import java.util.Collections;

import static org.assertj.core.api.Assertions.assertThat;

public class CookieToAuthHeaderFilterTest {
    private static final String COOKIE_NAME = "authToken";
    private static final String TOKEN = "TOKEN";

    private final CookieToAuthHeaderFilter filter = new CookieToAuthHeaderFilter(COOKIE_NAME);

    private HttpServletRequest doFilter(MockHttpServletRequest request) throws Exception {
        MockFilterChain filterChain = new MockFilterChain();
        filter.doFilter(request, new MockHttpServletResponse(), filterChain);
        return (HttpServletRequest) filterChain.getRequest();
    }

    @Test
    public void test_cookie_is_converted_to_authorization_header() throws Exception {
        // GIVEN
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setCookies(new Cookie(COOKIE_NAME, TOKEN));

        // WHEN
        HttpServletRequest filteredRequest = doFilter(request);

        // THEN
        assertThat(filteredRequest.getHeader(HttpHeaders.AUTHORIZATION)).isEqualTo("Bearer " + TOKEN);
        assertThat(Collections.list(filteredRequest.getHeaders(HttpHeaders.AUTHORIZATION)))
                .containsExactly("Bearer " + TOKEN);
    }

    @Test
    public void test_other_headers_are_kept() throws Exception {
        // GIVEN
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setCookies(new Cookie(COOKIE_NAME, TOKEN));
        request.addHeader("X-Custom", "value");

        // WHEN
        HttpServletRequest filteredRequest = doFilter(request);

        // THEN
        assertThat(filteredRequest.getHeader("X-Custom")).isEqualTo("value");
        assertThat(Collections.list(filteredRequest.getHeaders("X-Custom"))).containsExactly("value");
    }

    @Test
    public void test_request_without_cookie_is_unchanged() throws Exception {
        // GIVEN
        MockHttpServletRequest request = new MockHttpServletRequest();

        // WHEN
        HttpServletRequest filteredRequest = doFilter(request);

        // THEN
        assertThat(filteredRequest).isSameAs(request);
        assertThat(filteredRequest.getHeader(HttpHeaders.AUTHORIZATION)).isNull();
    }

    @Test
    public void test_request_with_other_cookie_is_unchanged() throws Exception {
        // GIVEN
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setCookies(new Cookie("otherCookie", TOKEN));

        // WHEN
        HttpServletRequest filteredRequest = doFilter(request);

        // THEN
        assertThat(filteredRequest).isSameAs(request);
        assertThat(filteredRequest.getHeader(HttpHeaders.AUTHORIZATION)).isNull();
    }
}
