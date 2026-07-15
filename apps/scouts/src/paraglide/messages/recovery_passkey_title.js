/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Recovery_Passkey_TitleInputs */

const en_recovery_passkey_title = /** @type {(inputs: Recovery_Passkey_TitleInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Passkey`)
};

const es_recovery_passkey_title = /** @type {(inputs: Recovery_Passkey_TitleInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Passkey`)
};

const fr_recovery_passkey_title = /** @type {(inputs: Recovery_Passkey_TitleInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Clé d'accès`)
};

const ar_recovery_passkey_title = /** @type {(inputs: Recovery_Passkey_TitleInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`مفتاح المرور`)
};

/**
* | output |
* | --- |
* | "Passkey" |
*
* @param {Recovery_Passkey_TitleInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const recovery_passkey_title = /** @type {((inputs?: Recovery_Passkey_TitleInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Recovery_Passkey_TitleInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_recovery_passkey_title(inputs)
	if (locale === "es") return es_recovery_passkey_title(inputs)
	if (locale === "fr") return fr_recovery_passkey_title(inputs)
	return ar_recovery_passkey_title(inputs)
});
export { recovery_passkey_title as "recovery.passkey.title" }