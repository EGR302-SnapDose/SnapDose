package com.snapdose.api.security;

import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseAuthException;
import com.snapdose.api.config.DeviceTokenProperties;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

@Component
public class AuthenticationFilter extends OncePerRequestFilter {

    private static final Logger log = LoggerFactory.getLogger(
        AuthenticationFilter.class
    );

    @Autowired
    private DeviceTokenProperties deviceTokenProperties;

    @Override
    protected void doFilterInternal(
        HttpServletRequest request,
        HttpServletResponse response,
        FilterChain chain
    ) throws ServletException, IOException {
        String authHeader = request.getHeader("Authorization");
        String deviceToken = request.getHeader("X-Device-Token");
        String deviceId = request.getHeader("X-Device-Id");

        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7);
            if (validateFirebaseToken(token)) {
                chain.doFilter(request, response);
                return;
            }
        }

        if (deviceToken != null && deviceId != null) {
            if (validateDeviceToken(deviceId, deviceToken)) {
                chain.doFilter(request, response);
                return;
            }
        }

        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        response.setContentType("application/json");
        response
            .getWriter()
            .write(
                "{\"error\":\"Unauthorized\",\"message\":\"Invalid or missing authentication token\"}"
            );
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        return "/api/health".equals(request.getRequestURI());
    }

    private boolean validateFirebaseToken(String idToken) {
        try {
            var decoded = FirebaseAuth.getInstance().verifyIdToken(idToken);
            FirebaseAuthenticationToken auth = new FirebaseAuthenticationToken(
                idToken,
                decoded.getUid()
            );
            auth.setAuthenticated(true);
            SecurityContextHolder.getContext().setAuthentication(auth);
            return true;
        } catch (FirebaseAuthException e) {
            log.debug(
                "Firebase token validation failed: {}",
                e.getAuthErrorCode()
            );
            return false;
        }
    }

    private boolean validateDeviceToken(String deviceId, String token) {
        log.debug("Validating device token for deviceId={}", deviceId);
        if (deviceTokenProperties.isValidDeviceToken(deviceId, token)) {
            DeviceAuthenticationToken auth = new DeviceAuthenticationToken(
                deviceId,
                token
            );
            auth.setAuthenticated(true);
            SecurityContextHolder.getContext().setAuthentication(auth);
            log.debug("Device token valid for deviceId={}", deviceId);
            return true;
        }
        log.debug("Device token invalid for deviceId={}", deviceId);
        return false;
    }
}
