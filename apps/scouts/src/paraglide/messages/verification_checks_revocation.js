/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Verification_Checks_RevocationInputs */

const en_verification_checks_revocation = /** @type {(inputs: Verification_Checks_RevocationInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Status`)
};

const es_verification_checks_revocation = /** @type {(inputs: Verification_Checks_RevocationInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Estado`)
};

const fr_verification_checks_revocation = /** @type {(inputs: Verification_Checks_RevocationInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Statut`)
};

const ar_verification_checks_revocation = /** @type {(inputs: Verification_Checks_RevocationInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`الحالة`)
};

/**
* | output |
* | --- |
* | "Status" |
*
* @param {Verification_Checks_RevocationInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const verification_checks_revocation = /** @type {((inputs?: Verification_Checks_RevocationInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Verification_Checks_RevocationInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_verification_checks_revocation(inputs)
	if (locale === "es") return es_verification_checks_revocation(inputs)
	if (locale === "fr") return fr_verification_checks_revocation(inputs)
	return ar_verification_checks_revocation(inputs)
});
export { verification_checks_revocation as "verification.checks.revocation" }