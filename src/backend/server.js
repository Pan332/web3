import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { create } from 'ipfs-http-client';
import multer from 'multer';

dotenv.config({ path: './.env' });

const app = express();
const port = process.env.PORT;
const accesstoken = process.env.ACCESS_TOKEN_SECRET;

app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));

app.use(helmet());
app.use(express.json());


app.use(cookieParser());

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'Strict',
};

// Set security-related cookies
app.use((req, res, next) => {
  res.cookie('XSRF-TOKEN', 'token', cookieOptions); // Example of setting secure cookie
  next();
});

app.options('*', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', 'http://localhost:5173');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.sendStatus(204); // No content
});

app.use('/uploads', (req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', 'http://localhost:5173');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  next();
});

const storage = multer.memoryStorage();
const upload = multer({ storage });
const client = create({
  host: '127.0.0.1',
  port: '5001',
  protocol: 'http',
});

app.post('/upload', upload.single('file'), async (req, res) => {
  try {
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    const added = await client.add(file.buffer);
    res.json({ cid: added.path });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to upload file' });
  }
});


// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error handling request:', err);
  res.status(500).send('Internal server error');
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

if (process.env.NODE_ENV === 'production') {
  app.use((req, res, next) => {
    if (req.headers['x-forwarded-proto'] !== 'https') {
      return res.redirect(301, 'https://' + req.headers.host + req.url);
    }
    next();
  });
}

// HSTS - HTTP Strict Transport Security
app.use(helmet.hsts({
  maxAge: 31536000,         // 1 year
  includeSubDomains: true,  // Apply to all subdomains
  preload: true,            // Preload this policy in browsers
}));

// Content Security Policy (CSP)
app.use(helmet.contentSecurityPolicy({
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'", "'unsafe-inline'"],
    styleSrc: ["'self'", "'unsafe-inline'"],
    imgSrc: ["'self'", "http://localhost:4321", "data:"],
    connectSrc: ["'self'"],
    fontSrc: ["'self'"],
    objectSrc: ["'none'"],
    frameAncestors: ["'none'"],
  },
}));

// X-Content-Type-Options (Prevent MIME type sniffing)
app.use(helmet.noSniff());

// XSS Protection (Cross-Site Scripting)
app.use(helmet.xssFilter());

// Referrer Policy
app.use(helmet.referrerPolicy({ policy: 'no-referrer' }));

app.use((req, res, next) => {
  res.setHeader('Permissions-Policy', 'geolocation=(self), fullscreen=(self)');
  next();
});

// Example of setting a secure cookie for access token
app.use((req, res, next) => {
  res.cookie('access_token', accesstoken, cookieOptions);
  next();
});
