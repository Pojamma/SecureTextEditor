import React from 'react';
import { useUIStore } from '@/stores/uiStore';
import { FileMenu } from './FileMenu';
import { EditMenu } from './EditMenu';
import { ViewMenu } from './ViewMenu';
import { SecurityMenu } from './SecurityMenu';
import { ToolsMenu } from './ToolsMenu';
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
          <FileMenu />
          <EditMenu />
          <ViewMenu />
          <SecurityMenu />
          <ToolsMenu />
        </div>
      </div>
    </>
  );
};
