/**
 * Profile Page
 * User profile management and password change
 */

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useAuth } from '../context/AuthContext';
import { userAPI } from '../api';
import Loading from '../components/Loading';

const Toast = ({ message, type, onClose }) => (
  <div className={`fixed top-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl border animate-slide-up
    ${type === 'success'
      ? 'bg-emerald-950/90 border-emerald-700/50 text-emerald-300'
      : 'bg-red-950/90 border-red-700/50 text-red-300'
    }`}
  >
    {type === 'success' ? (
      <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
      </svg>
    ) : (
      <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
      </svg>
    )}
    <span className="text-sm font-medium">{message}</span>
    <button onClick={onClose} className="ml-1 opacity-60 hover:opacity-100">
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
      </svg>
    </button>
  </div>
);

const Profile = () => {
  const { user, updateUser, logout } = useAuth();
  const [toast, setToast] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);

  const {
    register: regProfile,
    handleSubmit: handleProfile,
    formState: { errors: profileErrors },
  } = useForm({ defaultValues: { name: user?.name || '', email: user?.email || '' } });

  const {
    register: regPassword,
    handleSubmit: handlePassword,
    reset: resetPassword,
    watch,
    formState: { errors: passwordErrors },
  } = useForm();
  const newPass = watch('newPassword');

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const onUpdateProfile = async (values) => {
    setProfileLoading(true);
    try {
      const { data } = await userAPI.updateProfile(values);
      updateUser(data.user);
      showToast('Profile updated successfully!');
    } catch (err) {
      showToast(err.response?.data?.message || 'Update failed.', 'error');
    } finally {
      setProfileLoading(false);
    }
  };

  const onChangePassword = async (values) => {
    setPasswordLoading(true);
    try {
      await userAPI.changePassword({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      });
      resetPassword();
      showToast('Password changed successfully!');
    } catch (err) {
      showToast(err.response?.data?.message || 'Password change failed.', 'error');
    } finally {
      setPasswordLoading(false);
    }
  };

  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  return (
    <div className="min-h-screen bg-surface-950 py-8 px-4">
      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}

      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Profile Settings</h1>
          <p className="text-slate-400 text-sm mt-1">Manage your account details and password</p>
        </div>

        {/* Avatar + Stats */}
        <div className="card flex flex-wrap items-center gap-5">
          <div className="w-16 h-16 rounded-2xl bg-brand-600 flex items-center justify-center text-white text-xl font-bold shadow-lg shadow-brand-900/40 flex-shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-slate-100 text-lg">{user?.name}</p>
            <p className="text-slate-400 text-sm">{user?.email}</p>
            <p className="text-xs text-slate-600 mt-1">
              Member since {new Date(user?.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-surface-800 rounded-xl px-4 py-3 text-center border border-surface-700">
              <p className="text-xl font-bold text-slate-100">{user?.totalInterviews || 0}</p>
              <p className="text-xs text-slate-500 mt-0.5">Interviews</p>
            </div>
            <div className="bg-surface-800 rounded-xl px-4 py-3 text-center border border-surface-700">
              <p className="text-xl font-bold text-brand-400">{user?.averageScore || 0}%</p>
              <p className="text-xs text-slate-500 mt-0.5">Avg Score</p>
            </div>
          </div>
        </div>

        {/* Edit Profile */}
        <div className="card">
          <h2 className="text-base font-semibold text-slate-100 mb-4">Personal Information</h2>
          <form onSubmit={handleProfile(onUpdateProfile)} className="space-y-4">
            <div>
              <label className="label">Full Name</label>
              <input
                type="text"
                className={`input ${profileErrors.name ? 'border-red-600' : ''}`}
                {...regProfile('name', {
                  required: 'Name is required',
                  minLength: { value: 2, message: 'At least 2 characters' },
                })}
              />
              {profileErrors.name && <p className="form-error">{profileErrors.name.message}</p>}
            </div>
            <div>
              <label className="label">Email Address</label>
              <input
                type="email"
                className={`input ${profileErrors.email ? 'border-red-600' : ''}`}
                {...regProfile('email', {
                  required: 'Email is required',
                  pattern: { value: /^\S+@\S+\.\S+$/, message: 'Enter a valid email' },
                })}
              />
              {profileErrors.email && <p className="form-error">{profileErrors.email.message}</p>}
            </div>
            <button type="submit" disabled={profileLoading} className="btn-primary">
              {profileLoading ? <Loading size="sm" /> : 'Save Changes'}
            </button>
          </form>
        </div>

        {/* Change Password */}
        <div className="card">
          <h2 className="text-base font-semibold text-slate-100 mb-4">Change Password</h2>
          <form onSubmit={handlePassword(onChangePassword)} className="space-y-4">
            <div>
              <label className="label">Current Password</label>
              <input
                type="password"
                placeholder="••••••••"
                className={`input ${passwordErrors.currentPassword ? 'border-red-600' : ''}`}
                {...regPassword('currentPassword', { required: 'Current password is required' })}
              />
              {passwordErrors.currentPassword && <p className="form-error">{passwordErrors.currentPassword.message}</p>}
            </div>
            <div>
              <label className="label">New Password</label>
              <input
                type="password"
                placeholder="At least 6 characters"
                className={`input ${passwordErrors.newPassword ? 'border-red-600' : ''}`}
                {...regPassword('newPassword', {
                  required: 'New password is required',
                  minLength: { value: 6, message: 'Must be at least 6 characters' },
                })}
              />
              {passwordErrors.newPassword && <p className="form-error">{passwordErrors.newPassword.message}</p>}
            </div>
            <div>
              <label className="label">Confirm New Password</label>
              <input
                type="password"
                placeholder="Repeat new password"
                className={`input ${passwordErrors.confirmPassword ? 'border-red-600' : ''}`}
                {...regPassword('confirmPassword', {
                  required: 'Please confirm your new password',
                  validate: (v) => v === newPass || 'Passwords do not match',
                })}
              />
              {passwordErrors.confirmPassword && <p className="form-error">{passwordErrors.confirmPassword.message}</p>}
            </div>
            <button type="submit" disabled={passwordLoading} className="btn-primary">
              {passwordLoading ? <Loading size="sm" /> : 'Change Password'}
            </button>
          </form>
        </div>

        {/* Danger Zone */}
        <div className="card border-red-900/40">
          <h2 className="text-base font-semibold text-red-400 mb-2">Danger Zone</h2>
          <p className="text-sm text-slate-400 mb-4">
            Signing out will end your current session. You will need to log in again to access your account.
          </p>
          <button onClick={logout} className="btn-danger">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
};

export default Profile;
