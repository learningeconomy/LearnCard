/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Share_Invitelinkcopied2Inputs */

const en_share_invitelinkcopied2 = /** @type {(inputs: Share_Invitelinkcopied2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Invite link copied to clipboard`)
};

const es_share_invitelinkcopied2 = /** @type {(inputs: Share_Invitelinkcopied2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Enlace de invitación copiado al portapapeles`)
};

const fr_share_invitelinkcopied2 = /** @type {(inputs: Share_Invitelinkcopied2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Lien d'invitation copié dans le presse-papiers`)
};

const ar_share_invitelinkcopied2 = /** @type {(inputs: Share_Invitelinkcopied2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تم نسخ رابط الدعوة إلى الحافظة`)
};

/**
* | output |
* | --- |
* | "Invite link copied to clipboard" |
*
* @param {Share_Invitelinkcopied2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const share_invitelinkcopied2 = /** @type {((inputs?: Share_Invitelinkcopied2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Share_Invitelinkcopied2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_share_invitelinkcopied2(inputs)
	if (locale === "es") return es_share_invitelinkcopied2(inputs)
	if (locale === "fr") return fr_share_invitelinkcopied2(inputs)
	return ar_share_invitelinkcopied2(inputs)
});
export { share_invitelinkcopied2 as "share.inviteLinkCopied" }