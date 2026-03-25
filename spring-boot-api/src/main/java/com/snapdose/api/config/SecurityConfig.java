package com.snapdose.api.config;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

import com.snapdose.api.security.AuthenticationFilter;

/**
 * Spring Security configuration for Firebase and Device token authentication
 */
@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Autowired
    private AuthenticationFilter authenticationFilter;

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            // Disable CSRF since we're using tokens
            .csrf().disable()
            // Use stateless session management (no cookies)
            .sessionManagement().sessionCreationPolicy(SessionCreationPolicy.STATELESS)
            .and()
            // Configure authorization
            .authorizeHttpRequests()
                // Allow health check without authentication
                .requestMatchers("/api/health").permitAll()
                // Require authentication for all other /api endpoints
                .requestMatchers("/api/**").authenticated()
                // Deny everything else
                .anyRequest().denyAll()
            .and()
            // Add our custom authentication filter
            .addFilterBefore(authenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}
