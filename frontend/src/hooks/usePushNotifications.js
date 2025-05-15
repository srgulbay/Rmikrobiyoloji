import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
const PUBLIC_VAPID_KEY_FROM_ENV = import.meta.env.VITE_PUBLIC_VAPID_KEY;
const arr = urlBase64ToUint8Array(import.meta.env.VITE_PUBLIC_VAPID_KEY);

function urlBase64ToUint8Array(base64String) {
  if (!base64String) return null;
  try {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  } catch (e) {
    console.error("urlBase64ToUint8Array HATA:", e, "Gelen base64String:", base64String);
    return null;
  }
}

function usePushNotifications() {
  const { token } = useAuth();
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscriptionError, setSubscriptionError] = useState(null);
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState('default');
  const [isCheckingSubscription, setIsCheckingSubscription] = useState(true);

  useEffect(() => {
    if ('Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window) {
      setIsSupported(true);
      setPermission(Notification.permission);
    } else {
      setIsSupported(false);
      setIsCheckingSubscription(false);
      console.warn('Push bildirimleri veya Service Worker bu tarayıcıda desteklenmiyor.');
    }
  }, []);

  const getServiceWorkerRegistration = useCallback(async () => {
    if (!isSupported) return null;
    try {
        const registration = await navigator.serviceWorker.getRegistration();
        if (!registration) {
            console.warn("Service Worker kaydı bulunamadı. /sw.js doğru kaydedildi mi ve kapsamı doğru mu?");
            // Yeni bir SW kaydetmeyi deneyebiliriz, eğer yoksa veya güncel değilse
            // Ancak bu genellikle uygulamanın ana girişinde yapılır.
            // const newRegistration = await navigator.serviceWorker.register('/sw.js');
            // console.log("Yeni SW kaydı denendi:", newRegistration);
            // return newRegistration;
            return null;
        }
        return registration;
    } catch (e) {
        console.error("Service Worker registration alınırken hata:", e);
        return null;
    }
  }, [isSupported]);

  useEffect(() => {
    if (!isSupported || !token) {
        setIsCheckingSubscription(false);
        if (!token) setIsSubscribed(false); // Token yoksa abone değil varsay
        return;
    }
    const checkSubscription = async () => {
      setIsCheckingSubscription(true);
      setSubscriptionError(null);
      try {
        const registration = await getServiceWorkerRegistration();
        if (!registration || !registration.pushManager) {
            setIsSubscribed(false); setIsCheckingSubscription(false);
            console.warn("PushManager kullanılamıyor veya SW registration yok.");
            return;
        }
        const currentSubscription = await registration.pushManager.getSubscription();
        if (currentSubscription) {
          setIsSubscribed(true);
          console.log('Mevcut aktif push aboneliği bulundu:', currentSubscription.endpoint);
        } else {
          setIsSubscribed(false);
        }
      } catch (error) {
        console.error('Mevcut abonelik kontrol edilirken hata:', error);
        setIsSubscribed(false);
      } finally {
        setIsCheckingSubscription(false);
      }
    };
    checkSubscription();
  }, [isSupported, getServiceWorkerRegistration, token]);

  const subscribeUser = useCallback(async () => {
    console.log("📢 subscribeUser çağrıldı.");
    console.log("ENV'den okunan VITE_PUBLIC_VAPID_KEY:", PUBLIC_VAPID_KEY_FROM_ENV);

    if (!PUBLIC_VAPID_KEY_FROM_ENV || typeof PUBLIC_VAPID_KEY_FROM_ENV !== 'string' || PUBLIC_VAPID_KEY_FROM_ENV.trim() === '') {
      const errMsg = 'HATA: PUBLIC_VAPID_KEY ortam değişkeni bulunamadı, tanımsız veya boş. Lütfen .env dosyanızı ve Vite ayarlarınızı kontrol edin.';
      console.error(errMsg);
      setSubscriptionError(errMsg);
      return false;
    }
    if (!isSupported) {
      setSubscriptionError('Push bildirimleri bu tarayıcıda desteklenmiyor.');
      return false;
    }
    if (!token) {
        setSubscriptionError('Abonelik için giriş yapmalısınız.');
        return false;
    }

    setSubscriptionError(null);
    setIsCheckingSubscription(true);

    try {
      const registration = await getServiceWorkerRegistration();
      if (!registration || !registration.pushManager) {
        throw new Error('Service worker veya PushManager hazır değil/bulunamadı.');
      }

      let currentPermission = Notification.permission;
      if (currentPermission === 'default') {
        console.log("Bildirim izni isteniyor...");
        currentPermission = await Notification.requestPermission();
      }
      setPermission(currentPermission);

      if (currentPermission !== 'granted') {
        console.warn('Push bildirim izni verilmedi (' + currentPermission + ').');
        setSubscriptionError('Push bildirimlerine izin vermeniz gerekmektedir.');
        setIsCheckingSubscription(false);
        return false;
      }
      console.log("Bildirim izni verildi.");

      const applicationServerKey = urlBase64ToUint8Array(PUBLIC_VAPID_KEY_FROM_ENV);
      if (!applicationServerKey) {
          throw new Error('VAPID public key Uint8Array formatına dönüştürülemedi.');
      }
      console.log("applicationServerKey oluşturuldu.");

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey,
      });
      
      console.log('Yeni push aboneliği oluşturuldu (tarayıcı):', subscription.endpoint);
      
      await axios.post(`${API_BASE_URL}/api/push/subscribe`, subscription.toJSON(), {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      console.log('Abonelik backend\'e başarıyla gönderildi.');
      setIsSubscribed(true);
      return true;

    } catch (error) {
      console.error('Push aboneliği sırasında KAPSAMLI HATA:', error);
      setSubscriptionError(`Abonelik hatası: ${error.message} (Hata Adı: ${error.name})`);
      setIsSubscribed(false);
      return false;
    } finally {
        setIsCheckingSubscription(false);
    }
  }, [isSupported, token, getServiceWorkerRegistration]);

  const unsubscribeUser = useCallback(async () => { 
    if (!isSupported || !token) {
        console.warn('Abonelikten çıkılamıyor: Destek yok veya token eksik.');
        return false;
    }
    setSubscriptionError(null);
    setIsCheckingSubscription(true);
    try {
      const registration = await getServiceWorkerRegistration();
      if (!registration || !registration.pushManager) throw new Error('Service worker veya PushManager hazır değil.');
      const currentSubscription = await registration.pushManager.getSubscription();
      if (currentSubscription) {
        const successfulUnsubscribe = await currentSubscription.unsubscribe();
        if (successfulUnsubscribe) {
          console.log('Kullanıcı abonelikten çıkarıldı (tarayıcı tarafı).');
          try {
            await axios.post(`${API_BASE_URL}/api/push/unsubscribe`, 
              { endpoint: currentSubscription.endpoint }, 
              { headers: { Authorization: `Bearer ${token}` } }
            );
            console.log('Abonelik backend\'den de silindi.');
          } catch (backendError) { console.error('Abonelik backend\'den silinirken hata:', backendError); }
          setIsSubscribed(false);
          return true;
        } else { throw new Error('Tarayıcı abonelikten çıkma işlemi başarısız oldu.'); }
      } else {
        console.log('Silinecek aktif bir abonelik bulunamadı.');
        setIsSubscribed(false); return true;
      }
    } catch (error) {
      console.error('Abonelikten çıkılırken KAPSAMLI HATA:', error);
      setSubscriptionError(`Abonelikten çıkılırken bir hata oluştu: ${error.message}`);
      return false;
    } finally { setIsCheckingSubscription(false); }
  }, [isSupported, token, getServiceWorkerRegistration]);

  return {
    isSupported, isSubscribed, subscribeUser, unsubscribeUser, permission, 
    subscriptionError, isCheckingSubscription,
    requestPermissionAgain: async () => {
        if (!isSupported) {
            setSubscriptionError("Push bildirimleri bu tarayıcıda desteklenmiyor.");
            return null;
        }
        if (permission === 'denied') {
            setSubscriptionError("Bildirim izni daha önce reddedilmiş. Lütfen tarayıcı ayarlarından site için bildirimlere izin verin ve sayfayı yenileyin.");
            return null;
        }
        const newPermission = await Notification.requestPermission();
        setPermission(newPermission);
        if (newPermission === 'granted') {
            // İzin alındıktan sonra otomatik abone olmayı deneyebiliriz
            await subscribeUser();
        }
        return newPermission;
    }
  };
}

export default usePushNotifications;
