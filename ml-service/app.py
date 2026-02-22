import os
import numpy as np
from flask import Flask, request, jsonify
from flask_cors import CORS
from PIL import Image, ImageFilter, ImageStat
import io

app = Flask(__name__)
CORS(app)


def analyze_image(image_bytes):
    """
    Analyze image to detect if real or AI-generated using multiple heuristics.
    Modern AI images are very detailed, so we focus on:
    - Frequency domain patterns (FFT)
    - Brightness-dependent noise (real cameras have more noise in dark areas)
    - Skin/texture smoothness at micro level
    - Sharpness uniformity (real photos have depth of field)
    - Color channel independence
    """
    img = Image.open(io.BytesIO(image_bytes)).convert('RGB')
    img_small = img.resize((256, 256), Image.LANCZOS)
    arr = np.array(img_small, dtype=np.float64)
    gray = np.mean(arr, axis=2)

    real_points = 0.0
    ai_points = 0.0
    reasons_real = []
    reasons_ai = []

    # ===== 1. FREQUENCY DOMAIN ANALYSIS (FFT) =====
    # AI-generated images have distinct frequency domain signatures
    # They often lack natural high-frequency noise and have spectral artifacts
    f_transform = np.fft.fft2(gray)
    f_shift = np.fft.fftshift(f_transform)
    magnitude = np.log1p(np.abs(f_shift))

    h, w = magnitude.shape
    cy, cx = h // 2, w // 2

    # High-frequency energy ratio
    total_energy = np.sum(magnitude)
    # Outer ring (high freq)
    Y, X = np.ogrid[:h, :w]
    outer_mask = ((X - cx)**2 + (Y - cy)**2) > (min(h, w) // 3)**2
    mid_mask = (((X - cx)**2 + (Y - cy)**2) > (min(h, w) // 6)**2) & \
               (((X - cx)**2 + (Y - cy)**2) <= (min(h, w) // 3)**2)
    inner_mask = ((X - cx)**2 + (Y - cy)**2) <= (min(h, w) // 6)**2

    high_freq_ratio = np.sum(magnitude[outer_mask]) / total_energy if total_energy > 0 else 0
    mid_freq_ratio = np.sum(magnitude[mid_mask]) / total_energy if total_energy > 0 else 0

    # AI images tend to have less high-frequency energy and more mid-frequency uniformity
    if high_freq_ratio < 0.25:
        ai_points += 1.5
        reasons_ai.append('Abnormal frequency spectrum pattern detected')
    elif high_freq_ratio > 0.38:
        real_points += 1.0
        reasons_real.append('Natural high-frequency noise spectrum identified')

    # Check mid-frequency uniformity (AI images are more uniform)
    mid_freq_values = magnitude[mid_mask]
    mid_freq_cv = np.std(mid_freq_values) / (np.mean(mid_freq_values) + 1e-10)
    if mid_freq_cv < 0.35:
        ai_points += 1.0
        reasons_ai.append('Uniform mid-frequency energy distribution (synthetic signature)')

    # ===== 2. BRIGHTNESS-DEPENDENT NOISE =====
    # Real cameras: darker regions have MORE noise (shot noise + read noise)
    # AI images: noise is uniform regardless of brightness
    dark_mask = gray < 80
    bright_mask = gray > 180
    mid_mask_brightness = (gray >= 80) & (gray <= 180)

    dx = np.diff(gray, axis=1)
    dy = np.diff(gray, axis=0)

    def region_noise(mask, diff_arr, axis):
        m = mask[:, :-1] if axis == 1 else mask[:-1, :]
        vals = diff_arr[m]
        return np.std(vals) if len(vals) > 100 else None

    dark_noise = region_noise(dark_mask, dx, 1)
    bright_noise = region_noise(bright_mask, dx, 1)

    if dark_noise is not None and bright_noise is not None:
        noise_ratio = dark_noise / (bright_noise + 1e-10)
        if noise_ratio > 1.15:
            real_points += 1.5
            reasons_real.append('Camera sensor noise pattern verified (brightness-dependent)')
        elif noise_ratio < 0.95:
            ai_points += 1.2
            reasons_ai.append('Unnatural uniform noise across brightness levels')
        else:
            ai_points += 0.3

    # ===== 3. MICRO-TEXTURE SMOOTHNESS =====
    # AI images have unnaturally smooth gradients at micro level
    # Check 8x8 block-level smoothness
    block_smoothness = []
    for i in range(0, 240, 8):
        for j in range(0, 240, 8):
            block = gray[i:i+8, j:j+8]
            if block.shape == (8, 8):
                grad_x = np.abs(np.diff(block, axis=1))
                grad_y = np.abs(np.diff(block, axis=0))
                smoothness = 1.0 / (1.0 + np.mean(grad_x) + np.mean(grad_y))
                block_smoothness.append(smoothness)

    if block_smoothness:
        avg_smoothness = np.mean(block_smoothness)
        smooth_block_ratio = np.sum(np.array(block_smoothness) > 0.15) / len(block_smoothness)

        if smooth_block_ratio > 0.5:
            ai_points += 1.3
            reasons_ai.append('Detected unnaturally smooth texture regions')
        elif smooth_block_ratio < 0.25:
            real_points += 0.8
            reasons_real.append('Natural micro-texture variations present')

    # ===== 4. SHARPNESS UNIFORMITY =====
    # Real photos: varying sharpness due to depth of field
    # AI images: uniformly sharp or artificially blurred
    edges = np.array(img_small.filter(ImageFilter.FIND_EDGES).convert('L'), dtype=np.float64)

    # Divide into quadrants and compare sharpness
    h4, w4 = edges.shape[0] // 2, edges.shape[1] // 2
    quadrant_sharpness = [
        np.mean(edges[:h4, :w4]),
        np.mean(edges[:h4, w4:]),
        np.mean(edges[h4:, :w4]),
        np.mean(edges[h4:, w4:])
    ]
    sharpness_variation = np.std(quadrant_sharpness) / (np.mean(quadrant_sharpness) + 1e-10)

    if sharpness_variation < 0.15:
        ai_points += 1.0
        reasons_ai.append('Unnaturally uniform sharpness across image (no natural depth of field)')
    elif sharpness_variation > 0.4:
        real_points += 1.0
        reasons_real.append('Natural depth of field variation detected')

    # ===== 5. COLOR CHANNEL CORRELATION =====
    # AI images tend to have higher correlation between color channels
    r, g, b = arr[:,:,0].flatten(), arr[:,:,1].flatten(), arr[:,:,2].flatten()
    rg_corr = np.corrcoef(r, g)[0, 1]
    rb_corr = np.corrcoef(r, b)[0, 1]
    gb_corr = np.corrcoef(g, b)[0, 1]
    avg_corr = (abs(rg_corr) + abs(rb_corr) + abs(gb_corr)) / 3

    if avg_corr > 0.95:
        ai_points += 0.8
        reasons_ai.append('Abnormally high color channel correlation')
    elif avg_corr < 0.85:
        real_points += 0.5
        reasons_real.append('Natural color channel independence detected')

    # ===== 6. EDGE GRADIENT ANALYSIS =====
    # AI images often have overly clean edges with sharp transitions
    edge_gradients = np.abs(np.diff(edges.flatten()))
    edge_gradient_mean = np.mean(edge_gradients)
    edge_gradient_std = np.std(edge_gradients)
    edge_sharpness = edge_gradient_mean / (edge_gradient_std + 1e-10)

    if edge_sharpness > 0.8:
        ai_points += 0.7
        reasons_ai.append('Overly sharp edge transitions detected')
    elif edge_sharpness < 0.5:
        real_points += 0.5
        reasons_real.append('Natural gradient transitions at edges')

    # ===== 7. SATURATION UNIFORMITY =====
    hsv_img = img_small.convert('HSV')
    hsv_arr = np.array(hsv_img, dtype=np.float64)
    saturation = hsv_arr[:, :, 1]
    sat_std = np.std(saturation)
    sat_mean = np.mean(saturation)

    if sat_mean > 100 and sat_std < 35:
        ai_points += 0.8
        reasons_ai.append('Abnormally uniform color saturation levels')
    elif sat_std > 55:
        real_points += 0.5
        reasons_real.append('Natural saturation variation observed')

    # ===== FINAL SCORING =====
    total = real_points + ai_points
    if total < 0.5:
        return 'Real', 62.0, ['Image analysis inconclusive, defaulting to real']

    real_ratio = real_points / total
    ai_ratio = ai_points / total

    if ai_points > real_points:
        confidence = min(60 + ai_ratio * 37, 97)
        explanation = reasons_ai[:4] if reasons_ai else ['Synthetic image characteristics detected']
        if len(explanation) < 2 and reasons_ai:
            explanation = reasons_ai[:2]
        return 'AI Generated', round(confidence, 2), explanation
    else:
        confidence = min(60 + real_ratio * 37, 97)
        explanation = reasons_real[:4] if reasons_real else ['Natural image characteristics detected']
        if len(explanation) < 2 and reasons_real:
            explanation = reasons_real[:2]
        return 'Real', round(confidence, 2), explanation


@app.route('/predict', methods=['POST'])
def predict():
    if 'image' not in request.files:
        return jsonify({'error': 'No image file provided'}), 400

    file = request.files['image']
    image_bytes = file.read()

    if len(image_bytes) == 0:
        return jsonify({'error': 'Empty image file'}), 400

    try:
        prediction, confidence, explanation = analyze_image(image_bytes)
        return jsonify({
            'result': prediction,
            'confidence': confidence,
            'explanation': explanation
        })
    except Exception as e:
        print(f'Prediction error: {e}')
        import traceback
        traceback.print_exc()
        return jsonify({'error': 'Failed to process image'}), 500


@app.route('/health', methods=['GET'])
def health():
    return jsonify({
        'status': 'ok',
        'message': 'RealCheck ML Service is running'
    })


if __name__ == '__main__':
    print('RealCheck ML Service starting...')
    print('Using advanced image analysis heuristics for prediction')
    app.run(host='0.0.0.0', port=5001, debug=True)
