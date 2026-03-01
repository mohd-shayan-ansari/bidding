import { useEffect, useMemo, useState } from 'react'
import './App.css'

const SPORTS = ['All', 'Cricket', 'Basketball', 'Tennis']
const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000'

const defaultAuthForm = {
  name: '',
  email: '',
  password: '',
}

const defaultMoneyForm = {
  amount: '1000',
  upiRef: '',
  phone: '',
  screenshot: null,
}

function formatCurrency(value) {
  return `₹${Number(value || 0).toLocaleString('en-IN')}`
}

async function apiRequest(path, method = 'GET', token, body, isFormData = false) {
  const headers = {}

  if (token) {
    headers.Authorization = `Bearer ${token}`
  }
  if (!isFormData) {
    headers['Content-Type'] = 'application/json'
  }

  const response = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: isFormData ? body : body ? JSON.stringify(body) : undefined,
  })

  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(data.message || 'Request failed')
  }

  return data
}

function AppNew() {
  const [token, setToken] = useState(localStorage.getItem('sm_token') || '')
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('sm_user')
    return saved ? JSON.parse(saved) : null
  })

  const [authMode, setAuthMode] = useState('login')
  const [authForm, setAuthForm] = useState(defaultAuthForm)
  const [authError, setAuthError] = useState('')
  const [authLoading, setAuthLoading] = useState(false)

  const [activeView, setActiveView] = useState('Market')
  const [selectedSport, setSelectedSport] = useState('All')
  const [marketFilter, setMarketFilter] = useState('All')
  const [bidAmount, setBidAmount] = useState(1500)

  const [matches, setMatches] = useState([])
  const [requests, setRequests] = useState([])
  const [users, setUsers] = useState([])

  const [addMoneyOpen, setAddMoneyOpen] = useState(false)
  const [moneyForm, setMoneyForm] = useState(defaultMoneyForm)
  const [moneyMessage, setMoneyMessage] = useState('')

  const [loading, setLoading] = useState(false)
  const [pageError, setPageError] = useState('')

  const isAdmin = user?.role === 'admin'

  const filteredMatches = useMemo(() => {
    return matches.filter((match) => {
      const matchSport = selectedSport === 'All' || match.sport === selectedSport
      const matchStatus = marketFilter === 'All' || match.status === marketFilter
      return matchSport && matchStatus
    })
  }, [selectedSport, marketFilter, matches])

  const ongoingCount = matches.filter((match) => match.status === 'Ongoing').length
  const upcomingCount = matches.filter((match) => match.status === 'Upcoming').length
  const pendingRequests = requests.filter((request) => request.status === 'Pending').length

  async function refreshData(activeToken = token, activeUser = user) {
    if (!activeToken || !activeUser) {
      return
    }

    setLoading(true)
    setPageError('')

    try {
      const [matchData, myRequests] = await Promise.all([
        apiRequest('/api/matches', 'GET', activeToken),
        apiRequest('/api/topup-requests/me', 'GET', activeToken),
      ])

      setMatches(matchData)

      if (activeUser.role === 'admin') {
        const [allUsers, adminRequests] = await Promise.all([
          apiRequest('/api/admin/users', 'GET', activeToken),
          apiRequest('/api/admin/topup-requests', 'GET', activeToken),
        ])
        setUsers(allUsers)
        setRequests(adminRequests)
      } else {
        setRequests(myRequests)
      }
    } catch (error) {
      setPageError(error.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refreshData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, user?.role])

  const handleAuthField = (event) => {
    const { name, value } = event.target
    setAuthForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleMoneyField = (event) => {
    const { name, value } = event.target
    setMoneyForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleProofUpload = (event) => {
    const file = event.target.files?.[0]
    setMoneyForm((prev) => ({ ...prev, screenshot: file || null }))
  }

  const handleAuthSubmit = async (event) => {
    event.preventDefault()
    setAuthError('')
    setAuthLoading(true)

    try {
      const endpoint = authMode === 'login' ? '/api/auth/login' : '/api/auth/register'
      const payload =
        authMode === 'login'
          ? { email: authForm.email, password: authForm.password }
          : { name: authForm.name, email: authForm.email, password: authForm.password }

      const response = await apiRequest(endpoint, 'POST', '', payload)
      setToken(response.token)
      setUser(response.user)
      localStorage.setItem('sm_token', response.token)
      localStorage.setItem('sm_user', JSON.stringify(response.user))
      setActiveView(response.user.role === 'admin' ? 'Admin' : 'Market')
      setAuthForm(defaultAuthForm)
    } catch (error) {
      setAuthError(error.message)
    } finally {
      setAuthLoading(false)
    }
  }

  const logout = () => {
    setToken('')
    setUser(null)
    setMatches([])
    setRequests([])
    setUsers([])
    localStorage.removeItem('sm_token')
    localStorage.removeItem('sm_user')
  }

  const submitAddMoneyRequest = async (event) => {
    event.preventDefault()
    setMoneyMessage('')

    if (!moneyForm.screenshot) {
      setMoneyMessage('Please upload payment screenshot.')
      return
    }

    try {
      const formPayload = new FormData()
      formPayload.append('amount', moneyForm.amount)
      formPayload.append('upiRef', moneyForm.upiRef)
      formPayload.append('phone', moneyForm.phone)
      formPayload.append('screenshot', moneyForm.screenshot)

      await apiRequest('/api/wallet/topup-request', 'POST', token, formPayload, true)

      setMoneyForm(defaultMoneyForm)
      setMoneyMessage('Request submitted. Admin will review and add money to wallet.')
      setAddMoneyOpen(false)
      await refreshData()
    } catch (error) {
      setMoneyMessage(error.message)
    }
  }

  const approveRequest = async (requestId) => {
    try {
      await apiRequest(`/api/admin/topup-requests/${requestId}/approve`, 'PATCH', token)
      await refreshData()
    } catch (error) {
      setPageError(error.message)
    }
  }

  const rejectRequest = async (requestId) => {
    try {
      await apiRequest(`/api/admin/topup-requests/${requestId}/reject`, 'PATCH', token)
      await refreshData()
    } catch (error) {
      setPageError(error.message)
    }
  }

  if (!token || !user) {
    return (
      <div className="auth-shell">
        <div className="auth-card">
          <p className="eyebrow">Sports Market</p>
          <h1>{authMode === 'login' ? 'Sign in to continue' : 'Create your account'}</h1>

          <form onSubmit={handleAuthSubmit}>
            {authMode === 'register' && (
              <>
                <label htmlFor="name">Name</label>
                <input id="name" name="name" value={authForm.name} onChange={handleAuthField} required />
              </>
            )}

            <label htmlFor="email">Email</label>
            <input id="email" name="email" type="email" value={authForm.email} onChange={handleAuthField} required />

            <label htmlFor="password">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              value={authForm.password}
              onChange={handleAuthField}
              required
            />

            {authError && <p className="error-text">{authError}</p>}

            <button className="confirm" type="submit" disabled={authLoading}>
              {authLoading ? 'Please wait...' : authMode === 'login' ? 'Login' : 'Register'}
            </button>
          </form>

          <button
            className="link-button"
            onClick={() => {
              setAuthMode((prev) => (prev === 'login' ? 'register' : 'login'))
              setAuthError('')
            }}
          >
            {authMode === 'login' ? 'Need an account? Register' : 'Already have an account? Login'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="app-shell">
      <header className="top-bar">
        <div>
          <p className="eyebrow">Sports Market Live</p>
          <h1>Bid and buy team stocks in real time</h1>
          <p className="muted">
            Logged in as <strong>{user.name}</strong> ({user.role})
          </p>
        </div>
        <div className="header-actions">
          <div className="live-badge">{ongoingCount} live markets</div>
          <button className="chip" onClick={logout}>
            Logout
          </button>
        </div>
      </header>

      {pageError && <p className="error-text">{pageError}</p>}
      {loading && <p className="muted">Loading latest data...</p>}

      <section className="view-switcher" role="tablist" aria-label="Dashboard views">
        {['Market', 'Wallet', ...(isAdmin ? ['Admin'] : [])].map((view) => (
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
              <h3>{matches.length}</h3>
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
                    <p className={match.trend.startsWith('+') ? 'trend up' : 'trend down'}>{match.trend}</p>
                  </div>

                  <div className="market-row muted">
                    <p>{match.startsAt}</p>
                    <p>{Number(match.viewers || 0).toLocaleString()} users watching</p>
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
                <button>Mumbai Indians</button>
                <button>Delhi Capitals</button>
                <button>Rajasthan Royals</button>
                <button>Chennai Super Kings</button>
                <button>Kolkata Knight Riders</button>
                <button>Gujarat Titans</button>
              </div>

              <button className="confirm">Confirm Bid</button>

              <small>
                Hosting ready UI + backend API wired. Add real match feeds and payment verification ops for
                production.
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
              <span className="request-status approved">{user.name}</span>
            </div>

            <p className="wallet-amount">{formatCurrency(user.wallet)}</p>
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
                  <p className="muted">After payment, submit the form with screenshot proof.</p>
                </div>

                <form className="proof-form" onSubmit={submitAddMoneyRequest}>
                  <h3>Payment Verification Form</h3>

                  <label htmlFor="amount">Paid Amount (₹)</label>
                  <input
                    id="amount"
                    name="amount"
                    type="number"
                    min="100"
                    value={moneyForm.amount}
                    onChange={handleMoneyField}
                    required
                  />

                  <label htmlFor="upiRef">UPI Ref / UTR Number</label>
                  <input
                    id="upiRef"
                    name="upiRef"
                    value={moneyForm.upiRef}
                    onChange={handleMoneyField}
                    required
                  />

                  <label htmlFor="phone">Phone Number</label>
                  <input
                    id="phone"
                    name="phone"
                    value={moneyForm.phone}
                    onChange={handleMoneyField}
                    required
                  />

                  <label htmlFor="proof">Upload Payment Screenshot</label>
                  <input id="proof" type="file" accept="image/*" onChange={handleProofUpload} required />

                  {moneyForm.screenshot && <p className="file-chip">Attached: {moneyForm.screenshot.name}</p>}
                  {moneyMessage && <p className="muted">{moneyMessage}</p>}

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
              {requests.map((request) => (
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
                    <p className="muted small-text">{new Date(request.createdAt).toLocaleString()}</p>
                  </div>
                </div>
              ))}

              {requests.length === 0 && <p className="muted">No requests yet.</p>}
            </div>
          </article>
        </section>
      )}

      {activeView === 'Admin' && isAdmin && (
        <section className="admin-grid">
          <article className="wallet-card">
            <h2>Admin Wallet Requests</h2>
            <p className="muted">Pending requests: {pendingRequests}</p>

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
                    <a
                      className="small-text"
                      href={`${API_BASE}${request.screenshotUrl}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      View uploaded screenshot
                    </a>
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

              {requests.length === 0 && <p className="muted">No wallet requests found.</p>}
            </div>
          </article>

          <article className="wallet-card">
            <h2>User Wallet Ledger</h2>
            <div className="requests-list">
              {users.map((ledgerUser) => (
                <div key={ledgerUser.id} className="request-row">
                  <div>
                    <strong>{ledgerUser.name}</strong>
                    <p className="muted small-text">{ledgerUser.email}</p>
                  </div>
                  <strong>{formatCurrency(ledgerUser.wallet)}</strong>
                </div>
              ))}
            </div>
          </article>
        </section>
      )}
    </div>
  )
}

export default AppNew
