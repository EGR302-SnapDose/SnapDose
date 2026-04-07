package com.snapdose.api.model;

import java.util.Map;

public class ValidationErrorResponse {

    private String error;
    private Map<String, String> fields;
    private long timestamp;

    public ValidationErrorResponse(String error, Map<String, String> fields) {
        this.error = error;
        this.fields = fields;
        this.timestamp = System.currentTimeMillis();
    }

    public String getError() { return error; }
    public void setError(String error) { this.error = error; }

    public Map<String, String> getFields() { return fields; }
    public void setFields(Map<String, String> fields) { this.fields = fields; }

    public long getTimestamp() { return timestamp; }
    public void setTimestamp(long timestamp) { this.timestamp = timestamp; }
}