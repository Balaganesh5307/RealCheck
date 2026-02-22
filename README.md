# 🔍 RealCheck

**Detect AI-Generated Images Instantly** — Upload any image and our advanced AI system powered by MobileNetV2 will analyze it to determine whether it's a real photograph or AI-generated content.

---

## ✨ Features

- **AI Image Detection** — Binary classification (Real vs AI Generated) using advanced image analysis heuristics
- **MobileNetV2 Powered** — Deep learning model for intelligent image analysis
- **Grad-CAM Heatmaps** — Visual explainability showing which regions influenced the model's decision
- **Confidence Scoring** — Percentage-based confidence levels with visual progress bars
- **Detailed Explanations** — Human-readable reasons behind each prediction
- **Analysis History** — View, revisit, and manage all previously analyzed images
- **Drag & Drop Upload** — Intuitive file upload with preview support
- **Responsive Design** — Clean, light-themed UI that works on all devices

---

## 🛠️ Tech Stack

| Layer       | Technology                           |
|-------------|--------------------------------------|
| Frontend    | React 18, React Router, Vite, Axios  |
| Backend     | Node.js, Express, Mongoose           |
| ML Service  | Python, Flask, NumPy, Pillow, TensorFlow |
| Database    | MongoDB                             |
| Styling     | Vanilla CSS (custom design system)   |

---

## 📁 Project Structure

```
RealCheck/
├── client/                  # React frontend (Vite)
│   ├── src/
│   │   ├── components/
│   │   │   └── Navbar.jsx
│   │   ├── pages/
│   │   │   ├── Home.jsx     # Landing page
│   │   │   ├── Upload.jsx   # Image upload with drag & drop
│   │   │   ├── Result.jsx   # Analysis results + heatmap
│   │   │   └── History.jsx  # Past analysis records
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css        # Global styles & design system
│   └── package.json
│
├── server/                  # Node.js backend API
│   ├── models/
│   │   └── Result.js        # Mongoose schema
│   ├── routes/
│   │   ├── upload.js        # Image upload & ML proxy
│   │   └── history.js       # History CRUD operations
│   ├── uploads/             # Stored uploaded images
│   ├── index.js             # Express server entry
│   ├── .env                 # Environment variables
│   └── package.json
│
├── ml-service/              # Python ML microservice
│   ├── app.py               # Flask API with image analysis
│   └── requirements.txt     # Python dependencies
│
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** (v18+)
- **Python** (v3.9+)
- **MongoDB** (local or cloud instance)

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/RealCheck.git
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

The app opens at `http://localhost:5173`.

---

## 📡 API Endpoints

### Upload & Analyze

```
POST /api/upload
Content-Type: multipart/form-data
Body: image (file)
```

**Response:**

```json
{
  "id": "mongo_id",
  "result": "AI Generated",
  "confidence": 91.5,
  "explanation": ["Abnormal frequency spectrum pattern detected", "..."],
  "heatmapImage": "base64_string",
  "imageUrl": "/uploads/filename.jpg",
  "createdAt": "2026-02-22T10:30:00.000Z"
}
```

### History

```
GET    /api/history          # Get all results
DELETE /api/history/:id      # Delete a single record
DELETE /api/history           # Delete all records
```

### Health Check

```
GET /api/health              # Server health
GET http://localhost:5001/health  # ML service health
```

---

## 🧠 How It Works

1. **Upload** — User uploads an image through the drag & drop interface
2. **Analysis** — The server forwards the image to the Python ML microservice
3. **Heuristic Detection** — The ML service runs multiple analysis algorithms:
   - Frequency domain analysis (FFT)
   - Brightness-dependent noise patterns
   - Micro-texture smoothness detection
   - Sharpness uniformity analysis
   - Color channel correlation
   - Edge gradient analysis
   - Saturation uniformity
4. **Grad-CAM Visualization** — MobileNetV2 generates a heatmap showing attention regions
5. **Results** — The prediction, confidence score, explanations, and heatmap are displayed

---

## 📄 License

This project is for educational and demonstration purposes.
