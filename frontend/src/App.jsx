import React, { useState, useEffect } from 'react';
import { useSocket } from './context/SocketContext';
import Navbar from './components/Navbar';
import Auth from './components/Auth';
import MatchList from './components/MatchList';
import BetSlip from './components/BetSlip';
import UserDashboard from './components/UserDashboard';
import { RefreshCw } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const App = () => {
  const { matches, authenticateSocket } = useSocket();
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [balance, setBalance] = useState(0);
  const [activeTab, setActiveTab] = useState('sportsbook');
  const [activeBetslip, setActiveBetslip] = useState(null);
  const [appLoading, setAppLoading] = useState(true);

  // Fetch user profile if token is present on startup
  useEffect(() => {
    const fetchProfile = async () => {
      if (!token) {
        setAppLoading(false);
        return;
      }

      try {
        const res = await fetch(`${API_URL}/api/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();

        if (res.ok) {
          setUser(data);
          setBalance(data.balance);
          // Authenticate socket for this user
          authenticateSocket(data._id);
        } else {
          // Token expired or invalid
          handleLogout();
        }
      } catch (err) {
        console.error('Error loading profile:', err);
      } finally {
        setAppLoading(false);
      }
    };

    fetchProfile();
  }, [token]);

  const handleAuthSuccess = ({ token, user }) => {
    localStorage.setItem('token', token);
    setToken(token);
    setUser(user);
    setBalance(user.balance);
    authenticateSocket(user._id);
    setActiveTab('sportsbook');
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken('');
    setUser(null);
    setBalance(0);
    setActiveBetslip(null);
    setActiveTab('sportsbook');
  };

  const handleSelectOdds = (match, selection, odds) => {
    if (!user) {
      alert('Please log in or register to place bets.');
      return;
    }

    if (match.status === 'finished') return;

    // Toggle logic: If user clicks the exact same selection, clear the betslip
    if (
      activeBetslip &&
      activeBetslip.matchId === match._id &&
      activeBetslip.selection === selection
    ) {
      setActiveBetslip(null);
    } else {
      setActiveBetslip({
        matchId: match._id,
        homeTeam: match.homeTeam,
        awayTeam: match.awayTeam,
        selection,
        odds,
      });
    }
  };

  const handleBetPlaced = (newBalance) => {
    setBalance(newBalance);
  };

  const handleWalletUpdate = (newBalance) => {
    setBalance(newBalance);
  };

  if (appLoading) {
    return (
      <div className="app-loader">
        <RefreshCw className="spinner text-primary" size={48} />
        <h2>Connecting to Sportsbook...</h2>
      </div>
    );
  }

  return (
    <div className="app-wrapper">
      <Navbar
        user={user}
        balance={balance}
        onLogout={handleLogout}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      <main className="main-content">
        {!user ? (
          <Auth onAuthSuccess={handleAuthSuccess} />
        ) : (
          <>
            {activeTab === 'sportsbook' ? (
              <div className="sportsbook-layout">
                <div className="sportsbook-matches-col">
                  <MatchList
                    matches={matches}
                    activeBetslip={activeBetslip}
                    onSelectOdds={handleSelectOdds}
                  />
                </div>
                <div className="sportsbook-betslip-col">
                  <BetSlip
                    activeBetslip={activeBetslip}
                    onClear={() => setActiveBetslip(null)}
                    userToken={token}
                    walletBalance={balance}
                    onBetPlaced={handleBetPlaced}
                  />
                </div>
              </div>
            ) : (
              <UserDashboard
                userToken={token}
                walletBalance={balance}
                onWalletUpdate={handleWalletUpdate}
              />
            )}
          </>
        )}
      </main>

      <footer className="app-footer">
        <p>© 2026 ApexBet Live Gaming Inc. Simulated Sandbox Sportsbook.</p>
      </footer>
    </div>
  );
};

export default App;
