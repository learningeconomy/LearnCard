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

const fr_share_generatelinkfailed2 = /** @type {(inputs: Share_Generatelinkfailed2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Échec de la génération du lien d'invitation`)
};

const ar_share_generatelinkfailed2 = /** @type {(inputs: Share_Generatelinkfailed2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`فشل إنشاء رابط الدعوة`)
};

/**
* | output |
* | --- |
* | "Failed to generate invite link" |
*
* @param {Share_Generatelinkfailed2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const share_generatelinkfailed2 = /** @type {((inputs?: Share_Generatelinkfailed2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Share_Generatelinkfailed2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_share_generatelinkfailed2(inputs)
	if (locale === "es") return es_share_generatelinkfailed2(inputs)
	if (locale === "fr") return fr_share_generatelinkfailed2(inputs)
	return ar_share_generatelinkfailed2(inputs)
});
export { share_generatelinkfailed2 as "share.generateLinkFailed" }