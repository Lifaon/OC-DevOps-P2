package com.openclassrooms.etudiant.service;


import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

@Service
public class JwtService {

    public String generateToken(UserDetails userDetails) {
        return null; // TODO
    }

}
