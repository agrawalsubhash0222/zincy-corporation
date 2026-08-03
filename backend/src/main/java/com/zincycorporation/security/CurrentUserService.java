package com.zincycorporation.security;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;
import org.springframework.web.server.ResponseStatusException;

import com.zincycorporation.entity.Users;

@Service
public class CurrentUserService {

    public Users requireUser() {
        if (!(RequestContextHolder.getRequestAttributes()
                instanceof ServletRequestAttributes attributes)) {
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "Authentication is required");
        }

        Object value = attributes.getRequest()
                .getAttribute(ApiAuthInterceptor.AUTHENTICATED_USER_ATTRIBUTE);

        if (!(value instanceof Users user)) {
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "Authentication is required");
        }

        return user;
    }

    public boolean isAdmin() {
        String role = requireUser().getRole();
        return role != null && role.equalsIgnoreCase("ADMIN");
    }
}
