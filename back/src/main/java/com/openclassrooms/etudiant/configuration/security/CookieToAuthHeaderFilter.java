package com.openclassrooms.etudiant.configuration.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletRequestWrapper;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Arrays;
import java.util.Collections;
import java.util.Enumeration;
import java.util.List;

@RequiredArgsConstructor
public class CookieToAuthHeaderFilter extends OncePerRequestFilter {

	private final String cookieName;

	@Override
	protected void doFilterInternal(HttpServletRequest request,
									HttpServletResponse response,
									FilterChain filterChain) throws ServletException, IOException {

		String token = extractTokenFromCookie(request);
		System.out.println("token got: " + token);
		System.out.println("cookie name: " + cookieName);
		if (token != null) {
			HttpServletRequest wrappedRequest = new HttpServletRequestWrapper(request) {
				@Override
				public String getHeader(String name) {
					if ("Authorization".equalsIgnoreCase(name)) {
						return "Bearer " + token;
					}
					return super.getHeader(name);
				}

				@Override
				public Enumeration<String> getHeaders(String name) {
					if ("Authorization".equalsIgnoreCase(name)) {
						return Collections.enumeration(List.of("Bearer " + token));
					}
					return super.getHeaders(name);
				}
			};
			filterChain.doFilter(wrappedRequest, response);
		} else {
			filterChain.doFilter(request, response);
		}
	}

	private String extractTokenFromCookie(HttpServletRequest request) {
		Cookie[] cookies = request.getCookies();
		return Arrays.stream(cookies)
				.filter(cookie -> cookie.getName().equals(cookieName))
				.map(Cookie::getValue)
				.findFirst()
				.orElse(null);
	}
}
