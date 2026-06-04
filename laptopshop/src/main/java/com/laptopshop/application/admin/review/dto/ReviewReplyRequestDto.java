package com.laptopshop.application.admin.review.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Request body cho POST /admin/reviews/{id}/reply.
 */
@Getter
@Setter
@NoArgsConstructor
public class ReviewReplyRequestDto {
    @NotBlank(message = "replyText không được để trống")
    @Size(max = 2000, message = "replyText tối đa 2000 ký tự")
    private String replyText;
}