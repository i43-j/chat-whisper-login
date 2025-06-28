
# Secure Chat Assistant

A modern, accessible chatbot interface built with React, Vite, and TypeScript. Features secure login authentication, dark/light mode toggle, and a clean, responsive design that works seamlessly across all devices.

## ✨ Features

- 🔐 **Secure Login Flow** - Modal-based authentication with session management
- 💬 **Real-time Chat Interface** - Clean, WhatsApp-like chat bubbles with markdown support
- 🌙 **Dark/Light Mode** - Auto-detects system preference with manual toggle
- 📱 **Fully Responsive** - Mobile-first design that scales beautifully
- ♿ **Accessibility First** - ARIA compliant with keyboard navigation support
- 🎨 **Smooth Animations** - Polished transitions that respect reduced-motion preferences

## 🚀 Quick Start

### Local Development

1. **Clone and install dependencies:**
   ```bash
   git clone <your-repo-url>
   cd <your-project-name>
   npm install
   ```

2. **Set up environment variables** (see detailed setup below)

3. **Start development server:**
   ```bash
   npm run dev
   ```

4. **Open your browser** to `http://localhost:8080`

### CodeSandbox/StackBlitz

1. **Import this repository** into your preferred online IDE
2. **Create a `.env` file** in the root directory
3. **Add your webhook URLs** (see environment setup below)
4. **Install dependencies** and start the dev server

## 🔧 Environment Setup

### Step 1: Create the .env file

Create a file named `.env` in the **root directory** of your project (same level as `package.json`):

```
your-project/
├── src/
├── public/
├── package.json
├── .env          ← Create this file here
└── README.md
```

### Step 2: Configure your webhook URLs

Add these two variables to your `.env` file:

```env
VITE_LOGIN_WEBHOOK_URL=https://your-api.com/auth/login
VITE_CHAT_WEBHOOK_URL=https://your-api.com/chat
```

#### 🔍 How to find your webhook URLs:

**For Login Webhook:**
- Should accept POST requests with JSON: `{"username": "string", "password": "string"}`
- Should return JSON with a token: `{"token": "your-session-token"}`
- Returns 200 for success, 401/403 for invalid credentials

**For Chat Webhook:**
- Should accept POST requests with JSON: `{"message": "user message text"}`
- Should include Authorization header: `Bearer {token}`
- Should return JSON: `{"response": "bot response text"}`

#### 📝 Example webhook URLs:

```env
# Using a custom backend
VITE_LOGIN_WEBHOOK_URL=https://myapp-api.herokuapp.com/login
VITE_CHAT_WEBHOOK_URL=https://myapp-api.herokuapp.com/chat

# Using serverless functions
VITE_LOGIN_WEBHOOK_URL=https://myapp.vercel.app/api/login
VITE_CHAT_WEBHOOK_URL=https://myapp.vercel.app/api/chat

# Using webhook services (for testing)
VITE_LOGIN_WEBHOOK_URL=https://webhook.site/your-unique-id
VITE_CHAT_WEBHOOK_URL=https://webhook.site/your-other-unique-id
```

### Step 3: Restart your development server

After creating/updating the `.env` file, restart your dev server:

```bash
npm run dev
```

## 🌐 CORS Configuration

If you're using external webhooks, you may encounter CORS errors. Here's how to handle them:

### For your backend API:
Add these headers to your webhook responses:
```javascript
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: POST, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization
```

### For testing with webhook.site:
Webhook.site automatically handles CORS, making it perfect for testing.

### For local development:
If testing with a local backend on a different port, ensure your backend includes CORS middleware.

## 🛠️ Troubleshooting

### Environment Variables Not Working?
- ✅ Ensure your `.env` file is in the project root (same level as `package.json`)
- ✅ Variable names must start with `VITE_` (this is required by Vite)
- ✅ Restart your dev server after creating/modifying `.env`
- ✅ Check the browser's Network tab to see what URLs are being called

### Login Always Fails?
- ✅ Check your browser's console for network errors
- ✅ Verify your login webhook URL is correct and accessible
- ✅ Test your webhook with tools like Postman or curl
- ✅ For demo purposes, any login will work if the webhook fails to connect

### Chat Not Working?
- ✅ Ensure you've successfully logged in first
- ✅ Check that your chat webhook URL is configured correctly
- ✅ Verify your webhook accepts the expected JSON format
- ✅ Check browser console for authentication or network errors

### CORS Errors?
- ✅ Add proper CORS headers to your backend (see CORS section above)
- ✅ For quick testing, use webhook.site which handles CORS automatically
- ✅ Consider using a CORS proxy for development: `https://cors-anywhere.herokuapp.com/`

## 🚀 Deployment

### Vercel
1. Push your code to GitHub
2. Connect your repo to Vercel
3. Add environment variables in Vercel dashboard:
   - Go to Settings → Environment Variables
   - Add `VITE_LOGIN_WEBHOOK_URL` and `VITE_CHAT_WEBHOOK_URL`
4. Deploy!

### Netlify
1. Push your code to GitHub
2. Connect your repo to Netlify
3. Add environment variables in Netlify dashboard:
   - Go to Site Settings → Environment Variables
   - Add `VITE_LOGIN_WEBHOOK_URL` and `VITE_CHAT_WEBHOOK_URL`
4. Deploy!

## 📚 API Reference

### Login Webhook Expected Format

**Request:**
```json
POST /login
Content-Type: application/json

{
  "username": "user123",
  "password": "password123"
}
```

**Success Response:**
```json
HTTP 200 OK
{
  "token": "jwt-token-or-session-id"
}
```

**Error Response:**
```json
HTTP 401 Unauthorized
{
  "error": "Invalid credentials"
}
```

### Chat Webhook Expected Format

**Request:**
```json
POST /chat
Content-Type: application/json
Authorization: Bearer {token}

{
  "message": "Hello, how are you?"
}
```

**Success Response:**
```json
HTTP 200 OK
{
  "response": "I'm doing great! How can I help you today?"
}
```

## 🎯 Best Practices

- **Security**: Never commit your `.env` file to version control
- **Testing**: Use webhook.site for quick testing and prototyping
- **Production**: Use HTTPS URLs for all webhook endpoints
- **Performance**: Consider implementing rate limiting on your webhooks
- **UX**: Customize the suggestion pills and welcome message for your use case

## 📱 Browser Support

- Chrome/Edge 88+
- Firefox 85+
- Safari 14+
- Mobile browsers (iOS Safari, Chrome Mobile)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

---

**Need help?** Check the troubleshooting section above or open an issue in this repository.
