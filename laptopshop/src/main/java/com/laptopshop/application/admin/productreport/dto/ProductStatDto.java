package com.laptopshop.application.admin.productreport.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.math.BigDecimal;

/**
 * Một stat card trên trang Product Report.
 * Ví dụ: label="Tổng sản phẩm", formattedValue="248", value=248
 */
@Getter
@AllArgsConstructor
public class ProductStatDto {
    private String label;
    /** Giá trị đã format để hiển thị trực tiếp */
    private String formattedValue;
    /** Giá trị thô (count hoặc VND) */
    private BigDecimal value;
}
