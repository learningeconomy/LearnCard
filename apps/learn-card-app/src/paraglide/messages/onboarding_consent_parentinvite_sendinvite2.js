/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Onboarding_Consent_Parentinvite_Sendinvite2Inputs */

const en_onboarding_consent_parentinvite_sendinvite2 = /** @type {(inputs: Onboarding_Consent_Parentinvite_Sendinvite2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Send Invite`)
};

const es_onboarding_consent_parentinvite_sendinvite2 = /** @type {(inputs: Onboarding_Consent_Parentinvite_Sendinvite2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Enviar invitación`)
};

const fr_onboarding_consent_parentinvite_sendinvite2 = /** @type {(inputs: Onboarding_Consent_Parentinvite_Sendinvite2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Envoyer l'invitation`)
};

const ar_onboarding_consent_parentinvite_sendinvite2 = /** @type {(inputs: Onboarding_Consent_Parentinvite_Sendinvite2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إرسال الدعوة`)
};

/**
* | output |
* | --- |
* | "Send Invite" |
*
* @param {Onboarding_Consent_Parentinvite_Sendinvite2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const onboarding_consent_parentinvite_sendinvite2 = /** @type {((inputs?: Onboarding_Consent_Parentinvite_Sendinvite2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Onboarding_Consent_Parentinvite_Sendinvite2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_onboarding_consent_parentinvite_sendinvite2(inputs)
	if (locale === "es") return es_onboarding_consent_parentinvite_sendinvite2(inputs)
	if (locale === "fr") return fr_onboarding_consent_parentinvite_sendinvite2(inputs)
	return ar_onboarding_consent_parentinvite_sendinvite2(inputs)
});
export { onboarding_consent_parentinvite_sendinvite2 as "onboarding.consent.parentInvite.sendInvite" }