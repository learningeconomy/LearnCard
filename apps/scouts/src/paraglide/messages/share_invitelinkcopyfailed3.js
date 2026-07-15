/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Share_Invitelinkcopyfailed3Inputs */

const en_share_invitelinkcopyfailed3 = /** @type {(inputs: Share_Invitelinkcopyfailed3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Unable to copy Invite link to clipboard`)
};

const es_share_invitelinkcopyfailed3 = /** @type {(inputs: Share_Invitelinkcopyfailed3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No se pudo copiar el enlace de invitación al portapapeles`)
};

const fr_share_invitelinkcopyfailed3 = /** @type {(inputs: Share_Invitelinkcopyfailed3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Impossible de copier le lien d'invitation dans le presse-papiers`)
};

const ar_share_invitelinkcopyfailed3 = /** @type {(inputs: Share_Invitelinkcopyfailed3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تعذر نسخ رابط الدعوة إلى الحافظة`)
};

/**
* | output |
* | --- |
* | "Unable to copy Invite link to clipboard" |
*
* @param {Share_Invitelinkcopyfailed3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const share_invitelinkcopyfailed3 = /** @type {((inputs?: Share_Invitelinkcopyfailed3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Share_Invitelinkcopyfailed3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_share_invitelinkcopyfailed3(inputs)
	if (locale === "es") return es_share_invitelinkcopyfailed3(inputs)
	if (locale === "fr") return fr_share_invitelinkcopyfailed3(inputs)
	return ar_share_invitelinkcopyfailed3(inputs)
});
export { share_invitelinkcopyfailed3 as "share.inviteLinkCopyFailed" }