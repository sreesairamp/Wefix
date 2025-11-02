# Setting Up Your TensorFlow.js Model

## Quick Setup

1. **Export your model from Teachable Machine:**
   - Go to your Teachable Machine project
   - Click "Export Model"
   - Choose "TensorFlow.js" → "Download"
   - You'll get a zip file with `model.json` and `weights.bin`

2. **Extract and place files:**
   - Extract the zip file
   - Copy `model.json` to `public/model/model.json`
   - Copy `weights.bin` to `public/model/weights.bin`

3. **Verify your model structure:**
   - Your model should output 4 classes (as per the model.json you provided)
   - The classes should match: Water Clogging, Road Damage, Garbage, Streetlight
   - If different, update `src/utils/aiClassification.js` line 266

## Model Specifications

Based on your provided model.json:
- **Input**: 224x224 RGB images
- **Output**: 4 classes with softmax activation
- **Architecture**: MobileNet-based (depthwise separable convolutions)

## Testing

After placing the model files:
1. Start your dev server: `npm run dev`
2. Click the AI Assistant button (bottom-right)
3. Upload an image and test classification

## Troubleshooting

If model doesn't load:
- Check browser console for errors
- Verify file paths match exactly
- Ensure `weights.bin` is in the same directory as `model.json`
- Check that CORS is enabled if hosting elsewhere

The system will use text-based classification as a fallback if the model is unavailable.

