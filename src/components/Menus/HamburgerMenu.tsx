import React from 'react';
import { useUIStore } from '@/stores/uiStore';
import { RecentFiles } from './RecentFiles';
import './Menu.css';

export const HamburgerMenu: React.FC = () => {
  const { menus, closeAllMenus } = useUIStore();
  const isOpen = menus.hamburgerMenu;

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="menu-backdrop" onClick={closeAllMenus} />

      {/* Menu Panel */}
      <div className="hamburger-menu">
        <div className="menu-header">
          <h2>Menu</h2>
          <button className="close-button" onClick={closeAllMenus}>
            ✕
          </button>
        </div>

        <div className="menu-content">
          <RecentFiles />
        </div>
      </div>
    </>
  );
};
