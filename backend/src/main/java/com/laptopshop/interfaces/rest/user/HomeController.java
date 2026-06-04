package com.laptopshop.interfaces.rest.user;

import com.laptopshop.application.customer.user.dto.HomePageDto;
import com.laptopshop.application.customer.user.service.HomeService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Public API – không cần JWT.
 * GET /api/home → trả về toàn bộ dữ liệu cần thiết cho homepage.
 */
@RestController
@RequestMapping("/api/home")
@RequiredArgsConstructor
public class HomeController {

    private final HomeService homeService;

    /**
     * Lấy dữ liệu homepage.
     * Response được cache phía server (caffeine/redis tùy config).
     *
     * @return HomePageDto chứa:
     *   - featuredProducts  (top bán chạy, 8 sp)
     *   - gamingProducts    (laptop-gaming, 8 sp)
     *   - officeProducts    (laptop-van-phong, 8 sp)
     *   - ultrabookProducts (laptop-mong-nhe, 8 sp)
     *   - categories        (danh mục root)
     *   - brands            (brand có sản phẩm)
     *   - totalProducts     (tổng số sp active)
     */
    @GetMapping
    public ResponseEntity<HomePageDto> getHomePage() {
        return ResponseEntity.ok(homeService.getHomePage());
    }
}
