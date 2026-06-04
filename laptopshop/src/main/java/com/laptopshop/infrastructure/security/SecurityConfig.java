package com.laptopshop.infrastructure.security;

import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfigurationSource;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthFilter jwtAuthFilter;
    private final CorsConfigurationSource corsConfigurationSource;

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                .cors(cors -> cors.configurationSource(corsConfigurationSource))
                .csrf(csrf -> csrf.disable())
                .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .exceptionHandling(ex -> ex
                        .authenticationEntryPoint((req, res, ex2) -> {
                            res.setContentType("application/json;charset=UTF-8");
                            res.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                            res.getWriter().write("{\"error\": \"Chua xac thuc\"}");
                        })
                        .accessDeniedHandler((req, res, ex2) -> {
                            res.setContentType("application/json;charset=UTF-8");
                            res.setStatus(HttpServletResponse.SC_FORBIDDEN);
                            res.getWriter().write("{\"error\": \"Khong co quyen truy cap\"}");
                        })
                )
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                        .requestMatchers("/api/auth/**").permitAll()
                        .requestMatchers("/api/admin/auth/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/products/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/brands").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/categories").permitAll()
                        .requestMatchers("/api/payment/vnpay/callback").permitAll()
                        .requestMatchers("/api/payment/momo/callback").permitAll()
                        .requestMatchers("/api/payment/momo/notify").permitAll()
                        .requestMatchers("/api/home").permitAll()
                        .requestMatchers("/api/admin/staff/**").hasRole("SUPER_ADMIN")
                        .requestMatchers("/api/admin/products/**").hasRole("SUPER_ADMIN")
                        .requestMatchers("/api/admin/categories/**").hasRole("SUPER_ADMIN")
                        .requestMatchers("/api/admin/brands/**").hasRole("SUPER_ADMIN")
                        .requestMatchers("/api/admin/customers/**").hasRole("SUPER_ADMIN")
                        .requestMatchers("/api/admin/reviews/**").hasRole("SUPER_ADMIN")
                        .requestMatchers("/api/admin/promotions/**").hasRole("SUPER_ADMIN")
                        .requestMatchers("/api/admin/reports/**").hasAnyRole("SUPER_ADMIN", "STORE_MANAGER")
                        .requestMatchers("/api/admin/orders/**").hasAnyRole("SUPER_ADMIN", "STORE_MANAGER", "SALES_STAFF")
                        .requestMatchers("/api/admin/refunds/**").hasAnyRole("SUPER_ADMIN", "STORE_MANAGER", "SALES_STAFF")
                        .requestMatchers("/api/admin/warranty/**").hasAnyRole("SUPER_ADMIN", "STORE_MANAGER", "SALES_STAFF")
                        .requestMatchers(HttpMethod.GET, "/api/admin/inventory/**").hasAnyRole("SUPER_ADMIN", "STORE_MANAGER", "SALES_STAFF")
                        .requestMatchers("/api/admin/inventory/**").hasAnyRole("SUPER_ADMIN", "STORE_MANAGER")
                        .requestMatchers("/api/admin/**").hasAnyRole("SUPER_ADMIN", "STORE_MANAGER", "SALES_STAFF")
                        .requestMatchers("/api/cart/**").authenticated()
                        .requestMatchers("/api/orders/**").authenticated()
                        .requestMatchers("/api/wishlist/**").authenticated()
                        .requestMatchers("/api/user/**").authenticated()
                        .requestMatchers("/api/payment/**").authenticated()
                        .requestMatchers("/api/reviews/**").authenticated()
                        .requestMatchers("/api/warranty/**").authenticated()
                        .requestMatchers("/api/v1/returns/**").authenticated()
                        .requestMatchers("/api/notifications/**").authenticated()
                        .requestMatchers("/uploads/**").permitAll()
                        .anyRequest().authenticated()
                )
                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationManager authenticationManager(
            AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }
}