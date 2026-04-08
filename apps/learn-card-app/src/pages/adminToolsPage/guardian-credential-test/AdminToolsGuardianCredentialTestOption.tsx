import React, { useState } from 'react';
import type { FC } from 'react';

import { useWallet, useToast, ToastTypeEnum } from 'learn-card-base';
import { useGetBoosts, useGetMyManagedChildren } from 'learn-card-base/react-query/queries/queries';

import AdminToolsOptionItemHeader from '../AdminToolsModal/helpers/AdminToolsOptionItemHeader';
import type { AdminToolOption } from '../AdminToolsModal/admin-tools.helpers';

type SendStatus = 'idle' | 'sending' | 'success' | 'error';

const inputClass =
    'w-full border border-grayscale-200 rounded-[12px] px-[12px] py-[10px] text-[14px] text-grayscale-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white font-notoSans';
const labelClass = 'text-[13px] font-[600] text-grayscale-700 mb-[4px] block font-notoSans';

const AdminToolsGuardianCredentialTestOption: FC<{ option: AdminToolOption }> = ({ option }) => {
    const { initWallet } = useWallet();
    const { presentToast } = useToast();
    const { data: boosts = [], isLoading: boostsLoading } = useGetBoosts();
    const { data: managedChildren = [], isLoading: managedLoading } = useGetMyManagedChildren();

    const [recipientEmail, setRecipientEmail] = useState('');
    const [guardianEmail, setGuardianEmail] = useState('');
    const [boostUri, setBoostUri] = useState('');
    const [status, setStatus] = useState<SendStatus>('idle');
    const [result, setResult] = useState<{
        issuanceId?: string;
        guardianStatus?: string;
        error?: string;
    } | null>(null);

    const reset = () => {
        setStatus('idle');
        setResult(null);
    };

    const handleSend = async () => {
        if (!recipientEmail.trim() || !guardianEmail.trim() || !boostUri.trim()) {
            presentToast('Fill in all three fields', { type: ToastTypeEnum.Error });
            return;
        }
        if (recipientEmail.trim().toLowerCase() === guardianEmail.trim().toLowerCase()) {
            presentToast('Guardian email must differ from recipient', { type: ToastTypeEnum.Error });
            return;
        }

        setStatus('sending');
        setResult(null);

        try {
            const wallet = await initWallet();
            const res = await wallet.invoke.send?.({
                type: 'boost',
                recipient: recipientEmail.trim(),
                templateUri: boostUri.trim(),
                options: { guardianEmail: guardianEmail.trim() },
            });

            setStatus('success');
            setResult({
                issuanceId: res?.inbox?.issuanceId,
                guardianStatus: res?.inbox?.guardianStatus ?? 'AWAITING_GUARDIAN',
            });
            presentToast('Guardian-gated credential sent!', { type: ToastTypeEnum.Success });
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Unknown error';
            setStatus('error');
            setResult({ error: message });
        }
    };

    return (
        <section className="h-full w-full flex items-start justify-center overflow-y-scroll pt-4">
            <section className="bg-white max-w-[800px] w-full rounded-[20px] overflow-hidden shadow-box-bottom">
                <AdminToolsOptionItemHeader option={option} />

                <div className="p-[20px] flex flex-col gap-[20px]">
                    {/* Boost picker */}
                    <div>
                        <label className={labelClass}>Boost Template</label>
                        {boostsLoading ? (
                            <p className="text-[13px] text-grayscale-400 font-notoSans">Loading boosts…</p>
                        ) : (
                            <>
                                {boosts.length > 0 && (
                                    <select
                                        className={`${inputClass} mb-[8px]`}
                                        value={boostUri}
                                        onChange={e => setBoostUri(e.target.value)}
                                    >
                                        <option value="">— pick a boost —</option>
                                        {boosts.map(b => (
                                            <option key={b.uri} value={b.uri ?? ''}>
                                                {b.name ?? b.uri}
                                            </option>
                                        ))}
                                    </select>
                                )}
                                <input
                                    type="text"
                                    className={inputClass}
                                    placeholder={boosts.length > 0 ? 'or paste URI directly' : 'Paste boost URI'}
                                    value={boostUri}
                                    onChange={e => setBoostUri(e.target.value)}
                                />
                            </>
                        )}
                    </div>

                    {/* Recipient email */}
                    <div>
                        <label className={labelClass}>Student / Recipient Email</label>
                        <input
                            type="email"
                            className={inputClass}
                            placeholder="student@example.com"
                            value={recipientEmail}
                            onChange={e => setRecipientEmail(e.target.value)}
                        />
                    </div>

                    {/* Guardian email */}
                    <div>
                        <label className={labelClass}>Guardian Email</label>
                        <input
                            type="email"
                            className={inputClass}
                            placeholder="guardian@example.com"
                            value={guardianEmail}
                            onChange={e => setGuardianEmail(e.target.value)}
                        />
                        <p className="text-[12px] text-grayscale-400 font-notoSans mt-[4px]">
                            Must differ from recipient. Guardian will receive an approval link and OTP challenge.
                        </p>
                    </div>

                    {/* Send button */}
                    {status !== 'success' && (
                        <button
                            onClick={handleSend}
                            disabled={status === 'sending' || !recipientEmail || !guardianEmail || !boostUri}
                            className="rounded-full bg-emerald-700 text-white px-[18px] py-[12px] text-[15px] font-[600] font-notoSans disabled:opacity-50 flex items-center justify-center gap-[8px]"
                        >
                            {status === 'sending' && (
                                <span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                            )}
                            {status === 'sending' ? 'Sending…' : 'Send Guardian-Gated Credential'}
                        </button>
                    )}

                    {/* Success result */}
                    {status === 'success' && result && (
                        <div className="bg-emerald-50 border border-emerald-200 rounded-[12px] p-[16px] flex flex-col gap-[6px]">
                            <p className="text-[14px] font-[600] text-emerald-800 font-notoSans">Sent!</p>
                            {result.issuanceId && (
                                <p className="text-[12px] text-emerald-700 font-notoSans">
                                    Issuance ID:{' '}
                                    <span className="font-mono">{result.issuanceId}</span>
                                </p>
                            )}
                            <p className="text-[12px] text-emerald-700 font-notoSans">
                                Status: <span className="font-mono">{result.guardianStatus}</span>
                            </p>
                            <p className="text-[12px] text-emerald-600 font-notoSans mt-[2px]">
                                Check both inboxes — student gets a pending notice, guardian gets
                                the approval link.
                            </p>
                            <button
                                onClick={reset}
                                className="text-[12px] text-emerald-700 font-notoSans underline self-start mt-[2px]"
                            >
                                Send another
                            </button>
                        </div>
                    )}

                    {/* Error result */}
                    {status === 'error' && result?.error && (
                        <div className="bg-red-50 border border-red-200 rounded-[12px] p-[16px] flex flex-col gap-[6px]">
                            <p className="text-[14px] font-[600] text-red-800 font-notoSans">Error</p>
                            <p className="text-[13px] text-red-700 font-mono break-all">{result.error}</p>
                            <button
                                onClick={reset}
                                className="text-[12px] text-red-700 font-notoSans underline self-start"
                            >
                                Try again
                            </button>
                        </div>
                    )}

                    {/* Managed Accounts */}
                    <hr className="border-grayscale-100" />
                    <div>
                        <p className={`${labelClass} mb-[8px]`}>Managed Accounts</p>
                        {managedLoading && (
                            <span className="animate-spin inline-block w-4 h-4 border-2 border-emerald-600 border-t-transparent rounded-full" />
                        )}
                        {!managedLoading && managedChildren.length === 0 && (
                            <p className="text-[13px] text-grayscale-400 font-notoSans">
                                You're not currently managing any accounts.
                            </p>
                        )}
                        {!managedLoading && managedChildren.map(profile => (
                            <div
                                key={profile.profileId}
                                className="flex items-center gap-[8px] py-[8px] border-b border-grayscale-100 last:border-0"
                            >
                                <div>
                                    <p className="text-[14px] font-[600] text-grayscale-900 font-notoSans">
                                        {profile.displayName || profile.profileId}
                                    </p>
                                    <p className="text-[12px] text-grayscale-400 font-notoSans">
                                        @{profile.profileId}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        </section>
    );
};

export default AdminToolsGuardianCredentialTestOption;
