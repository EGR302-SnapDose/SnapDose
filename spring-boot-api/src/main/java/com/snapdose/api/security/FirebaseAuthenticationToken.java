package com.snapdose.api.security;

import java.util.Collection;
import java.util.Collections;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;

/**
 * Custom authentication token for Firebase ID token validation
 */
public class FirebaseAuthenticationToken implements Authentication {
    private final String principal;
    private final String credentials;
    private final String userId;
    private boolean authenticated = false;

    public FirebaseAuthenticationToken(String credentials, String userId) {
        this.principal = userId;
        this.credentials = credentials;
        this.userId = userId;
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return Collections.emptyList();
    }

    @Override
    public Object getCredentials() {
        return credentials;
    }

    @Override
    public Object getDetails() {
        return null;
    }

    @Override
    public Object getPrincipal() {
        return principal;
    }

    @Override
    public boolean isAuthenticated() {
        return authenticated;
    }

    @Override
    public void setAuthenticated(boolean isAuthenticated) throws IllegalArgumentException {
        this.authenticated = isAuthenticated;
    }

    @Override
    public String getName() {
        return principal;
    }

    public String getUserId() {
        return userId;
    }
}
