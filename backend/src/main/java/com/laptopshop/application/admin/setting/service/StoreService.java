package com.laptopshop.application.admin.setting.service;

import com.laptopshop.application.admin.refund.dto.PageDto;
import com.laptopshop.application.admin.setting.dto.StoreCreateRequestDto;
import com.laptopshop.application.admin.setting.dto.StoreDetailDto;
import com.laptopshop.application.admin.setting.dto.StoreListDto;
import com.laptopshop.application.admin.setting.dto.StoreUpdateRequestDto;
import org.springframework.data.domain.Pageable;

public interface StoreService {
    PageDto<StoreListDto> searchStores(String q, String status, Pageable pageable);
    StoreDetailDto getStore(Long id);
    StoreDetailDto createStore(StoreCreateRequestDto req);
    StoreDetailDto updateStore(Long id, StoreUpdateRequestDto req);
    void changeStatus(Long id, String status);
    void deleteStore(Long id);
    byte[] exportStores(String status);
}
