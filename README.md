# FitAI — AI-Powered Virtual Dressing Room and Fashion Shopping Platform

## Project Overview

FitAI is a web-based fashion shopping application that integrates AI-powered virtual try-on functionality. It allows users to browse clothing products, upload a personal image, and preview how a selected garment may look on them. The project combines an interactive React frontend with a Flask backend and database integration.

## Key Features

### 1. Image Capture and Upload
- Upload a personal photo for virtual try-on.
- Capture or provide an image using the webcam, if enabled in the application.
- Select a garment to generate a virtual try-on result.

### 2. AI-Powered Virtual Try-On
- Process the uploaded person image and selected garment image.
- Generate a try-on result using the configured IDM-VTON service.
- Display the generated output image for the user to view.

### 3. Fashion Product Catalogue
- Browse available fashion products.
- Search products by relevant details.
- Filter products by category.
- Sort products by price or rating.

### 4. Try-On History
- Store and retrieve virtual try-on history.
- Access previously generated try-on results where supported.
- Delete history entries through the available backend functionality.

### 5. User Authentication
- Support user authentication through the application's authentication module.
- Protect selected features, such as try-on and history, using login requirements.

### 6. Order Management
- Submit order information through the backend.
- Retrieve saved order information where supported by the application.

## Technology Stack

- **Frontend:** React, Vite, JavaScript, CSS
- **Backend:** Python, Flask
- **Database:** MySQL with SQLite fallback for supported operations
- **Virtual Try-On:** IDM-VTON service integration
- **Development Tools:** Visual Studio Code, Git, GitHub, Jira

## System Architecture

The application follows a client-server architecture:

1. The React frontend provides the user interface for browsing products and using virtual try-on.
2. The Flask backend handles API requests, image processing workflows, product retrieval, and other application operations.
3. The database stores supported application data, including product information and try-on or order records.
4. The configured IDM-VTON service generates virtual try-on images.

## How to Run FitAI

### Prerequisites

- Python
- Node.js and npm
- Required Python packages
- Database configuration, where applicable
- Access to the configured virtual try-on service

### Option 1: Using the Windows Launcher

If `run_fitai.bat` is available in the project directory:

1. Open the FitAI project folder.
2. Double-click `run_fitai.bat`.
3. Wait for the backend and frontend to start.
4. Open the local frontend address displayed by the launcher.

### Option 2: Run Through the Terminal

**Start the backend**

Open a terminal and navigate to the directory containing the Flask application. Activate the project's Python environment and run the backend using the entry-point file configured in the project.

**Start the frontend**

Open another terminal in the directory containing the frontend's `package.json` file and execute:

```bash
npm install
npm run dev
```

Open the local URL displayed in the terminal.

> Note: Verify the backend entry-point file, launcher script, database settings, and environment variables against the current project files before running the application.

## Repository

GitHub: https://github.com/emmidisuchitha01/FitAI

## Project Purpose

FitAI demonstrates how web development, database integration, and AI-powered image generation can be combined to create an interactive virtual fashion shopping experience.


