# WeFix AI Assistant Setup Instructions

## 🤖 AI Assistant Features

The WeFix Smart AI Assistant provides:

1. **Text Classification** - Automatically detects issue category from text descriptions
2. **Image Classification** - Uses TensorFlow.js model to classify uploaded images
3. **Priority Scoring** - Estimates urgency (High/Medium/Low) based on multiple factors
4. **Sentiment Analysis** - Analyzes tone in issue descriptions
5. **Spam Detection** - Filters irrelevant or duplicate reports

## 📋 Setup Steps

### Step 1: Install Dependencies

The TensorFlow.js dependency has been installed. No additional steps needed.

### Step 2: Add Model Files

1. Place your Teachable Machine model files in the `public/model/` directory:
   - `model.json` - Model architecture file
   - `weights.bin` - Model weights file

2. The model should output 4 classes:
   - Class 0: Water Clogging
   - Class 1: Road Damage
   - Class 2: Garbage
   - Class 3: Streetlight

   *Note: If your model has different classes, update the `classes` array in `src/utils/aiClassification.js`*

### Step 3: Update Database Schema

Run the SQL script in your Supabase SQL Editor:

```sql
-- Run ADD_AI_COLUMNS.sql
```

This adds the following columns to the `issues` table:
- `ai_category` - Predicted category
- `ai_priority` - Predicted priority (High/Medium/Low)
- `ai_confidence` - Confidence score (0.00 to 1.00)
- `ai_sentiment` - Detected sentiment (positive/negative/neutral)
- `ai_spam_detected` - Spam detection flag

### Step 4: Verify Model Path

The AI Assistant will try to load the model from:
1. `/model/model.json`
2. `./model/model.json`
3. `/public/model/model.json`

If the model files are not found, the system will use fallback text-based classification.

## 🎯 Usage

### For Users:

1. Click the floating AI Assistant button (bottom-right corner)
2. Enter issue description or upload an image
3. Click "Predict Category & Priority"
4. Review AI predictions:
   - Category (Water Clogging, Road Damage, etc.)
   - Priority (High, Medium, Low)
   - Sentiment Analysis
   - Spam Detection
5. Click "Save Issue to Database" to create the issue with AI predictions

### AI Classification Logic:

**Text Classification:**
- Analyzes keywords in the description
- Matches against predefined categories
- Provides confidence score

**Priority Scoring:**
- Considers urgent keywords (emergency, danger, etc.)
- Category importance (Public Safety = higher priority)
- Sentiment analysis (negative = higher priority)
- Image classification results

**Sentiment Analysis:**
- Detects positive, negative, or neutral sentiment
- Uses keyword matching for quick analysis

**Spam Detection:**
- Checks for URLs, email addresses
- Detects commercial keywords
- Identifies suspicious patterns
- Validates minimum description length

## 🔧 Customization

### Update Categories

Edit `ISSUE_CATEGORIES` in `src/utils/aiClassification.js`:

```javascript
const ISSUE_CATEGORIES = {
  'Your Category': ['keyword1', 'keyword2', ...],
  // Add more categories
};
```

### Adjust Priority Logic

Modify `PRIORITY_KEYWORDS` and `calculatePriority()` function in `src/utils/aiClassification.js`.

### Model Class Names

If your TensorFlow.js model outputs different class names, update:

```javascript
const classes = ['YourClass1', 'YourClass2', 'YourClass3', 'YourClass4'];
```

## 📊 Display AI Predictions

AI predictions are automatically displayed:
- On the Issues page (category and priority badges)
- In the AI Assistant modal (full analysis)
- Saved to database for filtering/sorting

## 🚀 Next Steps

1. Upload your model files to `public/model/`
2. Run the database migration (`ADD_AI_COLUMNS.sql`)
3. Test the AI Assistant by clicking the floating button
4. Verify predictions are saved correctly in the database

## ⚠️ Notes

- If model files are missing, text-based classification will still work
- Image classification requires the TensorFlow.js model files
- AI predictions are stored with each issue for future analysis
- The system gracefully handles missing model files with fallback logic

