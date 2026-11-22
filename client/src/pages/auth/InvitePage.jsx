import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { AlertCircle, Sparkles } from 'lucide-react';
import { AuthLayout } from '../../components/layout/AuthLayout.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Input } from '../../components/ui/Form.jsx';
import { acceptInvite } from '../../store/authSlice.js';

export default function InvitePage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const error = useSelector((state) => state.auth.error);
  const [form, setForm] = useState({ name: '', password: '', confirm: '' });
  const [localError, setLocalError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setLocalError('');
    if (!token) {
      setLocalError(
        'This invitation link is missing its token. Ask an administrator to resend it.'
      );
      return;
    }
    if (form.password.length < 12) {
      setLocalError('Use at least 12 characters for your password.');
      return;
    }
    if (form.password !== form.confirm) {
      setLocalError('The passwords do not match.');
      return;
    }
    setSubmitting(true);
    const payload = { token, password: form.password };
    if (form.name.trim().length >= 2) payload.name = form.name.trim();
    const result = await dispatch(acceptInvite(payload));
    setSubmitting(false);
    if (result.meta.requestStatus === 'fulfilled') navigate('/', { replace: true });
  };

  const message = localError || error?.message;

  return (
    <AuthLayout
      title="You have been invited."
      description="Set your name and password to join the NexusFlow workspace. Your role was assigned by an administrator."
      footer={
        <>
          Already activated?{' '}
          <Link to="/login" className="font-semibold text-ink underline-offset-2 hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-4" noValidate>
        {message && (
          <div className="flex items-start gap-2.5 rounded-xl border border-danger/20 bg-danger/5 px-3.5 py-3 text-[12px] text-danger">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{message}</span>
          </div>
        )}
        {!token && (
          <div className="rounded-xl border border-gold/40 bg-gold/10 px-3.5 py-3 text-[12px] text-[#7d6100]">
            No invitation token was found in this URL. Open the link from your invitation email.
          </div>
        )}
        <Input
          label="Full name"
          autoComplete="name"
          value={form.name}
          onChange={(event) => setForm((previous) => ({ ...previous, name: event.target.value }))}
          placeholder="Optional — keeps your invited name"
        />
        <Input
          label="Password"
          type="password"
          required
          autoComplete="new-password"
          value={form.password}
          onChange={(event) =>
            setForm((previous) => ({ ...previous, password: event.target.value }))
          }
          placeholder="12+ characters"
          hint="Upper, lower, number and symbol."
        />
        <Input
          label="Confirm password"
          type="password"
          required
          autoComplete="new-password"
          value={form.confirm}
          onChange={(event) =>
            setForm((previous) => ({ ...previous, confirm: event.target.value }))
          }
          placeholder="Repeat password"
        />
        <Button type="submit" size="lg" className="w-full" loading={submitting} icon={Sparkles}>
          Activate workspace access
        </Button>
      </form>
    </AuthLayout>
  );
}
