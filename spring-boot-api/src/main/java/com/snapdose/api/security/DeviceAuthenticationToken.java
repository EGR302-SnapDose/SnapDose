package com.snapdose.api.security;

import java.util.Collection;
import java.util.Collections;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;

/**
 * Custom authentication token for device token validation (M5Stack/Firmware)
 */
public class DeviceAuthenticationToken implements Authentication {
    private final String principal;
    private final String credentials;
    private final String deviceId;
    private boolean authenticated = false;

    public DeviceAuthenticationToken(String deviceId, String token) {
        this.principal = deviceId;
        this.credentials = token;
        this.deviceId = deviceId;
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

    public String getDeviceId() {
        return deviceId;
    }
}
