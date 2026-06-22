/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Share_Generateinvitelink2Inputs */

const en_share_generateinvitelink2 = /** @type {(inputs: Share_Generateinvitelink2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Generate Invite Link`)
};

const es_share_generateinvitelink2 = /** @type {(inputs: Share_Generateinvitelink2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Generar enlace de invitación`)
};

const fr_share_generateinvitelink2 = /** @type {(inputs: Share_Generateinvitelink2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Générer un lien d'invitation`)
};

const ar_share_generateinvitelink2 = /** @type {(inputs: Share_Generateinvitelink2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إنشاء رابط دعوة`)
};

/**
* | output |
* | --- |
* | "Generate Invite Link" |
*
* @param {Share_Generateinvitelink2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const share_generateinvitelink2 = /** @type {((inputs?: Share_Generateinvitelink2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Share_Generateinvitelink2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_share_generateinvitelink2(inputs)
	if (locale === "es") return es_share_generateinvitelink2(inputs)
	if (locale === "fr") return fr_share_generateinvitelink2(inputs)
	return ar_share_generateinvitelink2(inputs)
});
export { share_generateinvitelink2 as "share.generateInviteLink" }