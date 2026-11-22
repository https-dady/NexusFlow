import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { AlertCircle, ArrowRight } from 'lucide-react';
import { AuthLayout } from '../../components/layout/AuthLayout.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Input } from '../../components/ui/Form.jsx';
import { registerUser } from '../../store/authSlice.js';

export default function RegisterPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const error = useSelector((state) => state.auth.error);
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [localError, setLocalError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setLocalError('');
    if (form.password.length < 12) {
      setLocalError('Use at least 12 characters for your password.');
      return;
    }
    if (form.password !== form.confirm) {
      setLocalError('The passwords do not match.');
      return;
    }
    setSubmitting(true);
    const result = await dispatch(
      registerUser({ name: form.name, email: form.email, password: form.password })
    );
    setSubmitting(false);
    if (result.meta.requestStatus === 'fulfilled') navigate('/', { replace: true });
  };

  const message = localError || error?.message;

  return (
    <AuthLayout
      title="Create your account."
      description="The first account becomes the workspace super administrator. Later accounts are provisioned by invitation."
      footer={
        <>
          Already have an account?{' '}
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

        <Input
          label="Full name"
          required
          autoComplete="name"
          value={form.name}
          onChange={(event) => setForm((previous) => ({ ...previous, name: event.target.value }))}
          placeholder="Alex Morgan"
        />
        <Input
          label="Work email"
          type="email"
          required
          autoComplete="email"
          value={form.email}
          onChange={(event) => setForm((previous) => ({ ...previous, email: event.target.value }))}
          placeholder="you@company.com"
        />
        <div className="grid gap-4 sm:grid-cols-2">
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
            label="Confirm"
            type="password"
            required
            autoComplete="new-password"
            value={form.confirm}
            onChange={(event) =>
              setForm((previous) => ({ ...previous, confirm: event.target.value }))
            }
            placeholder="Repeat password"
          />
        </div>

        <Button
          type="submit"
          size="lg"
          className="w-full"
          loading={submitting}
          iconRight={ArrowRight}
        >
          Create account
        </Button>
      </form>
    </AuthLayout>
  );
}
