package com.laptopshop.domain.catalog.repository;

import com.laptopshop.domain.catalog.entity.ProductSpec;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ProductSpecRepository extends JpaRepository<ProductSpec, Long> {

    Optional<ProductSpec> findByProductId(Long productId);
}