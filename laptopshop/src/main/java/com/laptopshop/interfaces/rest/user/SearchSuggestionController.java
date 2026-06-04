package com.laptopshop.interfaces.rest.user;

import com.laptopshop.application.customer.catalog.dto.SearchSuggestionResponse;
import com.laptopshop.application.customer.catalog.service.SearchSuggestionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequiredArgsConstructor
public class SearchSuggestionController {

    private final SearchSuggestionService searchSuggestionService;

    /**
     * GET /api/products/suggestions?q=dell&limit=8
     * Public — không cần JWT (đã có rule permitAll cho GET /api/products/**)
     *
     * Trả về tối đa `limit` gợi ý sản phẩm khớp với keyword.
     */
    @GetMapping("/api/products/suggestions")
    public ResponseEntity<List<SearchSuggestionResponse>> getSuggestions(
            @RequestParam(name = "q", defaultValue = "") String q,
            @RequestParam(defaultValue = "8") int limit) {

        if (q.isBlank() || q.length() < 1) {
            return ResponseEntity.ok(List.of());
        }

        return ResponseEntity.ok(searchSuggestionService.suggest(q.trim(), limit));
    }
}
