package com.laptopshop.application.admin.setting.service;

import com.laptopshop.application.admin.refund.dto.PageDto;
import com.laptopshop.application.admin.setting.dto.StaffCreateRequestDto;
import com.laptopshop.application.admin.setting.dto.StaffDetailDto;
import com.laptopshop.application.admin.setting.dto.StaffListDto;
import com.laptopshop.application.admin.setting.dto.StaffUpdateRequestDto;
import org.springframework.data.domain.Pageable;

public interface StaffService {
    PageDto<StaffListDto> searchStaff(String q, Long storeId, String role,
                                      String status, Pageable pageable);
    StaffDetailDto getStaff(Long id);
    StaffDetailDto createStaff(StaffCreateRequestDto req);
    StaffDetailDto updateStaff(Long id, StaffUpdateRequestDto req);
    void changeStatus(Long id, String status);
    void deleteStaff(Long id);
    void resetPassword(Long id, boolean sendEmail);
    byte[] exportStaff(Long storeId, String role, String status);
}