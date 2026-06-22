/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ count: NonNullable<unknown> }} Passport_Resumebuilder_History_Credentialcount2Inputs */

const en_passport_resumebuilder_history_credentialcount2 = /** @type {(inputs: Passport_Resumebuilder_History_Credentialcount2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.count} Credentials`)
};

const es_passport_resumebuilder_history_credentialcount2 = /** @type {(inputs: Passport_Resumebuilder_History_Credentialcount2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.count} credenciales`)
};

const fr_passport_resumebuilder_history_credentialcount2 = /** @type {(inputs: Passport_Resumebuilder_History_Credentialcount2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.count} titres`)
};

const ar_passport_resumebuilder_history_credentialcount2 = /** @type {(inputs: Passport_Resumebuilder_History_Credentialcount2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.count} شهادات`)
};

/**
* | output |
* | --- |
* | "{count} Credentials" |
*
* @param {Passport_Resumebuilder_History_Credentialcount2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const passport_resumebuilder_history_credentialcount2 = /** @type {((inputs: Passport_Resumebuilder_History_Credentialcount2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Passport_Resumebuilder_History_Credentialcount2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_passport_resumebuilder_history_credentialcount2(inputs)
	if (locale === "es") return es_passport_resumebuilder_history_credentialcount2(inputs)
	if (locale === "fr") return fr_passport_resumebuilder_history_credentialcount2(inputs)
	return ar_passport_resumebuilder_history_credentialcount2(inputs)
});
export { passport_resumebuilder_history_credentialcount2 as "passport.resumeBuilder.history.credentialCount" }