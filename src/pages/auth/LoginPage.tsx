import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff, Lock, Mail, ArrowLeft } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { useAuth } from '../../contexts/AuthContext';
import { AR } from '../../constants/arabic';
import { ROUTES } from '../../constants/config';
import { Button, Input } from '../../components/common';
import { motion } from 'framer-motion';

const loginSchema = z.object({
  email: z.string().email('بريد إلكتروني غير صحيح'),
  password: z.string().min(6, 'كلمة المرور يجب أن تكون 6 أحرف على الأقل'),
});

type LoginForm = z.infer<typeof loginSchema>;

export function LoginPage() {
  const { signIn, profile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/';

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    setLoading(true);
    const { error } = await signIn(data.email, data.password);
    if (error) {
      toast.error('بيانات الدخول غير صحيحة. يرجى المحاولة مجدداً.');
      setLoading(false);
      return;
    }
    toast.success(AR.loginSuccess);
    // Redirect will happen via RootRedirect after profile loads
    navigate(from, { replace: true });
    setLoading(false);
  };

  return (
    <div className="auth-container">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-white/5 rounded-full" />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-white/5 rounded-full" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-white/3 rounded-full" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="auth-card"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <img src="/etra-logo.png" alt="ETRA Logo" className="w-24 h-auto mx-auto mb-4 drop-shadow-xl" />
          <h1 className="text-2xl font-black text-gray-900 mb-1">
            {AR.welcomeBack}
          </h1>
          <p className="text-primary-600 font-bold text-lg">{AR.appName}</p>
          <p className="text-gray-400 text-sm mt-1">{AR.loginSubtitle}</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
          <Input
            label={AR.email}
            type="email"
            placeholder={AR.emailPlaceholder}
            error={errors.email?.message}
            rightIcon={<Mail size={18} />}
            id="login-email"
            autoComplete="email"
            {...register('email')}
          />

          <div className="relative">
            <Input
              label={AR.password}
              type={showPassword ? 'text' : 'password'}
              placeholder={AR.passwordPlaceholder}
              error={errors.password?.message}
              rightIcon={<Lock size={18} />}
              id="login-password"
              autoComplete="current-password"
              leftIcon={
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              }
              {...register('password')}
            />
          </div>

          <div className="flex justify-start">
            <button
              type="button"
              onClick={() => navigate(ROUTES.forgotPassword)}
              className="text-sm text-primary-600 hover:text-primary-800 hover:underline transition-colors font-medium"
            >
              {AR.forgotPassword}
            </button>
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            loading={loading}
            className="w-full"
            id="login-submit"
          >
            {loading ? AR.loggingIn : AR.login}
          </Button>
        </form>

        <p className="text-center text-xs text-gray-400 mt-4">
          {AR.company} — {AR.appNameEn}
        </p>
      </motion.div>
    </div>
  );
}
