# 🔍 RealCheck

**Detect AI-Generated Images Instantly** — Upload any image and our forensic analysis engine will determine whether it's a real photograph or AI-generated content, complete with a visual heatmap showing which regions influenced the decision.

🌐 **Live Demo:** [realcheck-1.onrender.com](https://realcheck-1.onrender.com)

---

## ✨ Features

- **AI Image Detection** — Classifies images as **Real** or **AI Generated** using multi-algorithm forensic heuristics
- **Saliency Heatmap** — Visual overlay showing the regions the model focused on during analysis
- **Confidence Scoring** — Percentage-based confidence levels with animated progress bars
- **Detailed AI Explanation** — Human-readable, dynamically generated reasoning behind each prediction
- **Side-by-Side View** — Original image and heatmap displayed together on the result page
- **Analysis History** — View, revisit, and delete all previously analyzed images
- **Drag & Drop Upload** — Intuitive file upload with live image preview
- **User Authentication** — Register/login with JWT-secured sessions
- **Admin Dashboard** — Manage users and view platform-wide stats
- **Responsive Design** — Clean, light-themed UI that works on all devices

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, React Router v6, Vite, Axios |
| Backend | Node.js, Express, Mongoose, JWT |
| ML Service | Python, Flask, NumPy, Pillow, OpenCV |
| Database | MongoDB Atlas |
| Styling | Vanilla CSS (custom design system) |
| Hosting | Render (all three services) |

---

## 📁 Project Structure

```
RealCheck/
├── client/                  # React frontend (Vite)
│   ├── src/
│   │   ├── components/
│   │   │   └── Navbar.jsx
│   │   ├── pages/
│   │   │   ├── Home.jsx           # Landing page
│   │   │   ├── Upload.jsx         # Image upload with drag & drop
│   │   │   ├── Result.jsx         # Side-by-side result + heatmap
│   │   │   ├── History.jsx        # Past analysis records
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   ├── UserDashboard.jsx
│   │   │   └── AdminDashboard.jsx
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css              # Global styles & design system
│   └── package.json
│
├── server/                  # Node.js backend API
│   ├── models/
│   │   ├── Result.js              # Mongoose schema (stores heatmap)
│   │   └── User.js
│   ├── routes/
│   │   ├── upload.js              # Image upload & ML proxy
│   │   ├── dashboard.js           # User dashboard & history
│   │   └── admin.js               # Admin management routes
│   ├── middleware/
│   │   └── auth.js                # JWT authentication
│   ├── uploads/                   # Stored uploaded images
│   ├── index.js                   # Express server entry
│   └── package.json
│
├── ml-service/              # Python Flask ML microservice
│   ├── app.py                     # Heuristic analysis + OpenCV heatmap
│   └── requirements.txt           # Python dependencies
│
└── README.md
```

---

## 🚀 Getting Started (Local Development)

### Prerequisites

- **Node.js** v18+
- **Python** v3.9+
- **MongoDB** (local or MongoDB Atlas URI)

### 1. Clone the Repository

```bash
git clone https://github.com/Balaganesh5307/RealCheck.git
cd RealCheck
```

### 2. Set Up the ML Service

```bash
cd ml-service
pip install -r requirements.txt
python app.py
```

The ML service runs on `http://localhost:5001`.

### 3. Set Up the Backend Server

```bash
cd server
npm install
```

Create a `.env` file in the `server/` directory:

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/realcheck
JWT_SECRET=your_jwt_secret_key
ML_API_URL=http://localhost:5001/predict
```

Start the server:

```bash
npm run dev
```

The API server runs on `http://localhost:5000`.

### 4. Set Up the Frontend Client

```bash
cd client
npm install
npm run dev
```

Create a `.env` file in the `client/` directory:

```env
VITE_API_URL=http://localhost:5000
```

The app opens at `http://localhost:5173`.

---

## 📡 API Endpoints

### Upload & Analyze

```
POST /api/upload
Content-Type: multipart/form-data
Body: image (file)
Authorization: Bearer <token>  (optional — works without login)
```

**Response:**

```json
{
  "id": "mongo_id",
  "result": "Real",
  "confidence": 85.82,
  "explanation": "The analysis strongly indicates this is an authentic photograph...",
  "heatmapImage": "<base64_jpeg>",
  "imageUrl": "/uploads/filename.jpg",
  "createdAt": "2026-03-02T04:00:00.000Z"
}
```

### History

```
GET    /api/dashboard/history      # Get user's analysis history
DELETE /api/dashboard/history/:id  # Delete a single record
DELETE /api/dashboard/history      # Delete all records
```

### Auth

```
POST /api/auth/register
POST /api/auth/login
```

### Health Check

```
GET /health                     # ML service health check
```

---

## 🧠 How It Works

1. **Upload** — User uploads an image through the drag & drop interface
2. **Forwarding** — The Node.js backend forwards the image to the Python ML microservice
3. **Forensic Analysis** — The ML service runs 7 parallel detection algorithms:

| Algorithm | What it detects |
|---|---|
| Frequency Domain (FFT) | Abnormal spectral distribution in AI images |
| Brightness-Dependent Noise | Real cameras produce more noise in dark areas |
| Micro-Texture Smoothness | AI images have unnaturally smooth skin/texture regions |
| Sharpness Uniformity | Real photos have depth-of-field variation |
| Color Channel Correlation | AI pixels show higher channel co-dependence |
| Edge Gradient Analysis | AI images have overly crisp, uniform edge transitions |
| Saturation Uniformity | AI images have unrealistically consistent saturation |

4. **Heatmap Generation** — OpenCV multi-scale Laplacian + Canny edge saliency map is overlaid on the original image using the JET colormap
5. **Results** — Prediction, confidence score, AI-generated explanation, and heatmap are returned and displayed side-by-side

---

## 🖥️ Deployment (Render)

All three services are deployed independently on Render:

| Service | Type | Notes |
|---|---|---|
| `client` | Static Site | Built with `npm run build` |
| `server` | Web Service | Node 18, `npm start` |
| `ml-service` | Web Service | Python 3.9, `gunicorn app:app` |

> **Note:** Render's free tier spins down services after 15 minutes of inactivity. The first request after a cold start may take 30–60 seconds.

---

## 📄 License

This project is for educational and demonstration purposes.
