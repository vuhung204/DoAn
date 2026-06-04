package com.laptopshop.application.customer.notification.service;

import com.laptopshop.application.customer.notification.dto.NotificationPageResponse;
import com.laptopshop.domain.notification.entity.Notification;
import com.laptopshop.domain.notification.repository.NotificationRepository;
import com.laptopshop.domain.user.entity.User;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository repo;

    // ── Core ──────────────────────────────────────────────────────────────────

    @Transactional
    public void push(Long userId, String type, String title, String body,
                     Long referenceId, String referenceType) {
        Notification n = new Notification();
        User u = new User();
        u.setId(userId);
        n.setUser(u);
        n.setType(type);
        n.setTitle(title);
        n.setBody(body);
        n.setReferenceId(referenceId);
        n.setReferenceType(referenceType);
        repo.save(n);
    }

    // ── Domain shortcuts ──────────────────────────────────────────────────────

    @Transactional
    public void pushOrderStatus(Long userId, String orderCode,
                                Long orderId, String newStatus) {
        // Không push PENDING vì user vừa tự tạo đơn — họ đã biết
        if ("PENDING".equalsIgnoreCase(newStatus)) return;

        push(userId,
                "ORDER_STATUS",
                buildOrderTitle(orderCode, newStatus),
                buildOrderBody(newStatus),
                orderId,
                "ORDER");
    }

    @Transactional
    public void pushReturnStatus(Long userId, Long returnId, String newStatus) {
        push(userId,
                "RETURN_STATUS",
                buildReturnTitle(newStatus),
                buildReturnBody(newStatus),
                returnId,
                "RETURN");
    }

    @Transactional
    public void pushRefundCompleted(Long userId, Long returnId,
                                    long amount, String method) {
        String fmt = String.format("%,d", amount).replace(",", ".");
        push(userId,
                "REFUND_COMPLETED",
                "Hoàn tiền thành công",
                String.format("Số tiền %sđ đã được hoàn qua %s.", fmt, method),
                returnId,
                "RETURN");
    }

    // ── Query ─────────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public NotificationPageResponse list(Long userId, Pageable pageable) {
        Page<Notification> page = repo.findByUser_IdOrderByCreatedAtDesc(userId, pageable);
        long unread = repo.countByUser_IdAndIsRead(userId, false);
        return NotificationPageResponse.of(page, unread);
    }

    @Transactional(readOnly = true)
    public long countUnread(Long userId) {
        return repo.countByUser_IdAndIsRead(userId, false);
    }

    @Transactional
    public void markAllRead(Long userId) {
        repo.markAllRead(userId);
    }

    @Transactional
    public void markOneRead(Long userId, Long notifId) {
        repo.markOneRead(notifId, userId);
    }

    // ── Message builders ──────────────────────────────────────────────────────

    private String buildOrderTitle(String code, String status) {
        return switch (status.toUpperCase()) {
            case "CONFIRMED"  -> "Đơn #" + code + " đã được xác nhận";
            case "PROCESSING" -> "Đơn #" + code + " đang được xử lý";
            case "SHIPPING"   -> "Đơn #" + code + " đang được giao";
            case "COMPLETED"  -> "Đơn #" + code + " đã giao thành công";
            case "CANCELLED"  -> "Đơn #" + code + " đã bị hủy";
            case "REFUNDED"   -> "Đơn #" + code + " đã được hoàn tiền";
            default           -> "Cập nhật đơn hàng #" + code;
        };
    }

    private String buildOrderBody(String status) {
        return switch (status.toUpperCase()) {
            case "CONFIRMED"  -> "Đơn hàng đã được xác nhận và sẽ sớm được xử lý.";
            case "PROCESSING" -> "Chúng tôi đang chuẩn bị hàng cho đơn của bạn.";
            case "SHIPPING"   -> "Đơn hàng đang trên đường giao đến bạn.";
            case "COMPLETED"  -> "Đơn hàng đã giao thành công. Cảm ơn bạn đã mua hàng!";
            case "CANCELLED"  -> "Đơn hàng đã bị hủy. Liên hệ hỗ trợ nếu cần thêm thông tin.";
            case "REFUNDED"   -> "Tiền hoàn trả sẽ được xử lý trong 3–5 ngày làm việc.";
            default           -> "Trạng thái đơn hàng của bạn đã được cập nhật.";
        };
    }

    private String buildReturnTitle(String status) {
        return switch (status.toUpperCase()) {
            case "APPROVED"  -> "Yêu cầu hoàn trả được duyệt";
            case "REJECTED"  -> "Yêu cầu hoàn trả bị từ chối";
            case "RECEIVED"  -> "Đã nhận hàng hoàn trả";
            case "CANCELLED" -> "Yêu cầu hoàn trả đã hủy";
            default          -> "Cập nhật yêu cầu hoàn trả";
        };
    }

    private String buildReturnBody(String status) {
        return switch (status.toUpperCase()) {
            case "APPROVED"  -> "Yêu cầu đã được duyệt. Vui lòng gửi hàng về địa chỉ cửa hàng.";
            case "REJECTED"  -> "Yêu cầu không đáp ứng điều kiện. Liên hệ hỗ trợ để biết thêm.";
            case "RECEIVED"  -> "Chúng tôi đã nhận hàng hoàn trả và đang xử lý hoàn tiền.";
            case "CANCELLED" -> "Yêu cầu hoàn trả đã được hủy.";
            default          -> "Yêu cầu hoàn trả của bạn đã được cập nhật.";
        };
    }

    // ── Warranty shortcuts ────────────────────────────────────────────────────────

    @Transactional
    public void pushWarrantyStatus(Long userId, Long warrantyId, String newStatus) {
        push(userId,
                "WARRANTY_STATUS",
                buildWarrantyTitle(newStatus),
                buildWarrantyBody(newStatus),
                warrantyId,
                "WARRANTY");
    }

// ── Payment shortcuts ─────────────────────────────────────────────────────────

    @Transactional
    public void pushPaymentSuccess(Long userId, Long orderId, String orderCode, long amount) {
        String fmt = String.format("%,d", amount).replace(",", ".");
        push(userId,
                "PAYMENT_SUCCESS",
                "Thanh toán thành công",
                String.format("Đơn hàng #%s đã được thanh toán %sđ.", orderCode, fmt),
                orderId,
                "ORDER");
    }

    @Transactional
    public void pushPaymentFailed(Long userId, Long orderId, String orderCode) {
        push(userId,
                "PAYMENT_FAILED",
                "Thanh toán thất bại",
                String.format("Thanh toán cho đơn hàng #%s không thành công. Vui lòng thử lại.", orderCode),
                orderId,
                "ORDER");
    }

// ── Message builders ──────────────────────────────────────────────────────────

    private String buildWarrantyTitle(String status) {
        return switch (status.toUpperCase()) {
            case "APPROVED"  -> "Yêu cầu bảo hành được duyệt";
            case "IN_REPAIR" -> "Máy đang được sửa chữa";
            case "COMPLETED" -> "Bảo hành hoàn tất";
            case "REJECTED"  -> "Yêu cầu bảo hành bị từ chối";
            case "CANCELLED" -> "Yêu cầu bảo hành đã hủy";
            default          -> "Cập nhật yêu cầu bảo hành";
        };
    }

    private String buildWarrantyBody(String status) {
        return switch (status.toUpperCase()) {
            case "APPROVED"  -> "Yêu cầu đã được duyệt. Vui lòng mang máy đến cửa hàng để được kiểm tra.";
            case "IN_REPAIR" -> "Máy của bạn đang được kỹ thuật viên sửa chữa. Chúng tôi sẽ thông báo khi hoàn tất.";
            case "COMPLETED" -> "Máy đã được sửa chữa xong. Vui lòng đến cửa hàng để nhận lại máy.";
            case "REJECTED"  -> "Yêu cầu không đủ điều kiện bảo hành. Liên hệ hỗ trợ để biết thêm chi tiết.";
            case "CANCELLED" -> "Yêu cầu bảo hành đã được hủy.";
            default          -> "Trạng thái yêu cầu bảo hành của bạn đã được cập nhật.";
        };
    }


}
