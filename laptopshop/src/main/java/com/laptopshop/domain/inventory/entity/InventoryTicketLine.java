package com.laptopshop.domain.inventory.entity;

import com.laptopshop.domain.catalog.entity.Product;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Table(
        name = "inventory_ticket_lines",
        indexes = {
                @Index(name = "idx_ticketline_ticket",  columnList = "ticket_id"),
                @Index(name = "idx_ticketline_product", columnList = "product_id")
        }
)
@Entity
@Getter
@Setter
public class InventoryTicketLine {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "line_id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ticket_id", nullable = false,
            foreignKey = @ForeignKey(name = "fk_ticketline_ticket"))
    private InventoryTicket ticket;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false,
            foreignKey = @ForeignKey(name = "fk_ticketline_product"))
    private Product product;

    @Column(nullable = false)
    private Integer quantity;

    /**
     * Đơn giá nhập/xuất. Nếu null → fallback về product.basePrice khi tính value.
     */
    @Column(name = "unit_price", precision = 15, scale = 0)
    private BigDecimal unitPrice;

    @Column(name = "line_total", precision = 15, scale = 0)
    private BigDecimal lineTotal;
}
