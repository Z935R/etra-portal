import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, ArrowRight } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { useAuth } from '../../contexts/AuthContext';
import { AR } from '../../constants/arabic';
import { ROUTES } from '../../constants/config';
import { Button, Input, Alert } from '../../components/common';
import { motion } from 'framer-motion';

const schema = z.object({
  email: z.string().email('بريد إلكتروني غير صحيح'),
});

type FormData = z.infer<typeof schema>;

export function ForgotPasswordPage() {
  const { sendPasswordReset } = useAuth();
  const navigate = useNavigate();
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    const { error } = await sendPasswordReset(data.email);
    setLoading(false);
    if (error) {
      toast.error('تعذّر إرسال رابط الاستعادة. يرجى المحاولة مجدداً.');
      return;
    }
    setSent(true);
  };

  return (
    <div className="auth-container">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-white/5 rounded-full" />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-white/5 rounded-full" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="auth-card"
      >
        <button
          onClick={() => navigate(ROUTES.login)}
          className="flex items-center gap-1 text-sm text-gray-400 hover:text-gray-600 mb-6 transition-colors"
        >
          <ArrowRight size={16} />
          {AR.backToLogin}
        </button>

        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-primary rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Mail size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-black text-gray-900">{AR.forgotPassword}</h1>
          <p className="text-gray-400 text-sm mt-2">
            أدخلي بريدك الإلكتروني وسنرسل لك رابط إعادة التعيين
          </p>
        </div>

        {sent ? (
          <Alert type="success" title="تم الإرسال!">
            تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني. يرجى التحقق من صندوق الوارد.
          </Alert>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <Input
              label={AR.email}
              type="email"
              placeholder={AR.emailPlaceholder}
              error={errors.email?.message}
              rightIcon={<Mail size={18} />}
              id="forgot-email"
              dir="ltr"
              {...register('email')}
            />
            <Button type="submit" variant="primary" size="lg" loading={loading} className="w-full">
              {AR.sendResetLink}
            </Button>
          </form>
        )}
      </motion.div>
    </div>
  );
}
