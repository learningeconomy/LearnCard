/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Share_Profilelinkcopyfailed3Inputs */

const en_share_profilelinkcopyfailed3 = /** @type {(inputs: Share_Profilelinkcopyfailed3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Unable to copy Profile link to clipboard`)
};

const es_share_profilelinkcopyfailed3 = /** @type {(inputs: Share_Profilelinkcopyfailed3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No se pudo copiar el enlace de perfil al portapapeles`)
};

const fr_share_profilelinkcopyfailed3 = /** @type {(inputs: Share_Profilelinkcopyfailed3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Impossible de copier le lien de profil dans le presse-papiers`)
};

const ar_share_profilelinkcopyfailed3 = /** @type {(inputs: Share_Profilelinkcopyfailed3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تعذر نسخ رابط الملف الشخصي إلى الحافظة`)
};

/**
* | output |
* | --- |
* | "Unable to copy Profile link to clipboard" |
*
* @param {Share_Profilelinkcopyfailed3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const share_profilelinkcopyfailed3 = /** @type {((inputs?: Share_Profilelinkcopyfailed3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Share_Profilelinkcopyfailed3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_share_profilelinkcopyfailed3(inputs)
	if (locale === "es") return es_share_profilelinkcopyfailed3(inputs)
	if (locale === "fr") return fr_share_profilelinkcopyfailed3(inputs)
	return ar_share_profilelinkcopyfailed3(inputs)
});
export { share_profilelinkcopyfailed3 as "share.profileLinkCopyFailed" }