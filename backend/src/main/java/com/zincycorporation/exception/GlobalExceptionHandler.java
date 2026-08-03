package com.zincycorporation.exception;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.server.ResponseStatusException;

import jakarta.servlet.http.HttpServletRequest;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger LOGGER =
            LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<Map<String, Object>> handleStatusException(
            ResponseStatusException exception,
            HttpServletRequest request) {
        return build(
                exception.getStatusCode().value(),
                exception.getReason() == null
                        ? "Request failed"
                        : exception.getReason(),
                request.getRequestURI());
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, Object>> handleBadRequest(
            IllegalArgumentException exception,
            HttpServletRequest request) {
        return build(
                HttpStatus.BAD_REQUEST.value(),
                exception.getMessage(),
                request.getRequestURI());
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> handleUnexpected(
            Exception exception,
            HttpServletRequest request) {
        LOGGER.error(
                "Unhandled API error for {}",
                request.getRequestURI(),
                exception);

        return build(
                HttpStatus.INTERNAL_SERVER_ERROR.value(),
                "An unexpected error occurred",
                request.getRequestURI());
    }

    private ResponseEntity<Map<String, Object>> build(
            int status,
            String message,
            String path) {
        HttpStatus httpStatus = HttpStatus.valueOf(status);

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("timestamp", Instant.now().toString());
        body.put("status", status);
        body.put("error", httpStatus.getReasonPhrase());
        body.put("message", message);
        body.put("path", path);

        return ResponseEntity.status(httpStatus).body(body);
    }
}
