/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Recovery_Tab_EmailInputs */

const en_recovery_tab_email = /** @type {(inputs: Recovery_Tab_EmailInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Email`)
};

const es_recovery_tab_email = /** @type {(inputs: Recovery_Tab_EmailInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Correo electrónico`)
};

const fr_recovery_tab_email = /** @type {(inputs: Recovery_Tab_EmailInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`E-mail`)
};

const ar_recovery_tab_email = /** @type {(inputs: Recovery_Tab_EmailInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`البريد الإلكتروني`)
};

/**
* | output |
* | --- |
* | "Email" |
*
* @param {Recovery_Tab_EmailInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const recovery_tab_email = /** @type {((inputs?: Recovery_Tab_EmailInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Recovery_Tab_EmailInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_recovery_tab_email(inputs)
	if (locale === "es") return es_recovery_tab_email(inputs)
	if (locale === "fr") return fr_recovery_tab_email(inputs)
	return ar_recovery_tab_email(inputs)
});
export { recovery_tab_email as "recovery.tab.email" }