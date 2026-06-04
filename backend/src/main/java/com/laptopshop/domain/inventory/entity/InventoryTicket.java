package com.laptopshop.domain.inventory.entity;

import com.laptopshop.domain.inventory.enums.InventoryTicketType;
import com.laptopshop.domain.inventory.enums.InventoryTicketStatus;
import com.laptopshop.domain.store.entity.Staff;
import com.laptopshop.domain.store.entity.Store;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Table(
        name = "inventory_tickets",
        indexes = {
                @Index(name = "idx_ticket_type",       columnList = "ticket_type"),
                @Index(name = "idx_ticket_from_store", columnList = "from_store_id"),
                @Index(name = "idx_ticket_to_store",   columnList = "to_store_id"),
                @Index(name = "idx_ticket_status",     columnList = "status"),
                @Index(name = "idx_ticket_created",    columnList = "created_at")
        }
)
@Entity
@Getter
@Setter
public class InventoryTicket {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ticket_id")
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(name = "ticket_type", nullable = false, length = 20)
    private InventoryTicketType ticketType;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private InventoryTicketStatus status = InventoryTicketStatus.COMPLETED;

    /** Chi nhánh xuất hàng (null khi IMPORT). */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "from_store_id",
            foreignKey = @ForeignKey(name = "fk_ticket_from_store"))
    private Store fromStore;

    /** Chi nhánh nhận hàng (null khi EXPORT). */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "to_store_id",
            foreignKey = @ForeignKey(name = "fk_ticket_to_store"))
    private Store toStore;

    /**
     * Nhà cung cấp (dùng cho IMPORT).
     * Chưa có Supplier entity → lưu tên dạng free-text.
     */
    @Column(name = "supplier", length = 200)
    private String supplier;

    /** Lý do xuất kho (dùng cho EXPORT). */
    @Column(name = "reason", columnDefinition = "TEXT")
    private String reason;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by",
            foreignKey = @ForeignKey(name = "fk_ticket_staff"))
    private Staff createdBy;

    @Column(name = "note", columnDefinition = "TEXT")
    private String note;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "processed_at")
    private LocalDateTime processedAt;

    @OneToMany(mappedBy = "ticket", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<InventoryTicketLine> lines = new ArrayList<>();

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }
}
