/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boostcms_Toasts_Copycontactlinkfail6Inputs */

const en_boostcms_toasts_copycontactlinkfail6 = /** @type {(inputs: Boostcms_Toasts_Copycontactlinkfail6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Unable to copy Contact link to clipboard`)
};

const es_boostcms_toasts_copycontactlinkfail6 = /** @type {(inputs: Boostcms_Toasts_Copycontactlinkfail6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No se pudo copiar el enlace de contacto`)
};

const fr_boostcms_toasts_copycontactlinkfail6 = /** @type {(inputs: Boostcms_Toasts_Copycontactlinkfail6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Impossible de copier le lien de contact dans le presse-papiers`)
};

const ar_boostcms_toasts_copycontactlinkfail6 = /** @type {(inputs: Boostcms_Toasts_Copycontactlinkfail6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Unable to copy Contact link to clipboard`)
};

/**
* | output |
* | --- |
* | "Unable to copy Contact link to clipboard" |
*
* @param {Boostcms_Toasts_Copycontactlinkfail6Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boostcms_toasts_copycontactlinkfail6 = /** @type {((inputs?: Boostcms_Toasts_Copycontactlinkfail6Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boostcms_Toasts_Copycontactlinkfail6Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boostcms_toasts_copycontactlinkfail6(inputs)
	if (locale === "es") return es_boostcms_toasts_copycontactlinkfail6(inputs)
	if (locale === "fr") return fr_boostcms_toasts_copycontactlinkfail6(inputs)
	return ar_boostcms_toasts_copycontactlinkfail6(inputs)
});
export { boostcms_toasts_copycontactlinkfail6 as "boostCMS.toasts.copyContactLinkFail" }