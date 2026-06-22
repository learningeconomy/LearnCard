/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Share_Shareprofile1Inputs */

const en_share_shareprofile1 = /** @type {(inputs: Share_Shareprofile1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Share Profile`)
};

const es_share_shareprofile1 = /** @type {(inputs: Share_Shareprofile1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Compartir perfil`)
};

const fr_share_shareprofile1 = /** @type {(inputs: Share_Shareprofile1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Partager le profil`)
};

const ar_share_shareprofile1 = /** @type {(inputs: Share_Shareprofile1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`مشاركة الملف الشخصي`)
};

/**
* | output |
* | --- |
* | "Share Profile" |
*
* @param {Share_Shareprofile1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const share_shareprofile1 = /** @type {((inputs?: Share_Shareprofile1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Share_Shareprofile1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_share_shareprofile1(inputs)
	if (locale === "es") return es_share_shareprofile1(inputs)
	if (locale === "fr") return fr_share_shareprofile1(inputs)
	return ar_share_shareprofile1(inputs)
});
export { share_shareprofile1 as "share.shareProfile" }