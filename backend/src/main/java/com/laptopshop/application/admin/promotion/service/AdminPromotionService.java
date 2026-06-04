package com.laptopshop.application.admin.promotion.service;

import com.laptopshop.application.admin.promotion.dto.*;
import com.laptopshop.application.admin.refund.dto.PageDto;
import org.springframework.data.domain.Pageable;

import java.time.LocalDateTime;

public interface AdminPromotionService {

    PageDto<PromotionListDto> searchPromotions(String q, String status, String type,
                                               LocalDateTime from, LocalDateTime to,
                                               Pageable pageable);

    PromotionDetailDto getPromotion(Long id);

    PromotionDetailDto createPromotion(PromotionCreateRequestDto dto, String createdBy);

    PromotionDetailDto updatePromotion(Long id, PromotionUpdateRequestDto dto);

    void changeStatus(Long id, String status);

    void deletePromotion(Long id);

    void assignProducts(Long id, PromotionProductAssignRequestDto dto);

    PromotionValidateResponseDto validateCode(String code, Long excludeId);

    byte[] exportPromotions(ExportPromotionsRequestDto req);

    /** Tăng used_count nguyên tử. Trả false nếu đã hết quota. */
    boolean incrementUsedCountIfAllowed(Long id, int delta);
}
