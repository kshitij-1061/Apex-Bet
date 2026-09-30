import React, { useState, useEffect } from 'react';
import { X, Trash2, ArrowUpRight, CheckCircle2 } from 'lucide-react';
const BetSlip = ({ activeBetslip, onClear, userToken, onBetPlaced, walletBalance }) => {
  const [stake, setStake] = useState('10');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [placedBetDetails, setPlacedBetDetails] = useState(null);
  // Clear success messages or errors when selection changes
  useEffect(() => {
    setError('');
    setSuccess(false);
    setPlacedBetDetails(null);
  }, [activeBetslip]);
  if (!activeBetslip) {
    return (
      <div className="betslip-panel empty">
        <div className="betslip-header">
          <h2>Betting Slip</h2>
        </div>
        <div className="betslip-empty-state">
          <ArrowUpRight size={36} />
          <p>Select odds from a match to build your bet slip</p>
        </div>
      </div>
    );
  }
  const { matchId, homeTeam, awayTeam, selection, odds } = activeBetslip;
  const numericStake = parseFloat(stake) || 0;
  const potentialPayout = Math.round(numericStake * odds * 100) / 100;
  const handlePlaceBet = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    if (numericStake <= 0) {
      setError('Please enter a valid stake amount.');
      return;
    }
    if (numericStake > walletBalance) {
      setError('Insufficient wallet balance to place this bet.');
      return;
    }
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    try {
      const response = await fetch(`${API_URL}/api/bets/place`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userToken}`,
        },
        body: JSON.stringify({
          matchId,
          selection,
          stake: numericStake,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Error placing bet');
      }
      setSuccess(true);
      setPlacedBetDetails(data.bet);
      // Trigger user profile updates
      onBetPlaced(data.balance);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  const getSelectionName = (select) => {
    if (select === 'home') return homeTeam;
    if (select === 'away') return awayTeam;
    return 'Draw';
  };
  return (
    <div className="betslip-panel">
      <div className="betslip-header">
        <h2>Betting Slip</h2>
        <button className="clear-slip-btn" onClick={onClear} title="Clear Slip">
          <Trash2 size={16} />
        </button>
      </div>
      <div className="betslip-content">
        {success && placedBetDetails ? (
          <div className="betslip-success-card">
            <CheckCircle2 className="success-icon" size={32} />
            <h3>Bet Placed Successfully!</h3>
            <div className="receipt-details">
              <div className="receipt-row">
                <span>Event:</span>
                <strong>{homeTeam} vs {awayTeam}</strong>
              </div>
              <div className="receipt-row">
                <span>Selection:</span>
                <strong>{getSelectionName(selection)}</strong>
              </div>
              <div className="receipt-row">
                <span>Locked Odds:</span>
                <strong className="odds-label-receipt">{odds.toFixed(2)}</strong>
              </div>
              <div className="receipt-row">
                <span>Stake:</span>
                <strong>${placedBetDetails.stake.toFixed(2)}</strong>
              </div>
              <div className="receipt-row">
                <span>Est. Payout:</span>
                <strong className="payout-accent">${placedBetDetails.potentialPayout.toFixed(2)}</strong>
              </div>
            </div>
            <button className="dismiss-success-btn" onClick={onClear}>
              Ready for Next Bet
            </button>
          </div>
        ) : (
          <form onSubmit={handlePlaceBet} className="betslip-form">
            {error && <div className="betslip-error-msg">{error}</div>}
            <div className="slip-item">
              <div className="slip-item-header">
                <span className="slip-selection">{getSelectionName(selection)}</span>
                <button type="button" className="remove-item-btn" onClick={onClear}>
                  <X size={14} />
                </button>
              </div>
              <span className="slip-match-title">{homeTeam} vs {awayTeam}</span>
              <div className="slip-odds-row">
                <span className="market-name">Match Result</span>
                <span className="slip-odds-value">@ {odds.toFixed(2)}</span>
              </div>
            </div>
            {/* Bet Input Controls */}
            <div className="stake-input-container">
              <label>Stake Amount ($)</label>
              <div className="input-group">
                <span className="currency-prefix">$</span>
                <input
                  type="number"
                  min="1"
                  step="any"
                  value={stake}
                  onChange={(e) => setStake(e.target.value)}
                  placeholder="0.00"
                  required
                />
              </div>
              
              {/* Quick stakes */}
              <div className="quick-stake-buttons">
                {['5', '10', '25', '50', '100'].map((val) => (
                  <button
                    key={val}
                    type="button"
                    className={`quick-stake-btn ${stake === val ? 'active' : ''}`}
                    onClick={() => setStake(val)}
                  >
                    +${val}
                  </button>
                ))}
              </div>
            </div>
            {/* Summary calculations */}
            <div className="betslip-summary">
              <div className="summary-row">
                <span>Stake:</span>
                <span>${numericStake.toFixed(2)}</span>
              </div>
              <div className="summary-row payout">
                <span>Potential Payout:</span>
                <span className="payout-value">${potentialPayout.toFixed(2)}</span>
              </div>
            </div>
            {/* Submit Button */}
            <button type="submit" className="place-bet-btn" disabled={loading}>
              {loading ? <span className="spinner"></span> : 'CONFIRM & PLACE BET'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
export default BetSlip;
