/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boostcms_Toasts_Copyboostlinkfail6Inputs */

const en_boostcms_toasts_copyboostlinkfail6 = /** @type {(inputs: Boostcms_Toasts_Copyboostlinkfail6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Unable to copy boost link to clipboard`)
};

const es_boostcms_toasts_copyboostlinkfail6 = /** @type {(inputs: Boostcms_Toasts_Copyboostlinkfail6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No se pudo copiar el enlace de Boost`)
};

const fr_boostcms_toasts_copyboostlinkfail6 = /** @type {(inputs: Boostcms_Toasts_Copyboostlinkfail6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Impossible de copier le lien Boost dans le presse-papiers`)
};

const ar_boostcms_toasts_copyboostlinkfail6 = /** @type {(inputs: Boostcms_Toasts_Copyboostlinkfail6Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Unable to copy boost link to clipboard`)
};

/**
* | output |
* | --- |
* | "Unable to copy boost link to clipboard" |
*
* @param {Boostcms_Toasts_Copyboostlinkfail6Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boostcms_toasts_copyboostlinkfail6 = /** @type {((inputs?: Boostcms_Toasts_Copyboostlinkfail6Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boostcms_Toasts_Copyboostlinkfail6Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boostcms_toasts_copyboostlinkfail6(inputs)
	if (locale === "es") return es_boostcms_toasts_copyboostlinkfail6(inputs)
	if (locale === "fr") return fr_boostcms_toasts_copyboostlinkfail6(inputs)
	return ar_boostcms_toasts_copyboostlinkfail6(inputs)
});
export { boostcms_toasts_copyboostlinkfail6 as "boostCMS.toasts.copyBoostLinkFail" }