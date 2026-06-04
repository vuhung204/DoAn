package com.laptopshop.domain.refund.entity;

import com.laptopshop.domain.store.entity.Staff;
import com.laptopshop.domain.refund.enums.ReturnStatus;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Table(
        name = "refund_audit",
        indexes = {
                @Index(name = "idx_raudit_return", columnList = "return_id"),
                @Index(name = "idx_raudit_created", columnList = "created_at")
        }
)
@Entity
@Getter
@Setter
public class RefundAudit {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "audit_id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "return_id", nullable = false,
            foreignKey = @ForeignKey(name = "fk_raudit_return"))
    private ReturnRequest returnRequest;

    /** Trạng thái trước khi thao tác. */
    @Enumerated(EnumType.STRING)
    @Column(name = "old_status", length = 20)
    private ReturnStatus oldStatus;

    /** Trạng thái sau khi thao tác. */
    @Enumerated(EnumType.STRING)
    @Column(name = "new_status", nullable = false, length = 20)
    private ReturnStatus newStatus;

    /** Staff thực hiện thao tác. Null nếu do hệ thống. */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "staff_id",
            foreignKey = @ForeignKey(name = "fk_raudit_staff"))
    private Staff staff;

    @Column(length = 1000)
    private String note;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }
}