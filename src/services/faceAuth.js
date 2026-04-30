// Face Authentication Service using FaceIO
// Provides face enrollment and verification for 2FA

// IMPORTANT: Get your free FaceIO Public ID at https://faceio.net
// 1. Sign up for free
// 2. Create an application
// 3. Copy the Public ID (looks like: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx)
const FACEIO_PUBLIC_ID = 'faceio-public-id';

let currentPhone = null;

export const setCurrentPhone = (phone) => {
  currentPhone = phone;
};

export const getCurrentPhone = () => currentPhone;

export const initFaceIO = async () => {
  if (typeof window === 'undefined') return null;
  
  // Check if FaceIO is already loaded
  if (window.faceio) {
    window.faceio.publicId = FACEIO_PUBLIC_ID;
    return window.faceio;
  }
  
  // Load FaceIO script if not present
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://cdn.faceio.net/faceio.min.js';
    script.onload = () => {
      if (window.faceio) {
        window.faceio.publicId = FACEIO_PUBLIC_ID;
      }
      resolve(window.faceio);
    };
    script.onerror = () => reject(new Error('Failed to load FaceIO'));
    document.head.appendChild(script);
  });
};

export const enrollFace = async (phone) => {
  const faceio = await initFaceIO();
  if (!faceio) throw new Error('FaceIO not available. Please refresh and try again.');
  
  try {
    // Open enrollment modal - FaceIO handles camera, capture, and template generation
    const userId = await faceio.enroll({
      permissions: {
        camera: true,
      },
      locale: 'auto',
      payload: {
        phone: phone,
      },
    });
    
    // Save the face token to localStorage, keyed by phone
    const faceToken = userId;
    saveFaceToken(phone, faceToken);
    
    return { success: true, faceToken };
  } catch (err) {
    if (err.name === 'IMPORTANCE_HIGH' || err.code === 'IMPORTANCE_HIGH') {
      throw new Error('Camera permission is required for face enrollment. Please allow camera access.');
    }
    if (err.name === 'ERR_NO_FACE_DETECTED' || err.name === 'NO_FACE_DETECTED') {
      throw new Error('No face detected. Please position your face clearly in the camera.');
    }
    if (err.name === 'ERR_FACE_ALREADY_ENROLLED' || err.name === 'FACE_ALREADY_ENROLLED') {
      throw new Error('This face is already enrolled for another account.');
    }
    if (err.name === 'ERR_CAMERA_PERMISSION_DENIED' || err.name === 'CAMERA_PERMISSION_DENIED') {
      throw new Error('Camera access denied. Please enable camera permissions in your browser settings.');
    }
    throw new Error(err.message || 'Face enrollment failed. Please try again.');
  }
};

export const verifyFace = async (phone) => {
  const faceio = await initFaceIO();
  if (!faceio) throw new Error('FaceIO not available. Please refresh and try again.');
  
  const storedToken = getFaceToken(phone);
  if (!storedToken) {
    throw new Error('No face enrolled for this account. Please sign up first.');
  }
  
  try {
    // Open verification modal - FaceIO handles camera and matching
    const result = await faceio.verify({
      locale: 'auto',
    });
    
    // Verification successful
    return { success: true, match: true };
  } catch (err) {
    if (err.name === 'IMPORTANCE_HIGH' || err.code === 'IMPORTANCE_HIGH') {
      throw new Error('Camera permission is required. Please allow camera access.');
    }
    if (err.name === 'ERR_NO_FACE_DETECTED' || err.name === 'NO_FACE_DETECTED') {
      throw new Error('No face detected. Please position your face in the camera.');
    }
    if (err.name === 'ERR_RECOGNITION_FAILED' || err.name === 'RECOGNITION_FAILED') {
      throw new Error('Face not recognized. Please try again or use phone-only login.');
    }
    if (err.name === 'ERR_CAMERA_PERMISSION_DENIED' || err.name === 'CAMERA_PERMISSION_DENIED') {
      throw new Error('Camera access denied. Please enable camera permissions.');
    }
    throw new Error(err.message || 'Face verification failed. Please try again.');
  }
};

// Storage helpers - stored per phone number
export const saveFaceToken = (phone, token) => {
  if (typeof window === 'undefined') return;
  const key = `@Zsplit:faceToken:${phone}`;
  localStorage.setItem(key, JSON.stringify(token));
};

export const getFaceToken = (phone) => {
  if (typeof window === 'undefined') return null;
  const key = `@Zsplit:faceToken:${phone}`;
  const token = localStorage.getItem(key);
  return token ? JSON.parse(token) : null;
};

export const deleteFaceToken = (phone) => {
  if (typeof window === 'undefined') return;
  const key = `@Zsplit:faceToken:${phone}`;
  localStorage.removeItem(key);
};

// Check if a phone has face enrolled
export const hasEnrolledFace = (phone) => {
  if (typeof window === 'undefined') return false;
  const key = `@Zsplit:faceToken:${phone}`;
  return !!localStorage.getItem(key);
};

// Check if FaceIO is available in browser
export const checkFaceIOStatus = async () => {
  if (typeof window === 'undefined') {
    return { available: false, error: 'Not a browser environment' };
  }
  
  try {
    const faceio = await initFaceIO();
    if (!faceio) return { available: false, error: 'Failed to load FaceIO' };
    
    // Check if FaceIO has a valid public ID set
    if (faceio.publicId === 'faceio-public-id' || !faceio.publicId) {
      return { 
        available: true, 
        configured: false, 
        error: 'FaceIO not configured. Add your Public ID to src/services/faceAuth.js' 
      };
    }
    
    // Check if browser has camera access
    let hasCamera = false;
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      hasCamera = devices.some(d => d.kind === 'videoinput');
    } catch (e) {
      // Camera check failed - may still work
    }
    
    return { 
      available: true, 
      configured: true,
      hasCamera,
    };
  } catch (err) {
    return { available: false, error: err.message };
  }
};
