/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Launchpad_Detail_Privacypolicy1Inputs */

const en_launchpad_detail_privacypolicy1 = /** @type {(inputs: Launchpad_Detail_Privacypolicy1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Privacy Policy`)
};

const es_launchpad_detail_privacypolicy1 = /** @type {(inputs: Launchpad_Detail_Privacypolicy1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Política de privacidad`)
};

const de_launchpad_detail_privacypolicy1 = /** @type {(inputs: Launchpad_Detail_Privacypolicy1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Datenschutzrichtlinie`)
};

const ar_launchpad_detail_privacypolicy1 = /** @type {(inputs: Launchpad_Detail_Privacypolicy1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`سياسة الخصوصية`)
};

const fr_launchpad_detail_privacypolicy1 = /** @type {(inputs: Launchpad_Detail_Privacypolicy1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Politique de confidentialité`)
};

const ko_launchpad_detail_privacypolicy1 = /** @type {(inputs: Launchpad_Detail_Privacypolicy1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`개인정보 처리방침`)
};

/**
* | output |
* | --- |
* | "Privacy Policy" |
*
* @param {Launchpad_Detail_Privacypolicy1Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const launchpad_detail_privacypolicy1 = /** @type {((inputs?: Launchpad_Detail_Privacypolicy1Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Launchpad_Detail_Privacypolicy1Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_launchpad_detail_privacypolicy1(inputs)
	if (locale === "es") return es_launchpad_detail_privacypolicy1(inputs)
	if (locale === "de") return de_launchpad_detail_privacypolicy1(inputs)
	if (locale === "ar") return ar_launchpad_detail_privacypolicy1(inputs)
	if (locale === "fr") return fr_launchpad_detail_privacypolicy1(inputs)
	return ko_launchpad_detail_privacypolicy1(inputs)
});
export { launchpad_detail_privacypolicy1 as "launchpad.detail.privacyPolicy" }