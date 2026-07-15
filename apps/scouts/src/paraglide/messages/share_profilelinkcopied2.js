/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Share_Profilelinkcopied2Inputs */

const en_share_profilelinkcopied2 = /** @type {(inputs: Share_Profilelinkcopied2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Profile link copied to clipboard`)
};

const es_share_profilelinkcopied2 = /** @type {(inputs: Share_Profilelinkcopied2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Enlace de perfil copiado al portapapeles`)
};

const fr_share_profilelinkcopied2 = /** @type {(inputs: Share_Profilelinkcopied2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Lien de profil copié dans le presse-papiers`)
};

const ar_share_profilelinkcopied2 = /** @type {(inputs: Share_Profilelinkcopied2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تم نسخ رابط الملف الشخصي إلى الحافظة`)
};

/**
* | output |
* | --- |
* | "Profile link copied to clipboard" |
*
* @param {Share_Profilelinkcopied2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const share_profilelinkcopied2 = /** @type {((inputs?: Share_Profilelinkcopied2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Share_Profilelinkcopied2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_share_profilelinkcopied2(inputs)
	if (locale === "es") return es_share_profilelinkcopied2(inputs)
	if (locale === "fr") return fr_share_profilelinkcopied2(inputs)
	return ar_share_profilelinkcopied2(inputs)
});
export { share_profilelinkcopied2 as "share.profileLinkCopied" }