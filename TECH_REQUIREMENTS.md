# ⚡ Quick Reference - Yêu Cầu Công Nghệ

## 📦 Stack Công Nghệ

### Backend Stack
- **Language**: Java 17+
- **Framework**: Spring Boot 3.5.13
- **Build Tool**: Maven 3.8+
- **API Style**: RESTful
- **Security**: Spring Security

### Frontend Stack
- **Framework**: React 18+
- **Language**: TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **UI Library**: Material-UI (MUI) + Radix UI

### Database Stack
- **DBMS**: MySQL 8.0.43+
- **Character Set**: UTF8MB4
- **Collation**: utf8mb4_unicode_ci

---

## 🔧 Công Cụ Cài Đặt Bắt Buộc

### 1️⃣ JAVA DEVELOPMENT KIT (JDK)
```
Version: 17+
Download: https://www.oracle.com/java/technologies/downloads/
Check: java -version
```

### 2️⃣ MAVEN
```
Version: 3.8.6+
Download: https://maven.apache.org/download.cgi
Check: mvn -version
```

### 3️⃣ MySQL SERVER
```
Version: 8.0.43+
Download: https://dev.mysql.com/downloads/mysql/
Database: laptop_store
Port: 3306
SQL File: laptop_store.sql (import)
```

### 4️⃣ NODE.JS & NPM
```
Node Version: 18.x LTS+
npm Version: 9.x+
Download: https://nodejs.org/
Check: node --version, npm --version
```

### 5️⃣ GIT (Optional)
```
Version: Mới nhất
Download: https://git-scm.com/
For: Clone project repository
```

---

## 📁 Project Structure

```
DoAn/
├── backend/                 # Spring Boot Application
│   ├── src/
│   ├── pom.xml             # Maven Configuration
│   ├── mvnw                # Maven Wrapper (Windows)
│   └── mvnw.cmd            # Maven Wrapper (Script)
│
├── frontend/               # React + Vite Application
│   ├── src/
│   ├── package.json        # npm Configuration
│   ├── vite.config.ts      # Vite Configuration
│   └── tsconfig.json       # TypeScript Configuration
│
├── laptop_store.sql        # Database Dump (MySQL)
│
└── SETUP_GUIDE.md          # Hướng dẫn chi tiết
```

---

## 🌐 Port Mapping

| Service | URL | Port |
|---------|-----|------|
| Frontend (Development) | http://localhost:5173 | 5173 |
| Backend (API) | http://localhost:8080 | 8080 |
| MySQL Database | localhost | 3306 |

---

## ⚙️ Installation Order (Thứ tự cài)

```
1. Java JDK 17
   ↓
2. Maven 3.8+
   ↓
3. MySQL 8.0.43+ + Import laptop_store.sql
   ↓
4. Node.js 18 LTS + npm 9+
   ↓
5. Backend: mvn clean install
   ↓
6. Frontend: npm install
   ↓
7. Configure: application.properties (Backend)
   ↓
8. Run: Backend + Frontend
```

---

## 🚀 Quick Start Commands

### Backend
```bash
# Navigate to backend
cd backend

# Clean build
mvn clean install

# Run Spring Boot
mvn spring-boot:run

# Or run from JAR
java -jar target/laptopshop-0.0.1-SNAPSHOT.jar
```

### Frontend
```bash
# Navigate to frontend
cd frontend

# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
```

### Database
```bash
# Connect to MySQL
mysql -u root -p

# Create database
CREATE DATABASE laptop_store CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

# Import data
mysql -u root -p laptop_store < laptop_store.sql
```

---

## 🔑 Environment Configuration

### Backend - application.properties
```properties
# Database Connection
spring.datasource.url=jdbc:mysql://localhost:3306/laptop_store?useSSL=false&serverTimezone=UTC
spring.datasource.username=root
spring.datasource.password=<YOUR_PASSWORD>
spring.datasource.driver-class-name=com.mysql.cj.jdbc.Driver

# JPA
spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=false
```

### Frontend - Environment Variables (if needed)
```
VITE_API_BASE_URL=http://localhost:8080/api
```

---

## ✅ Verification Checklist

- [ ] `java -version` shows Java 17+
- [ ] `mvn -version` shows Maven 3.8+
- [ ] `mysql -version` shows MySQL 8.0+
- [ ] `node --version` shows Node 18+
- [ ] `npm --version` shows npm 9+
- [ ] Database `laptop_store` created
- [ ] Database tables imported successfully
- [ ] Backend dependencies installed
- [ ] Frontend dependencies installed
- [ ] Backend runs on port 8080
- [ ] Frontend runs on port 5173
- [ ] Can access http://localhost:5173
- [ ] API responds at http://localhost:8080/api

---

## 🆘 Common Issues

| Issue | Solution |
|-------|----------|
| Port 8080 in use | `netstat -ano \| findstr :8080` then kill process |
| Port 5173 in use | Run: `npm run dev -- --port 5174` |
| MySQL connection error | Check username/password in application.properties |
| Dependencies error | Run: `mvn clean install -U` or `npm install --legacy-peer-deps` |
| CORS error | Check Backend CORS configuration |
| Cannot find MySQL | Ensure MySQL service is running |

---

## 📚 Documentation Links

- **Java**: https://docs.oracle.com/en/java/javase/17/
- **Spring Boot**: https://spring.io/projects/spring-boot
- **Maven**: https://maven.apache.org/guides/
- **React**: https://react.dev/
- **Vite**: https://vitejs.dev/
- **MySQL**: https://dev.mysql.com/doc/

---

**Version**: 1.0  
**Last Updated**: June 4, 2026  
**For detailed setup instructions, see**: SETUP_GUIDE.md

