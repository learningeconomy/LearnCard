/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Troops_Verify_TitleInputs */

const en_troops_verify_title = /** @type {(inputs: Troops_Verify_TitleInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Credential Verifications`)
};

const es_troops_verify_title = /** @type {(inputs: Troops_Verify_TitleInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Verificaciones de Credencial`)
};

const fr_troops_verify_title = /** @type {(inputs: Troops_Verify_TitleInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Vérifications du justificatif`)
};

const ar_troops_verify_title = /** @type {(inputs: Troops_Verify_TitleInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Credential Verifications`)
};

/**
* | output |
* | --- |
* | "Credential Verifications" |
*
* @param {Troops_Verify_TitleInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const troops_verify_title = /** @type {((inputs?: Troops_Verify_TitleInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Troops_Verify_TitleInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_troops_verify_title(inputs)
	if (locale === "es") return es_troops_verify_title(inputs)
	if (locale === "fr") return fr_troops_verify_title(inputs)
	return ar_troops_verify_title(inputs)
});
export { troops_verify_title as "troops.verify.title" }