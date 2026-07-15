/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boostcms_Toasts_Contactlinkcopied5Inputs */

const en_boostcms_toasts_contactlinkcopied5 = /** @type {(inputs: Boostcms_Toasts_Contactlinkcopied5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Contact link copied to clipboard`)
};

const es_boostcms_toasts_contactlinkcopied5 = /** @type {(inputs: Boostcms_Toasts_Contactlinkcopied5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Enlace de contacto copiado al portapapeles`)
};

const fr_boostcms_toasts_contactlinkcopied5 = /** @type {(inputs: Boostcms_Toasts_Contactlinkcopied5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Lien de contact copié dans le presse-papiers`)
};

const ar_boostcms_toasts_contactlinkcopied5 = /** @type {(inputs: Boostcms_Toasts_Contactlinkcopied5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تم نسخ رابط الاتصال إلى الحافظة`)
};

/**
* | output |
* | --- |
* | "Contact link copied to clipboard" |
*
* @param {Boostcms_Toasts_Contactlinkcopied5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boostcms_toasts_contactlinkcopied5 = /** @type {((inputs?: Boostcms_Toasts_Contactlinkcopied5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boostcms_Toasts_Contactlinkcopied5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boostcms_toasts_contactlinkcopied5(inputs)
	if (locale === "es") return es_boostcms_toasts_contactlinkcopied5(inputs)
	if (locale === "fr") return fr_boostcms_toasts_contactlinkcopied5(inputs)
	return ar_boostcms_toasts_contactlinkcopied5(inputs)
});
export { boostcms_toasts_contactlinkcopied5 as "boostCMS.toasts.contactLinkCopied" }