import { useMemo, useState } from 'react'
import './App.css'

const SPORTS = ['All', 'Cricket', 'Football', 'Basketball', 'Tennis']

const MATCHES = [
  {
    id: 1,
    sport: 'Cricket',
    status: 'Ongoing',
    teams: ['Mumbai Meteors', 'Delhi Strikers'],
    score: '178/4 (18.2) vs 172/8 (20.0)',
    startsAt: 'Live now',
    viewers: 16200,
    trend: '+8.4%',
    marketCap: '₹12.4M',
  },
  {
    id: 2,
    sport: 'Football',
    status: 'Ongoing',
    teams: ['Madrid Royals', 'London Lions'],
    score: '2 - 1 (74\')',
    startsAt: 'Live now',
    viewers: 11870,
    trend: '+3.2%',
    marketCap: '₹8.9M',
  },
  {
    id: 3,
    sport: 'Cricket',
    status: 'Upcoming',
    teams: ['Bengal Tigers', 'Punjab Rockets'],
    score: 'Starts in 1h 40m',
    startsAt: 'Today, 8:30 PM',
    viewers: 7420,
    trend: '+1.9%',
    marketCap: '₹7.1M',
  },
  {
    id: 4,
    sport: 'Football',
    status: 'Upcoming',
    teams: ['Sydney Sharks', 'Tokyo Blades'],
    score: 'Starts in 2h 20m',
    startsAt: 'Today, 10:15 PM',
    viewers: 5340,
    trend: '+2.4%',
    marketCap: '₹6.3M',
  },
  {
    id: 5,
    sport: 'Basketball',
    status: 'Ongoing',
    teams: ['LA Comets', 'Miami Storm'],
    score: '89 - 92 (Q4 06:21)',
    startsAt: 'Live now',
    viewers: 8610,
    trend: '-0.8%',
    marketCap: '₹5.5M',
  },
]

const INITIAL_USERS = [
  { id: 'u1', name: 'Aarav', wallet: 5400 },
  { id: 'u2', name: 'Misbah', wallet: 8200 },
  { id: 'u3', name: 'Riya', wallet: 3150 },
]

const INITIAL_REQUESTS = [
  {
    id: 'REQ-1001',
    userId: 'u2',
    userName: 'Misbah',
    amount: 1500,
    upiRef: 'UTR8945612301',
    phone: '98XXXXXX21',
    screenshotName: 'payment-proof.png',
    status: 'Pending',
    createdAt: 'Today, 4:18 PM',
  },
]

function formatCurrency(value) {
  return `₹${value.toLocaleString('en-IN')}`
}

function App() {
  const [activeView, setActiveView] = useState('Market')
  const [selectedSport, setSelectedSport] = useState('All')
  const [marketFilter, setMarketFilter] = useState('All')
  const [bidAmount, setBidAmount] = useState(1500)

  const [users, setUsers] = useState(INITIAL_USERS)
  const [currentUserId, setCurrentUserId] = useState('u2')
  const [requests, setRequests] = useState(INITIAL_REQUESTS)

  const [addMoneyOpen, setAddMoneyOpen] = useState(false)
  const [formData, setFormData] = useState({
    amount: '1000',
    payerName: 'Misbah',
    upiRef: '',
    phone: '',
    screenshotName: '',
  })

  const currentUser = users.find((user) => user.id === currentUserId) || users[0]

  const filteredMatches = useMemo(() => {
    return MATCHES.filter((match) => {
      const matchSport = selectedSport === 'All' || match.sport === selectedSport
      const matchStatus = marketFilter === 'All' || match.status === marketFilter
      return matchSport && matchStatus
    })
  }, [selectedSport, marketFilter])

  const ongoingCount = MATCHES.filter((match) => match.status === 'Ongoing').length
  const upcomingCount = MATCHES.filter((match) => match.status === 'Upcoming').length

  const pendingRequests = requests.filter((request) => request.status === 'Pending')

  const handleFormValue = (event) => {
    const { name, value } = event.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleProofUpload = (event) => {
    const file = event.target.files?.[0]
    setFormData((prev) => ({ ...prev, screenshotName: file ? file.name : '' }))
  }

  const submitAddMoneyRequest = (event) => {
    event.preventDefault()

    const amountNumber = Number(formData.amount)
    if (!amountNumber || !formData.upiRef || !formData.phone || !formData.screenshotName) {
      return
    }

    const newRequest = {
      id: `REQ-${Math.floor(1000 + Math.random() * 9000)}`,
      userId: currentUser.id,
      userName: formData.payerName || currentUser.name,
      amount: amountNumber,
      upiRef: formData.upiRef,
      phone: formData.phone,
      screenshotName: formData.screenshotName,
      status: 'Pending',
      createdAt: 'Just now',
    }

    setRequests((prev) => [newRequest, ...prev])
    setFormData((prev) => ({
      ...prev,
      amount: '1000',
      upiRef: '',
      phone: '',
      screenshotName: '',
    }))
    setAddMoneyOpen(false)
    setActiveView('Admin')
  }

  const approveRequest = (requestId) => {
    const selectedRequest = requests.find((request) => request.id === requestId)
    if (!selectedRequest || selectedRequest.status !== 'Pending') {
      return
    }

    setUsers((prev) =>
      prev.map((user) =>
        user.id === selectedRequest.userId
          ? { ...user, wallet: user.wallet + selectedRequest.amount }
          : user,
      ),
    )

    setRequests((prev) =>
      prev.map((request) =>
        request.id === requestId
          ? { ...request, status: 'Approved', createdAt: `${request.createdAt} • Approved` }
          : request,
      ),
    )
  }

  const rejectRequest = (requestId) => {
    setRequests((prev) =>
      prev.map((request) =>
        request.id === requestId
          ? { ...request, status: 'Rejected', createdAt: `${request.createdAt} • Rejected` }
          : request,
      ),
    )
  }

  return (
    <div className="app-shell">
      <header className="top-bar">
        <div>
          <p className="eyebrow">Sports Market Live</p>
          <h1>Bid and buy team stocks in real time</h1>
        </div>
        <div className="live-badge">{ongoingCount} live markets</div>
      </header>

      <section className="view-switcher" role="tablist" aria-label="Dashboard views">
        {['Market', 'Wallet', 'Admin'].map((view) => (
          <button
            key={view}
            className={activeView === view ? 'chip active' : 'chip'}
            onClick={() => setActiveView(view)}
          >
            {view}
          </button>
        ))}
      </section>

      {activeView === 'Market' && (
        <>
          <section className="stats-grid">
            <article className="stat-card">
              <p>Total Matches</p>
              <h3>{MATCHES.length}</h3>
            </article>
            <article className="stat-card">
              <p>Ongoing</p>
              <h3>{ongoingCount}</h3>
            </article>
            <article className="stat-card">
              <p>Upcoming</p>
              <h3>{upcomingCount}</h3>
            </article>
            <article className="stat-card">
              <p>Active Bidders</p>
              <h3>26,540</h3>
            </article>
          </section>

          <section className="filters-panel">
            <div className="sport-tabs">
              {SPORTS.map((sport) => (
                <button
                  key={sport}
                  className={selectedSport === sport ? 'tab active' : 'tab'}
                  onClick={() => setSelectedSport(sport)}
                >
                  {sport}
                </button>
              ))}
            </div>

            <div className="status-filter" role="group" aria-label="Match status filter">
              {['All', 'Ongoing', 'Upcoming'].map((status) => (
                <button
                  key={status}
                  className={marketFilter === status ? 'chip active' : 'chip'}
                  onClick={() => setMarketFilter(status)}
                >
                  {status}
                </button>
              ))}
            </div>
          </section>

          <main className="content-grid">
            <section className="matches-list" aria-label="Matches list">
              {filteredMatches.map((match) => (
                <article key={match.id} className="match-card">
                  <div className="match-head">
                    <span className="sport">{match.sport}</span>
                    <span className={match.status === 'Ongoing' ? 'status live' : 'status'}>
                      {match.status}
                    </span>
                  </div>

                  <h3>
                    {match.teams[0]} <span>vs</span> {match.teams[1]}
                  </h3>
                  <p className="score">{match.score}</p>

                  <div className="market-row">
                    <p>
                      Market Cap <strong>{match.marketCap}</strong>
                    </p>
                    <p className={match.trend.startsWith('+') ? 'trend up' : 'trend down'}>
                      {match.trend}
                    </p>
                  </div>

                  <div className="market-row muted">
                    <p>{match.startsAt}</p>
                    <p>{match.viewers.toLocaleString()} users watching</p>
                  </div>

                  <div className="action-row">
                    <button className="btn buy">Buy Stock</button>
                    <button className="btn bid">Place Bid</button>
                  </div>
                </article>
              ))}
            </section>

            <aside className="trade-panel">
              <h2>Quick Bid Panel</h2>
              <p>Choose amount and bid on your favorite team stock instantly.</p>

              <label htmlFor="bidAmount">Bid Amount (₹)</label>
              <input
                id="bidAmount"
                type="range"
                min="500"
                max="10000"
                step="100"
                value={bidAmount}
                onChange={(event) => setBidAmount(Number(event.target.value))}
              />

              <div className="bid-value">₹{bidAmount.toLocaleString()}</div>

              <div className="team-options">
                <button>Mumbai Meteors</button>
                <button>London Lions</button>
                <button>Bengal Tigers</button>
              </div>

              <button className="confirm">Confirm Bid</button>

              <small>
                Demo UI only. Connect this to backend APIs and real-time sockets for production live
                trading.
              </small>
            </aside>
          </main>
        </>
      )}

      {activeView === 'Wallet' && (
        <section className="wallet-grid">
          <article className="wallet-card">
            <div className="wallet-header">
              <h2>User Wallet</h2>
              <select
                value={currentUserId}
                onChange={(event) => {
                  const selectedId = event.target.value
                  setCurrentUserId(selectedId)
                  const selectedUser = users.find((user) => user.id === selectedId)
                  setFormData((prev) => ({
                    ...prev,
                    payerName: selectedUser?.name || prev.payerName,
                  }))
                }}
              >
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name}
                  </option>
                ))}
              </select>
            </div>

            <p className="wallet-amount">{formatCurrency(currentUser.wallet)}</p>
            <p className="muted">Available trading balance</p>

            <button className="confirm" onClick={() => setAddMoneyOpen((prev) => !prev)}>
              {addMoneyOpen ? 'Close Add Money' : 'Add Money'}
            </button>

            {addMoneyOpen && (
              <div className="add-money-panel">
                <div className="qr-section">
                  <h3>Scan QR to pay</h3>
                  <div className="qr-box" aria-hidden="true">
                    <span>QR</span>
                  </div>
                  <p>
                    UPI ID: <strong>sportsmarket@upi</strong>
                  </p>
                  <p className="muted">After payment, submit the form with screenshot.</p>
                </div>

                <form className="proof-form" onSubmit={submitAddMoneyRequest}>
                  <h3>Payment Verification Form</h3>

                  <label htmlFor="payerName">Your Name</label>
                  <input
                    id="payerName"
                    name="payerName"
                    value={formData.payerName}
                    onChange={handleFormValue}
                    required
                  />

                  <label htmlFor="amount">Paid Amount (₹)</label>
                  <input
                    id="amount"
                    name="amount"
                    type="number"
                    min="100"
                    value={formData.amount}
                    onChange={handleFormValue}
                    required
                  />

                  <label htmlFor="upiRef">UPI Ref / UTR Number</label>
                  <input
                    id="upiRef"
                    name="upiRef"
                    value={formData.upiRef}
                    onChange={handleFormValue}
                    required
                  />

                  <label htmlFor="phone">Phone Number</label>
                  <input
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleFormValue}
                    required
                  />

                  <label htmlFor="proof">Upload Payment Screenshot</label>
                  <input id="proof" type="file" accept="image/*" onChange={handleProofUpload} required />

                  {formData.screenshotName && (
                    <p className="file-chip">Attached: {formData.screenshotName}</p>
                  )}

                  <button className="confirm" type="submit">
                    Submit For Admin Approval
                  </button>
                </form>
              </div>
            )}
          </article>

          <article className="wallet-card">
            <h2>Your Recent Requests</h2>
            <div className="requests-list">
              {requests
                .filter((request) => request.userId === currentUser.id)
                .map((request) => (
                  <div key={request.id} className="request-row">
                    <div>
                      <strong>{request.id}</strong>
                      <p>{formatCurrency(request.amount)}</p>
                    </div>
                    <div>
                      <span
                        className={`request-status ${
                          request.status === 'Approved'
                            ? 'approved'
                            : request.status === 'Rejected'
                              ? 'rejected'
                              : 'pending'
                        }`}
                      >
                        {request.status}
                      </span>
                      <p className="muted small-text">{request.createdAt}</p>
                    </div>
                  </div>
                ))}
            </div>
          </article>
        </section>
      )}

      {activeView === 'Admin' && (
        <section className="admin-grid">
          <article className="wallet-card">
            <h2>Admin Wallet Requests</h2>
            <p className="muted">Pending requests: {pendingRequests.length}</p>

            <div className="requests-list">
              {requests.map((request) => (
                <div key={request.id} className="admin-request-card">
                  <div>
                    <h3>
                      {request.id} · {request.userName}
                    </h3>
                    <p>
                      Amount: <strong>{formatCurrency(request.amount)}</strong>
                    </p>
                    <p className="small-text">UPI Ref: {request.upiRef}</p>
                    <p className="small-text">Phone: {request.phone}</p>
                    <p className="small-text">Screenshot: {request.screenshotName}</p>
                  </div>

                  <div className="admin-actions">
                    <span
                      className={`request-status ${
                        request.status === 'Approved'
                          ? 'approved'
                          : request.status === 'Rejected'
                            ? 'rejected'
                            : 'pending'
                      }`}
                    >
                      {request.status}
                    </span>

                    {request.status === 'Pending' && (
                      <div className="action-row">
                        <button className="btn buy" onClick={() => approveRequest(request.id)}>
                          Approve + Add Wallet
                        </button>
                        <button className="btn bid" onClick={() => rejectRequest(request.id)}>
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </article>

          <article className="wallet-card">
            <h2>User Wallet Ledger</h2>
            <div className="requests-list">
              {users.map((user) => (
                <div key={user.id} className="request-row">
                  <div>
                    <strong>{user.name}</strong>
                    <p className="muted small-text">User ID: {user.id}</p>
                  </div>
                  <strong>{formatCurrency(user.wallet)}</strong>
                </div>
              ))}
            </div>
          </article>
        </section>
      )}

    </div>
  )
}

export default App
