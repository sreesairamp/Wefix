# TensorFlow.js Model Files

Place your Teachable Machine model files here:

- `model.json` - The model architecture and configuration
- `weights.bin` - The model weights

The AI Assistant will automatically load these files for image classification.

## Model Input/Output

- **Input**: 224x224 RGB images (normalized to 0-1)
- **Output**: 4 classes (as per your model configuration)
  - Class 0: Water Clogging
  - Class 1: Road Damage  
  - Class 2: Garbage
  - Class 3: Streetlight

Note: The actual class names will be determined from your model's metadata. Update `aiClassification.js` if your class names differ.

