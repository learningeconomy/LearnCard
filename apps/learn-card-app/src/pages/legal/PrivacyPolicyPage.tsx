import React from 'react';

import { useBrandingConfig } from 'learn-card-base/config/TenantConfigProvider';

import LegalPageLayout from './LegalPageLayout';

const PrivacyPolicyPage: React.FC = () => {
    const { name } = useBrandingConfig();

    return (
        <LegalPageLayout title={`${name} Privacy Policy`} lastUpdated="February 4, 2026">
            <Section heading="1. Overview and Design Principles">
                <p>
                    Learning Economy Foundation (&quot;Learning Economy,&quot; &quot;we,&quot;
                    &quot;our&quot;) develops and operates {name}, a digital wallet and
                    credentialing platform designed to minimize data collection, prioritize user
                    and guardian control, and prevent monetization of learner data.
                </p>

                <p>
                    {name} is not a zero-data system. Limited metadata is processed to operate the
                    service securely. However, credential contents and cryptographic private keys
                    are designed to remain under user or guardian control and are not accessible to
                    Learning Economy in decrypted form.
                </p>
            </Section>

            <Section heading="2. Organizational Identity">
                <p>Legal Entity: Learning Economy Foundation, LLC</p>
                <p>Product: {name}</p>
                <p>
                    Contact:{' '}
                    <a href="mailto:privacy@learningeconomy.io" className="underline hover:text-grayscale-900">
                        privacy@learningeconomy.io
                    </a>
                </p>

                <p>
                    Learning Economy does not sell personal data, operate advertising networks, or
                    act as a data broker.
                </p>
            </Section>

            <Section heading="3. System Architecture and Data Custody">
                <h4 className="font-semibold text-grayscale-800 mt-4">User-Controlled Data</h4>
                <ul className="list-disc pl-5 space-y-1">
                    <li>Private cryptographic keys are generated and stored on user devices</li>
                    <li>Credential contents are encrypted end-to-end prior to transmission</li>
                    <li>Learning Economy does not possess decryption keys for encrypted credentials</li>
                </ul>

                <h4 className="font-semibold text-grayscale-800 mt-4">Centrally Stored Metadata</h4>
                <p>
                    Learning Economy stores limited platform metadata necessary to operate {name},
                    including:
                </p>
                <ul className="list-disc pl-5 space-y-1">
                    <li>Profile information (e.g., display name, contact method, country, date of birth if provided)</li>
                    <li>Consent and authorization records</li>
                    <li>Credential identifiers and metadata (not decrypted contents)</li>
                    <li>Guardian-managed account relationships</li>
                </ul>
                <p>
                    This metadata is encrypted at rest and transmitted using industry-standard
                    security protocols.
                </p>
            </Section>

            <Section heading="4. Personal Data We Process">
                <p>Depending on configuration and consent, {name} may process:</p>
                <ul className="list-disc pl-5 space-y-1">
                    <li>Display name or alias</li>
                    <li>Email address or phone number (if used for authentication)</li>
                    <li>Date of birth and country (for age-based consent enforcement)</li>
                    <li>Decentralized Identifiers (DIDs)</li>
                    <li>User-provided profile content</li>
                    <li>Consent and sharing records</li>
                </ul>

                <p>{name} does not store:</p>
                <ul className="list-disc pl-5 space-y-1">
                    <li>User private cryptographic keys</li>
                    <li>Decrypted credential contents</li>
                    <li>Government-issued identification numbers</li>
                </ul>
            </Section>

            <Section heading="5. Analytics, Logs, and Operational Telemetry">
                <p>
                    {name} uses limited operational telemetry solely for security, reliability, and
                    service improvement.
                </p>

                <p>
                    Telemetry may be processed by third-party service providers (e.g., Firebase,
                    Sentry, cloud infrastructure providers) and may include technical identifiers
                    such as IP address, device information, session metadata, or internal
                    identifiers.
                </p>

                <p>
                    {name} does not use analytics for advertising, behavioral targeting, or
                    marketing.
                </p>

                <h4 className="font-semibold text-grayscale-800 mt-4">K–12 and Minor Protections</h4>
                <ul className="list-disc pl-5 space-y-1">
                    <li>Analytics and telemetry are disabled by default for users under 13</li>
                    <li>Analytics for minors aged 13–17 require explicit consent</li>
                    <li>Districts and schools may require analytics to be fully disabled</li>
                    <li>Minimal security logging may still occur to protect system integrity</li>
                </ul>

                <p>
                    Operational telemetry is limited to what is reasonably necessary to operate and
                    secure the service.
                </p>
            </Section>

            <Section heading="6. Data Sharing and Consent">
                <p>
                    Data sharing occurs only through explicit user, guardian, or
                    district-authorized consent flows.
                </p>

                <p>
                    Users or guardians select which credentials or categories to share. Sharing may
                    be time-limited and revocable where technically feasible.
                </p>

                <p>
                    Learning Economy may observe that a sharing event occurred but cannot access
                    the contents of encrypted credentials.
                </p>
            </Section>

            <Section heading="7. Children, Minors, and Educational Use">
                <p>
                    {name} supports educational use by minors subject to appropriate safeguards.
                </p>
                <ul className="list-disc pl-5 space-y-1">
                    <li>Under 13: Access requires verified guardian or school authorization</li>
                    <li>Ages 13–17: Parental consent is required where mandated by law</li>
                </ul>
                <p>
                    Guardians and schools may manage, review, revoke consent for, or delete student
                    data.
                </p>
            </Section>

            <Section heading="8. Artificial Intelligence Features">
                <p>
                    {name} offers optional AI-assisted features accessed exclusively through
                    {name}-controlled systems. Learners do not interact directly with third-party
                    AI platforms.
                </p>

                <p>When enabled:</p>
                <ul className="list-disc pl-5 space-y-1">
                    <li>User-provided inputs and contextual learning data may be processed by external AI providers</li>
                    <li>Learning Economy does not permit AI providers to train models on learner data</li>
                    <li>AI providers may retain inputs and outputs in accordance with their own policies</li>
                </ul>

                <h4 className="font-semibold text-grayscale-800 mt-4">K–12 AI Restrictions</h4>
                <ul className="list-disc pl-5 space-y-1">
                    <li>External AI features are disabled by default for users under 13</li>
                    <li>AI features may be restricted or disabled by districts or schools</li>
                    <li>All AI usage requires explicit consent from the user or guardian</li>
                </ul>
            </Section>

            <Section heading="9. Data Retention and Deletion">
                <p>Users and guardians may delete accounts at any time.</p>

                <p>Deletion removes, to the extent technically feasible:</p>
                <ul className="list-disc pl-5 space-y-1">
                    <li>Profile data</li>
                    <li>Credential metadata</li>
                    <li>Consent records</li>
                </ul>

                <p>Residual data may persist in:</p>
                <ul className="list-disc pl-5 space-y-1">
                    <li>Encrypted system backups</li>
                    <li>Operational logs and analytics retained by third-party providers</li>
                    <li>Credentials previously shared with third parties</li>
                </ul>
            </Section>

            <Section heading="10. Security Measures">
                <p>{name} employs:</p>
                <ul className="list-disc pl-5 space-y-1">
                    <li>Encryption in transit</li>
                    <li>Encryption at rest</li>
                    <li>End-to-end encryption for credential contents</li>
                    <li>Role-based access controls</li>
                </ul>
            </Section>

            <Section heading="11. Privacy Rights">
                <p>
                    Depending on jurisdiction, users and guardians may have rights to access,
                    correct, delete, or export personal data. Requests may be submitted to{' '}
                    <a href="mailto:privacy@learningeconomy.io" className="underline hover:text-grayscale-900">
                        privacy@learningeconomy.io
                    </a>.
                </p>
            </Section>

            <Section heading="Appendix A — K–12 Privacy Commitment">
                <p>When {name} is used pursuant to a school or district agreement:</p>
                <ul className="list-disc pl-5 space-y-1">
                    <li>No advertising is displayed</li>
                    <li>Student data is not sold or monetized</li>
                    <li>Analytics and AI features are restricted by default</li>
                    <li>Schools and guardians retain authority over access and consent</li>
                </ul>
            </Section>

            <Section heading="Appendix B — FERPA &amp; COPPA Alignment Statement">
                <h4 className="font-semibold text-grayscale-800 mt-4">FERPA</h4>
                <p>
                    When contracted by a school or district, Learning Economy functions as a
                    service provider acting under district direction and does not independently
                    control education records.
                </p>

                <h4 className="font-semibold text-grayscale-800 mt-4">COPPA</h4>
                <p>
                    Parental consent is required for children under 13. Data collection is
                    minimized, and analytics and external AI features are disabled by default.
                </p>
            </Section>
        </LegalPageLayout>
    );
};

export default PrivacyPolicyPage;

// ---------------------------------------------------------------------------
// Local helper component
// ---------------------------------------------------------------------------

const Section: React.FC<{ heading: string; children: React.ReactNode }> = ({ heading, children }) => (
    <section className="space-y-3">
        <h2 className="text-lg font-semibold text-grayscale-900">{heading}</h2>
        {children}
    </section>
);
