/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Share_Generatelinkfailed2Inputs */

const en_share_generatelinkfailed2 = /** @type {(inputs: Share_Generatelinkfailed2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Failed to generate invite link`)
};

const es_share_generatelinkfailed2 = /** @type {(inputs: Share_Generatelinkfailed2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Error al generar enlace de invitación`)
};

const de_share_generatelinkfailed2 = /** @type {(inputs: Share_Generatelinkfailed2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Einladungslink konnte nicht erstellt werden`)
};

const ar_share_generatelinkfailed2 = /** @type {(inputs: Share_Generatelinkfailed2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`فشل إنشاء رابط الدعوة`)
};

const fr_share_generatelinkfailed2 = /** @type {(inputs: Share_Generatelinkfailed2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Échec de la génération du lien d'invitation`)
};

const ko_share_generatelinkfailed2 = /** @type {(inputs: Share_Generatelinkfailed2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`초대 링크 생성 실패`)
};

/**
* | output |
* | --- |
* | "Failed to generate invite link" |
*
* @param {Share_Generatelinkfailed2Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const share_generatelinkfailed2 = /** @type {((inputs?: Share_Generatelinkfailed2Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Share_Generatelinkfailed2Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_share_generatelinkfailed2(inputs)
	if (locale === "es") return es_share_generatelinkfailed2(inputs)
	if (locale === "de") return de_share_generatelinkfailed2(inputs)
	if (locale === "ar") return ar_share_generatelinkfailed2(inputs)
	if (locale === "fr") return fr_share_generatelinkfailed2(inputs)
	return ko_share_generatelinkfailed2(inputs)
});
export { share_generatelinkfailed2 as "share.generateLinkFailed" }