package com.laptopshop.interfaces.rest.user;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.*;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/admin/upload")
@RequiredArgsConstructor
public class UploadController {

    @Value("${upload.dir:uploads/}")
    private String uploadDir;

//    @Value("${server.host:http://127.0.0.1:9765}")
//    private String serverHost;

    @Value("${server.host}")
    private String serverHost;

    @PostMapping("/image")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','STORE_MANAGER')")
    public ResponseEntity<Map<String, String>> uploadImage(
            @RequestParam("file") MultipartFile file) throws IOException {

        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "File rỗng"));
        }

        String original = file.getOriginalFilename();
        String ext = (original != null && original.contains("."))
                ? original.substring(original.lastIndexOf('.'))
                : ".jpg";
        String filename = UUID.randomUUID() + ext;

        Path dir  = Paths.get(uploadDir);
        Path dest = dir.resolve(filename);
        Files.createDirectories(dir);
        Files.write(dest, file.getBytes());

        String url = serverHost + "/uploads/" + filename;
        return ResponseEntity.ok(Map.of("url", url));
    }
}