import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Eye, EyeOff } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { useAuth } from '../../contexts/AuthContext';
import { AR } from '../../constants/arabic';
import { ROUTES } from '../../constants/config';
import { Button, Input } from '../../components/common';
import { motion } from 'framer-motion';

const schema = z.object({
  password: z.string().min(8, 'كلمة المرور يجب أن تكون 8 أحرف على الأقل'),
  confirm:  z.string(),
}).refine(d => d.password === d.confirm, {
  message: 'كلمة المرور غير متطابقة',
  path: ['confirm'],
});

type FormData = z.infer<typeof schema>;

export function ResetPasswordPage() {
  const { updatePassword } = useAuth();
  const navigate = useNavigate();
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    const { error } = await updatePassword(data.password);
    setLoading(false);
    if (error) {
      toast.error('تعذّر إعادة تعيين كلمة المرور.');
      return;
    }
    toast.success('تم تعيين كلمة المرور الجديدة بنجاح!');
    navigate(ROUTES.login);
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
        className="auth-card"
      >
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-primary rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Lock size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-black text-gray-900">{AR.resetPassword}</h1>
          <p className="text-gray-400 text-sm mt-2">أدخلي كلمة المرور الجديدة</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <Input
            label={AR.newPassword}
            type={showPw ? 'text' : 'password'}
            error={errors.password?.message}
            id="reset-pw"
            dir="ltr"
            rightIcon={<Lock size={18} />}
            leftIcon={
              <button type="button" onClick={() => setShowPw(!showPw)} className="text-gray-400">
                {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            }
            {...register('password')}
          />
          <Input
            label={AR.confirmPassword}
            type={showPw ? 'text' : 'password'}
            error={errors.confirm?.message}
            id="reset-confirm"
            dir="ltr"
            rightIcon={<Lock size={18} />}
            {...register('confirm')}
          />
          <Button type="submit" variant="primary" size="lg" loading={loading} className="w-full">
            تعيين كلمة المرور
          </Button>
        </form>
      </motion.div>
    </div>
  );
}
