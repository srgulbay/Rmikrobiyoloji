import React, { useState, useEffect } from 'react';
import { Outlet, Link, NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useColorMode } from '@chakra-ui/react';
import { FaSignInAlt, FaUserPlus, FaSignOutAlt, FaSun, FaMoon, FaBars, FaTimes } from 'react-icons/fa';

function Layout() {
  const { isAuthenticated, user, logout } = useAuth();
  const { colorMode, toggleColorMode } = useColorMode();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    document.body.classList.toggle('dark-mode', colorMode === 'dark');
    // Mobil menü açıkken body scroll'u engelleme
    document.body.classList.toggle('mobile-menu-active', isMobileMenuOpen);
    // Cleanup function to remove the class if component unmounts while menu is open
    return () => {
        document.body.classList.remove('mobile-menu-active');
    };
  }, [colorMode, isMobileMenuOpen]); // isMobileMenuOpen'ı bağımlılıklara ekle

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const handleLogout = () => {
    logout();
    setIsMobileMenuOpen(false);
  };

  const handleNavLinkClick = () => {
      setIsMobileMenuOpen(false);
  }

  const getNavLinkClass = ({ isActive }) => isActive ? 'nav-link active' : 'nav-link';
  const getMobileNavLinkClass = ({ isActive }) => isActive ? 'mobile-nav-link active' : 'mobile-nav-link';

  // Tema Değiştirici Butonunu ayrı bir component yapalım (tekrarı önlemek için)
   const ThemeToggleButton = ({ className = '' }) => (
       <button
           onClick={toggleColorMode}
           className={`btn btn-ghost btn-sm theme-toggle ${className}`}
           title={colorMode === 'light' ? 'Koyu Tema' : 'Açık Tema'}
           aria-label="Temayı Değiştir"
       >
           {colorMode === 'light' ? <FaMoon /> : <FaSun />}
       </button>
   );

  return (
    // app-layout sınıfı artık body'e eklenen sınıfla yönetiliyor
    <div className='app-layout'>
      <header className="main-header">
        <div className="container header-container">
          <div className="logo">
            <Link to="/browse">mikRobiyoloji</Link>
          </div>

          {/* Desktop Navigasyon Linkleri */}
          <nav className="nav-links desktop-nav">
            <NavLink to="/browse" className={getNavLinkClass}>Konular</NavLink>
            {isAuthenticated && user?.role === 'admin' && (
              <NavLink to="/admin" className={getNavLinkClass}>Yönetim Paneli</NavLink>
            )}
            {isAuthenticated && (
              <NavLink to="/solve" className={getNavLinkClass}>Soru Çöz</NavLink>
            )}
            {isAuthenticated && (
              <NavLink to="/my-stats" className={getNavLinkClass}>İstatistiklerim</NavLink>
            )}
            {isAuthenticated && (
              <NavLink to="/wordle-game" className={getNavLinkClass}>Kelime Oyunu</NavLink>
            )}
          </nav>

          {/* Sağ Taraf Kontroller */}
          <div className="header-right-controls">
            {/* Tema Değiştirici (Sadece Desktop'ta header'da) */}
            <div className="desktop-nav"> {/* desktop-nav ile sarmala */}
                 <ThemeToggleButton />
             </div>

            {/* Kullanıcı Menüsü (Desktop) */}
            <div className="user-menu desktop-nav">
              {isAuthenticated ? (
                <>
                  <span className="user-info" title={`Rol: ${user?.role} / Uzmanlık: ${user?.specialization || 'Belirtilmemiş'}`}>
                    Hoşgeldin, {user?.username || 'Kullanıcı'}!
                  </span>
                  <button
                    onClick={handleLogout}
                    className="btn btn-ghost btn-sm"
                    title="Çıkış Yap"
                    aria-label="Çıkış Yap"
                  >
                    <FaSignOutAlt />
                  </button>
                </>
              ) : (
                <>
                  <NavLink to="/login" className="btn btn-secondary btn-sm">
                     <FaSignInAlt className='btn-icon' /> Giriş Yap
                  </NavLink>
                  <NavLink to="/register" className="btn btn-primary btn-sm">
                      <FaUserPlus className='btn-icon' /> Kayıt Ol
                  </NavLink>
                </>
              )}
            </div>

            {/* Hamburger Butonu (Sadece Mobilde) */}
            <button
              className="hamburger-btn" // Bu sınıf mobilde gösterilecek
              onClick={toggleMobileMenu}
              aria-label="Menüyü Aç/Kapat"
              aria-expanded={isMobileMenuOpen}
            >
              {isMobileMenuOpen ? <FaTimes /> : <FaBars />}
            </button>
          </div>

        </div>
      </header>

       {/* Mobil Menü */}
      <div className={`mobile-menu ${isMobileMenuOpen ? 'is-open' : ''}`}>
          {/* Mobil Menü Kapatma Butonu (İsteğe Bağlı) */}
          {/* <button className="mobile-menu-close" onClick={toggleMobileMenu}><FaTimes /></button> */}

          <nav className='mobile-nav-links'>
             <NavLink to="/browse" className={getMobileNavLinkClass} onClick={handleNavLinkClick}>Konular</NavLink>
             {isAuthenticated && user?.role === 'admin' && (
               <NavLink to="/admin" className={getMobileNavLinkClass} onClick={handleNavLinkClick}>Yönetim Paneli</NavLink>
             )}
             {isAuthenticated && (
               <NavLink to="/solve" className={getMobileNavLinkClass} onClick={handleNavLinkClick}>Soru Çöz</NavLink>
             )}
             {isAuthenticated && (
               <NavLink to="/my-stats" className={getMobileNavLinkClass} onClick={handleNavLinkClick}>İstatistiklerim</NavLink>
             )}
             {isAuthenticated && (
               <NavLink to="/wordle-game" className={getNavLinkClass}>Kelime Oyunu</NavLink>
             )}
          </nav>

           <div className='mobile-user-menu'>
             {/* TEMA DEĞİŞTİRİCİ BURAYA TAŞINDI */}
             <div className='mobile-theme-toggle-container'>
                <span>Tema:</span>
                <ThemeToggleButton />
             </div>

             {isAuthenticated ? (
                 <>
                    <span className="user-info"> {user?.username || 'Kullanıcı'} ({user?.role})</span>
                     <button onClick={handleLogout} className="btn btn-danger btn-sm w-full mt-4">
                         <FaSignOutAlt className='btn-icon'/> Çıkış Yap
                     </button>
                 </>
             ) : (
                 <div className='d-flex flex-col gap-3 mt-4'> {/* mt-4 eklendi */}
                     <NavLink to="/login" className="btn btn-secondary w-full" onClick={handleNavLinkClick}>
                         <FaSignInAlt className='btn-icon' /> Giriş Yap
                     </NavLink>
                     <NavLink to="/register" className="btn btn-primary w-full" onClick={handleNavLinkClick}>
                         <FaUserPlus className='btn-icon' /> Kayıt Ol
                     </NavLink>
                 </div>
             )}
           </div>
      </div>
      {/* Mobil menü açıkken arka planı karartmak için overlay */}
      {isMobileMenuOpen && <div className="mobile-menu-overlay" onClick={toggleMobileMenu}></div>}

      <main className="main-content">
          <Outlet />
      </main>

    </div>
  );
}

export default Layout;
