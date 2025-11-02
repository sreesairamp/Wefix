# 🔐 Security Notes for WeFix

## ⚠️ Important Security Reminders

### Current Status
Your Supabase credentials are currently hardcoded in `src/supabaseClient.js` as fallback values. This is **OK for development** but you should use environment variables for production.

### ✅ What's Correct

1. **Supabase URL**: `https://kkckdxtxobzlmvhobpbi.supabase.co` ✅
   - Format is correct
   - This is your project URL

2. **Supabase Anon Key**: Your key looks valid ✅
   - Format is correct (JWT token)
   - This is the "anon" (anonymous) key - it's meant to be public
   - However, Row Level Security (RLS) policies protect your data

3. **Stripe Key**: `pk_test_51YourKeyHere` ⚠️
   - This appears to be a **placeholder** - not a real key
   - Stripe test keys start with `pk_test_51` followed by more characters
   - Get your real key from: https://dashboard.stripe.com/apikeys

### 🔒 Security Best Practices

#### ✅ DO:
1. **Use Environment Variables** - Already configured! ✅
   - Create `.env.local` file (already created for you)
   - Never commit `.env.local` to Git (already in `.gitignore`)
   - Use Netlify environment variables for production

2. **Supabase Anon Key is Safe**
   - The "anon" key is meant to be public (it's in your frontend code)
   - Your data is protected by Row Level Security (RLS) policies
   - However, using environment variables is still better practice

3. **Stripe Publishable Keys**
   - Publishable keys (starting with `pk_`) are safe to expose
   - Never expose secret keys (starting with `sk_`)
   - Use test keys (`pk_test_...`) for development

#### ❌ DON'T:
1. **Never commit secrets to Git**
   - Secret keys (Stripe `sk_...` keys)
   - Database passwords
   - Private keys
   - API secrets

2. **Never share your `.env.local` file**
   - Contains your actual credentials
   - Keep it local only

3. **Don't use production Stripe keys in development**
   - Always use `pk_test_...` for testing
   - Only use `pk_live_...` in production

### 📝 Getting Your Real Stripe Key

1. Go to https://dashboard.stripe.com/apikeys
2. You'll see two keys:
   - **Publishable key**: `pk_test_51...` (starts with pk_test_)
   - **Secret key**: `sk_test_51...` (starts with sk_test_) - **NEVER use this in frontend!**

3. Copy the **Publishable key** (pk_test_51...)
4. Replace `pk_test_51YourKeyHere` in `.env.local`

### 🚀 For Production Deployment

When deploying to Netlify:

1. **Set Environment Variables in Netlify Dashboard**:
   ```
   VITE_SUPABASE_URL=https://kkckdxtxobzlmvhobpbi.supabase.co
   VITE_SUPABASE_ANON_KEY=your_key_here
   VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_real_key_here
   ```

2. **The code will automatically use these** instead of hardcoded values

### ✅ Current Setup Status

- ✅ Environment variable support added to `supabaseClient.js`
- ✅ Fallback values (for local dev without .env file)
- ✅ `.env.local` file created (not committed to Git)
- ✅ `.env.example` file created (template for others)
- ✅ `.gitignore` updated to ignore `.env*` files
- ⚠️ Replace Stripe placeholder key with real key

### 🧪 Testing

After updating `.env.local`:
1. Restart your dev server: `npm run dev`
2. Test Supabase connection (try logging in)
3. Test Stripe (if you've added real key)

### 📚 Additional Resources

- [Supabase Security](https://supabase.com/docs/guides/platform/security)
- [Stripe API Keys](https://stripe.com/docs/keys)
- [Vite Environment Variables](https://vitejs.dev/guide/env-and-mode.html)

