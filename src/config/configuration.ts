// src/config/configuration.ts

export default () => ({
  port: parseInt(process.env.PORT || '3000', 10),
  database: {
    uri: process.env.MONGODB_URI,
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'supersecretjwtkey', // CHANGE THIS IN PRODUCTION!
    expiresIn: process.env.JWT_EXPIRES_IN || '1h',
  },
  smtp: {
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: process.env.SMTP_SECURE === 'true',
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
    fromName: process.env.SMTP_FROM_NAME || 'Your App',
    fromEmail: process.env.SMTP_FROM_EMAIL,
  },
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackUrl:
      process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3000/auth/callback', // Update for production
  },
  r2: {
    endpoint: process.env.R2_ENDPOINT,
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    bucketName: process.env.R2_BUCKET_NAME,
    publicUrl: process.env.R2_PUBLIC_URL,
  },
  // Firebase configuration might be needed later if you fully integrate Firebase Auth
  // firebase: {
  //   projectId: process.env.FIREBASE_PROJECT_ID,
  //   clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  //   privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'), // Handle private key newlines
  // },
});
