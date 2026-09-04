package com.openclassrooms.etudiant.servlet;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.springframework.http.HttpStatus;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingRequestValueException;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.servlet.resource.NoResourceFoundException;

@ControllerAdvice
public class GlobalExceptionHandler {

    private final HttpServletRequest _request;
    private final HttpServletResponse _response;

    private static final Logger LOGGER = LogManager.getLogger();

    public GlobalExceptionHandler(HttpServletRequest request, HttpServletResponse response) {
        _request = request;
        _response = response;
    }

    private void _process(ResponseStatusException e) {
        try {
            e.getHeaders().forEach((t, l) -> l.forEach(s -> _response.setHeader(t, s)));
            int status = e.getStatusCode().value();
            _response.setStatus(status);
            _response.setContentType("text/plain");
            _response.getWriter().write(
                status + ": " + e.getBody().getTitle()
                + "\n" + e.getReason()
            );
        }
        catch (Exception new_e) {
            LOGGER.error(new_e);
        }
    }

    private void _process(Exception e, HttpStatus status) {
        _process(new ResponseStatusException(status, e.getMessage()));
    }

    @ExceptionHandler(ResponseStatusException.class)
    public void handleGeneralException(ResponseStatusException e) {
        _process(e);
    }

    @ExceptionHandler(NoResourceFoundException.class)
    public void handleNoResourceFoundException(NoResourceFoundException e) {
        _process(e, HttpStatus.NOT_FOUND);
    }

    @ExceptionHandler(HttpRequestMethodNotSupportedException.class)
    public void handleHttpRequestMethodNotSupportedException(HttpRequestMethodNotSupportedException e) {
        _process(e, HttpStatus.METHOD_NOT_ALLOWED);
        // These requests aren't processed by the request interceptor, force log
        RequestInterceptor.logRequestResponse(LOGGER, _request, _response);
    }

    @ExceptionHandler(MissingRequestValueException.class)
    public void handleBadRequest(MissingRequestValueException e) {
        _process(e, HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public void handleHttpMessageNotReadableException(HttpMessageNotReadableException e) {
        _process(e, HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public void handleMethodArgumentNotValidException(MethodArgumentNotValidException e) {
        _process(e, HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(Exception.class)
    public void handleOtherException(Exception e) {
        LOGGER.debug("Unhandled exception type: {}", e.getClass());
        _process(e, HttpStatus.INTERNAL_SERVER_ERROR);
    }
}
