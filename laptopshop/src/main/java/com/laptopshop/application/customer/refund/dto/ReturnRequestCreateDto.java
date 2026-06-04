package com.laptopshop.application.customer.refund.dto;

import jakarta.validation.constraints.*;
import lombok.Data;
import java.util.List;

@Data
public class ReturnRequestCreateDto {

    @NotNull
    private Long orderId;

    @NotBlank
    private String reason;

    @NotEmpty
    private List<ReturnItemDto> items;

    @Data
    public static class ReturnItemDto {
        @NotNull
        private Long orderItemId;

        @Min(1)
        private Integer quantity;

        private String reason; // lý do riêng từng sản phẩm (optional)
    }
}
