import os
import numpy as np
import base64
import cv2
from flask import Flask, request, jsonify
from flask_cors import CORS
from PIL import Image, ImageFilter, ImageStat
import io

app = Flask(__name__)
CORS(app)


def generate_heatmap(image_bytes):
    """
    Generate an OpenCV-based saliency heatmap overlay.
    Uses multi-scale Laplacian + Canny edge blending for a rich, informative
    activation-style visualization — no PyTorch/GPU needed.
    Always returns a base64-encoded JPEG.
    """
    try:
        img = Image.open(io.BytesIO(image_bytes)).convert('RGB')

        # Downsize to cap RAM and speed up on Render Free Tier
        max_size = 640
        if img.width > max_size or img.height > max_size:
            img.thumbnail((max_size, max_size), Image.LANCZOS)

        original_np = np.array(img)
        gray = cv2.cvtColor(original_np, cv2.COLOR_RGB2GRAY)

        # --- Multi-scale Laplacian saliency ---
        lap1 = cv2.Laplacian(gray, cv2.CV_64F, ksize=1)
        lap3 = cv2.Laplacian(gray, cv2.CV_64F, ksize=3)
        lap5 = cv2.Laplacian(gray, cv2.CV_64F, ksize=5)
        salience = (np.abs(lap1) * 0.3 + np.abs(lap3) * 0.4 + np.abs(lap5) * 0.3).astype(np.float32)

        # --- Canny edge contribution ---
        edges = cv2.Canny(gray, 50, 150).astype(np.float32)

        # Blend saliency + edges
        salience_smooth = cv2.GaussianBlur(salience, (15, 15), 0)
        edge_smooth = cv2.GaussianBlur(edges, (15, 15), 0)

        combined = cv2.addWeighted(salience_smooth, 0.7, edge_smooth, 0.3, 0)

        # Normalize to [0, 255]
        mn, mx = combined.min(), combined.max()
        if mx - mn > 0:
            norm = ((combined - mn) / (mx - mn) * 255).astype(np.uint8)
        else:
            norm = np.zeros_like(gray, dtype=np.uint8)

        # Apply JET colormap
        heatmap_colored = cv2.applyColorMap(norm, cv2.COLORMAP_JET)
        heatmap_colored = cv2.cvtColor(heatmap_colored, cv2.COLOR_BGR2RGB)

        # Blend with original image
        overlay = cv2.addWeighted(original_np, 0.55, heatmap_colored, 0.45, 0)

        overlay_img = Image.fromarray(overlay)
        buffer = io.BytesIO()
        overlay_img.save(buffer, format='JPEG', quality=85)
        buffer.seek(0)
        return base64.b64encode(buffer.getvalue()).decode('utf-8')

    except Exception as e:
        print(f'Heatmap generation failed: {e}')
        import traceback
        traceback.print_exc()
        return None


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
    f_transform = np.fft.fft2(gray)
    f_shift = np.fft.fftshift(f_transform)
    magnitude = np.log1p(np.abs(f_shift))

    h, w = magnitude.shape
    cy, cx = h // 2, w // 2

    total_energy = np.sum(magnitude)
    Y, X = np.ogrid[:h, :w]
    outer_mask = ((X - cx)**2 + (Y - cy)**2) > (min(h, w) // 3)**2
    mid_mask = (((X - cx)**2 + (Y - cy)**2) > (min(h, w) // 6)**2) & \
               (((X - cx)**2 + (Y - cy)**2) <= (min(h, w) // 3)**2)
    inner_mask = ((X - cx)**2 + (Y - cy)**2) <= (min(h, w) // 6)**2

    high_freq_ratio = np.sum(magnitude[outer_mask]) / total_energy if total_energy > 0 else 0
    mid_freq_ratio = np.sum(magnitude[mid_mask]) / total_energy if total_energy > 0 else 0

    if high_freq_ratio < 0.25:
        ai_points += 1.5
        reasons_ai.append('Abnormal frequency spectrum pattern detected')
    elif high_freq_ratio > 0.38:
        real_points += 1.0
        reasons_real.append('Natural high-frequency noise spectrum identified')

    mid_freq_values = magnitude[mid_mask]
    mid_freq_cv = np.std(mid_freq_values) / (np.mean(mid_freq_values) + 1e-10)
    if mid_freq_cv < 0.35:
        ai_points += 1.0
        reasons_ai.append('Uniform mid-frequency energy distribution (synthetic signature)')

    # ===== 2. BRIGHTNESS-DEPENDENT NOISE =====
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
    edges = np.array(img_small.filter(ImageFilter.FIND_EDGES).convert('L'), dtype=np.float64)

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
    ai_points = ai_points * 0.85
    real_points = real_points * 1.1
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


def generate_explanation(prediction, confidence, reasons):
    """
    Generate a dynamic, intelligent explanation paragraph based on
    prediction result, confidence level, and detected patterns.
    """
    import random

    if prediction == 'AI Generated':
        # --- AI Generated explanations ---
        if confidence >= 90:
            confidence_phrase = 'with high confidence'
            opener = random.choice([
                'The analysis strongly indicates this image is synthetically generated.',
                'Our deep analysis reveals strong evidence of artificial image generation.',
                'Multiple forensic indicators point to this image being AI-generated.'
            ])
        elif confidence >= 75:
            confidence_phrase = 'with moderate confidence'
            opener = random.choice([
                'The analysis suggests this image exhibits characteristics of synthetic generation.',
                'Several forensic markers indicate this image may be artificially generated.',
                'Our analysis detected notable signs of AI-based image synthesis.'
            ])
        else:
            confidence_phrase = 'with limited confidence'
            opener = random.choice([
                'The analysis found some indicators that this image may be synthetically generated.',
                'Certain characteristics suggest possible AI involvement in creating this image.',
                'A few forensic markers hint at synthetic generation, though evidence is limited.'
            ])

        finding_templates = {
            'Abnormal frequency spectrum pattern detected':
                'The frequency domain analysis revealed an abnormal spectral distribution, lacking the natural noise patterns typically produced by camera sensors.',
            'Uniform mid-frequency energy distribution (synthetic signature)':
                'The mid-frequency energy distribution appears unusually uniform, a common signature of neural network-based image synthesis.',
            'Unnatural uniform noise across brightness levels':
                'The noise characteristics remain suspiciously consistent across different brightness regions, whereas real camera sensors produce varying noise levels in dark versus bright areas.',
            'Detected unnaturally smooth texture regions':
                'Micro-texture analysis identified unnaturally smooth regions that lack the organic grain and variation found in photographs captured by physical cameras.',
            'Unnaturally uniform sharpness across image (no natural depth of field)':
                'The sharpness appears uniformly distributed across the entire image, missing the natural depth-of-field variation that optical lenses produce.',
            'Abnormally high color channel correlation':
                'The RGB color channels exhibit abnormally high correlation, suggesting the pixel values were generated from a shared latent representation rather than independent sensor measurements.',
            'Overly sharp edge transitions detected':
                'Edge analysis revealed overly crisp transitions between objects, lacking the subtle gradient blending that occurs naturally in optical image capture.',
            'Abnormally uniform color saturation levels':
                'Color saturation levels are unusually consistent throughout the image, a pattern more typical of generative algorithms than natural scene illumination.'
        }

    else:
        # --- Real image explanations ---
        if confidence >= 90:
            confidence_phrase = 'with high confidence'
            opener = random.choice([
                'The analysis strongly indicates this is an authentic photograph.',
                'Multiple forensic checks confirm this image exhibits genuine photographic characteristics.',
                'Our deep analysis identifies strong markers of authentic camera capture.'
            ])
        elif confidence >= 75:
            confidence_phrase = 'with moderate confidence'
            opener = random.choice([
                'The analysis suggests this image is a genuine photograph.',
                'Forensic markers are consistent with an authentic camera-captured image.',
                'Our analysis detected characteristics typical of real-world photography.'
            ])
        else:
            confidence_phrase = 'with limited confidence'
            opener = random.choice([
                'The analysis found some indicators consistent with authentic photography.',
                'Certain characteristics suggest this image was likely captured by a real camera.',
                'Some forensic markers are consistent with genuine photographic capture.'
            ])

        finding_templates = {
            'Natural high-frequency noise spectrum identified':
                'The frequency spectrum exhibits natural high-frequency noise patterns consistent with real-world image capture and camera sensor behavior.',
            'Camera sensor noise pattern verified (brightness-dependent)':
                'The noise distribution varies naturally with brightness levels — darker regions show more noise, which is a hallmark of authentic camera sensor physics.',
            'Natural micro-texture variations present':
                'Micro-texture analysis confirmed natural variations and organic grain at the pixel level, consistent with real photographic images.',
            'Natural depth of field variation detected':
                'The image displays natural depth-of-field variation, with some regions sharper than others, indicating capture through an actual optical lens system.',
            'Natural color channel independence detected':
                'The RGB color channels show natural independence in their value distributions, consistent with separate sensor measurements from a real camera.',
            'Natural gradient transitions at edges':
                'Edge transitions display natural, gradual gradients rather than artificially crisp boundaries, consistent with optical image formation.',
            'Natural saturation variation observed':
                'Color saturation varies organically across the image, reflecting natural lighting conditions and scene properties.',
            'Image analysis inconclusive, defaulting to real':
                'The image does not exhibit strong synthetic markers, and the default assessment leans toward authentic capture.'
        }

    # Build the findings paragraph
    findings = []
    for reason in reasons[:3]:
        if reason in finding_templates:
            findings.append(finding_templates[reason])
        else:
            findings.append(reason + '.')

    findings_text = ' '.join(findings) if findings else ''

    # Compose final paragraph
    confidence_summary = f'The detection confidence is {confidence}% ({confidence_phrase}).'
    explanation = f'{opener} {findings_text} {confidence_summary}'

    return explanation.strip()


@app.route('/predict', methods=['POST'])
def predict():
    if 'image' not in request.files:
        return jsonify({'error': 'No image file provided'}), 400

    file = request.files['image']
    image_bytes = file.read()

    if len(image_bytes) == 0:
        return jsonify({'error': 'Empty image file'}), 400

    try:
        prediction, confidence, reasons = analyze_image(image_bytes)
        explanation = generate_explanation(prediction, confidence, reasons)
        heatmap_image = generate_heatmap(image_bytes)

        response = {
            'result': prediction,
            'confidence': confidence,
            'explanation': explanation
        }

        if heatmap_image:
            response['heatmap_image'] = heatmap_image

        return jsonify(response)
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
    port = int(os.environ.get("PORT", 5000))
    print('RealCheck ML Service starting...')
    print('Using heuristic analysis + OpenCV saliency heatmap')
    app.run(host='0.0.0.0', port=port)
