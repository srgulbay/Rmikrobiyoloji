import React, { useEffect, useState } from 'react';
import { Button } from '@chakra-ui/react';

function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setVisible(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      console.log('Uygulama yüklendi.');
    } else {
      console.log('Yükleme reddedildi.');
    }
    setDeferredPrompt(null);
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <Button
      position="fixed"
      bottom="20px"
      right="20px"
      colorScheme="teal"
      size="md"
      zIndex="1400"
      onClick={handleInstallClick}
    >
      Uygulamayı Yükle
    </Button>
  );
}

export default InstallPrompt;