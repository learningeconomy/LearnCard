import React from 'react';

import { useBrandingConfig } from 'learn-card-base/config/TenantConfigProvider';

import LegalPageLayout from './LegalPageLayout';

const TermsOfServicePage: React.FC = () => {
    const { name } = useBrandingConfig();

    return (
        <LegalPageLayout title={`${name} Terms of Service`} lastUpdated="February 4, 2026">
            <p className="italic text-grayscale-600">
                Learner Sovereignty &amp; Education Infrastructure Edition
            </p>

            <Section heading="Table of Contents">
                <ol className="list-decimal pl-5 space-y-1">
                    <li>Agreement to These Terms</li>
                    <li>Our Mission and Role</li>
                    <li>Eligibility and Account Responsibility</li>
                    <li>{name}, LearnCloud, and the Ecosystem</li>
                    <li>Learner Data, Credentials, and Ownership</li>
                    <li>Consent, Data Connections, and Portability</li>
                    <li>Connected Applications and App Marketplace</li>
                    <li>AI-Assisted Learning and Training Features</li>
                    <li>Credential Issuance and Interpretation</li>
                    <li>Acceptable Use</li>
                    <li>Third-Party Services and Integrations</li>
                    <li>Suspension and Termination</li>
                    <li>Privacy and Data Protection</li>
                    <li>Data Retention and Deletion</li>
                    <li>Disclaimers</li>
                    <li>Limitation of Liability</li>
                    <li>Indemnification</li>
                    <li>Changes to the Services or Terms</li>
                    <li>Governing Law</li>
                    <li>Contact Information</li>
                </ol>
            </Section>

            <Section heading="How to Read These Terms (Simple Overview)">
                <DefinitionList items={[
                    { term: `${name} Wallet`, definition: 'Your personal learning and employment passport' },
                    { term: 'LearnCloud', definition: 'Secure infrastructure that stores encrypted records and consent metadata' },
                    { term: 'Consent Layer', definition: 'You decide what data connects to which apps, and for how long' },
                    { term: 'App Ecosystem', definition: 'Optional third-party tools (education, jobs, productivity) you can connect' },
                    { term: 'AI Features', definition: 'Optional tools to explore skills, learning, and pathways — not decision-makers' },
                    { term: 'Our Role', definition: 'Infrastructure steward, not data owner, employer, or authority' },
                    { term: 'Your Role', definition: 'Owner of your data and decisions' },
                ]} />
            </Section>

            <Section heading="1. Agreement to These Terms">
                <p>
                    These Terms of Service (&quot;Terms&quot;) govern your access to and use of {name} and
                    LearnCloud, including our websites, applications, APIs, and related services
                    (collectively, the &quot;Services&quot;).
                </p>

                <p>
                    By accessing or using the Services, you agree to these Terms. If you do not
                    agree, you may not use the Services.
                </p>

                <p>
                    If you are using {name} on behalf of a minor, school, district, or organization,
                    you represent that you are authorized to do so and agree to these Terms on
                    their behalf.
                </p>
            </Section>

            <Section heading="2. Our Mission and Role">
                <p>
                    Learning Economy Foundation, LLC is a U.S.-based nonprofit organization,
                    recognized under Section 501(c)(3) of the Internal Revenue Code, dedicated to
                    learner agency, guardian authority, and data sovereignty.
                </p>

                <p>{name} and LearnCloud are designed as public-good infrastructure to:</p>
                <ul className="list-disc pl-5 space-y-1">
                    <li>Enable individuals to hold and share their learning and employment records</li>
                    <li>Allow guardians and schools to manage access for minors</li>
                    <li>Support lifelong learning and workforce mobility</li>
                    <li>Prevent the sale or monetization of learner data</li>
                </ul>

                <p>We act as a technical steward and service provider, not as:</p>
                <ul className="list-disc pl-5 space-y-1">
                    <li>An employer</li>
                    <li>A school</li>
                    <li>A credentialing authority</li>
                    <li>A hiring decision-maker</li>
                    <li>A guarantor of outcomes</li>
                </ul>

                <p>
                    We do not independently access, control, or use education records and act
                    solely under the direction of learners, guardians, or educational institutions
                    where applicable.
                </p>
            </Section>

            <Section heading="3. Eligibility and Account Responsibility">
                <p>{name} may be used by:</p>
                <ul className="list-disc pl-5 space-y-1">
                    <li>Adults</li>
                    <li>Minors with verified guardian or school authorization</li>
                    <li>Schools, districts, and organizations under agreement</li>
                </ul>

                <p>
                    Guardians and institutions are responsible for managing accounts created for
                    minors.
                </p>

                <p>You agree to:</p>
                <ul className="list-disc pl-5 space-y-1">
                    <li>Provide accurate information</li>
                    <li>Safeguard access credentials</li>
                    <li>Use the Services lawfully and responsibly</li>
                </ul>
            </Section>

            <Section heading={`4. ${name}, LearnCloud, and the Ecosystem`}>
                <p>
                    {name} is a digital wallet and passport for learning and employment data.
                    LearnCloud provides secure infrastructure that supports storage, encryption,
                    and consent-based access.
                </p>

                <p>Together, they function similarly to:</p>
                <ul className="list-disc pl-5 space-y-1">
                    <li>A bank account + budgeting apps (for financial data), or</li>
                    <li>A payments platform + connected services (for transactions)</li>
                </ul>
                <p>Except applied to learning, skills, and employment records.</p>
            </Section>

            <Section heading="5. Learner Data, Credentials, and Ownership">
                <h4 className="font-semibold text-grayscale-800 mt-4">5.1 Learner Ownership</h4>
                <p>Learners (or their guardians) retain ownership of:</p>
                <ul className="list-disc pl-5 space-y-1">
                    <li>Their credentials</li>
                    <li>Their profile information</li>
                    <li>Their consent decisions</li>
                    <li>Their data connections</li>
                </ul>
                <p>
                    Learning Economy does not claim ownership of learner credentials or records.
                </p>

                <h4 className="font-semibold text-grayscale-800 mt-4">5.2 Platform License</h4>
                <p>
                    We grant you a limited, non-exclusive, non-transferable license to use the
                    Services solely for lawful, educational, and personal purposes consistent with
                    these Terms.
                </p>
            </Section>

            <Section heading="6. Consent, Data Connections, and Portability">
                <p>{name} is built around explicit, revocable consent.</p>
                <p>You control:</p>
                <ul className="list-disc pl-5 space-y-1">
                    <li>Which data is shared</li>
                    <li>With which applications or systems</li>
                    <li>For what purpose</li>
                    <li>For what duration</li>
                </ul>

                <p>You may revoke consent where technically feasible.</p>

                <p>
                    Data portability is a core principle: credentials are designed to be usable
                    beyond {name}, using open standards.
                </p>
            </Section>

            <Section heading="7. Connected Applications and App Marketplace">
                <p>
                    {name} and LearnCloud may enable you to connect your data to third-party
                    applications and services, including:
                </p>
                <ul className="list-disc pl-5 space-y-1">
                    <li>Learning management systems</li>
                    <li>Workforce and HR systems</li>
                    <li>Job platforms</li>
                    <li>Productivity and career tools</li>
                    <li>Educational and training applications</li>
                </ul>
                <p>These connections are:</p>
                <ul className="list-disc pl-5 space-y-1">
                    <li>Initiated by you (or your guardian or school)</li>
                    <li>Governed by your consent</li>
                    <li>Subject to the third party&apos;s own terms and policies</li>
                </ul>
                <p>
                    Learning Economy does not control or operate third-party applications and is
                    not responsible for how connected systems use data once access has been
                    authorized.
                </p>
            </Section>

            <Section heading="8. AI-Assisted Learning and Training Features">
                <p>{name} may offer optional AI-assisted features to help users:</p>
                <ul className="list-disc pl-5 space-y-1">
                    <li>Explore skills and competencies</li>
                    <li>Practice learning and training</li>
                    <li>Navigate educational and career pathways</li>
                </ul>

                <h4 className="font-semibold text-grayscale-800 mt-4">Important Clarifications</h4>
                <ul className="list-disc pl-5 space-y-1">
                    <li>AI features are assistive and educational, not authoritative</li>
                    <li>AI outputs do not constitute professional, legal, hiring, or certification advice</li>
                    <li>Learning Economy does not permit learner data to be used to train AI models</li>
                    <li>
                        AI features may involve third-party providers operating under contractual
                        restrictions; however, retention or processing of AI inputs may be subject
                        to those providers&apos; policies, except where prohibited for K–12 users
                    </li>
                    <li>AI features are subject to consent and may be restricted for minors or by schools</li>
                </ul>

                <p>
                    Decisions regarding education, employment, hiring, or credential acceptance
                    remain the responsibility of users and relevant third parties.
                </p>
            </Section>

            <Section heading="9. Credential Issuance and Interpretation">
                <p>
                    Credentials stored or shared through {name} are issued by third-party
                    organizations or individuals.
                </p>
                <p>Learning Economy:</p>
                <ul className="list-disc pl-5 space-y-1">
                    <li>Does not independently verify credential accuracy beyond cryptographic checks</li>
                    <li>Does not guarantee acceptance, recognition, or outcomes</li>
                    <li>Does not determine how credentials are interpreted or used by receiving parties</li>
                </ul>
            </Section>

            <Section heading="10. Acceptable Use">
                <p>You agree not to:</p>
                <ul className="list-disc pl-5 space-y-1">
                    <li>Misuse the Services to harm others</li>
                    <li>Circumvent security or consent controls</li>
                    <li>Impersonate another person</li>
                    <li>Interfere with system integrity</li>
                    <li>Use the Services for unlawful surveillance, exploitation, or harassment</li>
                    <li>Attempt unauthorized data extraction or re-identification</li>
                </ul>
                <p>
                    Commercial resale or exploitation of the Services without written permission is
                    prohibited.
                </p>
            </Section>

            <Section heading="11. Third-Party Services and Integrations">
                <p>The Services may rely on third-party infrastructure or integrations.</p>
                <p>
                    Your use of third-party services is governed by their terms. Learning Economy
                    is not responsible for third-party systems beyond our contractual obligations.
                </p>
            </Section>

            <Section heading="12. Suspension and Termination">
                <p>We may suspend or terminate access if:</p>
                <ul className="list-disc pl-5 space-y-1">
                    <li>These Terms are violated</li>
                    <li>Use poses a security, safety, or legal risk</li>
                    <li>Required by law</li>
                    <li>Requested by a guardian or educational institution</li>
                </ul>
                <p>
                    Where feasible and appropriate, especially in educational contexts, we aim to
                    provide notice and an opportunity to address issues.
                </p>
            </Section>

            <Section heading="13. Privacy and Data Protection">
                <p>
                    Our Privacy Policy describes how data is processed, protected, and controlled
                    and is incorporated by reference.
                </p>
                <p>
                    Privacy, consent, and data minimization are foundational to the Services.
                </p>
            </Section>

            <Section heading="14. Data Retention and Deletion">
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

            <Section heading="15. Disclaimers">
                <p>
                    The Services are provided &quot;as is&quot; and &quot;as available.&quot;
                </p>
                <p>
                    We do not guarantee uninterrupted availability or specific outcomes from use of
                    the Services.
                </p>
                <p>
                    Nothing in these Terms limits rights that cannot be waived under applicable
                    law.
                </p>
            </Section>

            <Section heading="16. Limitation of Liability">
                <p>
                    To the extent permitted by law, Learning Economy shall not be liable for
                    indirect, incidental, or consequential damages arising from use of the
                    Services.
                </p>
                <p>
                    Some jurisdictions do not allow certain limitations, and those laws will apply
                    where relevant.
                </p>
            </Section>

            <Section heading="17. Indemnification">
                <p>
                    You agree to indemnify Learning Economy for claims arising from your misuse of
                    the Services or violation of these Terms.
                </p>
                <p>
                    This does not apply to claims arising from our own misconduct or legal
                    noncompliance.
                </p>
            </Section>

            <Section heading="18. Changes to the Services or Terms">
                <p>
                    We may update these Terms to reflect changes in law, technology, or the
                    Services.
                </p>
                <p>Material changes will be communicated in a reasonable manner.</p>
            </Section>

            <Section heading="19. Governing Law">
                <p>
                    These Terms are governed by the laws of the United States and the State in
                    which Learning Economy Foundation is incorporated, without regard to
                    conflict-of-law principles.
                </p>
            </Section>

            <Section heading="20. Contact Information">
                <p>Learning Economy Foundation, LLC</p>
                <p>
                    <a href="mailto:privacy@learningeconomy.io" className="underline hover:text-grayscale-900">
                        privacy@learningeconomy.io
                    </a>
                </p>
            </Section>
        </LegalPageLayout>
    );
};

export default TermsOfServicePage;

// ---------------------------------------------------------------------------
// Local helper components
// ---------------------------------------------------------------------------

const Section: React.FC<{ heading: string; children: React.ReactNode }> = ({ heading, children }) => (
    <section className="space-y-3">
        <h2 className="text-lg font-semibold text-grayscale-900">{heading}</h2>
        {children}
    </section>
);

const DefinitionList: React.FC<{ items: { term: string; definition: string }[] }> = ({ items }) => (
    <dl className="space-y-2">
        {items.map(({ term, definition }) => (
            <div key={term} className="flex gap-2">
                <dt className="font-semibold text-grayscale-800 min-w-[140px] shrink-0">{term}</dt>
                <dd className="text-grayscale-600">{definition}</dd>
            </div>
        ))}
    </dl>
);
