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

const de_share_profilelinkcopied2 = /** @type {(inputs: Share_Profilelinkcopied2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Profillink in die Zwischenablage kopiert`)
};

const ar_share_profilelinkcopied2 = /** @type {(inputs: Share_Profilelinkcopied2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تم نسخ رابط الملف الشخصي إلى الحافظة`)
};

const fr_share_profilelinkcopied2 = /** @type {(inputs: Share_Profilelinkcopied2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Lien de profil copié dans le presse-papiers`)
};

const ko_share_profilelinkcopied2 = /** @type {(inputs: Share_Profilelinkcopied2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`프로필 링크가 클립보드에 복사됨`)
};

/**
* | output |
* | --- |
* | "Profile link copied to clipboard" |
*
* @param {Share_Profilelinkcopied2Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const share_profilelinkcopied2 = /** @type {((inputs?: Share_Profilelinkcopied2Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Share_Profilelinkcopied2Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_share_profilelinkcopied2(inputs)
	if (locale === "es") return es_share_profilelinkcopied2(inputs)
	if (locale === "de") return de_share_profilelinkcopied2(inputs)
	if (locale === "ar") return ar_share_profilelinkcopied2(inputs)
	if (locale === "fr") return fr_share_profilelinkcopied2(inputs)
	return ko_share_profilelinkcopied2(inputs)
});
export { share_profilelinkcopied2 as "share.profileLinkCopied" }