import { FormEvent, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAdminAuth } from '../../auth/AdminAuthContext';
import './AdminLogin.css';

function AdminLogin() {
  const { login, verifyMfa } = useAdminAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [requiresMfa, setRequiresMfa] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submissionInProgress = useRef(false);

  function navigateAfterLogin() {
    const state = location.state as { from?: unknown } | null;
    const candidate = state?.from;
    if (typeof candidate !== 'string' || !candidate.startsWith('/') || candidate.startsWith('//')) {
      navigate('/', { replace: true });
      return;
    }
    try {
      const destination = new URL(candidate, window.location.origin);
      navigate(
        destination.origin === window.location.origin && destination.pathname !== '/login'
          ? `${destination.pathname}${destination.search}${destination.hash}`
          : '/',
        { replace: true },
      );
    } catch {
      navigate('/', { replace: true });
    }
  }

  async function handleLoginSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submissionInProgress.current) return;

    const normalizedIdentifier = identifier.trim();
    if (!normalizedIdentifier || !password) {
      setMessage('Enter your email or username and password to continue.');
      return;
    }

    setIdentifier(normalizedIdentifier);
    submissionInProgress.current = true;
    setIsSubmitting(true);
    setMessage('');
    try {
      const mfaRequired = await login({ identifier: normalizedIdentifier, password });
      if (mfaRequired) {
        setRequiresMfa(true);
        setMessage('');
      } else {
        navigateAfterLogin();
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Sign in could not be completed.');
    } finally {
      setPassword('');
      submissionInProgress.current = false;
      setIsSubmitting(false);
    }
  }

  async function handleMfaSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submissionInProgress.current) return;
    const normalizedCode = otpCode.trim();
    if (!normalizedCode) {
      setMessage('Enter the verification code sent to your Admin email.');
      return;
    }

    submissionInProgress.current = true;
    setIsSubmitting(true);
    setMessage('');
    try {
      await verifyMfa(normalizedCode);
      setOtpCode('');
      navigateAfterLogin();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Verification could not be completed.');
    } finally {
      setOtpCode('');
      submissionInProgress.current = false;
      setIsSubmitting(false);
    }
  }

  return (
    <main className="admin-login">
      <section className="admin-login__brand" aria-label="CosmozPay Admin">
        <div className="admin-login__brand-content">
          <a className="admin-login__wordmark" href="/" aria-label="CosmozPay">
            <img className="admin-login__mark" src="/CosmozPaylogo2.jpeg" alt="" />
            <span>CosmozPay</span>
          </a>
          <div className="admin-login__brand-copy">
            <span className="admin-login__eyebrow">ADMINISTRATION PORTAL</span>
            <h1>Manage CosmozPay with confidence.</h1>
            <p>A clear view of the tools that keep your platform moving.</p>
          </div>
          <div className="admin-login__art" aria-hidden="true">
            <div className="admin-login__art-orbit admin-login__art-orbit--outer" />
            <div className="admin-login__art-orbit admin-login__art-orbit--inner" />
            <div className="admin-login__art-core">
              <span className="admin-login__art-dot" />
              <span className="admin-login__art-line" />
              <span className="admin-login__art-dot admin-login__art-dot--small" />
            </div>
          </div>
          <span className="admin-login__brand-footer">Secure operations. Thoughtful growth.</span>
        </div>
      </section>

      <section className="admin-login__panel">
        <div className="admin-login__form-wrap">
          <span className="admin-login__form-kicker">ADMIN PORTAL</span>
          <h2>{requiresMfa ? 'Verify your identity' : 'Welcome back'}</h2>
          <p className="admin-login__intro">
            {requiresMfa
              ? 'Enter the verification code sent to your Admin email.'
              : 'Sign in to your CosmozPay Admin account.'}
          </p>

          {requiresMfa ? (
            <form className="admin-login__form" onSubmit={handleMfaSubmit}>
              <div className="admin-login__field">
                <label htmlFor="admin-otp">Verification code</label>
                <input
                  id="admin-otp"
                  className="admin-login__input"
                  type="text"
                  name="otp_code"
                  autoComplete="one-time-code"
                  inputMode="numeric"
                  required
                  value={otpCode}
                  onChange={(event) => setOtpCode(event.target.value)}
                />
              </div>

              {message && <p className="admin-login__message" role="alert">{message}</p>}

              <button className="admin-login__button" type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Verifying…' : 'Verify code'}
                {!isSubmitting && <span aria-hidden="true">→</span>}
              </button>
              <button
                className="admin-login__back"
                type="button"
                disabled={isSubmitting}
                onClick={() => {
                  setRequiresMfa(false);
                  setOtpCode('');
                  setMessage('');
                }}
              >
                Use a different account
              </button>
            </form>
          ) : (
            <form className="admin-login__form" onSubmit={handleLoginSubmit}>
              <div className="admin-login__field">
                <label htmlFor="admin-identifier">Email or username</label>
                <input
                  id="admin-identifier"
                  className="admin-login__input"
                  type="text"
                  name="username"
                  autoComplete="username"
                  required
                  value={identifier}
                  onChange={(event) => setIdentifier(event.target.value)}
                />
              </div>

              <div className="admin-login__field">
                <label htmlFor="admin-password">Password</label>
                <div className="admin-login__password-wrap">
                  <input
                    id="admin-password"
                    className="admin-login__input"
                    type={passwordVisible ? 'text' : 'password'}
                    name="password"
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                  />
                  <button
                    className="admin-login__visibility"
                    type="button"
                    aria-label={passwordVisible ? 'Hide password' : 'Show password'}
                    aria-pressed={passwordVisible}
                    onClick={() => setPasswordVisible((visible) => !visible)}
                  >
                    {passwordVisible ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>

              {message && <p className="admin-login__message" role="alert">{message}</p>}

              <button className="admin-login__button" type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Signing in…' : 'Sign in'}
                {!isSubmitting && <span aria-hidden="true">→</span>}
              </button>
            </form>
          )}

          <p className="admin-login__security-note">
            <span aria-hidden="true">●</span>
            Your administrator access is securely managed.
          </p>
        </div>
        <span className="admin-login__copyright">© {new Date().getFullYear()} CosmozPay</span>
      </section>
    </main>
  );
}

export default AdminLogin;
