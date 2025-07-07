import React, { useEffect, useContext, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { toast } from 'react-hot-toast';
import axios from 'axios';

function PushSubscription() {
  const { user } = useContext(AuthContext);
  const { isDark } = useTheme();
  const [isSubscribed, setIsSubscribed] = useState(false);

  useEffect(() => {
    if (!user || !('serviceWorker' in navigator) || !('PushManager' in window)) {
      return;
    }

    const subscribeUser = async () => {
      try {
        const registration = await navigator.serviceWorker.ready;
        
        // Get VAPID public key
        const vapidResponse = await axios.get('/api/auth/vapid-public-key');
        const publicKey = vapidResponse.data.publicKey;
        
        // Subscribe to push notifications
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicKey)
        });
        
        // Send subscription to server
        await axios.post('/api/auth/subscribe', 
          { subscription },
          { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }}
        );
        
        setIsSubscribed(true);
        toast.success('🔔 Push notifications enabled!', {
          style: {
            background: isDark ? 'rgba(31, 41, 55, 0.9)' : 'rgba(255, 255, 255, 0.9)',
            color: isDark ? '#fff' : '#1f2937'
          }
        });
      } catch (error) {
        console.warn('Push subscription failed:', error);
        if (error.name === 'NotAllowedError') {
          toast.error('Push notifications blocked. Enable in browser settings.', {
            style: {
              background: isDark ? 'rgba(31, 41, 55, 0.9)' : 'rgba(255, 255, 255, 0.9)',
              color: isDark ? '#fff' : '#1f2937'
            }
          });
        }
      }
    };

    subscribeUser();
  }, [user]);

  // Helper function to convert VAPID key
  const urlBase64ToUint8Array = (base64String) => {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');
    
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  };

  return null; // This component doesn't render anything
}

export default PushSubscription;