package com.snapdose.api.model;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class BasalConfigRequest {

    @NotBlank(message = "deviceId is required")
    private String deviceId;

    @NotNull(message = "rateUnitsPerHour is required")
    @DecimalMin(value = "0.05", message = "Minimum basal rate is 0.05 U/hr")
    @DecimalMax(value = "30.0", message = "Maximum basal rate is 30.0 U/hr")
    private Double rateUnitsPerHour;

    @NotNull(message = "active is required")
    private Boolean active;

    public BasalConfigRequest() {}

    public String getDeviceId() {
        return deviceId;
    }

    public void setDeviceId(String deviceId) {
        this.deviceId = deviceId;
    }

    public Double getRateUnitsPerHour() {
        return rateUnitsPerHour;
    }

    public void setRateUnitsPerHour(Double rateUnitsPerHour) {
        this.rateUnitsPerHour = rateUnitsPerHour;
    }

    public Boolean getActive() {
        return active;
    }

    public void setActive(Boolean active) {
        this.active = active;
    }
}
