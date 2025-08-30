import { useState, useEffect } from 'react';
import { User, Mail, Calendar, Shield, Edit, Save, X } from 'lucide-react';
import { useAuth } from '../store/authStore';
import { useTranslation } from '../contexts/LanguageContext';
import { api } from '../lib/api';
import type { UserProfile } from '../types';

export default function Profile() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    username: '',
    email: '',
  });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const profileData = await api.getProfile();
      setProfile(profileData);
      setEditForm({
        username: profileData.username,
        email: profileData.email,
      });
    } catch (error) {
      console.error('Failed to load profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    if (profile) {
      setEditForm({
        username: profile.username,
        email: profile.email,
      });
    }
  };

  const handleSave = async () => {
    console.log('Saving profile:', editForm);
    setIsEditing(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-center text-gray-500">{t('errors.serverError')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t('profile.title')}</h1>
            <p className="text-gray-600 mt-1">{t('profile.subtitle')}</p>
          </div>
          <div className="flex items-center space-x-2">
            {!isEditing ? (
              <button
                onClick={handleEdit}
                className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
              >
                <Edit className="h-4 w-4 mr-2" />
                {t('common.edit')} {t('common.profile')}
              </button>
            ) : (
              <div className="flex space-x-2">
                <button
                  onClick={handleSave}
                  className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {t('common.save')}
                </button>
                <button
                  onClick={handleCancel}
                  className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
                >
                  <X className="h-4 w-4 mr-2" />
                  {t('common.cancel')}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Profile Information */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 bg-gray-50 border-b">
          <h2 className="text-lg font-semibold text-gray-900">{t('profile.userInfo')}</h2>
        </div>
        
        <div className="p-6 space-y-6">
          {/* User ID */}
          <div className="flex items-center space-x-4">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <Shield className="h-6 w-6 text-indigo-600" />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-500">{t('profile.userId')}</label>
              <p className="text-sm text-gray-900 font-mono mt-1">{profile.id}</p>
            </div>
          </div>

          {/* Username */}
          <div className="flex items-center space-x-4">
            <div className="p-2 bg-blue-100 rounded-lg">
              <User className="h-6 w-6 text-blue-600" />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-500">{t('common.username')}</label>
              {isEditing ? (
                <input
                  type="text"
                  value={editForm.username}
                  onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                />
              ) : (
                <p className="text-sm text-gray-900 mt-1">{profile.username}</p>
              )}
            </div>
          </div>

          {/* Email */}
          <div className="flex items-center space-x-4">
            <div className="p-2 bg-green-100 rounded-lg">
              <Mail className="h-6 w-6 text-green-600" />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-500">{t('common.email')}</label>
              {isEditing ? (
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                />
              ) : (
                <p className="text-sm text-gray-900 mt-1">{profile.email}</p>
              )}
            </div>
          </div>

          {/* Created At */}
          <div className="flex items-center space-x-4">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Calendar className="h-6 w-6 text-purple-600" />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-500">{t('profile.createdAt')}</label>
              <p className="text-sm text-gray-900 mt-1">
                {new Date(profile.created_at).toLocaleString()}
              </p>
            </div>
          </div>

          {/* Last Login */}
          {profile.last_login && (
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Calendar className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-500">{t('profile.lastLogin')}</label>
                <p className="text-sm text-gray-900 mt-1">
                  {new Date(profile.last_login).toLocaleString()}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Security Information */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 bg-gray-50 border-b">
          <h2 className="text-lg font-semibold text-gray-900">{t('profile.securityInfo')}</h2>
        </div>
        
        <div className="p-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start">
              <Shield className="h-5 w-5 text-blue-600 mr-3 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-medium text-blue-800 mb-2">{t('profile.sessionStatus')}</h3>
                <div className="text-sm text-blue-700 space-y-1">
                  <p>✓ JWT authentication {t('profile.active')}</p>
                  <p>✓ Token refresh {t('dashboard.enabled')}</p>
                  <p>✓ {t('profile.securityInfo')}</p>
                  <p>✓ {t('dashboard.autoTokenRefresh')}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
