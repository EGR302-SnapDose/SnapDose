package com.snapdose.api.security;

import java.io.IOException;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseAuthException;
import com.snapdose.api.config.DeviceTokenProperties;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

/**
 * Authentication filter that validates both Firebase ID tokens and device tokens
 * - Firebase tokens come from mobile app via "Authorization: Bearer {idToken}" header
 * - Device tokens come from M5Stack via "X-Device-Token: {token}" header
 */
@Component
public class AuthenticationFilter extends OncePerRequestFilter {

    @Autowired
    private DeviceTokenProperties deviceTokenProperties;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain) 
            throws ServletException, IOException {
        
        String authHeader = request.getHeader("Authorization");
        String deviceToken = request.getHeader("X-Device-Token");
        String deviceId = request.getHeader("X-Device-Id");

        // Try Firebase ID token first (from Authorization header)
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7);
            if (validateFirebaseToken(token)) {
                filterChain.doFilter(request, response);
                return;
            }
        }

        // Try device token (from X-Device-Token header)
        if (deviceToken != null && deviceId != null) {
            if (validateDeviceToken(deviceId, deviceToken)) {
                filterChain.doFilter(request, response);
                return;
            }
        }

        // If no valid authentication found, reject
        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        response.setContentType("application/json");
        response.getWriter().write("{\"error\": \"Unauthorized\", \"message\": \"Invalid or missing authentication token\"}");
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) throws ServletException {
        // Skip authentication filter for health endpoint
        String path = request.getRequestURI();
        return path.equals("/api/health");
    }

    /**
     * Validates Firebase ID token using Firebase Admin SDK
     */
    private boolean validateFirebaseToken(String idToken) {
        try {
            var decodedToken = FirebaseAuth.getInstance().verifyIdToken(idToken);
            String uid = decodedToken.getUid();
            
            // Create authenticated token and store in security context
            FirebaseAuthenticationToken authToken = new FirebaseAuthenticationToken(idToken, uid);
            authToken.setAuthenticated(true);
            SecurityContextHolder.getContext().setAuthentication(authToken);
            
            return true;
        } catch (FirebaseAuthException e) {
            // Token verification failed
            return false;
        }
    }

    /**
     * Validates device token for M5Stack/firmware
     */
    private boolean validateDeviceToken(String deviceId, String token) {
        System.out.println("DEBUG: Validating device token. deviceId=" + deviceId + ", token=" + token);
        System.out.println("DEBUG: Available devices: " + deviceTokenProperties.getDevices());
        
        if (deviceTokenProperties.isValidDeviceToken(deviceId, token)) {
            // Create authenticated token and store in security context
            DeviceAuthenticationToken authToken = new DeviceAuthenticationToken(deviceId, token);
            authToken.setAuthenticated(true);
            SecurityContextHolder.getContext().setAuthentication(authToken);
            
            System.out.println("DEBUG: Device token validated successfully for " + deviceId);
            return true;
        }
        System.out.println("DEBUG: Device token validation failed for " + deviceId);
        return false;
    }
}
