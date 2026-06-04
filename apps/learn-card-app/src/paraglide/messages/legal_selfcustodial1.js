/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Legal_Selfcustodial1Inputs */

const en_legal_selfcustodial1 = /** @type {(inputs: Legal_Selfcustodial1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Self-custodial login.`)
};

const es_legal_selfcustodial1 = /** @type {(inputs: Legal_Selfcustodial1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Inicio de sesión autocustodiado.`)
};

const de_legal_selfcustodial1 = /** @type {(inputs: Legal_Selfcustodial1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Selbstverwaltete Anmeldung.`)
};

const ar_legal_selfcustodial1 = /** @type {(inputs: Legal_Selfcustodial1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تسجيل دخول ذاتي.`)
};

const fr_legal_selfcustodial1 = /** @type {(inputs: Legal_Selfcustodial1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Connexion auto-gérée.`)
};

const ko_legal_selfcustodial1 = /** @type {(inputs: Legal_Selfcustodial1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`셀프 커스토디얼 로그인.`)
};

/**
* | output |
* | --- |
* | "Self-custodial login." |
*
* @param {Legal_Selfcustodial1Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const legal_selfcustodial1 = /** @type {((inputs?: Legal_Selfcustodial1Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Legal_Selfcustodial1Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_legal_selfcustodial1(inputs)
	if (locale === "es") return es_legal_selfcustodial1(inputs)
	if (locale === "de") return de_legal_selfcustodial1(inputs)
	if (locale === "ar") return ar_legal_selfcustodial1(inputs)
	if (locale === "fr") return fr_legal_selfcustodial1(inputs)
	return ko_legal_selfcustodial1(inputs)
});
export { legal_selfcustodial1 as "legal.selfCustodial" }