# 📋 Hướng Dẫn Cài Đặt Laptop Store Application

## 📌 Mục Lục
- [Yêu Cầu Hệ Thống](#yêu-cầu-hệ-thống)
- [Cài Đặt Database](#cài-đặt-database-mysql)
- [Cài Đặt Backend](#cài-đặt-backend)
- [Cài Đặt Frontend](#cài-đặt-frontend)
- [Chạy Ứng Dụng](#chạy-ứng-dụng)
- [Troubleshooting](#troubleshooting)

---

## 🖥️ Yêu Cầu Hệ Thống

### Bảng Công Nghệ & Phiên Bản

| Công Nghệ | Phiên Bản | Loại | Ghi Chú |
|-----------|----------|------|--------|
| **Java JDK** | 17+ | Backend | Bắt buộc cho Backend |
| **Spring Boot** | 3.5.13 | Backend | Framework chính |
| **Maven** | 3.8+ | Build Tool | Quản lý dependencies Backend |
| **Node.js** | 18+ (LTS) | Frontend | Bắt buộc cho Frontend |
| **npm** | 9+ | Package Manager | Đi kèm Node.js |
| **MySQL Server** | 8.0.43+ | Database | CSDL chính |
| **MySQL Workbench** (optional) | Mới nhất | Tool | GUI cho MySQL |
| **Git** (optional) | Mới nhất | Version Control | Clone project |

### Yêu Cầu Phần Cứng

- **RAM**: Tối thiểu 4GB (khuyến nghị 8GB+)
- **Ổ cứng**: Tối thiểu 2GB dung lượng trống
- **OS**: Windows, macOS, hoặc Linux

### Port Sử Dụng

| Ứng Dụng | Port | Mục Đích |
|----------|------|---------|
| Backend (Spring Boot) | 8080 | API Server |
| Frontend (Vite Dev) | 5173 | Development Server |
| MySQL Server | 3306 | Database Server |

---

## 🗄️ Cài Đặt Database (MySQL)

### Bước 1: Cài Đặt MySQL Server

#### Trên Windows:

1. **Tải MySQL Server 8.0**
   - Truy cập: https://dev.mysql.com/downloads/mysql/
   - Chọn "Windows (x86, 64-bit)" → MySQL Server 8.0.43 MSI Installer
   - Tải file và chạy installer

2. **Chạy MySQL Installer**
   - Nhấp đúp vào file `mysql-installer-community-8.0.43.msi`
   - Chọn "Setup Type" → "Server only" hoặc "Full"
   - Click "Next" để tiếp tục
   - Chọn "MySQL Server 8.0.43" và cài đặt
   - Cấu hình MySQL Service:
     - **Config Type**: Development Machine
     - **MySQL Port**: 3306 (mặc định)
     - **MySQL User**: root
     - **Password**: Đặt mật khẩu mạnh (ghi nhớ!)

3. **Kiểm tra cài đặt**
   ```bash
   # Mở Command Prompt/PowerShell
   mysql --version
   # Kết quả: mysql  Ver 8.0.43 for Win64
   ```

#### Trên macOS:

```bash
# Sử dụng Homebrew (khuyến nghị)
brew install mysql@8.0
brew services start mysql@8.0
mysql -u root
```

#### Trên Linux (Ubuntu/Debian):

```bash
sudo apt-get update
sudo apt-get install mysql-server-8.0
sudo mysql_secure_installation  # Cấu hình bảo mật
```

### Bước 2: Tạo Database & Import Data

1. **Kết nối vào MySQL**
   ```bash
   mysql -u root -p
   # Nhập mật khẩu khi được yêu cầu
   ```

2. **Tạo Database**
   ```sql
   CREATE DATABASE laptop_store CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```

3. **Import dữ liệu từ file SQL**
   ```bash
   # Thoát MySQL trước (gõ: exit)
   
   # Sau đó chạy lệnh import (từ thư mục chứa file laptop_store.sql)
   mysql -u root -p laptop_store < laptop_store.sql
   ```

4. **Xác nhận import thành công**
   ```bash
   mysql -u root -p
   USE laptop_store;
   SHOW TABLES;
   # Sẽ hiển thị danh sách các bảng
   ```

### Bước 3: Cấu Hình MySQL Connection (tùy chọn)

Nếu muốn đổi mật khẩu root hoặc tạo user mới:

```sql
-- Tạo user mới cho ứng dụng
CREATE USER 'laptopshop'@'localhost' IDENTIFIED BY 'your_password_here';
GRANT ALL PRIVILEGES ON laptop_store.* TO 'laptopshop'@'localhost';
FLUSH PRIVILEGES;
```

---

## 🔧 Cài Đặt Backend (Spring Boot + Java)

### Bước 1: Cài Đặt Java JDK 17

#### Trên Windows:

1. **Tải JDK 17**
   - Truy cập: https://www.oracle.com/java/technologies/downloads/
   - Chọn "JDK 17" → Windows x64 Installer
   - Tải và chạy file `jdk-17_windows-x64_bin.exe`

2. **Cài Đặt JDK**
   - Click "Next" để tiếp tục qua các bước
   - Chọn thư mục cài đặt (ví dụ: `C:\Program Files\Java\jdk-17`)
   - Hoàn thành cài đặt

3. **Thiết Lập Environment Variables**
   - Mở "System Properties" → "Environment Variables"
   - Thêm biến mới:
     - **Variable name**: `JAVA_HOME`
     - **Variable value**: `C:\Program Files\Java\jdk-17`
   - Thêm vào PATH: `%JAVA_HOME%\bin`

4. **Kiểm tra cài đặt**
   ```bash
   java -version
   # Kết quả: openjdk version "17..." (hoặc Oracle JDK 17...)
   ```

#### Trên macOS:

```bash
brew tap homebrew/cask-versions
brew cask install java17
```

#### Trên Linux:

```bash
sudo apt-get install openjdk-17-jdk
```

### Bước 2: Cài Đặt Maven

#### Trên Windows:

1. **Tải Maven**
   - Truy cập: https://maven.apache.org/download.cgi
   - Tải "apache-maven-3.8.6-bin.zip" (hoặc version mới hơn)

2. **Giải nén Maven**
   - Giải nén vào thư mục, ví dụ: `C:\apache-maven-3.8.6`

3. **Thiết Lập Environment Variables**
   - Thêm biến mới:
     - **Variable name**: `MAVEN_HOME`
     - **Variable value**: `C:\apache-maven-3.8.6`
   - Thêm vào PATH: `%MAVEN_HOME%\bin`

4. **Kiểm tra cài đặt**
   ```bash
   mvn -version
   # Kết quả: Apache Maven 3.8.6 ...
   ```

#### Trên macOS/Linux:

```bash
# macOS
brew install maven

# Linux
sudo apt-get install maven
```

### Bước 3: Cài Đặt & Chạy Backend

1. **Mở Command Prompt/Terminal tại thư mục `backend`**
   ```bash
   cd backend
   ```

2. **Tải Dependencies & Build Project**
   ```bash
   mvn clean install
   # Lần đầu sẽ tải khoảng 500MB+ dependencies
   ```

3. **Cấu Hình Database Connection**
   - Mở file: `backend/src/main/resources/application.properties`
   - Kiểm tra/cập nhật các thông tin kết nối:
   ```properties
   spring.datasource.url=jdbc:mysql://localhost:3306/laptop_store?useSSL=false&serverTimezone=UTC&allowPublicKeyRetrieval=true
   spring.datasource.username=root
   spring.datasource.password=<your_mysql_password>
   spring.datasource.driver-class-name=com.mysql.cj.jdbc.Driver
   spring.jpa.hibernate.ddl-auto=update
   ```

4. **Chạy Backend**
   ```bash
   mvn spring-boot:run
   # Hoặc chạy từ file JAR sau khi build
   java -jar target/laptopshop-0.0.1-SNAPSHOT.jar
   ```

5. **Kiểm tra Backend chạy thành công**
   - Truy cập: http://localhost:8080
   - Hoặc kiểm tra API: http://localhost:8080/api/health

---

## ⚛️ Cài Đặt Frontend (React + Vite)

### Bước 1: Cài Đặt Node.js & npm

#### Trên Windows:

1. **Tải Node.js LTS**
   - Truy cập: https://nodejs.org/
   - Tải "LTS version" (18.x hoặc mới hơn)
   - Chạy file `node-vX.X.X-x64.msi`

2. **Cài Đặt Node.js**
   - Click "Next" để tiếp tục
   - Tick "Automatically install tools for native modules" (tùy chọn)
   - Hoàn thành cài đặt

3. **Kiểm tra cài đặt**
   ```bash
   node --version    # v18.x.x
   npm --version     # 9.x.x
   ```

#### Trên macOS:

```bash
brew install node
node --version
npm --version
```

#### Trên Linux:

```bash
sudo apt-get install nodejs npm
```

### Bước 2: Cài Đặt Frontend Dependencies

1. **Mở Command Prompt/Terminal tại thư mục `frontend`**
   ```bash
   cd frontend
   ```

2. **Cài Đặt Dependencies**
   ```bash
   npm install
   # Hoặc nếu muốn dùng yarn:
   yarn install
   ```

3. **Cấu Hình API Backend URL**
   - Các file API thường ở: `frontend/src/app/admin/api/`
   - Kiểm tra file gọi API (ví dụ: `productApi.ts`)
   - Cập nhật URL Backend nếu cần:
   ```typescript
   const API_BASE_URL = 'http://localhost:8080/api';
   // hoặc
   const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080/api';
   ```

### Bước 3: Chạy Frontend Development Server

1. **Chạy Dev Server**
   ```bash
   npm run dev
   # Hoặc
   yarn dev
   ```

2. **Truy cập ứng dụng**
   - Mở browser vào: `http://localhost:5173`
   - Frontend sẽ tự động reload khi bạn sửa code

### Bước 4: Build Frontend cho Production (tùy chọn)

```bash
npm run build
# Hoặc
yarn build

# Output sẽ ở thư mục: dist/
```

---

## 🚀 Chạy Ứng Dụng Hoàn Chỉnh

### Lần Đầu Tiên

1. **Bật MySQL Server**
   ```bash
   # Windows (nếu được cài dưới dạng Service)
   net start MySQL80
   
   # Hoặc macOS
   brew services start mysql@8.0
   ```

2. **Chạy Backend** (mở terminal thứ nhất)
   ```bash
   cd backend
   mvn spring-boot:run
   # Chờ đến khi thấy "Started LaptopShopApplication in ..."
   ```

3. **Chạy Frontend** (mở terminal thứ hai)
   ```bash
   cd frontend
   npm run dev
   # Chờ đến khi thấy "Local: http://localhost:5173"
   ```

4. **Truy cập ứng dụng**
   - Giao diện: http://localhost:5173
   - API Backend: http://localhost:8080/api

### Tắt Ứng Dụng

- **Frontend**: Nhấn `Ctrl+C` trong terminal
- **Backend**: Nhấn `Ctrl+C` trong terminal
- **MySQL**: 
  ```bash
  # Windows
  net stop MySQL80
  
  # macOS
  brew services stop mysql@8.0
  ```

---

## 🔧 Troubleshooting

### ❌ Lỗi: "Java version mismatch"
**Giải pháp:**
```bash
# Kiểm tra Java version
java -version

# Nếu không phải Java 17, cài lại hoặc đổi JAVA_HOME
set JAVA_HOME=C:\Program Files\Java\jdk-17
```

### ❌ Lỗi: "MySQL: Access denied for user 'root'@'localhost'"
**Giải pháp:**
```bash
# Reset password MySQL (Windows)
mysql -u root -p
# Nếu không biết password, có thể tạo user mới hoặc reset

# Kiểm tra file application.properties có đúng username/password không
```

### ❌ Lỗi: "Port 8080 already in use"
**Giải pháp:**
```bash
# Windows - Tìm process dùng port 8080
netstat -ano | findstr :8080
taskkill /PID <PID> /F

# Linux/macOS
lsof -i :8080
kill -9 <PID>
```

### ❌ Lỗi: "Port 5173 already in use"
**Giải pháp:**
```bash
# Tương tự như port 8080, hoặc đổi port trong vite.config.ts
# Chỉ định port khác:
npm run dev -- --port 5174
```

### ❌ Frontend không kết nối được Backend
**Giải pháp:**
1. Kiểm tra Backend đã chạy: http://localhost:8080/api/health
2. Kiểm tra URL API trong code Frontend
3. Kiểm tra CORS configuration trong Backend

### ❌ Lỗi: "npm ERR! code ERESOLVE"
**Giải pháp:**
```bash
# Thử xóa node_modules và cài lại
rm -rf node_modules package-lock.json
npm install

# Hoặc dùng legacy peer deps
npm install --legacy-peer-deps
```

### ❌ Database không import được
**Giải pháp:**
```bash
# Kiểm tra file laptop_store.sql tồn tại
# Kiểm tra đường dẫn đầy đủ
mysql -u root -p laptop_store < /full/path/to/laptop_store.sql

# Hoặc dùng MySQL Workbench để import
```

### ❌ Maven build thất bại
**Giải pháp:**
```bash
# Xóa cache Maven
mvn clean install -U

# Hoặc xóa .m2 folder
rmdir /s %USERPROFILE%\.m2\repository
```

---

## 📝 Thông Tin Đăng Nhập Demo

Sau khi cài đặt xong, có thể dùng tài khoản demo:

| Trường | Giá Trị |
|--------|---------|
| Email Admin | admin@example.com |
| Password | 123456 |
| Email User | user@example.com |
| Password | 123456 |

**Lưu ý**: Thay đổi mật khẩu ngay lập tức trước khi sử dụng production!

---

## 📞 Hỗ Trợ & Liên Hệ

Nếu gặp vấn đề:
1. Kiểm tra section **Troubleshooting** trên
2. Kiểm tra file `backend/pom.xml` và `frontend/package.json`
3. Xem log từ console của Backend và Frontend
4. Kiểm tra kết nối MySQL bằng: `mysql -u root -p -e "SELECT 1"`

---

## 📊 Kiểm Danh Sách (Checklist) Cài Đặt

- [ ] Cài đặt Java JDK 17
- [ ] Cài đặt Maven 3.8+
- [ ] Cài đặt MySQL Server 8.0.43+
- [ ] Tạo Database `laptop_store`
- [ ] Import dữ liệu từ `laptop_store.sql`
- [ ] Cài đặt Node.js 18+ LTS
- [ ] Cấu hình `application.properties` cho Backend
- [ ] Cài đặt Backend dependencies (mvn clean install)
- [ ] Cài đặt Frontend dependencies (npm install)
- [ ] Chạy Backend (mvn spring-boot:run)
- [ ] Chạy Frontend (npm run dev)
- [ ] Truy cập: http://localhost:5173
- [ ] Kiểm tra API: http://localhost:8080/api
- [ ] Đăng nhập với tài khoản demo
- [ ] Hoàn tất cài đặt! 🎉

---

**Cập nhật lần cuối**: 2026-06-04  
**Phiên bản**: 1.0

