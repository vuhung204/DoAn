package com.laptopshop.application.customer.catalog.service;

import com.laptopshop.application.customer.catalog.dto.SearchSuggestionResponse;
import com.laptopshop.domain.catalog.repository.SearchSuggestionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class SearchSuggestionService {

    private final SearchSuggestionRepository repo;

    public List<SearchSuggestionResponse> suggest(String q, int limit) {
        return repo.findSuggestions(q, Math.min(limit, 10))
                .stream()
                .map(r -> SearchSuggestionResponse.builder()
                        .id(toLong(r[0]))
                        .name(str(r[1]))
                        .slug(str(r[2]))
                        .brandName(str(r[3]))
                        .categoryName(str(r[4]))
                        .price(toBD(r[5]))
                        .imageUrl(str(r[6]))
                        .build())
                .toList();
    }

    private static String str(Object o) { return o == null ? null : o.toString(); }

    private static Long toLong(Object o) {
        if (o == null) return null;
        if (o instanceof Number n) return n.longValue();
        return Long.parseLong(o.toString());
    }

    private static BigDecimal toBD(Object o) {
        if (o == null) return BigDecimal.ZERO;
        if (o instanceof BigDecimal bd) return bd;
        if (o instanceof Number n) return BigDecimal.valueOf(n.longValue());
        return new BigDecimal(o.toString());
    }
}
