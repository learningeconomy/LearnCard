/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Auth_DismissInputs */

const en_auth_dismiss = /** @type {(inputs: Auth_DismissInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Dismiss`)
};

const es_auth_dismiss = /** @type {(inputs: Auth_DismissInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Descartar`)
};

const fr_auth_dismiss = /** @type {(inputs: Auth_DismissInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ignorer`)
};

const ar_auth_dismiss = /** @type {(inputs: Auth_DismissInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تجاهل`)
};

/**
* | output |
* | --- |
* | "Dismiss" |
*
* @param {Auth_DismissInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const auth_dismiss = /** @type {((inputs?: Auth_DismissInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Auth_DismissInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_auth_dismiss(inputs)
	if (locale === "es") return es_auth_dismiss(inputs)
	if (locale === "fr") return fr_auth_dismiss(inputs)
	return ar_auth_dismiss(inputs)
});
export { auth_dismiss as "auth.dismiss" }