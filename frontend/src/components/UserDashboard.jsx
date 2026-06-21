import React, { useState, useEffect } from 'react';
import { ArrowDownLeft, ArrowUpRight, Award, History, Landmark, ShieldCheck } from 'lucide-react';
const UserDashboard = ({ userToken, walletBalance, onWalletUpdate }) => {
  const [activeTab, setActiveTab] = useState('bets');
  const [bets, setBets] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [depositAmount, setDepositAmount] = useState('100');
  const [withdrawAmount, setWithdrawAmount] = useState('50');
  const [walletLoading, setWalletLoading] = useState(false);
  const [walletMessage, setWalletMessage] = useState({ text: '', type: '' });
  const [loadingHistory, setLoadingHistory] = useState(false);
  const fetchHistory = async () => {
    setLoadingHistory(true);
    try {
      // Fetch Bets
      const betsRes = await fetch('http://localhost:5000/api/bets', {
        headers: { Authorization: `Bearer ${userToken}` },
      });
      const betsData = await betsRes.json();
      if (betsRes.ok) setBets(betsData);
      // Fetch Transactions
      const txRes = await fetch('http://localhost:5000/api/wallet/transactions', {
        headers: { Authorization: `Bearer ${userToken}` },
      });
      const txData = await txRes.json();
      if (txRes.ok) setTransactions(txData);
    } catch (err) {
      console.error('Error fetching dashboard history:', err);
    } finally {
      setLoadingHistory(false);
    }
  };
  useEffect(() => {
    fetchHistory();
  }, [userToken, walletBalance]); // Re-fetch on wallet actions
  const handleWalletAction = async (action) => {
    setWalletLoading(true);
    setWalletMessage({ text: '', type: '' });
    
    const amount = action === 'deposit' ? depositAmount : withdrawAmount;
    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      setWalletMessage({ text: 'Please enter a valid amount', type: 'error' });
      setWalletLoading(false);
      return;
    }
    try {
      const response = await fetch(`http://localhost:5000/api/wallet/${action}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userToken}`,
        },
        body: JSON.stringify({ amount: numericAmount }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Transaction failed');
      }
      setWalletMessage({
        text: `Successfully ${action === 'deposit' ? 'deposited' : 'withdrawn'} $${numericAmount.toFixed(2)}`,
        type: 'success',
      });
      onWalletUpdate(data.balance);
      if (action === 'deposit') setDepositAmount('100');
      else setWithdrawAmount('50');
    } catch (err) {
      setWalletMessage({ text: err.message, type: 'error' });
    } finally {
      setWalletLoading(false);
    }
  };
  const getSelectionName = (bet) => {
    if (!bet.matchId) return bet.selection.toUpperCase();
    if (bet.selection === 'home') return bet.matchId.homeTeam;
    if (bet.selection === 'away') return bet.matchId.awayTeam;
    return 'Draw';
  };
  return (
    <div className="dashboard-container">
      {/* Sidebar Navigation */}
      <div className="dashboard-tabs">
        <button
          className={`dash-tab-btn ${activeTab === 'bets' ? 'active' : ''}`}
          onClick={() => { setActiveTab('bets'); setWalletMessage({ text: '', type: '' }); }}
        >
          <Award size={18} />
          <span>My Bets ({bets.length})</span>
        </button>
        <button
          className={`dash-tab-btn ${activeTab === 'wallet' ? 'active' : ''}`}
          onClick={() => { setActiveTab('wallet'); setWalletMessage({ text: '', type: '' }); }}
        >
          <Landmark size={18} />
          <span>Mock Wallet</span>
        </button>
        <button
          className={`dash-tab-btn ${activeTab === 'transactions' ? 'active' : ''}`}
          onClick={() => { setActiveTab('transactions'); setWalletMessage({ text: '', type: '' }); }}
        >
          <History size={18} />
          <span>Ledger History</span>
        </button>
      </div>
      {/* Main Panel Content */}
      <div className="dashboard-content-panel">
        {loadingHistory && <div className="loading-spinner-overlay"><span className="spinner"></span></div>}
        {/* --- TABS: MY BETS --- */}
        {activeTab === 'bets' && (
          <div className="bets-history-section">
            <h2 className="panel-title">Your Bets</h2>
            {bets.length === 0 ? (
              <div className="empty-panel-state">
                <Award size={48} className="dimmed-icon" />
                <p>You haven't placed any bets yet.</p>
              </div>
            ) : (
              <div className="bets-history-list">
                {bets.map((bet) => (
                  <div key={bet._id} className={`bet-history-card border-${bet.status}`}>
                    <div className="card-top">
                      <div className="match-title-row">
                        <strong>
                          {bet.matchId
                            ? `${bet.matchId.homeTeam} vs ${bet.matchId.awayTeam}`
                            : 'Archived Match'}
                        </strong>
                        <span className={`bet-status-pill ${bet.status}`}>{bet.status.toUpperCase()}</span>
                      </div>
                      <span className="bet-sport-type">
                        {bet.matchId ? bet.matchId.sport : 'Game'} • Placed on{' '}
                        {new Date(bet.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <div className="card-bottom">
                      <div className="stat-box">
                        <span className="stat-label">Selection</span>
                        <span className="stat-value">{getSelectionName(bet)}</span>
                      </div>
                      <div className="stat-box">
                        <span className="stat-label">Odds Locked</span>
                        <span className="stat-value">@{bet.oddsAtPlacement.toFixed(2)}</span>
                      </div>
                      <div className="stat-box">
                        <span className="stat-label">Stake</span>
                        <span className="stat-value">${bet.stake.toFixed(2)}</span>
                      </div>
                      <div className="stat-box">
                        <span className="stat-label">
                          {bet.status === 'won' ? 'Payout' : 'Potential Payout'}
                        </span>
                        <span className={`stat-value ${bet.status === 'won' ? 'text-win' : ''}`}>
                          ${bet.potentialPayout.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        {/* --- TABS: MOCK WALLET --- */}
        {activeTab === 'wallet' && (
          <div className="wallet-management-section">
            <h2 className="panel-title">Virtual Wallet Management</h2>
            {/* Current Balance Display */}
            <div className="wallet-card-display">
              <span className="card-label">Available Virtual Balance</span>
              <h1 className="card-val">${walletBalance.toFixed(2)}</h1>
              <div className="trust-disclaimer">
                <ShieldCheck size={16} />
                <span>Simulated Sandbox Environment. No real payments are processed.</span>
              </div>
            </div>
            {walletMessage.text && (
              <div className={`wallet-alert-box ${walletMessage.type}`}>
                {walletMessage.text}
              </div>
            )}
            {/* Wallet Forms */}
            <div className="wallet-controls-grid">
              {/* Deposit Form */}
              <div className="wallet-form-card">
                <h3> Deposit</h3>
                <p>Instantly add virtual funds to play with (max $10,000).</p>
                <div className="form-row">
                  <div className="input-group">
                    <span className="currency-prefix">$</span>
                    <input
                      type="number"
                      min="1"
                      value={depositAmount}
                      onChange={(e) => setDepositAmount(e.target.value)}
                      placeholder="Amount"
                    />
                  </div>
                  <button
                    className="action-btn-deposit"
                    onClick={() => handleWalletAction('deposit')}
                    disabled={walletLoading}
                  >
                    <ArrowDownLeft size={16} />
                    <span>Deposit</span>
                  </button>
                </div>
              </div>
              {/* Withdraw Form */}
              <div className="wallet-form-card">
                <h3> Withdrawal</h3>
                <p>Withdraw earnings back out of your profile balance.</p>
                <div className="form-row">
                  <div className="input-group">
                    <span className="currency-prefix">$</span>
                    <input
                      type="number"
                      min="1"
                      value={withdrawAmount}
                      onChange={(e) => setWithdrawAmount(e.target.value)}
                      placeholder="Amount"
                    />
                  </div>
                  <button
                    className="action-btn-withdraw"
                    onClick={() => handleWalletAction('withdraw')}
                    disabled={walletLoading}
                  >
                    <ArrowUpRight size={16} />
                    <span>Withdraw</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        {/* --- TABS: LEDGER HISTORY --- */}
        {activeTab === 'transactions' && (
          <div className="ledger-section">
            <h2 className="panel-title">Wallet Transaction Ledger</h2>
            {transactions.length === 0 ? (
              <div className="empty-panel-state">
                <History size={48} className="dimmed-icon" />
                <p>No transaction logs found.</p>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="ledger-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Type</th>
                      <th>Amount</th>
                      <th>New Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((tx) => (
                      <tr key={tx._id}>
                        <td>{new Date(tx.createdAt).toLocaleString()}</td>
                        <td>
                          <span className={`tx-type-pill ${tx.type}`}>
                            {tx.type.replace('_', ' ').toUpperCase()}
                          </span>
                        </td>
                        <td className={tx.amount > 0 ? 'text-win font-semibold' : 'font-semibold'}>
                          {tx.amount > 0 ? `+$${tx.amount.toFixed(2)}` : `-$${Math.abs(tx.amount).toFixed(2)}`}
                        </td>
                        <td>${tx.balanceAfter.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
export default UserDashboard;