package com.laptopshop.application.admin.product.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

/**
 * Thông số kỹ thuật sản phẩm — map 1-1 với ProductSpec entity.
 * Dùng cả request (CreateProduct/UpdateProduct) và response (ProductDetailDto).
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ProductSpecsDto {
    private String cpu;
    private String ram;
    private String storage;
    /** Màn hình — map entity field "display" */
    private String display;
    private String gpu;
    private String os;
    /** Cân nặng (kg) */
    private BigDecimal weightKg;
    /** Dung lượng pin (Wh) */
    private Integer batteryWh;
    /** Cổng kết nối, ví dụ: "USB-C, HDMI, USB-A x2" */
    private String ports;
    private String color;
}
