/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Credsbundle_Toast_Linkcopyfail3Inputs */

const en_credsbundle_toast_linkcopyfail3 = /** @type {(inputs: Credsbundle_Toast_Linkcopyfail3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Unable to copy verified resume link to clipboard`)
};

const es_credsbundle_toast_linkcopyfail3 = /** @type {(inputs: Credsbundle_Toast_Linkcopyfail3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No se pudo copiar el enlace de currículum verificado`)
};

const fr_credsbundle_toast_linkcopyfail3 = /** @type {(inputs: Credsbundle_Toast_Linkcopyfail3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Impossible de copier le lien de CV vérifié dans le presse-papiers`)
};

const ar_credsbundle_toast_linkcopyfail3 = /** @type {(inputs: Credsbundle_Toast_Linkcopyfail3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تعذر نسخ رابط السيرة الذاتية الموثقة إلى الحافظة`)
};

/**
* | output |
* | --- |
* | "Unable to copy verified resume link to clipboard" |
*
* @param {Credsbundle_Toast_Linkcopyfail3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const credsbundle_toast_linkcopyfail3 = /** @type {((inputs?: Credsbundle_Toast_Linkcopyfail3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Credsbundle_Toast_Linkcopyfail3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_credsbundle_toast_linkcopyfail3(inputs)
	if (locale === "es") return es_credsbundle_toast_linkcopyfail3(inputs)
	if (locale === "fr") return fr_credsbundle_toast_linkcopyfail3(inputs)
	return ar_credsbundle_toast_linkcopyfail3(inputs)
});
export { credsbundle_toast_linkcopyfail3 as "credsBundle.toast.linkCopyFail" }