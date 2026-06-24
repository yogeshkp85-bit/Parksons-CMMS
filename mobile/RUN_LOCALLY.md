# Running the CMMS Project Locally

This guide provides step-by-step instructions to set up and run the backend server and the mobile application on your local machine for development and testing.

## Prerequisites

Before you begin, ensure you have the following installed:
- **Node.js**: A recent LTS version.
- **npm** or **yarn**: For package management.
- **PostgreSQL**: A running instance of the PostgreSQL database server.
- **Expo Go App (Optional)**: If you want to run the mobile app on a physical device, install the Expo Go app from the App Store or Google Play.
- **Android Studio / Xcode (Optional)**: If you want to run the app on an emulator/simulator.

---

## 1. Backend Setup

The backend is a Node.js application that connects to a PostgreSQL database.

### Step 1: Navigate to the Backend Directory

```bash
cd backend
```

### Step 2: Install Dependencies

Install the required npm packages.

```bash
npm install
```

### Step 3: Configure Environment Variables

The backend uses a `.env` file for configuration, primarily for the database connection. Create a file named `.env` in the `backend` directory and add the following, replacing the placeholder values with your actual PostgreSQL credentials.

```env
# .env file for the backend

# The connection URL for your PostgreSQL database.
# Format: postgresql://USER:PASSWORD@HOST:PORT/DATABASE
DATABASE_URL="postgresql://postgres:password@localhost:5432/cmms_db"

# The port the backend server will run on.
PORT=5000
```

### Step 4: Set Up the Database

The project uses Prisma to manage the database schema. Run the following command to sync the schema with your database. This will create the necessary tables.

```bash
npx prisma db push
```

### Step 5: Start the Backend Server

As mentioned in `Project_Progress.md`, you can start the development server with:

```bash
npm run dev
```

The backend API should now be running at **`http://localhost:5000`**.

---

## 3. Running The Application

You have two methods to start the application: manually (most reliable) or using a script.

### Method 1: Manual Start (Recommended)

You will need to open **two separate terminals** (e.g., PowerShell, Command Prompt).

**In Terminal 1 (Backend):**
```bash
# Navigate to the backend folder and start the server
cd backend
npm run dev
```

**In Terminal 2 (Frontend):**
```bash
# Navigate to the mobile folder and start the web client
cd mobile
npm run web
```

### Method 2: Using the Automation Script

From the project's root directory (`D:\Parksons-CMMS-Dev`), you can run the script for your operating system.

**On Windows:**
Double-click the `start-local.bat` file or run this in PowerShell:
```powershell
.\start-local.bat
```

**On macOS/Linux:**
```bash
chmod +x start-local.sh
./start-local.sh
```

---

## 2. Mobile Application (Expo) Setup

The mobile app is built with Expo and connects to the backend API.

### Step 1: Navigate to the Mobile Directory

```bash
cd mobile
```

### Step 2: Install Dependencies

```bash
npm install
```

### Step 3: Verify API Connection

Ensure the mobile app is configured to connect to your local backend server. Check the `mobile/api/apiClient.ts` file (or a similar configuration file) to confirm that the `baseURL` is set to `http://localhost:5000`.

### Step 4: Start the Expo Development Server

Start the Expo server, which will open the Expo Dev Tools in your browser.

```bash
npm start
```

### Step 5: Run the Application

From the Expo Dev Tools terminal or in your browser, you have several options:
- **To run in a web browser:** Press `w`. This is the quickest way to see the app running, as noted in `Project_Progress.md` (`npm run web`).
- **To run on a physical device:** Scan the QR code with the Expo Go app on your phone.
- **To run on an emulator/simulator:** Press `a` for Android or `i` for iOS.

You should now have the full application running locally. The mobile app will make requests to your local backend server for login, data fetching, and submissions.