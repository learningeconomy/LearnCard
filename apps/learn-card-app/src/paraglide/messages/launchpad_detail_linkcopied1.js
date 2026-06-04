/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Launchpad_Detail_Linkcopied1Inputs */

const en_launchpad_detail_linkcopied1 = /** @type {(inputs: Launchpad_Detail_Linkcopied1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Link copied to clipboard!`)
};

const es_launchpad_detail_linkcopied1 = /** @type {(inputs: Launchpad_Detail_Linkcopied1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`¡Enlace copiado al portapapeles!`)
};

const de_launchpad_detail_linkcopied1 = /** @type {(inputs: Launchpad_Detail_Linkcopied1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Link in die Zwischenablage kopiert!`)
};

const ar_launchpad_detail_linkcopied1 = /** @type {(inputs: Launchpad_Detail_Linkcopied1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تم نسخ الرابط إلى الحافظة!`)
};

const fr_launchpad_detail_linkcopied1 = /** @type {(inputs: Launchpad_Detail_Linkcopied1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Lien copié dans le presse-papiers !`)
};

const ko_launchpad_detail_linkcopied1 = /** @type {(inputs: Launchpad_Detail_Linkcopied1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`링크가 클립보드에 복사되었습니다!`)
};

/**
* | output |
* | --- |
* | "Link copied to clipboard!" |
*
* @param {Launchpad_Detail_Linkcopied1Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const launchpad_detail_linkcopied1 = /** @type {((inputs?: Launchpad_Detail_Linkcopied1Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Launchpad_Detail_Linkcopied1Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_launchpad_detail_linkcopied1(inputs)
	if (locale === "es") return es_launchpad_detail_linkcopied1(inputs)
	if (locale === "de") return de_launchpad_detail_linkcopied1(inputs)
	if (locale === "ar") return ar_launchpad_detail_linkcopied1(inputs)
	if (locale === "fr") return fr_launchpad_detail_linkcopied1(inputs)
	return ko_launchpad_detail_linkcopied1(inputs)
});
export { launchpad_detail_linkcopied1 as "launchpad.detail.linkCopied" }