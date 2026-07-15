/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Credsbundle_Toast_Linkcopied2Inputs */

const en_credsbundle_toast_linkcopied2 = /** @type {(inputs: Credsbundle_Toast_Linkcopied2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Verified resume link copied to clipboard`)
};

const es_credsbundle_toast_linkcopied2 = /** @type {(inputs: Credsbundle_Toast_Linkcopied2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Enlace de currículum verificado copiado al portapapeles`)
};

const fr_credsbundle_toast_linkcopied2 = /** @type {(inputs: Credsbundle_Toast_Linkcopied2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Lien de CV vérifié copié dans le presse-papiers`)
};

const ar_credsbundle_toast_linkcopied2 = /** @type {(inputs: Credsbundle_Toast_Linkcopied2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Verified resume link copied to clipboard`)
};

/**
* | output |
* | --- |
* | "Verified resume link copied to clipboard" |
*
* @param {Credsbundle_Toast_Linkcopied2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const credsbundle_toast_linkcopied2 = /** @type {((inputs?: Credsbundle_Toast_Linkcopied2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Credsbundle_Toast_Linkcopied2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_credsbundle_toast_linkcopied2(inputs)
	if (locale === "es") return es_credsbundle_toast_linkcopied2(inputs)
	if (locale === "fr") return fr_credsbundle_toast_linkcopied2(inputs)
	return ar_credsbundle_toast_linkcopied2(inputs)
});
export { credsbundle_toast_linkcopied2 as "credsBundle.toast.linkCopied" }