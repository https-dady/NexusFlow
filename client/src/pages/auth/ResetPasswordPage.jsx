import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import { AuthLayout } from '../../components/layout/AuthLayout.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Input } from '../../components/ui/Form.jsx';
import { resetPassword } from '../../store/authSlice.js';

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const error = useSelector((state) => state.auth.error);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [localError, setLocalError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setLocalError('');
    if (!token) {
      setLocalError('This reset link is missing its token. Request a new link.');
      return;
    }
    if (password.length < 12) {
      setLocalError('Use at least 12 characters.');
      return;
    }
    if (password !== confirm) {
      setLocalError('The passwords do not match.');
      return;
    }
    setSubmitting(true);
    const result = await dispatch(resetPassword({ token, password }));
    setSubmitting(false);
    if (result.meta.requestStatus === 'fulfilled') navigate('/', { replace: true });
  };

  const message = localError || error?.message;

  return (
    <AuthLayout
      title="Choose a new password."
      description="Your other sessions will be revoked once the password changes."
      footer={
        <Link to="/login" className="inline-flex items-center gap-1.5 font-semibold text-ink">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to sign in
        </Link>
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
            No token was found in the URL. Open the link from your reset email, or request a new
            one.
          </div>
        )}
        <Input
          label="New password"
          type="password"
          required
          autoComplete="new-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="12+ characters"
          hint="Upper, lower, number and symbol."
        />
        <Input
          label="Confirm password"
          type="password"
          required
          autoComplete="new-password"
          value={confirm}
          onChange={(event) => setConfirm(event.target.value)}
          placeholder="Repeat password"
        />
        <Button type="submit" size="lg" className="w-full" loading={submitting}>
          Update password &amp; sign in
        </Button>
      </form>
    </AuthLayout>
  );
}
