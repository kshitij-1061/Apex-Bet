import React, { useState } from 'react';
import { useSocket } from '../context/SocketContext';
import { Bell, Wallet, LogOut, User as UserIcon, X, Trophy } from 'lucide-react';

const Navbar = ({ user, balance, onLogout, activeTab, setActiveTab }) => {
  const { betNotifications, removeNotification } = useSocket();
  const [showNotifications, setShowNotifications] = useState(false);

  const unreadCount = betNotifications.length;

  return (
    <nav className="navbar">
      <div className="nav-container">
        <div className="nav-brand" onClick={() => setActiveTab('sportsbook')}>
          <Trophy className="brand-icon" />
          <span className="brand-text">APEX</span>
          <span className="brand-accent">BET</span>
        </div>

        {user && (
          <div className="nav-menu">
            <button
              className={`nav-link ${activeTab === 'sportsbook' ? 'active' : ''}`}
              onClick={() => setActiveTab('sportsbook')}
            >
              Sportsbook
            </button>
            <button
              className={`nav-link ${activeTab === 'dashboard' ? 'active' : ''}`}
              onClick={() => setActiveTab('dashboard')}
            >
              My Bets & Wallet
            </button>
          </div>
        )}

        <div className="nav-actions">
          {user ? (
            <>
              {/* Wallet Info */}
              <div className="nav-wallet">
                <Wallet className="wallet-icon" />
                <span className="wallet-balance">${balance.toFixed(2)}</span>
              </div>

              {/* Notification Bell */}
              <div className="notification-bell-container">
                <button
                  className={`bell-btn ${unreadCount > 0 ? 'pulse' : ''}`}
                  onClick={() => setShowNotifications(!showNotifications)}
                >
                  <Bell className="bell-icon" />
                  {unreadCount > 0 && <span className="bell-badge">{unreadCount}</span>}
                </button>

                {showNotifications && (
                  <div className="notification-dropdown">
                    <div className="dropdown-header">
                      <h3>Activity Feed</h3>
                      <button onClick={() => setShowNotifications(false)}>
                        <X size={16} />
                      </button>
                    </div>
                    <div className="dropdown-body">
                      {betNotifications.length === 0 ? (
                        <p className="no-notifications">No recent notifications</p>
                      ) : (
                        betNotifications.map((notif) => (
                          <div
                            key={notif.id}
                            className={`notification-item ${notif.status === 'won' ? 'won' : 'lost'}`}
                          >
                            <div className="notification-item-header">
                              <span className={`status-pill ${notif.status}`}>
                                {notif.status === 'won' ? 'WON' : 'LOST'}
                              </span>
                              <button onClick={() => removeNotification(notif.id)}>
                                <X size={12} />
                              </button>
                            </div>
                            <p className="notification-message">
                              {notif.status === 'won' ? (
                                <>
                                  You won <strong>${notif.payout.toFixed(2)}</strong> on{' '}
                                  {notif.matchTitle}!
                                </>
                              ) : (
                                <>Your bet on {notif.matchTitle} was unsettled as a loss.</>
                              )}
                            </p>
                            <span className="notification-time">Just now</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* User Profile */}
              <div className="nav-profile">
                <UserIcon size={16} />
                <span className="profile-name">{user.name}</span>
              </div>

              {/* Logout */}
              <button className="logout-btn" onClick={onLogout} title="Logout">
                <LogOut size={18} />
              </button>
            </>
          ) : (
            <span className="nav-slogan">Secure Real-time Virtual Betting</span>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
