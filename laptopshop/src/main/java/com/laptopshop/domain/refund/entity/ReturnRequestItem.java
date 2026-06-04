package com.laptopshop.domain.refund.entity;


import com.laptopshop.domain.order.entity.OrderItem;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Table(
        name = "return_request_items",
        indexes = {
                @Index(name = "idx_rri_return",     columnList = "return_id"),
                @Index(name = "idx_rri_order_item", columnList = "order_item_id")
        }
)
@Entity
@Getter
@Setter
public class ReturnRequestItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "rri_id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "return_id", nullable = false,
            foreignKey = @ForeignKey(name = "fk_rri_return"))
    private ReturnRequest returnRequest;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_item_id", nullable = false,
            foreignKey = @ForeignKey(name = "fk_rri_order_item"))
    private OrderItem orderItem;

    @Column(nullable = false)
    private Integer quantity = 1;

    /** Lý do hoàn trả riêng cho sản phẩm này (optional). */
    @Column(columnDefinition = "TEXT")
    private String reason;

    /** Số tiền hoàn tương ứng với sản phẩm này. */
    @Column(name = "refund_amount", precision = 15, scale = 0)
    private BigDecimal refundAmount;

    @Column(name = "condition_note", length = 500)
    private String conditionNote;
}
