import { useEffect, useState } from 'react';
import { sendMessage } from '../../messaging/client';
import type {
  GetAuthStatusResponse,
  GetProfileResponse,
  LogoutResponse,
  StartAuthResponse,
} from '../../types/messages';

export const useAuth = () => {
  const [did, setDid] = useState<string | null>(null);

  const [profileImage, setProfileImage] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);

  // Initialize from background on mount
  useEffect(() => {
    sendMessage({ type: 'get-auth-status' }).then((resp: GetAuthStatusResponse) => {
      if (resp?.ok && resp.data) {
        setDid(resp.data.did ?? null);
        if (resp.data.loggedIn) {
          refreshProfile();
        }
      }
    });
  }, []);

  const refreshProfile = async (): Promise<GetProfileResponse> => {
    const resp = await sendMessage({ type: 'get-profile' });

    if (resp?.ok) setProfileImage(resp.profile?.image ?? null);

    return resp as GetProfileResponse;
  };

  const login = async (): Promise<StartAuthResponse> => {
    setLoading(true);

    const resp = await sendMessage({ type: 'start-auth' });

    setLoading(false);

    if (resp?.ok) {
      setDid(resp.data?.did ?? null);
      await refreshProfile();
    }

    return resp as StartAuthResponse;
  };

  const logout = async (): Promise<LogoutResponse> => {
    setLoading(true);

    const resp = await sendMessage({ type: 'logout' });

    setLoading(false);

    if (resp?.ok) {
      setDid(null);
      setProfileImage(null);
    }

    return resp as LogoutResponse;
  };

  return {
    did,
    profileImage,
    loading,
    login,
    logout,
    refreshProfile,
  } as const;
};
