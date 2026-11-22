import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Mail } from 'lucide-react';
import { AuthLayout } from '../../components/layout/AuthLayout.jsx';
import { api } from '../../lib/api.js';
import { Button } from '../../components/ui/Button.jsx';
import { Input } from '../../components/ui/Form.jsx';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const submit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await api.post('/auth/forgot-password', { email });
      setSent(true);
    } catch (requestError) {
      setError(requestError.response?.data?.error?.message ?? 'Unable to request a reset link.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout
      title={sent ? 'Check your inbox.' : 'Reset your password.'}
      description={
        sent
          ? 'If an active account matches that address, a single-use reset link is on its way. It expires shortly.'
          : 'Enter the email tied to your account and we will send a single-use reset link.'
      }
      footer={
        <Link to="/login" className="inline-flex items-center gap-1.5 font-semibold text-ink">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to sign in
        </Link>
      }
    >
      {sent ? (
        <div className="rounded-2xl border border-success/20 bg-success/5 p-5 text-center">
          <CheckCircle2 className="mx-auto h-8 w-8 text-success" />
          <p className="mt-3 text-[13px] leading-relaxed text-ink/70">
            Reset instructions were requested for <strong className="text-ink">{email}</strong>. In
            demo environments without SMTP, the link is written to the server log.
          </p>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4" noValidate>
          {error && (
            <div className="rounded-xl border border-danger/20 bg-danger/5 px-3.5 py-3 text-[12px] text-danger">
              {error}
            </div>
          )}
          <div className="relative">
            <Mail className="pointer-events-none absolute top-[42px] left-3.5 h-4 w-4 text-muted" />
            <Input
              label="Work email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@company.com"
              className="pl-10"
            />
          </div>
          <Button type="submit" size="lg" className="w-full" loading={submitting}>
            Send reset link
          </Button>
          <p className="text-center text-[10.5px] leading-relaxed text-muted">
            For security, we return the same response whether or not the address exists.
          </p>
        </form>
      )}
    </AuthLayout>
  );
}
